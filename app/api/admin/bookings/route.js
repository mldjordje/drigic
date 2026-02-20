import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";

export const runtime = "nodejs";

const updateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "confirmed", "completed", "cancelled", "no_show"]).optional(),
  notes: z.string().max(1000).optional(),
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
