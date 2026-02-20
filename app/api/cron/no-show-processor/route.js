import { and, eq, inArray, isNull, lt } from "drizzle-orm";
import { fail, ok } from "@/lib/api/http";
import { isCronAuthorized } from "@/lib/cron/auth";
import { getDb, schema } from "@/lib/db/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  if (!isCronAuthorized(request)) {
    return fail(401, "Unauthorized cron request.");
  }

  const db = getDb();
  const threshold = new Date(Date.now() - 30 * 60 * 1000);

  const candidates = await db
    .select()
    .from(schema.bookings)
    .where(
      and(
        inArray(schema.bookings.status, ["pending", "confirmed"]),
        lt(schema.bookings.endsAt, threshold),
        isNull(schema.bookings.noShowMarkedAt)
      )
    );

  let penalizedCount = 0;

  for (const booking of candidates) {
    await db.transaction(async (tx) => {
      const [penalty] = await tx
        .select()
        .from(schema.penalties)
        .where(eq(schema.penalties.bookingId, booking.id))
        .limit(1);

      await tx
        .update(schema.bookings)
        .set({
          status: "no_show",
          noShowMarkedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(schema.bookings.id, booking.id));

      await tx.insert(schema.bookingStatusLog).values({
        bookingId: booking.id,
        previousStatus: booking.status,
        nextStatus: "no_show",
        note: "Marked by no-show cron processor",
      });

      if (!penalty) {
        await tx.insert(schema.penalties).values({
          userId: booking.userId,
          bookingId: booking.id,
          amountRsd: 2000,
          reason: "No-show penalty",
          status: "unpaid",
        });

        penalizedCount += 1;
      }
    });
  }

  return ok({
    ok: true,
    processed: candidates.length,
    penaltiesCreated: penalizedCount,
  });
}

