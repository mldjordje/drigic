import { and, eq, gte, lt, lte } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { buildClientBookingEmail, formatBookingDateTime } from "@/lib/notifications/booking-email";
import {
  buildTreatmentRecordMarker,
  deliverBookingNotification,
  deliverNotification,
} from "@/lib/notifications/delivery";
import { getServiceReminderGuidance } from "@/lib/notifications/service-reminders";
import { getConfiguredSiteUrl } from "@/lib/site";

const HEARTBEAT_INTERVAL_MS = 15 * 60 * 1000;
let lastRunAt = 0;

function addHours(dateValue, hours) {
  return new Date(dateValue.getTime() + hours * 60 * 60 * 1000);
}

function buildReminderWindow({ offsetHours, durationHours = 2 }) {
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

function buildReminderEmailPayload(booking) {
  const guidance = getServiceReminderGuidance(booking.serviceSummary);

  return {
    message: `Podsetnik: vas termin je zakazan za ${formatBookingDateTime(booking.startsAt)}.`,
    emailPayload: buildClientBookingEmail({
      subject: "Podsetnik za termin (za 24 sata)",
      previewText: "Podsecamo vas na zakazani termin",
      heading: "Podsetnik za zakazani termin",
      intro:
        "Saljemo jedan podsetnik 24 sata pre pocetka termina. Ako vam je potrebna izmena, javite nam se sto ranije kako bismo vam pomogli.",
      startsAt: booking.startsAt,
      serviceSummary: booking.serviceSummary,
      durationMin: booking.totalDurationMin,
      priceRsd: booking.totalPriceRsd,
      statusLabel: "Potvrdjen",
      notes: booking.notes,
      footerLines: guidance.before24,
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
    const payload = buildReminderEmailPayload(booking);
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

export async function runReminderDispatch({ db = getDb() } = {}) {
  const sent24 = await processReminderType({
    db,
    type: "reminder_24h",
    title: "Podsetnik za termin (24h)",
    offsetHours: 24,
  });
  const sentCorrections = await processTreatmentCorrectionReminders(db);

  return {
    ok: true,
    sent24,
    sentCorrections,
  };
}

export async function maybeRunReminderDispatch({ db = getDb(), force = false } = {}) {
  const now = Date.now();
  if (!force && now - lastRunAt < HEARTBEAT_INTERVAL_MS) {
    return {
      ok: true,
      skipped: "throttled",
      sent24: 0,
      sentCorrections: 0,
    };
  }

  lastRunAt = now;

  try {
    return await runReminderDispatch({ db });
  } catch (error) {
    lastRunAt = 0;
    throw error;
  }
}
