import { and, desc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { publicOk } from "@/lib/api/http";
import { getDb, schema } from "@/lib/db/client";

export const runtime = "nodejs";
export const revalidate = 300;

function isMissingOptionalColumn(error) {
  const message = String(error?.message || error?.cause?.message || "").toLowerCase();
  return (
    (
      message.includes("service_category") ||
      message.includes("collage_image_url") ||
      message.includes("service_id")
    ) &&
    (message.includes("does not exist") || message.includes("column"))
  );
}

const getCachedBeforeAfterCases = unstable_cache(
  async (serviceCategory, serviceId, limit) => {
    const db = getDb();
    let rows;
    const filters = [eq(schema.beforeAfterCases.isPublished, true)];

    if (serviceCategory) {
      filters.push(eq(schema.beforeAfterCases.serviceCategory, serviceCategory));
    }
    if (serviceId) {
      filters.push(eq(schema.beforeAfterCases.serviceId, serviceId));
    }

    try {
      rows = await db
        .select({
          id: schema.beforeAfterCases.id,
          treatmentType: schema.beforeAfterCases.treatmentType,
          serviceCategory: schema.beforeAfterCases.serviceCategory,
          serviceId: schema.beforeAfterCases.serviceId,
          productUsed: schema.beforeAfterCases.productUsed,
          beforeImageUrl: schema.beforeAfterCases.beforeImageUrl,
          afterImageUrl: schema.beforeAfterCases.afterImageUrl,
          collageImageUrl: schema.beforeAfterCases.collageImageUrl,
          isPublished: schema.beforeAfterCases.isPublished,
          createdAt: schema.beforeAfterCases.createdAt,
          updatedAt: schema.beforeAfterCases.updatedAt,
          serviceName: schema.services.name,
          serviceSlug: schema.services.slug,
        })
        .from(schema.beforeAfterCases)
        .leftJoin(schema.services, eq(schema.services.id, schema.beforeAfterCases.serviceId))
        .where(and(...filters))
        .orderBy(desc(schema.beforeAfterCases.createdAt))
        .limit(limit);
    } catch (error) {
      if (!isMissingOptionalColumn(error)) {
        throw error;
      }

      try {
        const fallbackRowsWithCategory = await db
          .select({
            id: schema.beforeAfterCases.id,
            treatmentType: schema.beforeAfterCases.treatmentType,
            serviceCategory: schema.beforeAfterCases.serviceCategory,
            productUsed: schema.beforeAfterCases.productUsed,
            beforeImageUrl: schema.beforeAfterCases.beforeImageUrl,
            afterImageUrl: schema.beforeAfterCases.afterImageUrl,
            isPublished: schema.beforeAfterCases.isPublished,
            createdAt: schema.beforeAfterCases.createdAt,
            updatedAt: schema.beforeAfterCases.updatedAt,
          })
          .from(schema.beforeAfterCases)
          .where(
            and(
              eq(schema.beforeAfterCases.isPublished, true),
              ...(serviceCategory
                ? [eq(schema.beforeAfterCases.serviceCategory, serviceCategory)]
                : [])
            )
          )
          .orderBy(desc(schema.beforeAfterCases.createdAt))
          .limit(limit);

        rows = fallbackRowsWithCategory.map((row) => ({
          ...row,
          collageImageUrl: null,
          serviceId: null,
          serviceName: null,
          serviceSlug: null,
        }));
      } catch {
        const fallbackRows = await db
          .select({
            id: schema.beforeAfterCases.id,
            treatmentType: schema.beforeAfterCases.treatmentType,
            productUsed: schema.beforeAfterCases.productUsed,
            beforeImageUrl: schema.beforeAfterCases.beforeImageUrl,
            afterImageUrl: schema.beforeAfterCases.afterImageUrl,
            isPublished: schema.beforeAfterCases.isPublished,
            createdAt: schema.beforeAfterCases.createdAt,
            updatedAt: schema.beforeAfterCases.updatedAt,
          })
          .from(schema.beforeAfterCases)
          .where(eq(schema.beforeAfterCases.isPublished, true))
          .orderBy(desc(schema.beforeAfterCases.createdAt))
          .limit(limit);

        rows = fallbackRows.map((row) => ({
          ...row,
          serviceCategory: null,
          collageImageUrl: null,
          serviceId: null,
          serviceName: null,
          serviceSlug: null,
        }));
      }
    }

    return rows;
  },
  ["public-before-after-cases"],
  { revalidate }
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const serviceCategory = String(searchParams.get("serviceCategory") || "").trim();
  const serviceId = String(searchParams.get("serviceId") || "").trim();
  const limit = Math.max(1, Math.min(60, Number(searchParams.get("limit") || 30)));
  const data = await getCachedBeforeAfterCases(serviceCategory, serviceId, limit);

  return publicOk(
    { ok: true, data },
    { sMaxAge: revalidate, staleWhileRevalidate: 1800 }
  );
}
