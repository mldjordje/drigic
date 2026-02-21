import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { created, fail, ok, readJson } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";
import { getDefaultEmployee } from "@/lib/booking/config";

export const runtime = "nodejs";

const createRecordSchema = z.object({
  bookingId: z.string().uuid().nullable().optional(),
  treatmentDate: z.string().datetime().optional(),
  notes: z.string().max(3000).optional(),
  correctionDueDate: z.string().nullable().optional(),
  media: z
    .array(
      z.object({
        mediaUrl: z.string().url(),
        mediaType: z.string().max(32).optional(),
      })
    )
    .optional(),
});

async function assertClient(db, id) {
  const [client] = await db
    .select({
      id: schema.users.id,
      role: schema.users.role,
      email: schema.users.email,
      phone: schema.users.phone,
      fullName: schema.profiles.fullName,
      gender: schema.profiles.gender,
      birthDate: schema.profiles.birthDate,
      avatarUrl: schema.profiles.avatarUrl,
    })
    .from(schema.users)
    .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.users.id))
    .where(eq(schema.users.id, id))
    .limit(1);

  if (!client || client.role !== "client") {
    return null;
  }
  return client;
}

export async function GET(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const { id } = params || {};
  if (!id) {
    return fail(400, "Missing client id.");
  }

  const db = getDb();
  const client = await assertClient(db, id);
  if (!client) {
    return fail(404, "Client not found.");
  }

  const now = new Date();

  const [treatmentRows, bookingRows, penaltyRows] = await Promise.all([
    db
      .select({
        recordId: schema.treatmentRecords.id,
        bookingId: schema.treatmentRecords.bookingId,
        treatmentDate: schema.treatmentRecords.treatmentDate,
        notes: schema.treatmentRecords.notes,
        correctionDueDate: schema.treatmentRecords.correctionDueDate,
        mediaId: schema.treatmentRecordMedia.id,
        mediaUrl: schema.treatmentRecordMedia.mediaUrl,
        mediaType: schema.treatmentRecordMedia.mediaType,
      })
      .from(schema.treatmentRecords)
      .leftJoin(
        schema.treatmentRecordMedia,
        eq(schema.treatmentRecordMedia.treatmentRecordId, schema.treatmentRecords.id)
      )
      .where(eq(schema.treatmentRecords.userId, id))
      .orderBy(desc(schema.treatmentRecords.treatmentDate)),
    db
      .select({
        bookingId: schema.bookings.id,
        startsAt: schema.bookings.startsAt,
        endsAt: schema.bookings.endsAt,
        status: schema.bookings.status,
        notes: schema.bookings.notes,
        totalPriceRsd: schema.bookings.totalPriceRsd,
        totalDurationMin: schema.bookings.totalDurationMin,
        serviceName: schema.bookingItems.serviceNameSnapshot,
      })
      .from(schema.bookings)
      .leftJoin(schema.bookingItems, eq(schema.bookingItems.bookingId, schema.bookings.id))
      .where(eq(schema.bookings.userId, id))
      .orderBy(desc(schema.bookings.startsAt)),
    db
      .select({
        id: schema.penalties.id,
        amountRsd: schema.penalties.amountRsd,
        reason: schema.penalties.reason,
        status: schema.penalties.status,
        createdAt: schema.penalties.createdAt,
      })
      .from(schema.penalties)
      .where(eq(schema.penalties.userId, id))
      .orderBy(desc(schema.penalties.createdAt)),
  ]);

  const treatmentMap = new Map();
  for (const row of treatmentRows) {
    if (!treatmentMap.has(row.recordId)) {
      treatmentMap.set(row.recordId, {
        id: row.recordId,
        bookingId: row.bookingId,
        treatmentDate: row.treatmentDate,
        notes: row.notes,
        correctionDueDate: row.correctionDueDate,
        media: [],
      });
    }

    if (row.mediaId && row.mediaUrl) {
      treatmentMap.get(row.recordId).media.push({
        id: row.mediaId,
        mediaUrl: row.mediaUrl,
        mediaType: row.mediaType,
      });
    }
  }

  const bookingMap = new Map();
  for (const row of bookingRows) {
    if (!bookingMap.has(row.bookingId)) {
      bookingMap.set(row.bookingId, {
        id: row.bookingId,
        startsAt: row.startsAt,
        endsAt: row.endsAt,
        status: row.status,
        notes: row.notes,
        totalPriceRsd: row.totalPriceRsd,
        totalDurationMin: row.totalDurationMin,
        services: [],
      });
    }
    if (row.serviceName && !bookingMap.get(row.bookingId).services.includes(row.serviceName)) {
      bookingMap.get(row.bookingId).services.push(row.serviceName);
    }
  }

  const bookings = Array.from(bookingMap.values()).map((item) => ({
    ...item,
    serviceSummary: item.services.join(", "),
  }));
  const upcomingBookings = bookings.filter(
    (item) =>
      (item.status === "pending" || item.status === "confirmed") &&
      new Date(item.startsAt) >= now
  );

  const treatmentHistory = Array.from(treatmentMap.values());

  return ok({
    ok: true,
    client,
    treatmentHistory,
    bookings,
    upcomingBookings,
    correctionReminders: treatmentHistory
      .filter((record) => record.correctionDueDate)
      .map((record) => ({
        treatmentRecordId: record.id,
        correctionDueDate: record.correctionDueDate,
      })),
    penalties: penaltyRows,
  });
}

export async function POST(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const { id } = params || {};
  if (!id) {
    return fail(400, "Missing client id.");
  }

  const body = await readJson(request);
  const parsed = createRecordSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Invalid payload", parsed.error.flatten());
  }

  const db = getDb();
  const client = await assertClient(db, id);
  if (!client) {
    return fail(404, "Client not found.");
  }

  const payload = parsed.data;
  const employee = await getDefaultEmployee();

  if (payload.bookingId) {
    const [booking] = await db
      .select({
        id: schema.bookings.id,
      })
      .from(schema.bookings)
      .where(
        and(eq(schema.bookings.id, payload.bookingId), eq(schema.bookings.userId, client.id))
      )
      .limit(1);
    if (!booking) {
      return fail(400, "Booking does not belong to this client.");
    }
  }

  const treatmentDate = payload.treatmentDate ? new Date(payload.treatmentDate) : new Date();

  const [record] = await db
    .insert(schema.treatmentRecords)
    .values({
      userId: client.id,
      bookingId: payload.bookingId || null,
      employeeId: employee.id,
      treatmentDate,
      notes: payload.notes || null,
      correctionDueDate: payload.correctionDueDate || null,
    })
    .returning();

  if (payload.media?.length) {
    await db.insert(schema.treatmentRecordMedia).values(
      payload.media.map((item) => ({
        treatmentRecordId: record.id,
        mediaUrl: item.mediaUrl,
        mediaType: item.mediaType || "image",
      }))
    );
  }

  return created({
    ok: true,
    data: record,
  });
}
