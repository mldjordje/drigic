import { and, asc, desc, eq, gte, lte, or } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { created, fail, ok, readJson } from "@/lib/api/http";
import { sendTransactionalEmail } from "@/lib/auth/email";
import { requireAdmin } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";
import {
  addMinutes,
  findConflicts,
  isWithinWorkHours,
  normalizeServiceSelections,
  resolveQuote,
} from "@/lib/booking/engine";
import { getClinicSettings, getDefaultEmployee } from "@/lib/booking/config";
import { WORKING_HOURS_SUMMARY } from "@/lib/booking/schedule";
import {
  deliverBookingAlertToAdmins,
  deliverBookingNotification,
} from "@/lib/notifications/delivery";
import {
  buildAdminBookingEmail,
  buildClientBookingEmail,
} from "@/lib/notifications/booking-email";
import { env } from "@/lib/env";

export const runtime = "nodejs";

const STATUS_VALUES = ["pending", "confirmed", "completed", "cancelled", "no_show"];
const STATUS_LABELS = {
  pending: "Na cekanju",
  confirmed: "Potvrdjen",
  completed: "Zavrsen",
  cancelled: "Otkazan",
  no_show: "No-show",
};

const updateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(STATUS_VALUES).optional(),
  notes: z.string().max(1000).optional(),
  startAt: z.string().datetime().optional(),
  serviceIds: z.array(z.string().uuid()).optional(),
  serviceSelections: z
    .array(
      z.object({
        serviceId: z.string().uuid(),
        quantity: z.number().int().min(1).optional(),
        brand: z.string().min(1).max(80).optional(),
      })
    )
    .optional(),
});

const createSchema = z.object({
  clientName: z.string().min(2).max(255),
  phone: z.string().max(32).optional(),
  email: z.string().email().optional(),
  serviceIds: z.array(z.string().uuid()).optional(),
  serviceSelections: z
    .array(
      z.object({
        serviceId: z.string().uuid(),
        quantity: z.number().int().min(1).optional(),
        brand: z.string().min(1).max(80).optional(),
      })
    )
    .optional(),
  startAt: z.string().datetime(),
  notes: z.string().max(1000).optional(),
  status: z.enum(["pending", "confirmed"]).optional(),
});

const ALLOWED_STATUS_TRANSITIONS = {
  pending: new Set(["pending", "confirmed", "cancelled", "no_show"]),
  confirmed: new Set(["confirmed", "completed", "cancelled", "no_show"]),
  completed: new Set(["completed"]),
  cancelled: new Set(["cancelled"]),
  no_show: new Set(["no_show"]),
};
const SLOT_CONFLICT_ERROR = "Selected slot overlaps with existing booking/block.";

async function lockEmployeeSchedule(tx, employeeId) {
  await tx.execute(
    sql`SELECT pg_advisory_xact_lock(hashtextextended(${employeeId}, 0))`
  );
}

function isValidStatusTransition(fromStatus, toStatus) {
  const allowed = ALLOWED_STATUS_TRANSITIONS[fromStatus];
  if (!allowed) {
    return false;
  }
  return allowed.has(toStatus);
}

function formatServiceSummaryItem(row) {
  const quantity = Number(row.quantity || 1);
  const label = row.serviceName || "Usluga";
  if (quantity <= 1) {
    return label;
  }
  const unit = row.unitLabel || "kom";
  return `${label} (${quantity} ${unit})`;
}

function getStatusNotificationPayload(status, startsAt) {
  const startsAtLabel = new Date(startsAt).toLocaleString("sr-RS", {
    timeZone: "Europe/Belgrade",
  });

  if (status === "confirmed") {
    return {
      type: "booking_confirmed",
      title: "Termin je potvrdjen",
      message: `Vas termin za ${startsAtLabel} je potvrdjen.`,
    };
  }

  if (status === "cancelled") {
    return {
      type: "booking_cancelled",
      title: "Termin je otkazan",
      message: `Vas termin za ${startsAtLabel} je otkazan. Kontaktirajte kliniku za novi termin.`,
    };
  }

  if (status === "pending") {
    return {
      type: "booking_submitted",
      title: "Zahtev za termin",
      message: `Kreiran je zahtev za termin ${startsAtLabel}. Sacekajte potvrdu klinike.`,
    };
  }

  return null;
}

function isPlaceholderEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase()
    .endsWith("@drigic.local");
}

