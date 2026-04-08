import { eq } from "drizzle-orm";
import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";
import {
  isSundayDateKey,
  nextSundayDateKeysFrom,
  toBelgradeDateKey,
  toMinutes,
} from "@/lib/booking/schedule";

export const runtime = "nodejs";

const timeRegex = /^\d{2}:\d{2}$/;

const upsertSchema = z.object({
  sundayDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(timeRegex),
  endTime: z.string().regex(timeRegex),
  isActive: z.boolean().optional(),
  note: z.string().max(1000).optional(),
});

const patchSchema = z.object({
  id: z.string().uuid(),
  startTime: z.string().regex(timeRegex).optional(),
  endTime: z.string().regex(timeRegex).optional(),
  isActive: z.boolean().optional(),
  note: z.string().max(1000).nullable().optional(),
});

function getPgCode(error) {
  return String(error?.code || error?.cause?.code || "");
}

function validateTimes(startTime, endTime) {
  if (toMinutes(startTime) >= toMinutes(endTime)) {
    return "Vreme početka mora biti pre vremena kraja.";
  }
  return "";
}

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const { searchParams } = new URL(request.url);
  const upcoming = Math.min(
    24,
    Math.max(1, Number(searchParams.get("upcoming") || "8") || 8)
  );

  const todayKey = toBelgradeDateKey(new Date());
  const sundayKeys = nextSundayDateKeysFrom(todayKey, upcoming);
  if (!sundayKeys.length) {
    return ok({ ok: true, data: { todayKey, weeks: [] } });
  }

  const db = getDb();

  try {
    const rows = await db.select().from(schema.sundayAvailability);

    const allowed = new Set(sundayKeys);
    const byDate = Object.fromEntries(
      rows
        .map((row) => {
        const key =
          typeof row.sundayDate === "string"
            ? row.sundayDate
            : row.sundayDate instanceof Date
              ? toBelgradeDateKey(row.sundayDate)
              : row.sundayDate?.toISOString?.().slice(0, 10) || "";
        return [key, row];
        })
        .filter(([key]) => allowed.has(key))
    );

    const weeks = sundayKeys.map((dateKey) => ({
      sundayDate: dateKey,
      record: byDate[dateKey] || null,
    }));

    return ok({ ok: true, data: { todayKey, weeks } });
  } catch (error) {
    if (getPgCode(error) === "42P01") {
      return ok({
        ok: true,
        data: {
          todayKey,
          weeks: sundayKeys.map((dateKey) => ({ sundayDate: dateKey, record: null })),
        },
      });
    }
    return fail(500, error?.message || "Neuspešno učitavanje nedeljnih termina.");
  }
}

export async function POST(request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const body = await readJson(request);
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Invalid payload", parsed.error.flatten());
  }

  if (!isSundayDateKey(parsed.data.sundayDate)) {
    return fail(400, "Datum mora biti nedelja (kalendarski dan u Beogradu).");
  }

  const timeError = validateTimes(parsed.data.startTime, parsed.data.endTime);
  if (timeError) {
    return fail(400, timeError);
  }

  const db = getDb();
  const isActive = parsed.data.isActive !== false;

  try {
    const [existing] = await db
      .select()
      .from(schema.sundayAvailability)
      .where(eq(schema.sundayAvailability.sundayDate, parsed.data.sundayDate))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(schema.sundayAvailability)
        .set({
          startTime: parsed.data.startTime,
          endTime: parsed.data.endTime,
          isActive,
          note:
            parsed.data.note !== undefined
              ? parsed.data.note || null
              : existing.note,
          updatedAt: new Date(),
        })
        .where(eq(schema.sundayAvailability.id, existing.id))
        .returning();

      return ok({ ok: true, data: updated });
    }

    const [created] = await db
      .insert(schema.sundayAvailability)
      .values({
        sundayDate: parsed.data.sundayDate,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        isActive,
        note: parsed.data.note || null,
        createdByUserId: auth.user.id,
      })
      .returning();

    return ok({ ok: true, data: created });
  } catch (error) {
    if (getPgCode(error) === "42P01") {
      return fail(500, "Baza nije ažurirana. Pokrenite migracije (0012_sunday_availability).");
    }
    return fail(500, error?.message || "Neuspešno čuvanje nedeljnih termina.");
  }
}

export async function PATCH(request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const body = await readJson(request);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Invalid payload", parsed.error.flatten());
  }

  const db = getDb();

  try {
    const [existing] = await db
      .select()
      .from(schema.sundayAvailability)
      .where(eq(schema.sundayAvailability.id, parsed.data.id))
      .limit(1);

    if (!existing) {
      return fail(404, "Zapis nije pronađen.");
    }

    const nextStart = parsed.data.startTime ?? existing.startTime;
    const nextEnd = parsed.data.endTime ?? existing.endTime;
    const timeError = validateTimes(nextStart, nextEnd);
    if (timeError) {
      return fail(400, timeError);
    }

    const [updated] = await db
      .update(schema.sundayAvailability)
      .set({
        startTime: nextStart,
        endTime: nextEnd,
        isActive: parsed.data.isActive ?? existing.isActive,
        note:
          parsed.data.note !== undefined ? parsed.data.note : existing.note,
        updatedAt: new Date(),
      })
      .where(eq(schema.sundayAvailability.id, parsed.data.id))
      .returning();

    return ok({ ok: true, data: updated });
  } catch (error) {
    if (getPgCode(error) === "42P01") {
      return fail(500, "Baza nije ažurirana. Pokrenite migracije (0012_sunday_availability).");
    }
    return fail(500, error?.message || "Neuspešno ažuriranje.");
  }
}
