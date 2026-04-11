import { and, eq, gte, lt, lte } from "drizzle-orm";
import { fail, ok } from "@/lib/api/http";
import { isCronAuthorized } from "@/lib/cron/auth";
import { getDb, schema } from "@/lib/db/client";
import { buildClientBookingEmail, formatBookingDateTime } from "@/lib/notifications/booking-email";
import {
  buildTreatmentRecordMarker,
  deliverBookingNotification,
  deliverNotification,
} from "@/lib/notifications/delivery";
import { getServiceReminderGuidance } from "@/lib/notifications/service-reminders";
import { getConfiguredSiteUrl } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function addHours(dateValue, hours) {
  return new Date(dateValue.getTime() + hours * 60 * 60 * 1000);
}

function buildReminderWindow({ offsetHours, durationHours = 1 }) {
  const now = new Date();
  return {
    start: addHours(now, offsetHours),
    end: addHours(now, offsetHours + durationHours),
  };
}

function formatServiceSummaryItem(row) {
  const quantity = Number(row.quantity || 1);
  const label = row.serviceName || "Usluga";
  if (quantity <= 1) {
    return label;
  }

  return `${label} (${quantity} ${row.unitLabel || "kom"})`;
}

function groupBookingRows(rows) {
  const bookingMap = new Map();

  for (const row of rows) {
    if (!bookingMap.has(row.bookingId)) {
      bookingMap.set(row.bookingId, {
        bookingId: row.bookingId,
        userId: row.userId,
        startsAt: row.startsAt,
        endsAt: row.endsAt,
        totalDurationMin: row.totalDurationMin,
        totalPriceRsd: row.totalPriceRsd,
        notes: row.notes,
        email: row.email,
        services: [],
      });
    }

    if (row.serviceName) {
      bookingMap.get(row.bookingId).services.push(formatServiceSummaryItem(row));
    }
  }

  return Array.from(bookingMap.values()).map((booking) => ({
    ...booking,
    serviceSummary: booking.services.join(", "),
  }));
}

async function loadReminderBookings({ db, start, end }) {
  const rows = await db
    .select({
      bookingId: schema.bookings.id,
      userId: schema.bookings.userId,
      startsAt: schema.bookings.startsAt,
      endsAt: schema.bookings.endsAt,
      totalDurationMin: schema.bookings.totalDurationMin,
      totalPriceRsd: schema.bookings.totalPriceRsd,
      notes: schema.bookings.notes,
      email: schema.users.email,
      serviceName: schema.bookingItems.serviceNameSnapshot,
      quantity: schema.bookingItems.quantity,
      unitLabel: schema.bookingItems.unitLabel,
    })
    .from(schema.bookings)
    .innerJoin(schema.users, eq(schema.users.id, schema.bookings.userId))
    .leftJoin(schema.bookingItems, eq(schema.bookingItems.bookingId, schema.bookings.id))
    .where(
      and(
        eq(schema.bookings.status, "confirmed"),
        gte(schema.bookings.startsAt, start),
        lt(schema.bookings.startsAt, end)
      )
    );

  return groupBookingRows(rows);
}

function buildReminderEmailPayload(booking, type) {
  const guidance = getServiceReminderGuidance(booking.serviceSummary);
  const isDayBefore = type === "reminder_24h";

  return {
    message: isDayBefore
      ? `Podsetnik: vas termin je zakazan za ${formatBookingDateTime(booking.startsAt)}.`
      : `Podsetnik: vas termin pocinje uskoro, ${formatBookingDateTime(booking.startsAt)}.`,
    emailPayload: buildClientBookingEmail({
      subject: isDayBefore ? "Podsetnik za termin sutra" : "Podsetnik za termin uskoro",
      previewText: isDayBefore
        ? "Vas termin je zakazan za naredni dan"
        : "Vas termin pocinje za oko dva sata",
      heading: isDayBefore ? "Podsetnik za sutrasnji termin" : "Podsetnik za skoriji dolazak",
      intro: isDayBefore
        ? "Podsecamo vas na zakazani termin. Ako vam je potrebna izmena, javite nam se sto ranije kako bismo vam pomogli."
        : "Podsecamo vas da termin pocinje uskoro. Ako kasnite ili vam je potrebna hitna izmena, kontaktirajte ordinaciju odmah.",
      startsAt: booking.startsAt,
      serviceSummary: booking.serviceSummary,
      durationMin: booking.totalDurationMin,
      priceRsd: booking.totalPriceRsd,
      statusLabel: "Potvrdjen",
      notes: booking.notes,
      footerLines: isDayBefore ? guidance.before24 : guidance.before2,
    }),
  };
}

