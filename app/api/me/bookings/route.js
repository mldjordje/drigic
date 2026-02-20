import { desc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth/guards";
import { ok } from "@/lib/api/http";
import { getDb, schema } from "@/lib/db/client";

export const runtime = "nodejs";

export async function GET(request) {
  const auth = await requireUser(request);
  if (auth.error) {
    return auth.error;
  }

  const db = getDb();
  const now = new Date();
  const rows = await db
    .select({
      id: schema.bookings.id,
      startsAt: schema.bookings.startsAt,
      endsAt: schema.bookings.endsAt,
      status: schema.bookings.status,
      totalPriceRsd: schema.bookings.totalPriceRsd,
      totalDurationMin: schema.bookings.totalDurationMin,
      notes: schema.bookings.notes,
      createdAt: schema.bookings.createdAt,
    })
    .from(schema.bookings)
    .where(eq(schema.bookings.userId, auth.user.id))
    .orderBy(desc(schema.bookings.startsAt));

  const upcoming = rows.filter(
    (booking) =>
      new Date(booking.startsAt) >= now &&
      ["pending", "confirmed"].includes(booking.status)
  );
  const past = rows.filter((booking) => new Date(booking.startsAt) < now);

  return ok({
    ok: true,
    upcoming,
    past,
    all: rows,
  });
}
