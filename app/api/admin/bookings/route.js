import { and, asc, desc, eq, gte, lte, or } from "drizzle-orm";
import { z } from "zod";
import { created, fail, ok, readJson } from "@/lib/api/http";
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
import { deliverBookingNotification } from "@/lib/notifications/delivery";

export const runtime = "nodejs";

const STATUS_VALUES = ["pending", "confirmed", "completed", "cancelled", "no_show"];

const updateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(STATUS_VALUES).optional(),
  notes: z.string().max(1000).optional(),
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
      title: "Termin je potvrden",
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

  return null;
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
      });
    }

    if (row.serviceName) {
      const current = byId.get(id);
      const item = formatServiceSummaryItem(row);
      if (!current.services.includes(item)) {
        current.services.push(item);
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
    if (statusNotification) {
      const [user] = await db
        .select({
          id: schema.users.id,
          email: schema.users.email,
        })
        .from(schema.users)
        .where(eq(schema.users.id, current.userId))
        .limit(1);

      if (user) {
        const deliveryResult = await deliverBookingNotification({
          db,
          userId: user.id,
          email: user.email,
          type: statusNotification.type,
          title: statusNotification.title,
          message: statusNotification.message,
          bookingId: current.id,
          scheduledFor: current.startsAt,
          dedupe: false,
        });
        if (!deliveryResult?.sentEmail) {
          console.error(
            "[admin.bookings.patch] client status email not sent",
            deliveryResult?.emailReason || "unknown reason"
          );
        }
      }
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

  if (!isWithinWorkHours(startAt, quote.totalDurationMin, settings)) {
    return fail(
      400,
      `Clinic working hours are ${settings.workdayStart}-${settings.workdayEnd}.`
    );
  }

  const conflicts = await findConflicts({
    employeeId: employee.id,
    startsAt: startAt,
    endsAt,
  });
  if (conflicts.length) {
    return fail(409, "Selected slot overlaps with existing booking/block.");
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

  const [createdBooking] = await db
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

  await db.insert(schema.bookingItems).values(
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
    await db.insert(schema.bookingStatusLog).values({
      bookingId: createdBooking.id,
      previousStatus: null,
      nextStatus: finalStatus,
      changedByUserId: auth.user.id,
      note: "Booking created from admin calendar",
    });
  } catch (logError) {
    console.error("[admin.bookings.create] status log insert failed", logError);
  }

  return created({ ok: true, data: createdBooking, quote });
}
