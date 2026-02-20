import { and, asc, eq, gte, isNull, lte, or } from "drizzle-orm";
import { ok } from "@/lib/api/http";
import { getDb, schema } from "@/lib/db/client";

export const runtime = "nodejs";

export async function GET() {
  const db = getDb();
  const now = new Date();

  const rows = await db
    .select({
      categoryId: schema.serviceCategories.id,
      categoryName: schema.serviceCategories.name,
      categorySort: schema.serviceCategories.sortOrder,
      serviceId: schema.services.id,
      serviceName: schema.services.name,
      description: schema.services.description,
      priceRsd: schema.services.priceRsd,
      durationMin: schema.services.durationMin,
      isVip: schema.services.isVip,
      bodyAreaId: schema.bodyAreas.id,
      bodyAreaName: schema.bodyAreas.name,
      promoPriceRsd: schema.servicePromotions.promoPriceRsd,
      promoStartsAt: schema.servicePromotions.startsAt,
      promoEndsAt: schema.servicePromotions.endsAt,
      promoActive: schema.servicePromotions.isActive,
      promotionTitle: schema.servicePromotions.title,
    })
    .from(schema.services)
    .innerJoin(
      schema.serviceCategories,
      eq(schema.services.categoryId, schema.serviceCategories.id)
    )
    .leftJoin(schema.bodyAreas, eq(schema.services.bodyAreaId, schema.bodyAreas.id))
    .leftJoin(
      schema.servicePromotions,
      and(
        eq(schema.servicePromotions.serviceId, schema.services.id),
        eq(schema.servicePromotions.isActive, true),
        or(isNull(schema.servicePromotions.startsAt), lte(schema.servicePromotions.startsAt, now)),
        or(isNull(schema.servicePromotions.endsAt), gte(schema.servicePromotions.endsAt, now))
      )
    )
    .where(and(eq(schema.services.isActive, true), eq(schema.serviceCategories.isActive, true)))
    .orderBy(asc(schema.serviceCategories.sortOrder), asc(schema.services.name));

  const grouped = rows.reduce((acc, row) => {
    if (!acc[row.categoryId]) {
      acc[row.categoryId] = {
        id: row.categoryId,
        name: row.categoryName,
        sortOrder: row.categorySort,
        services: [],
      };
    }

    acc[row.categoryId].services.push({
      id: row.serviceId,
      name: row.serviceName,
      description: row.description,
      priceRsd: row.priceRsd,
      durationMin: row.durationMin,
      isVip: row.isVip,
      bodyArea: row.bodyAreaId
        ? { id: row.bodyAreaId, name: row.bodyAreaName }
        : null,
      promotion:
        row.promoPriceRsd && row.promoActive
          ? {
              title: row.promotionTitle,
              promoPriceRsd: row.promoPriceRsd,
              startsAt: row.promoStartsAt,
              endsAt: row.promoEndsAt,
            }
          : null,
    });

    return acc;
  }, {});

  return ok({
    ok: true,
    categories: Object.values(grouped),
  });
}