async function processReminderType({ db, type, title, offsetHours }) {
  const bookings = await loadReminderBookings({
    db,
    ...buildReminderWindow({ offsetHours, durationHours: 2 }),
  });

  let sentCount = 0;
  for (const booking of bookings) {
    const payload = buildReminderEmailPayload(booking, type);
    const result = await deliverBookingNotification({
      db,
      userId: booking.userId,
      email: booking.email,
      type,
      title,
      message: payload.message,
      bookingId: booking.bookingId,
      scheduledFor: booking.startsAt,
      dedupe: true,
      emailPayload: payload.emailPayload,
    });

    if (!result?.deduped) {
      sentCount += 1;
    }
  }

  return sentCount;
}

function buildCorrectionEmailPayload(row) {
  const guidance = getServiceReminderGuidance(row.serviceName);
  const sections = [
    {
      label: "Usluga",
      value: row.serviceName,
    },
    {
      label: "Datum tretmana",
      value: formatBookingDateTime(row.treatmentDate),
    },
    {
      label: "Preporucena kontrola",
      value: new Date(`${row.correctionDueDate}T12:00:00Z`).toLocaleDateString("sr-RS", {
        timeZone: "Europe/Belgrade",
        dateStyle: "long",
      }),
    },
  ];

  return {
    subject: "Vreme je za kontrolu tretmana",
    previewText: "Podsetnik za kontrolni pregled ili korekciju",
    heading: "Podsetnik za kontrolu",
    intro:
      "Priblizio se preporuceni trenutak za kontrolni pregled. Ako zelite da proverimo rezultat ili isplaniramo naredni korak, mozete zakazati novi termin.",
    sections,
    ctaLabel: "Zakazite kontrolu",
    ctaUrl: new URL("/booking", getConfiguredSiteUrl()).toString(),
    footerLines: guidance.correction,
  };
}

async function processTreatmentCorrectionReminders(db) {
  const today = new Date().toISOString().slice(0, 10);
  const rows = await db
    .select({
      treatmentRecordId: schema.treatmentRecords.id,
      userId: schema.treatmentRecords.userId,
      treatmentDate: schema.treatmentRecords.treatmentDate,
      correctionDueDate: schema.treatmentRecords.correctionDueDate,
      serviceName: schema.services.name,
      email: schema.users.email,
    })
    .from(schema.treatmentRecords)
    .innerJoin(schema.users, eq(schema.users.id, schema.treatmentRecords.userId))
    .leftJoin(schema.services, eq(schema.services.id, schema.treatmentRecords.serviceId))
    .where(lte(schema.treatmentRecords.correctionDueDate, today));

  let sentCount = 0;
  for (const row of rows) {
    const serviceName = String(row.serviceName || "").trim();
    if (!serviceName || !row.correctionDueDate) {
      continue;
    }

    const marker = buildTreatmentRecordMarker("service_correction_reminder", row.treatmentRecordId);
    const result = await deliverNotification({
      db,
      userId: row.userId,
      email: row.email,
      type: "service_correction_reminder",
      title: "Podsetnik za kontrolu",
      message: `Podsetnik za kontrolu nakon usluge ${serviceName}. Ako vec imate zakazan termin, ovu poruku mozete zanemariti.`,
      scheduledFor: row.correctionDueDate,
      marker,
      url: "/booking",
      dedupe: true,
      emailPayload: buildCorrectionEmailPayload(row),
    });

    if (!result?.deduped) {
      sentCount += 1;
    }
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
    title: "Podsetnik za termin sutra",
    offsetHours: 24,
  });
  const sent2 = await processReminderType({
    db,
    type: "reminder_2h",
    title: "Podsetnik za termin uskoro",
    offsetHours: 2,
  });
  const sentCorrections = await processTreatmentCorrectionReminders(db);

  return ok({
    ok: true,
    sent24,
    sent2,
    sentCorrections,
  });
}
