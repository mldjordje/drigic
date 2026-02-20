import { eq } from "drizzle-orm";
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
  const [booking] = await db
    .select()
    .from(schema.bookings)
    .where(eq(schema.bookings.id, id))
    .limit(1);

  if (!booking) {
    return fail(404, "Booking not found.");
  }

  const employee = await getDefaultEmployee();
  const now = new Date();

  const [updatedBooking] = await db
    .update(schema.bookings)
    .set({
      status: "completed",
      updatedAt: now,
    })
    .where(eq(schema.bookings.id, booking.id))
    .returning();

  await db.insert(schema.bookingStatusLog).values({
    bookingId: booking.id,
    previousStatus: booking.status,
    nextStatus: "completed",
    changedByUserId: auth.user.id,
    note: parsed.data.notes || "Completed by admin",
  });

  const [record] = await db
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

  return created({
    ok: true,
    booking: updatedBooking,
    treatmentRecord: record,
  });
}

