import Link from "next/link";
import { and, asc, eq, gte, isNull, lte, or } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { cookies } from "next/headers";
import Header4 from "@/components/headers/Header4";
import Footer5 from "@/components/footers/Footer5";
import { getDb, schema } from "@/lib/db/client";
import { LOCALE_COOKIE_KEY, resolveLocale, translate } from "@/lib/i18n";
import { SERVICE_CATEGORY_SPECS } from "@/lib/services/category-map";
import { SITE_NAME } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `Cenovnik | ${SITE_NAME}`,
  description:
    "Pregled svih estetskih tretmana i cena u Dr Igić ordinaciji. Hijaluronski fileri, botox, skinbusteri, PRP i više.",
};

const loadAllServices = unstable_cache(
  async () => {
    const db = getDb();
    const now = new Date();

    const rows = await db
      .select({
        serviceId: schema.services.id,
        serviceName: schema.services.name,
        serviceDescription: schema.services.description,
        durationMin: schema.services.durationMin,
        priceRsd: schema.services.priceRsd,
        categoryId: schema.services.categoryId,
        categoryName: schema.serviceCategories.name,
        categorySortOrder: schema.serviceCategories.sortOrder,
        promoPriceRsd: schema.servicePromotions.promoPriceRsd,
        promoActive: schema.servicePromotions.isActive,
        promotionTitle: schema.servicePromotions.title,
      })
      .from(schema.services)
      .innerJoin(
        schema.serviceCategories,
        eq(schema.services.categoryId, schema.serviceCategories.id)
      )
      .leftJoin(
        schema.servicePromotions,
        and(
          eq(schema.servicePromotions.serviceId, schema.services.id),
          eq(schema.servicePromotions.isActive, true),
          or(isNull(schema.servicePromotions.startsAt), lte(schema.servicePromotions.startsAt, now)),
          or(isNull(schema.servicePromotions.endsAt), gte(schema.servicePromotions.endsAt, now))
        )
      )
      .where(
        and(
          eq(schema.services.isActive, true),
          eq(schema.services.kind, "single"),
          eq(schema.serviceCategories.isActive, true)
        )
      )
      .orderBy(asc(schema.serviceCategories.sortOrder), asc(schema.services.name));

    const deduped = Array.from(new Map(rows.map((row) => [row.serviceId, row])).values());

    const categoryMap = new Map();
    for (const row of deduped) {
      if (!categoryMap.has(row.categoryId)) {
        categoryMap.set(row.categoryId, {
          categoryId: row.categoryId,
          categoryName: row.categoryName,
          categorySortOrder: row.categorySortOrder,
          services: [],
        });
      }
      categoryMap.get(row.categoryId).services.push({
        id: row.serviceId,
        name: row.serviceName,
        description: row.serviceDescription || "",
        durationMin: Number(row.durationMin || 0),
        price: Number(row.priceRsd || 0),
        promotion:
          row.promoPriceRsd !== null && row.promoPriceRsd !== undefined && row.promoActive
            ? {
                title: row.promotionTitle || "Promocija",
                price: Number(row.promoPriceRsd),
              }
            : null,
      });
    }

    return Array.from(categoryMap.values()).sort(
      (a, b) => (a.categorySortOrder ?? 999) - (b.categorySortOrder ?? 999)
    );
  },
  ["all-services-pricing"],
  { revalidate: 300 }
);

export default async function CenovnikPage() {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_KEY)?.value);
  const t = (path, replacements) => translate(locale, path, replacements);

  const categories = await loadAllServices();

  const enriched = categories.map((cat) => {
    const spec = SERVICE_CATEGORY_SPECS.find(
      (s) => s.name.toLowerCase() === cat.categoryName.toLowerCase()
    );
    return {
      ...cat,
      slug: spec?.slug || null,
      iconClass: spec?.iconClass || "fas fa-spa",
    };
  });

  const hasPromo = enriched.some((cat) => cat.services.some((s) => s.promotion));

  return (
    <div className="clinic-home5">
      <Header4 />
      <main style={{ paddingTop: 130, paddingBottom: 90 }}>
        <section className="container">
          <div className="title-area text-center clinic-reveal">
            <h1 className="sec-title text-smoke" style={{ marginBottom: 12 }}>
              {t("pricing.title")}
            </h1>
            <p className="sec-text text-smoke" style={{ maxWidth: 760, margin: "0 auto" }}>
              {t("pricing.subtitle")}
            </p>
          </div>

          {enriched.length === 0 ? (
            <div className="admin-card" style={{ marginTop: 40 }}>
              <p style={{ margin: 0, color: "#d9e6f8" }}>{t("pricing.noServices")}</p>
            </div>
          ) : (
            <div className="clinic-pricing-page">
              {enriched.map((cat, catIndex) => (
                <div
                  key={cat.categoryId}
                  className="clinic-pricing-category glass-panel clinic-reveal"
                  style={{ "--clinic-reveal-delay": `${Math.min(catIndex, 8) * 60}ms` }}
                >
                  <div className="clinic-pricing-category-header">
                    <span className="clinic-pricing-category-icon" aria-hidden="true">
                      <i className={cat.iconClass} />
                    </span>
                    <h2 className="clinic-pricing-category-title">
                      {cat.slug ? (
                        <Link href={`/tretmani/${cat.slug}`}>{cat.categoryName}</Link>
                      ) : (
                        cat.categoryName
                      )}
                    </h2>
                  </div>

                  <table className="clinic-pricing-table">
                    <thead>
                      <tr>
                        <th>{t("pricing.serviceName")}</th>
                        <th className="text-center">{t("pricing.duration")}</th>
                        <th className="text-end">{t("pricing.price")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cat.services.map((service) => (
                        <tr key={service.id} className={service.promotion ? "has-promo" : ""}>
                          <td>
                            <span className="clinic-pricing-service-name">{service.name}</span>
                            {service.description ? (
                              <span className="clinic-pricing-service-desc">
                                {service.description}
                              </span>
                            ) : null}
                          </td>
                          <td className="text-center clinic-pricing-duration">
                            {service.durationMin > 0 ? `${service.durationMin} min` : "—"}
                          </td>
                          <td className="text-end clinic-pricing-price">
                            {service.promotion ? (
                              <span className="clinic-pricing-promo-wrap">
                                <span className="clinic-pricing-promo-badge">
                                  {service.promotion.title}
                                </span>
                                <del className="clinic-pricing-old-price">
                                  {service.price} EUR
                                </del>
                                <strong className="clinic-pricing-new-price">
                                  {service.promotion.price} EUR
                                </strong>
                              </span>
                            ) : (
                              <strong>{service.price} EUR</strong>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {cat.slug ? (
                    <div className="clinic-pricing-category-footer">
                      <Link
                        href={`/tretmani/${cat.slug}`}
                        className="clinic-treatment-link"
                      >
                        {t("pricing.viewCategory")}
                      </Link>
                    </div>
                  ) : null}
                </div>
              ))}

              {hasPromo ? (
                <p className="clinic-pricing-note clinic-reveal">{t("pricing.promoNote")}</p>
              ) : null}
              <p className="clinic-pricing-note clinic-reveal">{t("pricing.priceNote")}</p>
            </div>
          )}

          <div className="btn-wrap mt-50 justify-content-center">
            <Link href="/booking" className="btn bg-theme text-title clinic-glow-btn">
              <span className="link-effect">
                <span className="effect-1">{t("treatments.bookAppointment")}</span>
                <span className="effect-1">{t("treatments.bookAppointment")}</span>
              </span>
            </Link>
          </div>
        </section>
      </main>
      <Footer5 />
    </div>
  );
}
