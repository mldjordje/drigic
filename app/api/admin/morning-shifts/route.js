import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { created, fail, ok, readJson } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";

export const runtime = "nodejs";

const timeRegex = /^\d{2}:\d{2}$/;

const createSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(timeRegex),
  endTime: z.string().regex(timeRegex),
  note: z.string().max(1000).optional(),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  isActive: z.boolean().optional(),
  note: z.string().max(1000).optional(),
});

function toMinutes(value) {
  const [hours, minutes] = String(value || "")
    .split(":")
    .map(Number);
  return hours * 60 + minutes;
}

function validateRange(payload) {
  if (payload.startDate > payload.endDate) {
    return "Datum od ne može biti posle datuma do.";
  }

  if (toMinutes(payload.startTime) >= toMinutes(payload.endTime)) {
    return "Vreme od mora biti pre vremena do.";
  }

  return "";
}

function getPgCode(error) {
  return String(error?.code || error?.cause?.code || "");
}

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const db = getDb();

  try {
    const data = await db
      .select()
      .from(schema.morningShiftActivations)
      .orderBy(
        desc(schema.morningShiftActivations.isActive),
        desc(schema.morningShiftActivations.startDate),
        desc(schema.morningShiftActivations.createdAt)
      );

    return ok({ ok: true, data });
  } catch (error) {
    if (getPgCode(error) === "42P01") {
      return ok({ ok: true, data: [] });
    }
    return fail(500, error?.message || "Neuspešno učitavanje prepodnevnih termina.");
  }
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

  const rangeError = validateRange(parsed.data);
  if (rangeError) {
    return fail(400, rangeError);
  }

  const db = getDb();

  try {
    const [createdRecord] = await db
      .insert(schema.morningShiftActivations)
      .values({
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        note: parsed.data.note || null,
        isActive: true,
        createdByUserId: auth.user.id,
      })
      .returning();

    return created({ ok: true, data: createdRecord });
  } catch (error) {
    if (getPgCode(error) === "42P01") {
      return fail(500, "Database schema mismatch. Run latest migrations.");
    }
    return fail(500, error?.message || "Neuspešno kreiranje prepodnevnih termina.");
  }
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

  try {
    const [existing] = await db
      .select()
      .from(schema.morningShiftActivations)
      .where(eq(schema.morningShiftActivations.id, parsed.data.id))
      .limit(1);

    if (!existing) {
      return fail(404, "Aktivacija nije pronađena.");
    }

    const [updatedRecord] = await db
      .update(schema.morningShiftActivations)
      .set({
        isActive: parsed.data.isActive ?? existing.isActive,
        note: parsed.data.note ?? existing.note,
        updatedAt: new Date(),
      })
      .where(eq(schema.morningShiftActivations.id, parsed.data.id))
      .returning();

    return ok({ ok: true, data: updatedRecord });
  } catch (error) {
    if (getPgCode(error) === "42P01") {
      return fail(500, "Database schema mismatch. Run latest migrations.");
    }
    return fail(500, error?.message || "Neuspešno ažuriranje prepodnevnih termina.");
  }
}
