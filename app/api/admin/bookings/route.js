import { and, asc, desc, eq, gte, lte, or } from "drizzle-orm";
import { z } from "zod";
import { created, fail, ok, readJson } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";
import { addMinutes, findConflicts, resolveQuote } from "@/lib/booking/engine";
import { getDefaultEmployee } from "@/lib/booking/config";

export const runtime = "nodejs";

const updateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "confirmed", "completed", "cancelled", "no_show"]).optional(),
  notes: z.string().max(1000).optional(),
});

const createSchema = z.object({
  clientName: z.string().min(2).max(255),
  phone: z.string().max(32).optional(),
  email: z.string().email().optional(),
  serviceIds: z.array(z.string().uuid()).min(1),
  startAt: z.string().datetime(),
  notes: z.string().max(1000).optional(),
  status: z.enum(["pending", "confirmed"]).optional(),
});

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
        clientName: row.profileName || row.userEmail || "Klijent",
        clientEmail: row.userEmail || "",
        clientPhone: row.userPhone || "",
        services: [],
      });
    }

    if (row.serviceName) {
      const current = byId.get(id);
      if (!current.services.includes(row.serviceName)) {
        current.services.push(row.serviceName);
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

  const updates = {
    updatedAt: new Date(),
  };

  if (parsed.data.status) {
    updates.status = parsed.data.status;
  }

  if (typeof parsed.data.notes === "string") {
    updates.notes = parsed.data.notes;
  }

  const [updated] = await db
    .update(schema.bookings)
    .set(updates)
    .where(eq(schema.bookings.id, parsed.data.id))
    .returning();

  if (parsed.data.status && parsed.data.status !== current.status) {
    await db.insert(schema.bookingStatusLog).values({
      bookingId: current.id,
      previousStatus: current.status,
      nextStatus: parsed.data.status,
      changedByUserId: auth.user.id,
      note: "Updated from admin panel",
    });
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

  const db = getDb();
  const quote = await resolveQuote(payload.serviceIds);
  const employee = await getDefaultEmployee();
  const startAt = new Date(payload.startAt);
  const endsAt = addMinutes(startAt, quote.totalDurationMin);
  const finalStatus = payload.status || "confirmed";

  const createdBooking = await db.transaction(async (tx) => {
    const conflicts = await findConflicts({
      employeeId: employee.id,
      startsAt: startAt.toISOString(),
      endsAt: endsAt.toISOString(),
      tx,
    });
    if (conflicts.length) {
      throw new Error("Selected slot overlaps with existing booking/block.");
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
      [user] = await tx.select().from(schema.users).where(userFilter[0]).limit(1);
    } else if (userFilter.length > 1) {
      [user] = await tx
        .select()
        .from(schema.users)
        .where(or(...userFilter))
        .limit(1);
    }

    if (!user) {
      const fallbackEmail =
        email || `phone-${String(phone || Date.now()).replace(/\W+/g, "")}@drigic.local`;
      [user] = await tx
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
        const [updatedUser] = await tx
          .update(schema.users)
          .set(updates)
          .where(eq(schema.users.id, user.id))
          .returning();
        user = updatedUser || user;
      }
    }

    const [profile] = await tx
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.userId, user.id))
      .limit(1);
    if (!profile) {
      await tx.insert(schema.profiles).values({
        userId: user.id,
        fullName: payload.clientName,
      });
    } else if (payload.clientName && profile.fullName !== payload.clientName) {
      await tx
        .update(schema.profiles)
        .set({
          fullName: payload.clientName,
          updatedAt: new Date(),
        })
        .where(eq(schema.profiles.id, profile.id));
    }

    const [booking] = await tx
      .insert(schema.bookings)
      .values({
        userId: user.id,
        employeeId: employee.id,
        startsAt: startAt,
        endsAt,
        status: finalStatus,
        totalDurationMin: quote.totalDurationMin,
        totalPriceRsd: quote.totalPriceRsd,
        notes: payload.notes || "Booked by admin",
      })
      .returning();

    await tx.insert(schema.bookingItems).values(
      quote.items.map((item) => ({
        bookingId: booking.id,
        serviceId: item.serviceId,
        serviceNameSnapshot: item.name,
        durationMinSnapshot: item.durationMin,
        priceRsdSnapshot: item.finalPriceRsd,
      }))
    );

    await tx.insert(schema.bookingStatusLog).values({
      bookingId: booking.id,
      previousStatus: null,
      nextStatus: finalStatus,
      changedByUserId: auth.user.id,
      note: "Booking created from admin calendar",
    });

    return booking;
  });

  return created({ ok: true, data: createdBooking, quote });
}
