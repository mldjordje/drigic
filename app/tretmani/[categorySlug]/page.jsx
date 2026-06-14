import Link from "next/link";
import { and, asc, eq, gte, isNull, lte, or } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Header4 from "@/components/headers/Header4";
import Footer5 from "@/components/footers/Footer5";
import { getDb, schema } from "@/lib/db/client";
import { LOCALE_COOKIE_KEY, resolveLocale, translate } from "@/lib/i18n";
import { SITE_NAME, getConfiguredSiteUrl } from "@/lib/site";
import { SERVICE_CATEGORY_SPECS, getCategorySpecBySlug } from "@/lib/services/category-map";
import { CLINIC_PHONE_TEL, CLINIC_PHONE_DISPLAY } from "@/lib/clinicContact";

export const dynamic = "force-dynamic";
const CATEGORY_DATA_REVALIDATE = 300;

export async function generateStaticParams() {
  return SERVICE_CATEGORY_SPECS.map((category) => ({ categorySlug: category.slug }));
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const category = getCategorySpecBySlug(resolvedParams?.categorySlug);
  if (!category) return { title: "Tretmani" };

  const siteUrl = getConfiguredSiteUrl();
  const canonicalPath = `/tretmani/${category.slug}`;
  const ogImages = category.image
    ? [{ url: `${siteUrl}${category.image}`, width: 1600, height: 900, alt: category.name }]
    : [{ url: `${siteUrl}/icons/icon-512.png`, width: 512, height: 512, alt: SITE_NAME }];

  const locationKeywords = [
    `${category.name.toLowerCase()} Niš`,
    "estetska medicina Niš",
    "dr igić clinic Niš",
  ];

  return {
    title: category.seoTitle,
    description: category.seoDescription,
    keywords: [...(category.seoKeywords || []), ...locationKeywords],
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: category.seoTitle,
      description: category.seoDescription,
      url: `${siteUrl}${canonicalPath}`,
      type: "article",
      locale: "sr_RS",
      siteName: SITE_NAME,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: category.seoTitle,
      description: category.seoDescription,
      images: ogImages.map((i) => i.url),
    },
  };
}

const loadCategoryServices = unstable_cache(
  async (categorySlug) => {
    const categorySpec = getCategorySpecBySlug(categorySlug);
    if (!categorySpec) return null;

    const db = getDb();
    const now = new Date();

    const [category] = await db
      .select({ id: schema.serviceCategories.id, name: schema.serviceCategories.name, sortOrder: schema.serviceCategories.sortOrder })
      .from(schema.serviceCategories)
      .where(and(eq(schema.serviceCategories.name, categorySpec.name), eq(schema.serviceCategories.isActive, true)))
      .orderBy(asc(schema.serviceCategories.sortOrder))
      .limit(1);

    if (!category) return { categorySpec, category: null, services: [] };

    const rows = await db
      .select({
        id: schema.services.id,
        slug: schema.services.slug,
        name: schema.services.name,
        description: schema.services.description,
        priceRsd: schema.services.priceRsd,
        durationMin: schema.services.durationMin,
        promoPriceRsd: schema.servicePromotions.promoPriceRsd,
        promoStartsAt: schema.servicePromotions.startsAt,
        promoEndsAt: schema.servicePromotions.endsAt,
        promoActive: schema.servicePromotions.isActive,
        promotionTitle: schema.servicePromotions.title,
      })
      .from(schema.services)
      .leftJoin(
        schema.servicePromotions,
        and(
          eq(schema.servicePromotions.serviceId, schema.services.id),
          eq(schema.servicePromotions.isActive, true),
          or(isNull(schema.servicePromotions.startsAt), lte(schema.servicePromotions.startsAt, now)),
          or(isNull(schema.servicePromotions.endsAt), gte(schema.servicePromotions.endsAt, now))
        )
      )
      .where(and(eq(schema.services.categoryId, category.id), eq(schema.services.isActive, true), eq(schema.services.kind, "single")))
      .orderBy(asc(schema.services.name));

    const dedupedRows = Array.from(new Map(rows.map((row) => [row.id, row])).values());
    const services = dedupedRows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description || "",
      durationMin: Number(row.durationMin || 0),
      price: Number(row.priceRsd || 0),
      promotion:
        row.promoPriceRsd !== null && row.promoPriceRsd !== undefined && row.promoActive
          ? { title: row.promotionTitle || "Promocija", price: Number(row.promoPriceRsd) }
          : null,
    }));

    return { categorySpec, category, services };
  },
  ["treatment-category-services"],
  { revalidate: CATEGORY_DATA_REVALIDATE }
);

