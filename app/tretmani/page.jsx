import Link from "next/link";
import { cookies } from "next/headers";
import Header4 from "@/components/headers/Header4";
import Footer5 from "@/components/footers/Footer5";
import { LOCALE_COOKIE_KEY, resolveLocale, translate } from "@/lib/i18n";
import { getLocalizedCategoryCopy } from "@/lib/services/category-copy";
import { SERVICE_CATEGORY_SPECS } from "@/lib/services/category-map";

export const metadata = {
  title: "Tretmani | Dr Igic",
};

export default async function TreatmentsIndexPage() {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_KEY)?.value);
  const t = (path, replacements) => translate(locale, path, replacements);

  return (
    <div className="clinic-home5">
      <Header4 />
      <main style={{ paddingTop: 130, paddingBottom: 90 }}>
        <section className="container">
          <div className="title-area text-center clinic-reveal">
            <h1 className="sec-title text-smoke" style={{ marginBottom: 12 }}>
              {t("treatments.categoriesTitle")}
            </h1>
            <p className="sec-text text-smoke" style={{ maxWidth: 760, margin: "0 auto" }}>
              {t("treatments.categoriesBody")}
            </p>
          </div>

          <div className="clinic-treatment-grid">
            {SERVICE_CATEGORY_SPECS.map((category, index) => {
              const localizedCategory = getLocalizedCategoryCopy(locale, category);

              return (
                <Link
                  key={category.slug}
                  href={`/tretmani/${category.slug}`}
                  className="clinic-treatment-card glass-panel clinic-hover-raise clinic-reveal"
                  style={{ "--clinic-reveal-delay": `${Math.min(index, 10) * 45}ms` }}
                  aria-label={`${localizedCategory.name} - ${t("treatments.seeServices")}`}
                >
                  <span className="clinic-treatment-card__icon" aria-hidden="true">
                    <i className={category.iconClass || "fas fa-spa"} />
                  </span>
                  <div className="clinic-treatment-card__body">
                    <h3>{localizedCategory.name}</h3>
                    <p>{localizedCategory.shortDescription}</p>
                    <span className="clinic-treatment-link">{t("treatments.seeServices")}</span>
                  </div>
                  <span className="clinic-treatment-card__arrow" aria-hidden="true">
                    <i className="fas fa-arrow-right" />
                  </span>
                </Link>
              );
            })}
          </div>

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
