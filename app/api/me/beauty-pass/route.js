import { and, desc, eq, gte, inArray } from "drizzle-orm";
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

  const treatmentHistory = await db
    .select({
      id: schema.treatmentRecords.id,
      bookingId: schema.treatmentRecords.bookingId,
      treatmentDate: schema.treatmentRecords.treatmentDate,
      notes: schema.treatmentRecords.notes,
      correctionDueDate: schema.treatmentRecords.correctionDueDate,
      createdAt: schema.treatmentRecords.createdAt,
    })
    .from(schema.treatmentRecords)
    .where(eq(schema.treatmentRecords.userId, auth.user.id))
    .orderBy(desc(schema.treatmentRecords.treatmentDate));

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
  });
}
