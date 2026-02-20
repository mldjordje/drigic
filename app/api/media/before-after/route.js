import { desc, eq } from "drizzle-orm";
import { ok } from "@/lib/api/http";
import { getDb, schema } from "@/lib/db/client";

export const runtime = "nodejs";

export async function GET() {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.beforeAfterCases)
    .where(eq(schema.beforeAfterCases.isPublished, true))
    .orderBy(desc(schema.beforeAfterCases.createdAt))
    .limit(30);

  return ok({ ok: true, data: rows });
}