const loadCategoryBeforeAfter = unstable_cache(
  async (categorySlug) => {
    const db = getDb();
    try {
      return await db
        .select({
          id: schema.beforeAfterCases.id,
          treatmentType: schema.beforeAfterCases.treatmentType,
          beforeImageUrl: schema.beforeAfterCases.beforeImageUrl,
          afterImageUrl: schema.beforeAfterCases.afterImageUrl,
          collageImageUrl: schema.beforeAfterCases.collageImageUrl,
        })
        .from(schema.beforeAfterCases)
        .where(and(eq(schema.beforeAfterCases.isPublished, true), eq(schema.beforeAfterCases.serviceCategory, categorySlug)))
        .orderBy(asc(schema.beforeAfterCases.createdAt));
    } catch {
      return [];
    }
  },
  ["treatment-category-before-after"],
  { revalidate: CATEGORY_DATA_REVALIDATE }
);

function buildFaq(categorySpec, services) {
  const base = [
    {
      question: `Šta su ${categorySpec.name} tretmani?`,
      answer: categorySpec.heroIntro,
    },
    {
      question: `Koliko traje tretman ${categorySpec.name}?`,
      answer: services.length
        ? `Trajanje zavisi od konkretne usluge. Dostupne usluge traju od ${Math.min(...services.map((s) => s.durationMin))} do ${Math.max(...services.map((s) => s.durationMin))} minuta. U cenovniku je jasno prikazano trajanje svake stavke.`
        : "Trajanje zavisi od konkretne usluge i prikazano je u listi usluga.",
    },
    {
      question: "Da li je potreban pregled pre tretmana?",
      answer: "Da. Pre svakog tretmana radi se procena indikacije i individualni plan tretmana kako bi rezultat bio prirodan, bezbjedan i prilagođen anatomiji svakog pacijenta.",
    },
    {
      question: "Da li postoji period oporavka?",
      answer: categorySpec.aftercare || "U većini slučajeva oporavak je kratak. Tačna uputstva dobijate odmah nakon tretmana.",
    },
    {
      question: `Ko je kandidat za ${categorySpec.name}?`,
      answer: categorySpec.candidate,
    },
  ];
  return base;
}

