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
const FIXED_WORKDAY_START = "16:00";
const FIXED_WORKDAY_END = "21:00";

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
      workdayStart: FIXED_WORKDAY_START,
      workdayEnd: FIXED_WORKDAY_END,
    })
    .returning();
  return created;
}

function withFixedWorkingHours(settings) {
  return {
    ...settings,
    workdayStart: FIXED_WORKDAY_START,
    workdayEnd: FIXED_WORKDAY_END,
  };
}

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const db = getDb();
  const settings = await getOrCreateSettings(db);
  if (
    settings.workdayStart !== FIXED_WORKDAY_START ||
    settings.workdayEnd !== FIXED_WORKDAY_END
  ) {
    const [normalized] = await db
      .update(schema.clinicSettings)
      .set({
        workdayStart: FIXED_WORKDAY_START,
        workdayEnd: FIXED_WORKDAY_END,
        updatedAt: new Date(),
      })
      .where(eq(schema.clinicSettings.id, settings.id))
      .returning();
    return ok({ ok: true, data: withFixedWorkingHours(normalized) });
  }

  return ok({ ok: true, data: withFixedWorkingHours(settings) });
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
      slotMinutes: parsed.data.slotMinutes ?? settings.slotMinutes,
      bookingWindowDays: parsed.data.bookingWindowDays ?? settings.bookingWindowDays,
      workdayStart: FIXED_WORKDAY_START,
      workdayEnd: FIXED_WORKDAY_END,
      updatedAt: new Date(),
    })
    .where(eq(schema.clinicSettings.id, settings.id))
    .returning();

  return ok({ ok: true, data: withFixedWorkingHours(updated) });
}
