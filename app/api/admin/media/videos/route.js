import { z } from "zod";
import { eq } from "drizzle-orm";
import { created, fail, ok, readJson } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";

export const runtime = "nodejs";

const payloadSchema = z.object({
  youtubeUrl: z.string().url(),
  title: z.string().min(2).max(255),
  isPublished: z.boolean().optional(),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  youtubeUrl: z.string().url().optional(),
  title: z.string().min(2).max(255).optional(),
  isPublished: z.boolean().optional(),
});

const deleteSchema = z.object({
  id: z.string().uuid(),
});

export async function POST(request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const body = await readJson(request);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Invalid payload", parsed.error.flatten());
  }

  const db = getDb();
  const [record] = await db
    .insert(schema.videoLinks)
    .values({
      ...parsed.data,
      isPublished: parsed.data.isPublished ?? true,
    })
    .returning();

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

  const db = getDb();
  const [existing] = await db
    .select({ id: schema.videoLinks.id })
    .from(schema.videoLinks)
    .where(eq(schema.videoLinks.id, parsed.data.id))
    .limit(1);
  if (!existing) {
    return fail(404, "Video unos nije pronadjen.");
  }

  const updates = {
    updatedAt: new Date(),
    ...(parsed.data.youtubeUrl !== undefined ? { youtubeUrl: parsed.data.youtubeUrl } : {}),
    ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
    ...(parsed.data.isPublished !== undefined ? { isPublished: parsed.data.isPublished } : {}),
  };

  if (Object.keys(updates).length === 1) {
    return fail(400, "No update fields provided.");
  }

  const [updated] = await db
    .update(schema.videoLinks)
    .set(updates)
    .where(eq(schema.videoLinks.id, parsed.data.id))
    .returning();

  return ok({ ok: true, data: updated });
}

export async function DELETE(request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const body = await readJson(request);
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Invalid payload", parsed.error.flatten());
  }

  const db = getDb();
  const deleted = await db
    .delete(schema.videoLinks)
    .where(eq(schema.videoLinks.id, parsed.data.id))
    .returning({ id: schema.videoLinks.id });

  if (!deleted.length) {
    return fail(404, "Video unos nije pronadjen.");
  }

  return ok({ ok: true });
}
