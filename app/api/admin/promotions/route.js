import { and, asc, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { created, fail, ok, readJson } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";

export const runtime = "nodejs";

const createSchema = z.object({
  serviceId: z.string().uuid(),
  title: z.string().min(2).max(255),
  promoPriceRsd: z.number().int().min(0),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
  isActive: z.boolean().optional(),
});

const updateSchema = createSchema.partial().extend({
  id: z.string().uuid(),
});

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(schema.servicePromotions)
    .orderBy(asc(schema.servicePromotions.createdAt));

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

  const data = {
    ...parsed.data,
    startsAt: parsed.data.startsAt ? new Date(parsed.data.startsAt) : null,
    endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null,
  };

  const db = getDb();
  const [record] = await db.transaction(async (tx) => {
    if (data.isActive !== false) {
      await tx
        .update(schema.servicePromotions)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.servicePromotions.serviceId, data.serviceId),
            eq(schema.servicePromotions.isActive, true)
          )
        );
    }

    const [createdPromotion] = await tx
      .insert(schema.servicePromotions)
      .values({
        ...data,
        isActive: data.isActive !== undefined ? data.isActive : true,
      })
      .returning();
    return [createdPromotion];
  });

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

  const { id, startsAt, endsAt, ...updates } = parsed.data;
  const db = getDb();

  const [current] = await db
    .select()
    .from(schema.servicePromotions)
    .where(eq(schema.servicePromotions.id, id))
    .limit(1);

  if (!current) {
    return fail(404, "Promotion not found.");
  }

  const nextServiceId = updates.serviceId || current.serviceId;
  const nextIsActive =
    updates.isActive !== undefined ? updates.isActive : Boolean(current.isActive);

  const [record] = await db.transaction(async (tx) => {
    if (nextIsActive) {
      await tx
        .update(schema.servicePromotions)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.servicePromotions.serviceId, nextServiceId),
            eq(schema.servicePromotions.isActive, true),
            ne(schema.servicePromotions.id, id)
          )
        );
    }

    const [updatedPromotion] = await tx
      .update(schema.servicePromotions)
      .set({
        ...updates,
        ...(startsAt !== undefined
          ? { startsAt: startsAt ? new Date(startsAt) : null }
          : {}),
        ...(endsAt !== undefined ? { endsAt: endsAt ? new Date(endsAt) : null } : {}),
        updatedAt: new Date(),
      })
      .where(eq(schema.servicePromotions.id, id))
      .returning();

    return [updatedPromotion];
  });

  if (!record) {
    return fail(404, "Promotion not found.");
  }

  return ok({ ok: true, data: record });
}
