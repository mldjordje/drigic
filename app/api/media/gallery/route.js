import { desc } from "drizzle-orm";
import { ok } from "@/lib/api/http";
import { getDb, schema } from "@/lib/db/client";

export const runtime = "nodejs";

export async function GET() {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.galleryMedia)
    .orderBy(desc(schema.galleryMedia.createdAt))
    .limit(100);

  return ok({ ok: true, data: rows });
}

