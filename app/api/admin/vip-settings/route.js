import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";

export const runtime = "nodejs";

const updateSchema = z.object({
  basePriceRsd: z.number().int().min(0).optional(),
  notes: z.string().max(2000).optional(),
});

async function getOrCreateVipSettings(db) {
  const [current] = await db
    .select()
    .from(schema.vipSettings)
    .orderBy(desc(schema.vipSettings.createdAt))
    .limit(1);

  if (current) {
    return current;
  }

  const [created] = await db
    .insert(schema.vipSettings)
    .values({
      basePriceRsd: 0,
      notes: "Default VIP settings",
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
  const settings = await getOrCreateVipSettings(db);
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
  const settings = await getOrCreateVipSettings(db);
  const [updated] = await db
    .update(schema.vipSettings)
    .set({
      ...parsed.data,
      updatedAt: new Date(),
    })
    .where(eq(schema.vipSettings.id, settings.id))
    .returning();

  return ok({ ok: true, data: updated });
}

