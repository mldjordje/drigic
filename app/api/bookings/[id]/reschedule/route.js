import { sql } from "drizzle-orm";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api/http";
import { requireUser } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";
import { addMinutes, findConflicts, isWithinBookingWindow, isWithinWorkHours } from "@/lib/booking/engine";
import { getClinicSettings } from "@/lib/booking/config";

export const runtime = "nodejs";

const payloadSchema = z.object({
  startAt: z.string().datetime(),
  note: z.string().max(400).optional(),
});

async function lockEmployeeSchedule(tx, employeeId) {
  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${employeeId}, 0))`);
}

export async function PATCH(request, { params }) {
  const auth = await requireUser(request);
  if (auth.error) {
    return auth.error;
  }

  const { id } = params;
  const body = (await readJson(request)) || {};
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Invalid payload", parsed.error.flatten());
  }

  const db = getDb();
  const [booking] = await db
    .select()
    .from(schema.bookings)
    .where(and(eq(schema.bookings.id, id), eq(schema.bookings.userId, auth.user.id)))
    .limit(1);

  if (!booking) {
    return fail(404, "Booking not found.");
  }

  if (!["pending", "confirmed"].includes(booking.status)) {
    return fail(409, `Booking cannot be rescheduled in status '${booking.status}'.`);
  }

  const nextStartAt = new Date(parsed.data.startAt);
  if (Number.isNaN(nextStartAt.getTime())) {
    return fail(400, "Invalid startAt date.");
  }

  const settings = await getClinicSettings();
  if (!isWithinBookingWindow(nextStartAt, settings.bookingWindowDays)) {
    return fail(400, `Booking must be within next ${settings.bookingWindowDays} days.`);
  }

  const durationMin = Math.max(5, Math.min(60, Number(booking.totalDurationMin || 15)));
  if (!(await isWithinWorkHours(nextStartAt, durationMin, settings))) {
    return fail(400, "Selected time is outside clinic working hours.");
  }

  const nextEndsAt = addMinutes(nextStartAt, durationMin);

  try {
    await db.transaction(async (tx) => {
      await lockEmployeeSchedule(tx, booking.employeeId);

      const conflicts = await findConflicts({
        employeeId: booking.employeeId,
        startsAt: nextStartAt,
        endsAt: nextEndsAt,
        excludeBookingId: booking.id,
        tx,
      });
      if (conflicts.length) {
        throw new Error("Requested slot is no longer available.");
      }

      const now = new Date();
      await tx
        .update(schema.bookings)
        .set({
          startsAt: nextStartAt,
          endsAt: nextEndsAt,
          status: "pending",
          updatedAt: now,
          notes: booking.notes,
        })
        .where(eq(schema.bookings.id, booking.id));

      await tx.insert(schema.bookingStatusLog).values({
        bookingId: booking.id,
        previousStatus: booking.status,
        nextStatus: "pending",
        changedByUserId: auth.user.id,
        note: parsed.data.note || "Rescheduled by client",
      });
    });
  } catch (error) {
    const message = error?.message || "Reschedule failed.";
    if (message.includes("Requested slot is no longer available")) {
      return fail(409, message);
    }
    return fail(400, message);
  }

  return ok({
    ok: true,
    bookingId: booking.id,
    status: "pending",
    startsAt: nextStartAt.toISOString(),
    endsAt: nextEndsAt.toISOString(),
  });
}

