import { and, asc, eq, gte, inArray, isNull, lte, or } from "drizzle-orm";
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
      serviceKind: schema.services.kind,
      serviceName: schema.services.name,
      description: schema.services.description,
      colorHex: schema.services.colorHex,
      supportsMl: schema.services.supportsMl,
      maxMl: schema.services.maxMl,
      extraMlDiscountPercent: schema.services.extraMlDiscountPercent,
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
    .orderBy(
      asc(schema.serviceCategories.sortOrder),
      asc(schema.services.kind),
      asc(schema.services.name)
    );

  const packageServiceIds = rows
    .filter((row) => row.serviceKind === "package")
    .map((row) => row.serviceId);

  const packageItemsRows = packageServiceIds.length
    ? await db
        .select({
          packageServiceId: schema.servicePackageItems.packageServiceId,
          serviceId: schema.servicePackageItems.serviceId,
          quantity: schema.servicePackageItems.quantity,
          sortOrder: schema.servicePackageItems.sortOrder,
          serviceName: schema.services.name,
        })
        .from(schema.servicePackageItems)
        .innerJoin(
          schema.services,
          eq(schema.services.id, schema.servicePackageItems.serviceId)
        )
        .where(inArray(schema.servicePackageItems.packageServiceId, packageServiceIds))
        .orderBy(asc(schema.servicePackageItems.sortOrder), asc(schema.servicePackageItems.createdAt))
    : [];

  const packageItemsByPackageId = packageItemsRows.reduce((acc, row) => {
    if (!acc[row.packageServiceId]) {
      acc[row.packageServiceId] = [];
    }
    acc[row.packageServiceId].push({
      serviceId: row.serviceId,
      serviceName: row.serviceName,
      quantity: Number(row.quantity || 1),
      sortOrder: Number(row.sortOrder || 0),
    });
    return acc;
  }, {});

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
      kind: row.serviceKind,
      name: row.serviceName,
      description: row.description,
      colorHex: row.colorHex || "#8e939b",
      supportsMl: Boolean(row.supportsMl),
      maxMl: Number(row.maxMl || 1),
      extraMlDiscountPercent: Number(row.extraMlDiscountPercent || 0),
      priceRsd: row.priceRsd,
      durationMin: row.durationMin,
      isVip: row.isVip,
      bodyArea: row.bodyAreaId ? { id: row.bodyAreaId, name: row.bodyAreaName } : null,
      packageItems: packageItemsByPackageId[row.serviceId] || [],
      promotion:
        row.promoPriceRsd !== null && row.promoPriceRsd !== undefined && row.promoActive
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