function buildJsonLd(categorySpec, services, faq, siteUrl) {
  const categoryUrl = `${siteUrl}/tretmani/${categorySpec.slug}`;

  const minDur = services.length ? Math.min(...services.map((s) => s.durationMin)) : null;
  const maxDur = services.length ? Math.max(...services.map((s) => s.durationMin)) : null;
  const minPrice = services.length ? Math.min(...services.map((s) => s.promotion?.price ?? s.price)) : null;
  const maxPrice = services.length ? Math.max(...services.map((s) => s.price)) : null;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MedicalProcedure",
        "@id": `${categoryUrl}#procedure`,
        "name": categorySpec.name,
        "description": categorySpec.heroIntro,
        "howPerformed": categorySpec.procedure || undefined,
        "followup": categorySpec.aftercare || undefined,
        "procedureType": { "@type": "MedicalProcedureType", "name": "Aesthetic and regenerative medicine" },
        "recognizingAuthority": {
          "@type": "MedicalOrganization",
          "name": "Dr Igić Clinic",
          "@id": "https://drigic.rs/#organization",
          "url": siteUrl,
        },
        "performedBy": {
          "@type": "Physician",
          "@id": "https://drigic.rs/nikola-igic#physician",
          "name": "Dr Nikola Igić",
          "jobTitle": "Lekar estetske i anti-age medicine",
        },
        "beneficialFor": categorySpec.benefits?.map((b) => ({ "@type": "MedicalIndication", "name": b })),
        "url": categoryUrl,
        ...(categorySpec.image ? { "image": `${siteUrl}${categorySpec.image}` } : {}),
        ...(minDur && maxDur ? { "typicalAgeRange": undefined, "preparation": undefined } : {}),
        "speakable": {
          "@type": "SpeakableSpecification",
          "cssSelector": [".cat-hero__title", ".cat-hero__intro", ".cat-overview__lead"],
        },
      },
      ...(services.length
        ? [
            {
              "@type": "Service",
              "@id": `${categoryUrl}#service-catalog`,
              "name": `${categorySpec.name} — Dr Igić Clinic`,
              "description": categorySpec.heroIntro,
              "provider": { "@id": "https://drigic.rs/#organization" },
              "url": categoryUrl,
              "serviceType": categorySpec.name,
              "areaServed": { "@type": "City", "name": "Niš" },
              "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": `${categorySpec.name} usluge`,
                "itemListElement": services.map((service, i) => ({
                  "@type": "Offer",
                  "position": i + 1,
                  "name": service.name,
                  "description": service.description || service.name,
                  "price": String(service.promotion?.price ?? service.price),
                  "priceCurrency": "EUR",
                  "availability": "https://schema.org/InStock",
                  "seller": { "@id": "https://drigic.rs/#organization" },
                  ...(service.slug ? { "url": `${categoryUrl}/${service.slug}` } : {}),
                })),
              },
              ...(minPrice && maxPrice
                ? {
                    "offers": {
                      "@type": "AggregateOffer",
                      "lowPrice": String(minPrice),
                      "highPrice": String(maxPrice),
                      "priceCurrency": "EUR",
                      "offerCount": String(services.length),
                    },
                  }
                : {}),
            },
          ]
        : []),
      {
        "@type": "FAQPage",
        "@id": `${categoryUrl}#faq`,
        "mainEntity": faq.map((item) => ({
          "@type": "Question",
          "name": item.question,
          "acceptedAnswer": { "@type": "Answer", "text": item.answer },
        })),
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Početna", "item": siteUrl },
          { "@type": "ListItem", "position": 2, "name": "Tretmani", "item": `${siteUrl}/tretmani` },
          { "@type": "ListItem", "position": 3, "name": categorySpec.name, "item": categoryUrl },
        ],
      },
    ],
  };
}

