import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api/http";
import { requireUser } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";

export const runtime = "nodejs";

const subscribeSchema = z.object({
  endpoint: z.string().min(1),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  userAgent: z.string().max(1000).optional(),
});

const unsubscribeSchema = z.object({
  endpoint: z.string().min(1),
});

export async function POST(request) {
  const auth = await requireUser(request);
  if (auth.error) {
    return auth.error;
  }

  const body = await readJson(request);
  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Invalid payload", parsed.error.flatten());
  }

  const db = getDb();
  const [existing] = await db
    .select()
    .from(schema.pushSubscriptions)
    .where(eq(schema.pushSubscriptions.endpoint, parsed.data.endpoint))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(schema.pushSubscriptions)
      .set({
        userId: auth.user.id,
        p256dh: parsed.data.keys.p256dh,
        auth: parsed.data.keys.auth,
        userAgent: parsed.data.userAgent || existing.userAgent || null,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(schema.pushSubscriptions.id, existing.id))
      .returning();

    return ok({ ok: true, data: updated, action: "updated" });
  }

  const [created] = await db
    .insert(schema.pushSubscriptions)
    .values({
      userId: auth.user.id,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
      userAgent: parsed.data.userAgent || null,
      isActive: true,
    })
    .returning();

  return ok({ ok: true, data: created, action: "created" });
}

export async function DELETE(request) {
  const auth = await requireUser(request);
  if (auth.error) {
    return auth.error;
  }

  const body = await readJson(request);
  const parsed = unsubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Invalid payload", parsed.error.flatten());
  }

  const db = getDb();
  const [updated] = await db
    .update(schema.pushSubscriptions)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.pushSubscriptions.userId, auth.user.id),
        eq(schema.pushSubscriptions.endpoint, parsed.data.endpoint)
      )
    )
    .returning();

  if (!updated) {
    return fail(404, "Subscription not found.");
  }

  return ok({ ok: true, data: updated });
}