function buildStatusEmailPayload(status, context) {
  const base = {
    startsAt: context.startsAt,
    serviceSummary: context.serviceSummary,
    durationMin: context.totalDurationMin,
    priceRsd: context.totalPriceRsd,
    statusLabel: STATUS_LABELS[status] || status,
    notes: context.notes,
    cancellationReason: context.cancellationReason,
  };

  if (status === "confirmed") {
    return buildClientBookingEmail({
      subject: "Termin je potvrdjen",
      previewText: "Vas termin je uspesno potvrdjen",
      heading: "Termin je potvrdjen",
      intro:
        "Vas termin je potvrdjen od strane klinike. Ako vam bude trebala izmena, javite nam se blagovremeno.",
      ...base,
    });
  }

  if (status === "cancelled") {
    return buildClientBookingEmail({
      subject: "Termin je otkazan",
      previewText: "Obavestenje o otkazivanju termina",
      heading: "Termin je otkazan",
      intro:
        "Termin je otkazan od strane klinike. Molimo vas da odaberete novi termin ili odgovorite na ovu poruku za pomoc.",
      ...base,
    });
  }

  if (status === "pending") {
    return buildClientBookingEmail({
      subject: "Zahtev za termin je evidentiran",
      previewText: "Termin je vracen u status cekanja",
      heading: "Zahtev za termin je evidentiran",
      intro:
        "Termin je evidentiran u statusu cekanja. Poslacemo vam novo obavestenje cim obrada bude zavrsena.",
      ...base,
    });
  }

  return null;
}

async function loadBookingNotificationContext(db, bookingId) {
  const rows = await db
    .select({
      booking: schema.bookings,
      userEmail: schema.users.email,
      userPhone: schema.users.phone,
      profileName: schema.profiles.fullName,
      serviceName: schema.bookingItems.serviceNameSnapshot,
      quantity: schema.bookingItems.quantity,
      unitLabel: schema.bookingItems.unitLabel,
    })
    .from(schema.bookings)
    .leftJoin(schema.users, eq(schema.users.id, schema.bookings.userId))
    .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.bookings.userId))
    .leftJoin(schema.bookingItems, eq(schema.bookingItems.bookingId, schema.bookings.id))
    .where(eq(schema.bookings.id, bookingId));

  if (!rows.length) {
    return null;
  }

  const first = rows[0];
  const services = rows
    .filter((row) => row.serviceName)
    .map((row) => formatServiceSummaryItem(row));

  return {
    ...first.booking,
    clientName:
      String(first.profileName || "").trim() ||
      String(first.userPhone || "").trim() ||
      String(first.userEmail || "").trim() ||
      "Klijent",
    clientEmail: String(first.userEmail || "").trim(),
    clientPhone: String(first.userPhone || "").trim(),
    serviceSummary: services.join(", "),
  };
}

async function loadBookingItemsAsSelections(db, bookingId) {
  const rows = await db
    .select({
      serviceId: schema.bookingItems.serviceId,
      quantity: schema.bookingItems.quantity,
    })
    .from(schema.bookingItems)
    .where(eq(schema.bookingItems.bookingId, bookingId));
  return rows.map((row) => ({
    serviceId: row.serviceId,
    quantity: Number(row.quantity || 1),
  }));
}

