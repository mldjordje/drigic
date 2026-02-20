import { z } from "zod";
import { desc } from "drizzle-orm";
import { created, fail, ok, readJson } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";

export const runtime = "nodejs";

const payloadSchema = z.object({
  title: z.string().min(2).max(255),
  message: z.string().min(2).max(5000),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(schema.homeAnnouncements)
    .orderBy(desc(schema.homeAnnouncements.createdAt))
    .limit(100);

  return ok({ ok: true, data: rows });
}

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
    .insert(schema.homeAnnouncements)
    .values({
      title: parsed.data.title,
      message: parsed.data.message,
      startsAt: parsed.data.startsAt ? new Date(parsed.data.startsAt) : null,
      endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null,
      isActive: parsed.data.isActive ?? true,
    })
    .returning();

  return created({ ok: true, data: record });
}
