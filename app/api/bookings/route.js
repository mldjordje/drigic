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

  const quote = await resolveQuote(parsed.data.serviceIds);
  const endsAt = addMinutes(startAt, quote.totalDurationMin);
  const employee = await getDefaultEmployee();

  const createdBooking = await db.transaction(async (tx) => {
    const conflicts = await findConflicts({
      employeeId: employee.id,
      startsAt: startAt.toISOString(),
      endsAt: endsAt.toISOString(),
      tx,
    });

    if (conflicts.length) {
      throw new Error("Requested slot is no longer available.");
    }

    const [booking] = await tx
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

    await tx.insert(schema.bookingItems).values(
      quote.items.map((item) => ({
        bookingId: booking.id,
        serviceId: item.serviceId,
        serviceNameSnapshot: item.name,
        durationMinSnapshot: item.durationMin,
        priceRsdSnapshot: item.finalPriceRsd,
      }))
    );

    await tx.insert(schema.bookingStatusLog).values({
      bookingId: booking.id,
      previousStatus: null,
      nextStatus: "confirmed",
      changedByUserId: auth.user.id,
      note: "Booking created online",
    });

    return booking;
  });

  return created({
    ok: true,
    booking: createdBooking,
    quote,
  });
}
