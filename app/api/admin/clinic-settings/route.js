import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";

export const runtime = "nodejs";

const updateSchema = z.object({
  slotMinutes: z.number().int().min(5).max(60).optional(),
  bookingWindowDays: z.number().int().min(1).max(60).optional(),
  workdayStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  workdayEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

async function getOrCreateSettings(db) {
  const [settings] = await db
    .select()
    .from(schema.clinicSettings)
    .orderBy(desc(schema.clinicSettings.createdAt))
    .limit(1);
  if (settings) {
    return settings;
  }

  const [created] = await db
    .insert(schema.clinicSettings)
    .values({
      slotMinutes: Number(process.env.CLINIC_SLOT_MINUTES || 15),
      bookingWindowDays: Number(process.env.CLINIC_BOOKING_WINDOW_DAYS || 31),
      workdayStart: process.env.CLINIC_WORKDAY_START || "09:00",
      workdayEnd: process.env.CLINIC_WORKDAY_END || "20:00",
    })
    .returning();
  return created;
}

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const db = getDb();
  const settings = await getOrCreateSettings(db);
  return ok({ ok: true, data: settings });
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
  const settings = await getOrCreateSettings(db);
  const [updated] = await db
    .update(schema.clinicSettings)
    .set({
      ...parsed.data,
      updatedAt: new Date(),
    })
    .where(eq(schema.clinicSettings.id, settings.id))
    .returning();

  return ok({ ok: true, data: updated });
}

