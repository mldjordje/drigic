import Link from "next/link";
import { cookies } from "next/headers";
import Header4 from "@/components/headers/Header4";
import Footer5 from "@/components/footers/Footer5";
import { LOCALE_COOKIE_KEY, resolveLocale, translate } from "@/lib/i18n";
import { getCachedServicesCatalog } from "@/lib/catalog/services";
import { SERVICE_CATEGORY_SPECS } from "@/lib/services/category-map";
import { SITE_NAME } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `Cenovnik estetskih tretmana Niš | ${SITE_NAME}`,
  description:
    "Cene estetskih tretmana u ordinaciji Dr Igić u Nišu. Hijaluronski fileri, botoks, skinbusteri, PRP, mezoterapija i više. Sve cene u EUR.",
  keywords: [
    "cene estetskih tretmana Niš",
    "cenovnik fileri Niš",
    "botoks cena Niš",
    "estetska medicina cene Niš",
    "dr igić clinic cenovnik",
  ],
  alternates: { canonical: "/cenovnik" },
};

export default async function CenovnikPage() {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_KEY)?.value);
  const t = (path, replacements) => translate(locale, path, replacements);

  const rawCategories = await getCachedServicesCatalog();

  // Use SERVICE_CATEGORY_SPECS order as canonical ordering — DB sortOrder
  // defaults to 0 for all categories so SQL ordering is unreliable.
  const categories = rawCategories
    .map((cat) => {
      const specIndex = SERVICE_CATEGORY_SPECS.findIndex(
        (s) => s.name.toLowerCase() === cat.name.toLowerCase()
      );
      const spec = specIndex >= 0 ? SERVICE_CATEGORY_SPECS[specIndex] : null;
      return {
        ...cat,
        slug: spec?.slug || null,
        iconClass: spec?.iconClass || "fas fa-spa",
        _specIndex: specIndex >= 0 ? specIndex : 999,
      };
    })
    .sort((a, b) => a._specIndex - b._specIndex);

  // Show only single services on the pricing page (packages are composite)
  const categoriesWithSingles = categories
    .map((cat) => ({
      ...cat,
      services: (cat.services || []).filter((s) => s.kind === "single"),
    }))
    .filter((cat) => cat.services.length > 0);

  const hasPromo = categoriesWithSingles.some((cat) =>
    cat.services.some((s) => s.promotion)
  );

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

          {categoriesWithSingles.length === 0 ? (
            <div className="admin-card" style={{ marginTop: 40 }}>
              <p style={{ margin: 0, color: "#d9e6f8" }}>{t("pricing.noServices")}</p>
            </div>
          ) : (
            <div className="clinic-pricing-page">
              {categoriesWithSingles.map((cat, catIndex) => (
                <div
                  key={cat.id}
                  className="clinic-pricing-category glass-panel clinic-reveal"
                  style={{ "--clinic-reveal-delay": `${Math.min(catIndex, 8) * 60}ms` }}
                >
                  <div className="clinic-pricing-category-header">
                    <span className="clinic-pricing-category-icon" aria-hidden="true">
                      <i className={cat.iconClass} />
                    </span>
                    <h2 className="clinic-pricing-category-title">
                      {cat.slug ? (
                        <Link href={`/tretmani/${cat.slug}`}>{cat.name}</Link>
                      ) : (
                        cat.name
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
                      {cat.services.map((service) => {
                        const regular = service.priceRsd;
                        const promo = service.promotion?.promoPriceRsd ?? null;
                        const hasPromoPrice =
                          promo !== null && promo !== undefined && promo < regular;

                        return (
                          <tr key={service.id} className={hasPromoPrice ? "has-promo" : ""}>
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
                              {hasPromoPrice ? (
                                <span className="clinic-pricing-promo-wrap">
                                  <span className="clinic-pricing-promo-badge">
                                    {service.promotion.title || t("pricing.promo")}
                                  </span>
                                  <del className="clinic-pricing-old-price">
                                    {regular} EUR
                                  </del>
                                  <strong className="clinic-pricing-new-price">
                                    {promo} EUR
                                  </strong>
                                </span>
                              ) : (
                                <strong>{regular} EUR</strong>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {cat.slug ? (
                    <div className="clinic-pricing-category-footer">
                      <Link href={`/tretmani/${cat.slug}`} className="clinic-treatment-link">
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