export default async function TreatmentCategoryPage({ params }) {
  const resolvedParams = await params;
  const data = await loadCategoryServices(resolvedParams?.categorySlug);
  if (!data) notFound();

  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_KEY)?.value);
  const t = (path, replacements) => translate(locale, path, replacements);
  const { categorySpec, services } = data;
  const categoryBeforeAfter = await loadCategoryBeforeAfter(resolvedParams?.categorySlug);
  const faq = buildFaq(categorySpec, services);

  const siteUrl = getConfiguredSiteUrl();
  const jsonLd = buildJsonLd(categorySpec, services, faq, siteUrl);

  const durations = services.map((s) => s.durationMin).filter(Boolean);
  const minDur = durations.length ? Math.min(...durations) : null;
  const maxDur = durations.length ? Math.max(...durations) : null;

  return (
    <div className="clinic-home5">
      <Header4 />

      <main className="cat-pg">

        {/* ── HERO ── */}
        <section className="cat-hero">
          {categorySpec.image ? (
            <img
              className="cat-hero__bg"
              src={categorySpec.image}
              alt=""
              width={1600}
              height={900}
              loading="eager"
              decoding="async"
              aria-hidden="true"
            />
          ) : null}
          <div className="cat-hero__overlay" aria-hidden="true" />

          <div className="cat-hero__content">
            <nav className="cat-hero__crumb" aria-label="breadcrumb">
              <Link href="/tretmani">Tretmani</Link>
              <span aria-hidden="true">›</span>
              <span>{categorySpec.name}</span>
            </nav>

            <span className="cat-hero__eyebrow">
              <i className={categorySpec.iconClass || "fas fa-spa"} aria-hidden="true" />
              Dr Igić Clinic — Estetska medicina
            </span>

            <h1 className="cat-hero__title">{categorySpec.name}</h1>
            <p className="cat-hero__intro">{categorySpec.heroIntro}</p>

            {services.length > 0 ? (
              <div className="cat-hero__stats" aria-label="Ključne informacije">
                <div className="cat-hero__stat">
                  <strong>{services.length}</strong>
                  <span>{services.length === 1 ? "usluga" : services.length < 5 ? "usluge" : "usluga"}</span>
                </div>
                {minDur ? (
                  <>
                    <div className="cat-hero__stat-sep" aria-hidden="true" />
                    <div className="cat-hero__stat">
                      <strong>{minDur === maxDur ? `${minDur}` : `${minDur}–${maxDur}`}</strong>
                      <span>minuta</span>
                    </div>
                  </>
                ) : null}
                <div className="cat-hero__stat-sep" aria-hidden="true" />
                <div className="cat-hero__stat">
                  <strong>0</strong>
                  <span>operacija</span>
                </div>
              </div>
            ) : null}

            <div className="cat-hero__actions">
              <Link href="/booking" className="cat-hero__cta">
                <i className="fas fa-calendar-check" aria-hidden="true" />
                {t("treatments.bookAppointment")}
              </Link>
              <a href={`tel:${CLINIC_PHONE_TEL}`} className="cat-hero__tel">
                <i className="fas fa-phone" aria-hidden="true" />
                {CLINIC_PHONE_DISPLAY}
              </a>
            </div>
          </div>
        </section>

        {/* ── OVERVIEW ── */}
        <section className="cat-overview">
          <div className="container">
            <div className="cat-overview__grid">
              <div className="cat-overview__main clinic-reveal">
                <span className="cat-eyebrow">O tretmanu</span>
                {categorySpec.detailedOverview.map((paragraph, i) => (
                  <p key={i} className={i === 0 ? "cat-overview__lead" : "cat-overview__body-p"}>
                    {paragraph}
                  </p>
                ))}
              </div>

              <aside className="cat-overview__sidebar">
                <div className="cat-overview__block clinic-reveal" style={{ "--clinic-reveal-delay": "80ms" }}>
                  <h3 className="cat-overview__block-title">
                    <i className="fas fa-check-circle" aria-hidden="true" />
                    Prednosti tretmana
                  </h3>
                  <ul className="cat-benefit-list" aria-label="Prednosti">
                    {categorySpec.benefits.map((benefit) => (
                      <li key={benefit} className="cat-benefit-item">
                        <i className="fas fa-check" aria-hidden="true" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="cat-overview__block clinic-reveal" style={{ "--clinic-reveal-delay": "160ms" }}>
                  <h3 className="cat-overview__block-title">
                    <i className="fas fa-user-check" aria-hidden="true" />
                    Ko je kandidat
                  </h3>
                  <p className="cat-overview__candidate">{categorySpec.candidate}</p>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* ── PROCEDURE + AFTERCARE ── */}
        <section className="cat-process">
          <div className="container">
            <div className="cat-process__grid">
              <div className="cat-process__card clinic-reveal">
                <div className="cat-process__icon" aria-hidden="true">
                  <i className="fas fa-syringe" />
                </div>
                <h3>Tok procedure</h3>
                <p>{categorySpec.procedure}</p>
              </div>
              <div className="cat-process__card clinic-reveal" style={{ "--clinic-reveal-delay": "100ms" }}>
                <div className="cat-process__icon" aria-hidden="true">
                  <i className="fas fa-heart-pulse" />
                </div>
                <h3>Nega nakon tretmana</h3>
                <p>{categorySpec.aftercare}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── PRICE LIST ── */}
        {services.length > 0 ? (
          <section className="cat-services">
            <div className="container">
              <div className="cat-section-head clinic-reveal">
                <span className="cat-eyebrow">Cenovnik</span>
                <h2 className="cat-section-title">Usluge i cene</h2>
                <p className="cat-section-sub">
                  Sve cene su izražene u EUR. Konačna cena se utvrđuje na konsultaciji.
                </p>
              </div>

              <div className="cat-price-list" role="list">
                {services.map((service, i) => (
                  <div
                    key={service.id}
                    className={`cat-price-row clinic-reveal${service.promotion ? " cat-price-row--promo" : ""}`}
                    style={{ "--clinic-reveal-delay": `${Math.min(i, 10) * 55}ms` }}
                    role="listitem"
                  >
                    {service.promotion ? (
                      <span className="cat-price-row__promo-tag" aria-label="Promocija">
                        <i className="fas fa-tag" aria-hidden="true" />
                        {service.promotion.title}
                      </span>
                    ) : null}

                    <div className="cat-price-row__info">
                      <h3 className="cat-price-row__name">{service.name}</h3>
                      {service.description ? (
                        <p className="cat-price-row__desc">{service.description}</p>
                      ) : null}
                    </div>

                    <div className="cat-price-row__meta">
                      {service.durationMin > 0 ? (
                        <span className="cat-price-row__duration">
                          <i className="far fa-clock" aria-hidden="true" />
                          {service.durationMin} min
                        </span>
                      ) : null}

                      <div className="cat-price-row__price-wrap">
                        {service.promotion ? (
                          <>
                            <s className="cat-price-row__old">{service.price} EUR</s>
                            <strong className="cat-price-row__price">{service.promotion.price} EUR</strong>
                          </>
                        ) : (
                          <strong className="cat-price-row__price">{service.price} EUR</strong>
                        )}
                      </div>

                      <Link
                        href="/booking"
                        className="cat-price-row__book"
                        aria-label={`Zakaži tretman ${service.name}`}
                      >
                        Zakaži
                        <i className="fas fa-arrow-right" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* ── GALLERY ── */}
        {categoryBeforeAfter.length > 0 ? (
          <section className="cat-gallery">
            <div className="container">
              <div className="cat-section-head clinic-reveal">
                <span className="cat-eyebrow">Rezultati</span>
                <h2 className="cat-section-title">Pre i posle tretmana</h2>
              </div>
              <div className="cat-gallery__grid">
                {categoryBeforeAfter.map((item, i) => (
                  <div
                    key={item.id}
                    className="cat-gallery__item clinic-reveal"
                    style={{ "--clinic-reveal-delay": `${Math.min(i, 6) * 60}ms` }}
                  >
                    <img
                      src={item.collageImageUrl || item.beforeImageUrl}
                      alt={item.treatmentType || categorySpec.name}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* ── FAQ ── */}
        <section className="cat-faq">
          <div className="container">
            <div className="cat-section-head clinic-reveal">
              <span className="cat-eyebrow">FAQ</span>
              <h2 className="cat-section-title">Često postavljana pitanja</h2>
            </div>
            <div className="cat-faq__list">
              {faq.map((item, i) => (
                <details
                  key={item.question}
                  className="cat-faq__item clinic-reveal"
                  style={{ "--clinic-reveal-delay": `${Math.min(i, 6) * 50}ms` }}
                >
                  <summary className="cat-faq__q">
                    <span>{item.question}</span>
                    <span className="cat-faq__icon" aria-hidden="true" />
                  </summary>
                  <div className="cat-faq__a">
                    <p>{item.answer}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA BANNER ── */}
        <section className="cat-cta">
          <div className="container">
            <div className="cat-cta__inner clinic-reveal">
              <div className="cat-cta__text">
                <span className="cat-eyebrow cat-eyebrow--light">Zakažite danas</span>
                <h2 className="cat-cta__title">Individualni plan tretmana</h2>
                <p className="cat-cta__sub">
                  Svaki tretman počinje konsultacijom — personalizovan pristup, prirodan rezultat i
                  bezbedan protokol prilagođen vašoj anatomiji.
                </p>
              </div>
              <div className="cat-cta__actions">
                <Link href="/booking" className="cat-cta__btn cat-cta__btn--primary">
                  <i className="fas fa-calendar-check" aria-hidden="true" />
                  Zakaži online
                </Link>
                <a href={`tel:${CLINIC_PHONE_TEL}`} className="cat-cta__btn cat-cta__btn--outline">
                  <i className="fas fa-phone" aria-hidden="true" />
                  {CLINIC_PHONE_DISPLAY}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── BACK LINK ── */}
        <div className="container" style={{ paddingBottom: "3rem" }}>
          <Link href="/tretmani" className="cat-back-link">
            <i className="fas fa-arrow-left" aria-hidden="true" />
            Sve kategorije tretmana
          </Link>
        </div>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Footer5 />
    </div>
  );
}
