import { desc, eq } from "drizzle-orm";
import { ok } from "@/lib/api/http";
import { getDb, schema } from "@/lib/db/client";

export const runtime = "nodejs";

function isMissingOptionalColumn(error) {
  const message = String(error?.message || error?.cause?.message || "").toLowerCase();
  return (
    (message.includes("service_category") || message.includes("collage_image_url")) &&
    (message.includes("does not exist") || message.includes("column"))
  );
}

export async function GET() {
  const db = getDb();
  let rows;

  try {
    rows = await db
      .select({
        id: schema.beforeAfterCases.id,
        treatmentType: schema.beforeAfterCases.treatmentType,
        serviceCategory: schema.beforeAfterCases.serviceCategory,
        productUsed: schema.beforeAfterCases.productUsed,
        beforeImageUrl: schema.beforeAfterCases.beforeImageUrl,
        afterImageUrl: schema.beforeAfterCases.afterImageUrl,
        collageImageUrl: schema.beforeAfterCases.collageImageUrl,
        isPublished: schema.beforeAfterCases.isPublished,
        createdAt: schema.beforeAfterCases.createdAt,
        updatedAt: schema.beforeAfterCases.updatedAt,
      })
      .from(schema.beforeAfterCases)
      .where(eq(schema.beforeAfterCases.isPublished, true))
      .orderBy(desc(schema.beforeAfterCases.createdAt))
      .limit(30);
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
        .where(eq(schema.beforeAfterCases.isPublished, true))
        .orderBy(desc(schema.beforeAfterCases.createdAt))
        .limit(30);

      rows = fallbackRowsWithCategory.map((row) => ({ ...row, collageImageUrl: null }));
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
        .limit(30);

      rows = fallbackRows.map((row) => ({
        ...row,
        serviceCategory: null,
        collageImageUrl: null,
      }));
    }
  }

  return ok({ ok: true, data: rows });
}
