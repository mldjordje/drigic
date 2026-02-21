import { and, eq, like } from "drizzle-orm";
import { sendReminderEmail } from "@/lib/auth/email";
import { sendPushToUser } from "@/lib/notifications/push";
import { schema } from "@/lib/db/client";

function escapeLikePattern(value) {
  return String(value).replace(/[%_]/g, "");
}

export function buildBookingMarker(type, bookingId) {
  return `booking:${bookingId}:${type}`;
}

export async function hasNotificationMarker({ db, userId, type, marker }) {
  const safeMarker = escapeLikePattern(marker);
  const [existing] = await db
    .select()
    .from(schema.notifications)
    .where(
      and(
        eq(schema.notifications.userId, userId),
        eq(schema.notifications.type, type),
        like(schema.notifications.message, `%${safeMarker}%`)
      )
    )
    .limit(1);

  return Boolean(existing);
}

export async function deliverBookingNotification({
  db,
  userId,
  email,
  type,
  title,
  message,
  bookingId,
  scheduledFor = null,
  dedupe = false,
}) {
  const marker = buildBookingMarker(type, bookingId);

  if (dedupe) {
    const exists = await hasNotificationMarker({ db, userId, type, marker });
    if (exists) {
      return { sentEmail: false, sentPush: 0, deduped: true };
    }
  }

  const messageWithMarker = `${message} (${marker})`;
  await db.insert(schema.notifications).values({
    userId,
    channel: "in_app",
    type,
    title,
    message: messageWithMarker,
    scheduledFor,
    sentAt: new Date(),
    status: "sent",
  });

  let sentEmail = false;
  if (email) {
    try {
      const emailResult = await sendReminderEmail({
        to: email,
        title,
        message,
      });
      sentEmail = Boolean(emailResult?.sent);
    } catch {
      sentEmail = false;
    }
  }

  let sentPush = 0;
  try {
    const pushResult = await sendPushToUser(userId, {
      title,
      body: message,
      bookingId,
      type,
      url: "/beauty-pass",
    });
    sentPush = Number(pushResult?.sent || 0);
  } catch {
    sentPush = 0;
  }

  return { sentEmail, sentPush, deduped: false };
}
