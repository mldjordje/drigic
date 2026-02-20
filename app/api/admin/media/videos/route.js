import { z } from "zod";
import { created, fail, readJson } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";

export const runtime = "nodejs";

const payloadSchema = z.object({
  youtubeUrl: z.string().url(),
  title: z.string().min(2).max(255),
  isPublished: z.boolean().optional(),
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

