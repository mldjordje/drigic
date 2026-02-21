import { and, asc, eq } from "drizzle-orm";
import { ok } from "@/lib/api/http";
import { getDb, schema } from "@/lib/db/client";

export const runtime = "nodejs";

export async function GET() {
  const db = getDb();
  const data = await db
    .select({
      id: schema.treatmentProducts.id,
      name: schema.treatmentProducts.name,
      logoUrl: schema.treatmentProducts.logoUrl,
      sortOrder: schema.treatmentProducts.sortOrder,
      isActive: schema.treatmentProducts.isActive,
    })
    .from(schema.treatmentProducts)
    .where(and(eq(schema.treatmentProducts.isActive, true)))
    .orderBy(asc(schema.treatmentProducts.sortOrder), asc(schema.treatmentProducts.name));

  return ok({ ok: true, data });
}
