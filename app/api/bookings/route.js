import { z } from "zod";
import { created, fail, readJson } from "@/lib/api/http";
import { requireUser } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";
import {
  addMinutes,
  findConflicts,
  isWithinBookingWindow,
  resolveQuote,
} from "@/lib/booking/engine";
import { getClinicSettings, getDefaultEmployee } from "@/lib/booking/config";

export const runtime = "nodejs";

const payloadSchema = z.object({
  serviceIds: z.array(z.string().uuid()).min(1),
  startAt: z.string().datetime(),
  notes: z.string().max(1000).optional(),
});

export async function POST(request) {
  try {
    const auth = await requireUser(request);
    if (auth.error) {
      return auth.error;
    }

    const body = await readJson(request);
    const parsed = payloadSchema.safeParse(body);
    if (!parsed.success) {
      return fail(400, "Invalid payload", parsed.error.flatten());
    }

    const db = getDb();
    const startAt = new Date(parsed.data.startAt);
    const settings = await getClinicSettings();

    if (!isWithinBookingWindow(startAt, settings.bookingWindowDays)) {
      return fail(400, `Booking must be within next ${settings.bookingWindowDays} days.`);
    }

    const uniqueServiceIds = Array.from(new Set(parsed.data.serviceIds));
    const quote = await resolveQuote(uniqueServiceIds);
    const endsAt = addMinutes(startAt, quote.totalDurationMin);
    const employee = await getDefaultEmployee();

    const conflicts = await findConflicts({
      employeeId: employee.id,
      startsAt: startAt.toISOString(),
      endsAt: endsAt.toISOString(),
    });

    if (conflicts.length) {
      throw new Error("Requested slot is no longer available.");
    }

    const [createdBooking] = await db
      .insert(schema.bookings)
      .values({
        userId: auth.user.id,
        employeeId: employee.id,
        startsAt,
        endsAt,
        status: "confirmed",
        totalDurationMin: quote.totalDurationMin,
        totalPriceRsd: quote.totalPriceRsd,
        notes: parsed.data.notes || null,
      })
      .returning();

    await db.insert(schema.bookingItems).values(
      quote.items.map((item) => ({
        bookingId: createdBooking.id,
        serviceId: item.serviceId,
        serviceNameSnapshot: item.name,
        durationMinSnapshot: item.durationMin,
        priceRsdSnapshot: item.finalPriceRsd,
      }))
    );

    try {
      await db.insert(schema.bookingStatusLog).values({
        bookingId: createdBooking.id,
        previousStatus: null,
        nextStatus: "confirmed",
        changedByUserId: auth.user.id,
        note: "Booking created online",
      });
    } catch (logError) {
      console.error("[bookings.create] status log insert failed", logError);
    }

    return created({
      ok: true,
      booking: createdBooking,
      quote,
    });
  } catch (error) {
    const errorCode = String(error?.code || error?.cause?.code || "");
    const message = error?.message || "Booking failed.";
    if (message.includes("Requested slot is no longer available")) {
      return fail(409, message);
    }
    if (message.includes("invalid or inactive")) {
      return fail(400, message);
    }
    if (errorCode === "23503") {
      return fail(400, "Session is outdated. Log out and log in again.");
    }
    if (errorCode === "42P01") {
      return fail(500, "Database schema mismatch. Run latest migrations.");
    }
    console.error("[bookings.create] unexpected error", error);
    return fail(500, "Booking failed unexpectedly. Please retry.", {
      code: errorCode || null,
    });
  }
}
