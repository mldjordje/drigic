import { asc } from "drizzle-orm";
import { ok } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";

export const runtime = "nodejs";

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const db = getDb();
  const categories = await db
    .select()
    .from(schema.serviceCategories)
    .orderBy(asc(schema.serviceCategories.sortOrder), asc(schema.serviceCategories.name));

  const bodyAreas = await db
    .select()
    .from(schema.bodyAreas)
    .orderBy(asc(schema.bodyAreas.sortOrder), asc(schema.bodyAreas.name));

  return ok({
    ok: true,
    categories,
    bodyAreas,
  });
}

