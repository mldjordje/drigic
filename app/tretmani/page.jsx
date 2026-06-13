import Link from "next/link";
import { cookies } from "next/headers";
import Header4 from "@/components/headers/Header4";
import Footer5 from "@/components/footers/Footer5";
import { LOCALE_COOKIE_KEY, resolveLocale, translate } from "@/lib/i18n";
import { getLocalizedCategoryCopy } from "@/lib/services/category-copy";
import { SERVICE_CATEGORY_SPECS } from "@/lib/services/category-map";
import { SITE_NAME, getConfiguredSiteUrl } from "@/lib/site";

export const metadata = {
  title: {
    absolute: `Estetski tretmani Niš — Fileri, Botoks, PRP | ${SITE_NAME}`,
  },
  description:
    "Svi estetski tretmani ordinacije Dr Igić u Nišu: hijaluronski fileri, botoks, skinbusteri, PRP, mezoterapija, hemijski piling i regenerativni protokoli.",
  keywords: [
    "estetski tretmani Niš",
    "tretmani estetske medicine Niš",
    "hijaluronski fileri Niš",
    "botoks Niš",
    "skinbusteri Niš",
    "PRP Niš",
    "mezoterapija Niš",
    "preporuka tretmana Niš",
  ],
  alternates: { canonical: "/tretmani" },
  openGraph: {
    title: "Estetski tretmani Niš — Dr Igić Clinic",
    description:
      "Izaberite tretman prema cilju: volumen, bore, hidratacija, regeneracija, tekstura kože ili konture tela. Niš.",
    type: "website",
    siteName: SITE_NAME,
    url: "/tretmani",
  },
};

export default async function TreatmentsIndexPage() {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_KEY)?.value);
  const t = (path, replacements) => translate(locale, path, replacements);
  const siteUrl = getConfiguredSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${siteUrl}/tretmani#collection`,
        name: "Tretmani i usluge estetske medicine",
        description:
          "Katalog tretmana Dr Igic Clinic sa kategorijama, indikacijama i preporukama za izbor usluge.",
        url: `${siteUrl}/tretmani`,
        isPartOf: { "@id": `${siteUrl}/#website` },
      },
      {
        "@type": "ItemList",
        "@id": `${siteUrl}/tretmani#categories`,
        name: "Kategorije tretmana",
        itemListElement: SERVICE_CATEGORY_SPECS.map((category, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: category.name,
          description: category.shortDescription,
          url: `${siteUrl}/tretmani/${category.slug}`,
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Pocetna", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "Tretmani", item: `${siteUrl}/tretmani` },
        ],
      },
    ],
  };

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Footer5 />
    </div>
  );
}
