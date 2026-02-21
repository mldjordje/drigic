import { and, eq, gte, inArray, lte, like } from "drizzle-orm";
import { fail, ok } from "@/lib/api/http";
import { isCronAuthorized } from "@/lib/cron/auth";
import { getDb, schema } from "@/lib/db/client";
import { deliverBookingNotification } from "@/lib/notifications/delivery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function windowRange(targetHours) {
  const now = new Date();
  const target = new Date(now.getTime() + targetHours * 60 * 60 * 1000);
  const start = new Date(target.getTime() - 5 * 60 * 1000);
  const end = new Date(target.getTime() + 5 * 60 * 1000);
  return { start, end };
}

async function processReminderType({ db, type, title, targetHours }) {
  const { start, end } = windowRange(targetHours);
  const bookings = await db
    .select({
      bookingId: schema.bookings.id,
      userId: schema.bookings.userId,
      startsAt: schema.bookings.startsAt,
      email: schema.users.email,
    })
    .from(schema.bookings)
    .innerJoin(schema.users, eq(schema.users.id, schema.bookings.userId))
    .where(
      and(
        inArray(schema.bookings.status, ["confirmed"]),
        gte(schema.bookings.startsAt, start),
        lte(schema.bookings.startsAt, end)
      )
    );

  let sentCount = 0;
  for (const booking of bookings) {
    const marker = `booking:${booking.bookingId}`;
    const [existing] = await db
      .select()
      .from(schema.notifications)
      .where(
        and(
          eq(schema.notifications.userId, booking.userId),
          eq(schema.notifications.type, type),
          like(schema.notifications.message, `%${marker}%`)
        )
      )
      .limit(1);

    if (existing) {
      continue;
    }

    const message = `Podsetnik za termin (${new Date(
      booking.startsAt
    ).toLocaleString("sr-RS", { timeZone: "Europe/Belgrade" })})`;

    await deliverBookingNotification({
      db,
      userId: booking.userId,
      email: booking.email,
      type,
      title,
      message,
      bookingId: booking.bookingId,
      scheduledFor: booking.startsAt,
      dedupe: true,
    });

    sentCount += 1;
  }

  return sentCount;
}

export async function GET(request) {
  if (!isCronAuthorized(request)) {
    return fail(401, "Unauthorized cron request.");
  }

  const db = getDb();
  const sent24 = await processReminderType({
    db,
    type: "reminder_24h",
    title: "Podsetnik: Termin je za 24h",
    targetHours: 24,
  });
  const sent2 = await processReminderType({
    db,
    type: "reminder_2h",
    title: "Podsetnik: Termin je za 2h",
    targetHours: 2,
  });

  return ok({
    ok: true,
    sent24,
    sent2,
  });
}
