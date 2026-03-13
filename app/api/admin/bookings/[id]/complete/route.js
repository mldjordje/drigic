import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { created, fail, readJson } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";
import { getDefaultEmployee } from "@/lib/booking/config";

export const runtime = "nodejs";

const payloadSchema = z.object({
  notes: z.string().max(2000).optional(),
  correctionDueDate: z.string().optional(),
});
const TREATMENT_RECORD_EXISTS_ERROR = "Treatment record for this booking already exists.";
const COMPLETION_STATUS_ERROR = "Booking cannot be completed from current status.";

async function lockBooking(tx, bookingId) {
  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${bookingId}, 0))`);
}

export async function POST(request, { params }) {
  const auth = await requireAdmin(request);
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
  const employee = await getDefaultEmployee();
  const now = new Date();
  let booking = null;
  let updatedBooking = null;
  let record = null;

  try {
    await db.transaction(async (tx) => {
      await lockBooking(tx, id);

      [booking] = await tx
        .select()
        .from(schema.bookings)
        .where(eq(schema.bookings.id, id))
        .limit(1);

      if (!booking) {
        throw new Error("BOOKING_NOT_FOUND");
      }
      if (!["pending", "confirmed"].includes(booking.status)) {
        throw new Error(COMPLETION_STATUS_ERROR);
      }

      const [existingRecord] = await tx
        .select({ id: schema.treatmentRecords.id })
        .from(schema.treatmentRecords)
        .where(eq(schema.treatmentRecords.bookingId, booking.id))
        .limit(1);
      if (existingRecord) {
        throw new Error(TREATMENT_RECORD_EXISTS_ERROR);
      }

    [updatedBooking] = await tx
      .update(schema.bookings)
      .set({
        status: "completed",
        updatedAt: now,
      })
      .where(eq(schema.bookings.id, booking.id))
      .returning();

    await tx.insert(schema.bookingStatusLog).values({
      bookingId: booking.id,
      previousStatus: booking.status,
      nextStatus: "completed",
      changedByUserId: auth.user.id,
      note: parsed.data.notes || "Completed by admin",
    });

    [record] = await tx
      .insert(schema.treatmentRecords)
      .values({
        userId: booking.userId,
        bookingId: booking.id,
        employeeId: employee.id,
        treatmentDate: booking.endsAt || booking.startsAt,
        notes: parsed.data.notes || null,
        correctionDueDate: parsed.data.correctionDueDate || null,
      })
      .returning();
    });
  } catch (error) {
    const message = String(error?.message || "");
    if (message.includes("BOOKING_NOT_FOUND")) {
      return fail(404, "Booking not found.");
    }
    if (message.includes(COMPLETION_STATUS_ERROR)) {
      return fail(409, `Booking cannot be completed from status '${booking?.status || "unknown"}'.`);
    }
    if (message.includes(TREATMENT_RECORD_EXISTS_ERROR)) {
      return fail(409, TREATMENT_RECORD_EXISTS_ERROR);
    }
    return fail(500, error?.message || "Failed to complete booking.");
  }

  return created({
    ok: true,
    booking: updatedBooking,
    treatmentRecord: record,
  });
}
