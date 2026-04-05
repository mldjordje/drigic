import { and, eq, like } from "drizzle-orm";
import { sendReminderEmail } from "@/lib/auth/email";
import { sendPushToUser } from "@/lib/notifications/push";
import { schema } from "@/lib/db/client";

export function stripNotificationMarkerSuffix(message) {
  return String(message || "")
    .replace(/\s+\([^)]*\b(booking|treatment-record|admin-new-booking):[^)]+\)\s*$/i, "")
    .trim();
}

function escapeLikePattern(value) {
  return String(value).replace(/[%_]/g, "");
}

export function buildBookingMarker(type, bookingId) {
  return `booking:${bookingId}:${type}`;
}

export function buildTreatmentRecordMarker(type, treatmentRecordId) {
  return `treatment-record:${treatmentRecordId}:${type}`;
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

  return deliverNotification({
    db,
    userId,
    email,
    type,
    title,
    message,
    scheduledFor,
    marker,
    url: "/beauty-pass",
    dedupe,
    bookingId,
  });
}

export async function deliverNotification({
  db,
  userId,
  email,
  type,
  title,
  message,
  scheduledFor = null,
  marker,
  url = "/beauty-pass",
  dedupe = false,
  bookingId = null,
}) {
  if (!marker) {
    throw new Error("Notification marker is required.");
  }

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
  let emailReason = null;
  if (email) {
    try {
      const emailResult = await sendReminderEmail({
        to: email,
        title,
        message,
      });
      sentEmail = Boolean(emailResult?.sent);
      emailReason = emailResult?.reason || null;
    } catch {
      sentEmail = false;
      emailReason = "send failed unexpectedly";
    }
  }

  let sentPush = 0;
  try {
    const pushResult = await sendPushToUser(userId, {
      title,
      body: message,
      bookingId,
      type,
      url,
    });
    sentPush = Number(pushResult?.sent || 0);
  } catch {
    sentPush = 0;
  }

  return { sentEmail, emailReason, sentPush, deduped: false };
}

export async function deliverNewBookingAlertToAdmins({
  db,
  bookingId,
  clientEmail,
  startsAtLabel,
  serviceSummary,
  durationMin,
  priceRsd,
}) {
  const admins = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
    })
    .from(schema.users)
    .where(eq(schema.users.role, "admin"));

  const title = "Novi zahtev za termin";
  const message = [
    `Klijent: ${clientEmail || "-"}.`,
    `Termin: ${startsAtLabel}.`,
    `Usluge: ${serviceSummary || "-"}.`,
    `Trajanje: ${durationMin} min.`,
    `Cena: ${priceRsd} EUR.`,
  ].join(" ");

  const results = [];
  for (const admin of admins) {
    const marker = `admin-new-booking:${bookingId}:to:${admin.id}`;
    const delivery = await deliverNotification({
      db,
      userId: admin.id,
      email: admin.email,
      type: "admin_new_booking",
      title,
      message,
      marker,
      url: "/admin/kalendar",
      dedupe: true,
      bookingId,
    });
    results.push(delivery);
  }

  return results;
}