function buildRescheduleEmailPayload(context) {
  return buildClientBookingEmail({
    subject: "Izmenjen termin (na čekanju)",
    previewText: "Klinika je izmenila detalje vašeg termina",
    heading: "Termin je izmenjen",
    intro:
      "Klinika je izmenila datum, vreme ili usluge vašeg termina koji je još uvek na čekanju. Pregledajte nove detalje ispod.",
    startsAt: context.startsAt,
    serviceSummary: context.serviceSummary,
    durationMin: context.totalDurationMin,
    priceRsd: context.totalPriceRsd,
    statusLabel: STATUS_LABELS.pending,
    notes: context.notes,
  });
}

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const db = getDb();
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let rows = [];
  if (from && to) {
    rows = await db
      .select({
        booking: schema.bookings,
        userEmail: schema.users.email,
        userPhone: schema.users.phone,
        profileName: schema.profiles.fullName,
        serviceId: schema.bookingItems.serviceId,
        serviceName: schema.bookingItems.serviceNameSnapshot,
        quantity: schema.bookingItems.quantity,
        unitLabel: schema.bookingItems.unitLabel,
      })
      .from(schema.bookings)
      .leftJoin(schema.users, eq(schema.users.id, schema.bookings.userId))
      .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.bookings.userId))
      .leftJoin(schema.bookingItems, eq(schema.bookingItems.bookingId, schema.bookings.id))
      .where(
        and(
          gte(schema.bookings.startsAt, new Date(from)),
          lte(schema.bookings.startsAt, new Date(to))
        )
      )
      .orderBy(asc(schema.bookings.startsAt));
  } else {
    rows = await db
      .select({
        booking: schema.bookings,
        userEmail: schema.users.email,
        userPhone: schema.users.phone,
        profileName: schema.profiles.fullName,
        serviceId: schema.bookingItems.serviceId,
        serviceName: schema.bookingItems.serviceNameSnapshot,
        quantity: schema.bookingItems.quantity,
        unitLabel: schema.bookingItems.unitLabel,
      })
      .from(schema.bookings)
      .leftJoin(schema.users, eq(schema.users.id, schema.bookings.userId))
      .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.bookings.userId))
      .leftJoin(schema.bookingItems, eq(schema.bookingItems.bookingId, schema.bookings.id))
      .orderBy(desc(schema.bookings.startsAt))
      .limit(300);
  }

  const byId = new Map();
  for (const row of rows) {
    const id = row.booking.id;
    if (!byId.has(id)) {
      byId.set(id, {
        ...row.booking,
        clientName:
          String(row.profileName || "").trim() || String(row.userPhone || "").trim() || "Klijent",
        clientEmail: row.userEmail || "",
        clientPhone: row.userPhone || "",
        services: [],
        serviceIds: [],
      });
    }

    if (row.serviceName) {
      const current = byId.get(id);
      const item = formatServiceSummaryItem(row);
      if (!current.services.includes(item)) {
        current.services.push(item);
      }
      if (row.serviceId && !current.serviceIds.includes(row.serviceId)) {
        current.serviceIds.push(row.serviceId);
      }
    }
  }

  const data = Array.from(byId.values()).map((item) => ({
    ...item,
    serviceSummary: item.services.join(", "),
  }));

  return ok({ ok: true, data });
}

