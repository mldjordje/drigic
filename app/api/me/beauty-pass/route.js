import { and, asc, desc, eq, gte, inArray } from "drizzle-orm";
import { requireUser } from "@/lib/auth/guards";
import { ok } from "@/lib/api/http";
import { getDb, schema } from "@/lib/db/client";

export const runtime = "nodejs";

export async function GET(request) {
  const auth = await requireUser(request);
  if (auth.error) {
    return auth.error;
  }

  const db = getDb();
  const now = new Date();

  const [profile] = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, auth.user.id))
    .limit(1);

  const treatmentRows = await db
    .select({
      id: schema.treatmentRecords.id,
      bookingId: schema.treatmentRecords.bookingId,
      productId: schema.treatmentRecords.productId,
      productName: schema.treatmentProducts.name,
      productLogoUrl: schema.treatmentProducts.logoUrl,
      treatmentDate: schema.treatmentRecords.treatmentDate,
      notes: schema.treatmentRecords.notes,
      correctionDueDate: schema.treatmentRecords.correctionDueDate,
      createdAt: schema.treatmentRecords.createdAt,
    })
    .from(schema.treatmentRecords)
    .leftJoin(
      schema.treatmentProducts,
      eq(schema.treatmentProducts.id, schema.treatmentRecords.productId)
    )
    .where(eq(schema.treatmentRecords.userId, auth.user.id))
    .orderBy(desc(schema.treatmentRecords.treatmentDate));

  const treatmentHistory = treatmentRows.map((row) => ({
    id: row.id,
    bookingId: row.bookingId,
    treatmentDate: row.treatmentDate,
    notes: row.notes,
    correctionDueDate: row.correctionDueDate,
    createdAt: row.createdAt,
    product: row.productId
      ? {
          id: row.productId,
          name: row.productName,
          logoUrl: row.productLogoUrl,
        }
      : null,
  }));

  const upcomingBookings = await db
    .select()
    .from(schema.bookings)
    .where(
      and(
        eq(schema.bookings.userId, auth.user.id),
        gte(schema.bookings.startsAt, now),
        inArray(schema.bookings.status, ["pending", "confirmed"])
      )
    )
    .orderBy(desc(schema.bookings.startsAt));

  const penalties = await db
    .select()
    .from(schema.penalties)
    .where(eq(schema.penalties.userId, auth.user.id))
    .orderBy(desc(schema.penalties.createdAt));

  const products = await db
    .select({
      id: schema.treatmentProducts.id,
      name: schema.treatmentProducts.name,
      logoUrl: schema.treatmentProducts.logoUrl,
      sortOrder: schema.treatmentProducts.sortOrder,
    })
    .from(schema.treatmentProducts)
    .where(eq(schema.treatmentProducts.isActive, true))
    .orderBy(asc(schema.treatmentProducts.sortOrder), asc(schema.treatmentProducts.name));

  return ok({
    ok: true,
    profile: profile || null,
    treatmentHistory,
    upcomingBookings,
    correctionReminders: treatmentHistory
      .filter((record) => record.correctionDueDate)
      .map((record) => ({
        treatmentRecordId: record.id,
        correctionDueDate: record.correctionDueDate,
      })),
    penalties,
    products,
  });
}
