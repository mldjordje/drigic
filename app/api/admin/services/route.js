import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { created, fail, ok, readJson } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";

export const runtime = "nodejs";

const createSchema = z.object({
  categoryId: z.string().uuid(),
  bodyAreaId: z.string().uuid().nullable().optional(),
  name: z.string().min(2).max(255),
  description: z.string().max(3000).optional(),
  priceRsd: z.number().int().min(0),
  durationMin: z.number().int().min(5).max(480),
  isActive: z.boolean().optional(),
  isVip: z.boolean().optional(),
});

const updateSchema = createSchema
  .partial()
  .extend({ id: z.string().uuid() });

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(schema.services)
    .orderBy(asc(schema.services.name));

  return ok({ ok: true, data: rows });
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

  const db = getDb();
  const [record] = await db.insert(schema.services).values(parsed.data).returning();
  return created({ ok: true, data: record });
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

  const { id, ...updates } = parsed.data;
  if (!Object.keys(updates).length) {
    return fail(400, "No update fields provided.");
  }

  const db = getDb();
  const [record] = await db
    .update(schema.services)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(schema.services.id, id))
    .returning();

  if (!record) {
    return fail(404, "Service not found.");
  }

  return ok({ ok: true, data: record });
}
