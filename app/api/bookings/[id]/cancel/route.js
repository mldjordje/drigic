import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api/http";
import { requireUser } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";
import { hasCancelWindow } from "@/lib/booking/engine";

export const runtime = "nodejs";

const payloadSchema = z.object({
  reason: z.string().max(400).optional(),
});

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
    return fail(409, `Booking cannot be cancelled in status '${booking.status}'.`);
  }

  if (!hasCancelWindow(booking.startsAt)) {
    return fail(400, "Cancellation is allowed at least 2 hours before appointment.");
  }

  const now = new Date();
  await db
    .update(schema.bookings)
    .set({
      status: "cancelled",
      cancelledAt: now,
      cancellationReason: parsed.data.reason || null,
      updatedAt: now,
    })
    .where(eq(schema.bookings.id, booking.id));

  await db.insert(schema.bookingStatusLog).values({
    bookingId: booking.id,
    previousStatus: booking.status,
    nextStatus: "cancelled",
    changedByUserId: auth.user.id,
    note: parsed.data.reason || "Cancelled by client",
  });

  return ok({ ok: true, bookingId: booking.id, status: "cancelled" });
}
