import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api/http";
import { requireUser } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";

export const runtime = "nodejs";

const updateSchema = z.object({
  fullName: z.string().max(255).optional(),
  gender: z.string().max(32).optional(),
  birthDate: z.string().optional(),
  phone: z.string().max(32).optional(),
  avatarUrl: z.string().url().optional(),
});

export async function GET(request) {
  const auth = await requireUser(request);
  if (auth.error) {
    return auth.error;
  }

  const db = getDb();
  const [profile] = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, auth.user.id))
    .limit(1);

  return ok({
    ok: true,
    user: auth.user,
    profile: profile || null,
  });
}

export async function PATCH(request) {
  const auth = await requireUser(request);
  if (auth.error) {
    return auth.error;
  }

  const body = await readJson(request);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Invalid payload", parsed.error.flatten());
  }

  const db = getDb();
  const [existing] = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, auth.user.id))
    .limit(1);

  if (parsed.data.phone) {
    await db
      .update(schema.users)
      .set({ phone: parsed.data.phone, updatedAt: new Date() })
      .where(eq(schema.users.id, auth.user.id));
  }

  const profilePayload = {
    fullName: parsed.data.fullName,
    gender: parsed.data.gender,
    birthDate: parsed.data.birthDate || null,
    avatarUrl: parsed.data.avatarUrl,
    updatedAt: new Date(),
  };

  let profile = existing;
  if (!existing) {
    [profile] = await db
      .insert(schema.profiles)
      .values({
        userId: auth.user.id,
        ...profilePayload,
      })
      .returning();
  } else {
    [profile] = await db
      .update(schema.profiles)
      .set(profilePayload)
      .where(eq(schema.profiles.id, existing.id))
      .returning();
  }

  return ok({
    ok: true,
    profile,
  });
}

