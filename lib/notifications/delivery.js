import crypto from "node:crypto";

import { and, eq, like, sql } from "drizzle-orm";
import { sendReminderEmail, sendTransactionalEmail } from "@/lib/auth/email";
import { sendPushToUser } from "@/lib/notifications/push";
import { buildAdminBookingEmail } from "@/lib/notifications/booking-email";
import { schema } from "@/lib/db/client";

/** Admin in-app obaveštenja ostaju; email za ove adrese se ne šalje. */
const ADMIN_ALERT_EMAIL_BLOCKLIST = new Set(
  ["web.wise018@gmail.com"].map((e) => e.toLowerCase())
);

function shouldSkipAdminAlertEmail(email) {
  return ADMIN_ALERT_EMAIL_BLOCKLIST.has(String(email || "").trim().toLowerCase());
}

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

function advisoryLockKeys(seed) {
  const buf = crypto.createHash("sha256").update(seed).digest();
  return [buf.readInt32BE(0), buf.readInt32BE(4)];
}

function shouldSendReminderPushToSingleDevice(type) {
  const t = String(type || "");
  return t.startsWith("reminder_") || t === "service_correction_reminder";
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
  emailPayload,
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
    emailPayload,
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
  emailPayload,
}) {
  if (!marker) {
    throw new Error("Notification marker is required.");
  }

  const messageWithMarker = `${message} (${marker})`;
  const notificationRow = {
    userId,
    channel: "in_app",
    type,
    title,
    message: messageWithMarker,
    scheduledFor,
    sentAt: new Date(),
    status: "sent",
  };

  if (dedupe) {
    const [k1, k2] = advisoryLockKeys(`${userId}:${marker}`);
    let alreadySent = false;
    await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${k1}, ${k2})`);
      const exists = await hasNotificationMarker({ db: tx, userId, type, marker });
      if (exists) {
        alreadySent = true;
        return;
      }
      await tx.insert(schema.notifications).values(notificationRow);
    });
    if (alreadySent) {
      return { sentEmail: false, sentPush: 0, deduped: true };
    }
  } else {
    await db.insert(schema.notifications).values(notificationRow);
  }

  let sentEmail = false;
  let emailReason = null;
  if (email) {
    try {
      const emailResult = emailPayload
        ? await sendTransactionalEmail({
            to: email,
            ...emailPayload,
          })
        : await sendReminderEmail({
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
    const pushOptions = shouldSendReminderPushToSingleDevice(type)
      ? { maxSubscriptions: 1 }
      : {};
    const pushResult = await sendPushToUser(
      userId,
      {
        title,
        body: message,
        bookingId,
        type,
        url,
      },
      pushOptions
    );
    sentPush = Number(pushResult?.sent || 0);
  } catch {
    sentPush = 0;
  }

  return { sentEmail, emailReason, sentPush, deduped: false };
}

export async function deliverBookingAlertToAdmins({
  db,
  bookingId,
  type,
  title,
  message,
  url = "/admin/kalendar",
  dedupe = true,
  emailPayload,
}) {
  const admins = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
    })
    .from(schema.users)
    .where(eq(schema.users.role, "admin"));

  const results = [];
  for (const admin of admins) {
    const marker = `admin-${type}:${bookingId}:to:${admin.id}`;
    const email =
      admin.email && !shouldSkipAdminAlertEmail(admin.email) ? admin.email : null;
    const delivery = await deliverNotification({
      db,
      userId: admin.id,
      email,
      type,
      title,
      message,
      marker,
      url,
      dedupe,
      bookingId,
      emailPayload,
    });
    results.push(delivery);
  }

  return results;
}

export async function deliverNewBookingAlertToAdmins({
  db,
  bookingId,
  clientName,
  clientEmail,
  clientPhone,
  startsAtLabel,
  startsAt,
  serviceSummary,
  durationMin,
  priceRsd,
  notes,
}) {
  const title = "Novi zahtev za termin";
  const message = [
    `Klijent: ${clientName || "-"}.`,
    `Email: ${clientEmail || "-"}.`,
    `Termin: ${startsAtLabel}.`,
    `Usluge: ${serviceSummary || "-"}.`,
    `Trajanje: ${durationMin} min.`,
    `Cena: ${priceRsd} EUR.`,
  ].join(" ");
  const emailPayload = buildAdminBookingEmail({
    subject: "Novi zahtev za termin",
    previewText: "Stigao je novi zahtev koji ceka obradu",
    heading: "Novi zahtev za termin",
    intro:
      "U sistem je upravo stigao novi zahtev za termin. Pregledajte detalje i potvrdite ili korigujte termin u admin kalendaru.",
    startsAt,
    serviceSummary,
    durationMin,
    priceRsd,
    statusLabel: "Na cekanju",
    notes,
    clientName,
    clientEmail,
    clientPhone,
  });

  return deliverBookingAlertToAdmins({
    db,
    bookingId,
    type: "admin_new_booking",
    title,
    message,
    url: "/admin/kalendar",
    dedupe: true,
    emailPayload,
  });
}