export async function PATCH(request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const body = await readJson(request);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Invalid payload", parsed.error.flatten());
  }

  const db = getDb();
  const [current] = await db
    .select()
    .from(schema.bookings)
    .where(eq(schema.bookings.id, parsed.data.id))
    .limit(1);

  if (!current) {
    return fail(404, "Booking not found.");
  }

  const wantsReschedule =
    Boolean(parsed.data.startAt) ||
    Boolean(parsed.data.serviceSelections?.length) ||
    parsed.data.serviceIds !== undefined;

  if (parsed.data.serviceIds !== undefined && !parsed.data.serviceIds.length) {
    return fail(400, "Izaberite bar jednu uslugu.");
  }

  if (wantsReschedule) {
    if (current.status !== "pending") {
      return fail(
        400,
        "Samo nepotvrđeni termini (na čekanju) mogu da se izmene na ovaj način."
      );
    }
    if (parsed.data.status != null && parsed.data.status !== current.status) {
      return fail(
        400,
        "Sačuvajte izmenu termina odvojeno od promene statusa (prvo izmenite termin, zatim status)."
      );
    }

    const normalizedSelections =
      parsed.data.serviceSelections?.length || parsed.data.serviceIds?.length
        ? normalizeServiceSelections(
            parsed.data.serviceSelections || [],
            parsed.data.serviceIds || []
          )
        : await loadBookingItemsAsSelections(db, current.id);

    if (!normalizedSelections.length) {
      return fail(400, "Mora postojati bar jedna usluga.");
    }

    const startAt = parsed.data.startAt
      ? new Date(parsed.data.startAt)
      : new Date(current.startsAt);

    const quote = await resolveQuote(normalizedSelections, {
      requireHyaluronicBrand: false,
    });
    const endsAt = addMinutes(startAt, quote.totalDurationMin);
    const settings = await getClinicSettings();

    if (!(await isWithinWorkHours(startAt, quote.totalDurationMin, settings))) {
      return fail(400, `Radno vreme klinike: ${WORKING_HOURS_SUMMARY}`);
    }

    const prevRows = await loadBookingItemsAsSelections(db, current.id);
    const prevFp = prevRows
      .map((r) => `${r.serviceId}:${r.quantity}`)
      .sort()
      .join("|");
    const nextFp = quote.items
      .map((i) => `${i.serviceId}:${i.quantity}`)
      .sort()
      .join("|");
    const prevStartMs = new Date(current.startsAt).getTime();
    const timeChanged = prevStartMs !== startAt.getTime();
    const servicesChanged = prevFp !== nextFp;

    let updated = null;
    try {
      await db.transaction(async (tx) => {
        await lockEmployeeSchedule(tx, current.employeeId);

        const conflictsInTx = await findConflicts({
          employeeId: current.employeeId,
          startsAt: startAt,
          endsAt,
          tx,
          excludeBookingId: current.id,
        });
        if (conflictsInTx.length) {
          throw new Error(SLOT_CONFLICT_ERROR);
        }

        await tx
          .delete(schema.bookingItems)
          .where(eq(schema.bookingItems.bookingId, current.id));

        await tx.insert(schema.bookingItems).values(
          quote.items.map((item) => ({
            bookingId: current.id,
            serviceId: item.serviceId,
            quantity: item.quantity,
            unitLabel: item.unitLabel,
            serviceNameSnapshot: item.name,
            durationMinSnapshot: item.durationMin,
            priceRsdSnapshot: item.finalPriceRsd,
            serviceColorSnapshot: item.serviceColor,
            sourcePackageServiceId: item.sourcePackageServiceId || null,
          }))
        );

        const bookingUpdates = {
          startsAt: startAt,
          endsAt,
          totalDurationMin: quote.totalDurationMin,
          totalPriceRsd: quote.totalPriceRsd,
          primaryServiceColor: quote.primaryServiceColor,
          updatedAt: new Date(),
        };

        if (typeof parsed.data.notes === "string") {
          bookingUpdates.notes = parsed.data.notes;
        }

        const [row] = await tx
          .update(schema.bookings)
          .set(bookingUpdates)
          .where(eq(schema.bookings.id, current.id))
          .returning();
        updated = row;
      });
    } catch (error) {
      if (String(error?.message || "").includes(SLOT_CONFLICT_ERROR)) {
        return fail(409, SLOT_CONFLICT_ERROR);
      }
      throw error;
    }

    if (timeChanged || servicesChanged) {
      const context = await loadBookingNotificationContext(db, current.id);
      if (context?.clientEmail && !isPlaceholderEmail(context.clientEmail)) {
        const startsAtLabel = new Date(context.startsAt).toLocaleString("sr-RS", {
          timeZone: "Europe/Belgrade",
        });
        const deliveryResult = await deliverBookingNotification({
          db,
          userId: context.userId,
          email: context.clientEmail,
          type: "booking_rescheduled",
          title: "Termin je izmenjen",
          message: `Izmenjeni su detalji vašeg termina (${startsAtLabel}).`,
          bookingId: current.id,
          scheduledFor: context.startsAt,
          dedupe: false,
          emailPayload: buildRescheduleEmailPayload(context),
        });
        if (!deliveryResult?.sentEmail) {
          console.error(
            "[admin.bookings.patch] reschedule client email not sent",
            deliveryResult?.emailReason || "unknown reason"
          );
        }
      }
    }

    return ok({ ok: true, data: updated });
  }

  const nextStatus = parsed.data.status || current.status;
  if (!isValidStatusTransition(current.status, nextStatus)) {
    return fail(
      409,
      `Invalid status transition: ${current.status} -> ${nextStatus}.`
    );
  }

  const updates = {
    updatedAt: new Date(),
  };

  if (parsed.data.status) {
    updates.status = parsed.data.status;
    if (parsed.data.status === "cancelled") {
      updates.cancelledAt = new Date();
    }
    if (parsed.data.status === "no_show") {
      updates.noShowMarkedAt = new Date();
    }
  }

  if (typeof parsed.data.notes === "string") {
    updates.notes = parsed.data.notes;
    if (nextStatus === "cancelled") {
      updates.cancellationReason = parsed.data.notes || null;
    }
  }

  const [updated] = await db
    .update(schema.bookings)
    .set(updates)
    .where(eq(schema.bookings.id, parsed.data.id))
    .returning();

  if (nextStatus !== current.status) {
    await db.insert(schema.bookingStatusLog).values({
      bookingId: current.id,
      previousStatus: current.status,
      nextStatus,
      changedByUserId: auth.user.id,
      note: "Updated from admin panel",
    });

    const statusNotification = getStatusNotificationPayload(nextStatus, current.startsAt);
    const context = await loadBookingNotificationContext(db, current.id);

    if (
      statusNotification &&
      context?.clientEmail &&
      !isPlaceholderEmail(context.clientEmail)
    ) {
      const deliveryResult = await deliverBookingNotification({
        db,
        userId: context.userId,
        email: context.clientEmail,
        type: statusNotification.type,
        title: statusNotification.title,
        message: statusNotification.message,
        bookingId: current.id,
        scheduledFor: current.startsAt,
        dedupe: false,
        emailPayload: buildStatusEmailPayload(nextStatus, context),
      });
      if (!deliveryResult?.sentEmail) {
        console.error(
          "[admin.bookings.patch] client status email not sent",
          deliveryResult?.emailReason || "unknown reason"
        );
      }
    }

    if (nextStatus === "cancelled" && context) {
      const startsAtLabel = new Date(context.startsAt).toLocaleString("sr-RS", {
        timeZone: "Europe/Belgrade",
      });
      const inboxEmail = String(env.ADMIN_BOOKING_NOTIFY_EMAIL || "").trim();
      const adminEmailPayload = buildAdminBookingEmail({
        subject: "Termin je otkazan",
        previewText: "Termin je otkazan iz admin panela",
        heading: "Termin je otkazan",
        intro:
          "Termin je oznacen kao otkazan iz admin panela i automatski je uklonjen iz operativnog kalendara.",
        startsAt: context.startsAt,
        serviceSummary: context.serviceSummary,
        durationMin: context.totalDurationMin,
        priceRsd: context.totalPriceRsd,
        statusLabel: "Otkazan",
        notes: context.notes,
        cancellationReason: context.cancellationReason,
        clientName: context.clientName,
        clientEmail: context.clientEmail,
        clientPhone: context.clientPhone,
        actorLabel: "Admin panel",
      });

      if (inboxEmail) {
        const inboxResult = await sendTransactionalEmail({
          to: inboxEmail,
          ...adminEmailPayload,
        });
        if (!inboxResult?.sent) {
          console.error(
            "[admin.bookings.patch] admin inbox cancellation email not sent",
            inboxResult?.reason || "unknown reason"
          );
        }
      }

      await deliverBookingAlertToAdmins({
        db,
        bookingId: current.id,
        type: "admin_booking_cancelled",
        title: "Termin je otkazan",
        message: `Termin ${startsAtLabel} za ${context.clientName} je otkazan iz admin panela.`,
        url: "/admin/kalendar",
        dedupe: true,
        emailPayload: adminEmailPayload,
      });
    }
  }

  return ok({ ok: true, data: updated });
}

