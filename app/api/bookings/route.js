import { z } from "zod";
import { created, fail, readJson } from "@/lib/api/http";
import { requireUser } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";
import { sendReminderEmail } from "@/lib/auth/email";
import {
  addMinutes,
  findConflicts,
  isWithinBookingWindow,
  isWithinWorkHours,
  normalizeServiceSelections,
  resolveQuote,
} from "@/lib/booking/engine";
import { getClinicSettings, getDefaultEmployee } from "@/lib/booking/config";

export const runtime = "nodejs";
const PRIMARY_ADMIN_NOTIFY_EMAIL = "igic.nikola8397@gmail.com";

const payloadSchema = z.object({
  serviceIds: z.array(z.string().uuid()).optional(),
  serviceSelections: z
    .array(
      z.object({
        serviceId: z.string().uuid(),
        quantity: z.number().int().min(1).optional(),
      })
    )
    .optional(),
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
    const normalizedSelections = normalizeServiceSelections(
      parsed.data.serviceSelections || [],
      parsed.data.serviceIds || []
    );

    if (!normalizedSelections.length) {
      return fail(400, "At least one service is required.");
    }

    if (!isWithinBookingWindow(startAt, settings.bookingWindowDays)) {
      return fail(400, `Booking must be within next ${settings.bookingWindowDays} days.`);
    }

    const quote = await resolveQuote(normalizedSelections);
    const endsAt = addMinutes(startAt, quote.totalDurationMin);
    const employee = await getDefaultEmployee();

    if (!isWithinWorkHours(startAt, quote.totalDurationMin, settings)) {
      return fail(
        400,
        `Clinic working hours are ${settings.workdayStart}-${settings.workdayEnd}.`
      );
    }

    const conflicts = await findConflicts({
      employeeId: employee.id,
      startsAt: startAt,
      endsAt: endsAt,
    });

    if (conflicts.length) {
      throw new Error("Requested slot is no longer available.");
    }

    const [createdBooking] = await db
      .insert(schema.bookings)
      .values({
        userId: auth.user.id,
        employeeId: employee.id,
        startsAt: startAt,
        endsAt,
        status: "pending",
        totalDurationMin: quote.totalDurationMin,
        totalPriceRsd: quote.totalPriceRsd,
        primaryServiceColor: quote.primaryServiceColor,
        notes: parsed.data.notes || null,
      })
      .returning();

    await db.insert(schema.bookingItems).values(
      quote.items.map((item) => ({
        bookingId: createdBooking.id,
        serviceId: item.serviceId,
        quantity: item.quantity,
        unitLabel: item.unitLabel,
        serviceNameSnapshot: item.name,
        durationMinSnapshot: item.durationMin,
        priceRsdSnapshot: item.finalPriceRsd,
        serviceColorSnapshot: item.serviceColor,
        sourcePackageServiceId: item.sourcePackageServiceId || null,
      }))
    );

    try {
      await db.insert(schema.bookingStatusLog).values({
        bookingId: createdBooking.id,
        previousStatus: null,
        nextStatus: "pending",
        changedByUserId: auth.user.id,
        note: "Booking created online (awaiting admin confirmation)",
      });
    } catch (logError) {
      console.error("[bookings.create] status log insert failed", logError);
    }

    try {
      const startsAtLabel = new Date(createdBooking.startsAt).toLocaleString("sr-RS", {
        timeZone: "Europe/Belgrade",
      });
      const serviceSummary = quote.items
        .map((item) => `${item.name}${item.quantity > 1 ? ` x${item.quantity}` : ""}`)
        .join(", ");
      const notifyResult = await sendReminderEmail({
        to: PRIMARY_ADMIN_NOTIFY_EMAIL,
        title: "Novi booking na cekanju",
        message: [
          `Stigao je novi booking koji ceka potvrdu admina.`,
          `Termin: ${startsAtLabel}`,
          `Klijent: ${auth.user.email || auth.user.id}`,
          `Usluge: ${serviceSummary || "-"}`,
          `Trajanje: ${quote.totalDurationMin} min`,
          `Cena: ${quote.totalPriceRsd} EUR`,
        ].join("\n"),
      });
      if (!notifyResult?.sent) {
        console.error(
          "[bookings.create] admin notify email not sent",
          notifyResult?.reason || "unknown reason"
        );
      }
    } catch (notifyError) {
      console.error("[bookings.create] admin notify email failed", notifyError);
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
    if (message.includes("cannot exceed 60 minutes")) {
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
      reason: process.env.NODE_ENV === "development" ? message : null,
    });
  }
}
