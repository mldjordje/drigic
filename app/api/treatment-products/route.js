import { and, asc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { publicOk } from "@/lib/api/http";
import { getDb, schema } from "@/lib/db/client";

export const runtime = "nodejs";
export const revalidate = 600;

const getCachedTreatmentProducts = unstable_cache(
  async () => {
    const db = getDb();
    return db
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
  },
  ["public-treatment-products"],
  { revalidate }
);

export async function GET() {
  const data = await getCachedTreatmentProducts();

  return publicOk(
    { ok: true, data },
    { sMaxAge: revalidate, staleWhileRevalidate: 3600 }
  );
}