export async function POST(request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const body = await readJson(request);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Invalid payload", parsed.error.flatten());
  }

  const payload = parsed.data;
  const phone = payload.phone?.trim() || null;
  const email = payload.email?.trim().toLowerCase() || null;
  if (!phone && !email) {
    return fail(400, "Provide at least phone or email for the client.");
  }

  const normalizedSelections = normalizeServiceSelections(
    payload.serviceSelections || [],
    payload.serviceIds || []
  );
  if (!normalizedSelections.length) {
    return fail(400, "At least one service is required.");
  }

  const db = getDb();
  const quote = await resolveQuote(normalizedSelections);
  const employee = await getDefaultEmployee();
  const settings = await getClinicSettings();
  const startAt = new Date(payload.startAt);
  const endsAt = addMinutes(startAt, quote.totalDurationMin);
  const finalStatus = payload.status || "confirmed";

  if (!(await isWithinWorkHours(startAt, quote.totalDurationMin, settings))) {
    return fail(400, `Clinic working hours are: ${WORKING_HOURS_SUMMARY}`);
  }

  const conflicts = await findConflicts({
    employeeId: employee.id,
    startsAt: startAt,
    endsAt,
  });
  if (conflicts.length) {
    return fail(409, SLOT_CONFLICT_ERROR);
  }

  const userFilter = [];
  if (email) {
    userFilter.push(eq(schema.users.email, email));
  }
  if (phone) {
    userFilter.push(eq(schema.users.phone, phone));
  }

  let user = null;
  if (userFilter.length === 1) {
    [user] = await db.select().from(schema.users).where(userFilter[0]).limit(1);
  } else if (userFilter.length > 1) {
    [user] = await db
      .select()
      .from(schema.users)
      .where(or(...userFilter))
      .limit(1);
  }

  if (!user) {
    const fallbackEmail =
      email || `phone-${String(phone || Date.now()).replace(/\W+/g, "")}@drigic.local`;
    [user] = await db
      .insert(schema.users)
      .values({
        email: fallbackEmail,
        phone,
        role: "client",
      })
      .returning();
  } else {
    const updates = { updatedAt: new Date() };
    if (phone && !user.phone) {
      updates.phone = phone;
    }
    if (Object.keys(updates).length > 1) {
      const [updatedUser] = await db
        .update(schema.users)
        .set(updates)
        .where(eq(schema.users.id, user.id))
        .returning();
      user = updatedUser || user;
    }
  }

  const [profile] = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, user.id))
    .limit(1);
  if (!profile) {
    await db.insert(schema.profiles).values({
      userId: user.id,
      fullName: payload.clientName,
    });
  } else if (payload.clientName && profile.fullName !== payload.clientName) {
    await db
      .update(schema.profiles)
      .set({
        fullName: payload.clientName,
        updatedAt: new Date(),
      })
      .where(eq(schema.profiles.id, profile.id));
  }

  let createdBooking = null;
  try {
    await db.transaction(async (tx) => {
      await lockEmployeeSchedule(tx, employee.id);

      const conflictsInTx = await findConflicts({
        employeeId: employee.id,
        startsAt: startAt,
        endsAt,
        tx,
      });
      if (conflictsInTx.length) {
        throw new Error(SLOT_CONFLICT_ERROR);
      }

      [createdBooking] = await tx
        .insert(schema.bookings)
        .values({
          userId: user.id,
          employeeId: employee.id,
          startsAt: startAt,
          endsAt,
          status: finalStatus,
          totalDurationMin: quote.totalDurationMin,
          totalPriceRsd: quote.totalPriceRsd,
          primaryServiceColor: quote.primaryServiceColor,
          notes: payload.notes || "Booked by admin",
        })
        .returning();

      await tx.insert(schema.bookingItems).values(
        quote.items.map((item) => ({
          bookingId: createdBooking.id,
          serviceId: item.serviceId,
          quantity: item.quantity,
          unitLabel: item.unitLabel,
          serviceNameSnapshot: item.name,
          durationMinSnapshot: item.durationMin,
          priceRsdSnapshot: item.finalPriceRsd,
          serviceColorSnapshot: item.serviceColor,
          sourcePackageServiceId: item.sourcePackageServiceId || null,
        }))
      );

      try {
        await tx.insert(schema.bookingStatusLog).values({
          bookingId: createdBooking.id,
          previousStatus: null,
          nextStatus: finalStatus,
          changedByUserId: auth.user.id,
          note: "Booking created from admin calendar",
        });
      } catch (logError) {
        console.error("[admin.bookings.create] status log insert failed", logError);
      }
    });
  } catch (error) {
    if (String(error?.message || "").includes(SLOT_CONFLICT_ERROR)) {
      return fail(409, SLOT_CONFLICT_ERROR);
    }
    throw error;
  }

  const serviceSummary = quote.items
    .map((item) => `${item.name}${item.quantity > 1 ? ` x${item.quantity}` : ""}`)
    .join(", ");
  const clientEmail = String(user.email || "").trim();

  if (clientEmail && !isPlaceholderEmail(clientEmail)) {
    const statusPayload = getStatusNotificationPayload(finalStatus, createdBooking.startsAt);
    if (statusPayload) {
      try {
        await deliverBookingNotification({
          db,
          userId: user.id,
          email: clientEmail,
          type: statusPayload.type,
          title: statusPayload.title,
          message: statusPayload.message,
          bookingId: createdBooking.id,
          scheduledFor: createdBooking.startsAt,
          dedupe: false,
          emailPayload: buildStatusEmailPayload(finalStatus, {
            ...createdBooking,
            clientName: payload.clientName,
            clientEmail,
            clientPhone: phone,
            serviceSummary,
          }),
        });
      } catch (notifyError) {
        console.error("[admin.bookings.create] client notification failed", notifyError);
      }
    }
  }

  return created({ ok: true, data: createdBooking, quote });
}
