import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Header4 from "@/components/headers/Header4";
import Footer5 from "@/components/footers/Footer5";
import { getDb, schema } from "@/lib/db/client";
import { LOCALE_COOKIE_KEY, resolveLocale, translate } from "@/lib/i18n";
import { SITE_NAME, getConfiguredSiteUrl } from "@/lib/site";
import { getCategorySpecBySlug } from "@/lib/services/category-map";

export const dynamic = "force-dynamic";
const SERVICE_DATA_REVALIDATE = 300;

const loadServiceDetails = unstable_cache(
  async (categorySlug, serviceSlug) => {
    const categorySpec = getCategorySpecBySlug(categorySlug);
    if (!categorySpec) {
      return null;
    }

    const db = getDb();
    const [category] = await db
      .select({
        id: schema.serviceCategories.id,
        name: schema.serviceCategories.name,
      })
      .from(schema.serviceCategories)
      .where(eq(schema.serviceCategories.name, categorySpec.name))
      .limit(1);

    if (!category) {
      return null;
    }

    const [service] = await db
      .select({
        id: schema.services.id,
        slug: schema.services.slug,
        name: schema.services.name,
        description: schema.services.description,
        priceRsd: schema.services.priceRsd,
        durationMin: schema.services.durationMin,
        reminderEnabled: schema.services.reminderEnabled,
        reminderDelayDays: schema.services.reminderDelayDays,
        updatedAt: schema.services.updatedAt,
      })
      .from(schema.services)
      .where(
        and(
          eq(schema.services.categoryId, category.id),
          eq(schema.services.slug, serviceSlug),
          eq(schema.services.isActive, true)
        )
      )
      .limit(1);

    if (!service) {
      return null;
    }

    const relatedServices = await db
      .select({
        id: schema.services.id,
        slug: schema.services.slug,
        name: schema.services.name,
        description: schema.services.description,
        priceRsd: schema.services.priceRsd,
        durationMin: schema.services.durationMin,
      })
      .from(schema.services)
      .where(
        and(
          eq(schema.services.categoryId, category.id),
          eq(schema.services.isActive, true),
          eq(schema.services.kind, "single")
        )
      )
      .orderBy(asc(schema.services.name));

    let beforeAfter = [];
    try {
      beforeAfter = await db
        .select({
          id: schema.beforeAfterCases.id,
          treatmentType: schema.beforeAfterCases.treatmentType,
          beforeImageUrl: schema.beforeAfterCases.beforeImageUrl,
          afterImageUrl: schema.beforeAfterCases.afterImageUrl,
          collageImageUrl: schema.beforeAfterCases.collageImageUrl,
        })
        .from(schema.beforeAfterCases)
        .where(
          and(
            eq(schema.beforeAfterCases.isPublished, true),
            eq(schema.beforeAfterCases.serviceId, service.id)
          )
        )
        .orderBy(asc(schema.beforeAfterCases.createdAt));
    } catch {
      beforeAfter = [];
    }

    return {
      categorySpec,
      service,
      relatedServices: relatedServices.filter((item) => item.id !== service.id).slice(0, 4),
      beforeAfter,
    };
  },
  ["treatment-service-details"],
  { revalidate: SERVICE_DATA_REVALIDATE }
);

function compactText(value = "", maxLength = 158) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim().replace(/[.,;:]+$/, "")}.`;
}

function formatPrice(value) {
  const price = Number(value || 0);
  return price > 0 ? `${price} EUR` : "Cena nakon konsultacije";
}

function buildServiceRecommendations(service, categorySpec, relatedServices = []) {
  const relatedNames = relatedServices.slice(0, 3).map((item) => item.name);
  return {
    summary: `${service.name} je dobar izbor kada je cilj ${String(categorySpec.shortDescription || categorySpec.heroIntro).toLowerCase()}`,
    bestFor: [
      categorySpec.candidate,
      "osobe koje zele plan tretmana prilagodjen anatomiji, navikama i tempu oporavka",
      service.durationMin
        ? `klijente kojima odgovara procedura od oko ${service.durationMin} minuta`
        : "klijente koji zele individualnu procenu trajanja i intenziteta tretmana",
    ],
    plan: [
      "Pregled i procena indikacije pre tretmana.",
      "Izbor tehnike, doze i ritma tretmana prema stanju koze ili regije.",
      "Kontrola rezultata i preporuka za odrzavanje efekta.",
    ],
    combineWith: relatedNames.length ? relatedNames : ["konsultacija za individualni plan"],
    safetyNote:
      "Smernica je informativna i ne zamenjuje pregled lekara; konacan plan se potvrdjuje na konsultaciji.",
  };
}

function buildServiceFaq(service, categorySpec, recommendation) {
  return [
    {
      question: `Za koga je ${service.name}?`,
      answer: categorySpec.candidate,
    },
    {
      question: `Koliko traje ${service.name}?`,
      answer: service.durationMin
        ? `Tretman obicno traje oko ${service.durationMin} minuta, uz prethodnu procenu i dogovor o planu.`
        : "Trajanje se odredjuje nakon pregleda, u zavisnosti od regije i individualnog plana.",
    },
    {
      question: "Kako lakse izabrati odgovarajuci tretman?",
      answer:
        "Uporedite indikacije, trajanje, oporavak i povezane usluge, a konacan izbor potvrdite na konsultaciji.",
    },
    {
      question: "Da li je potreban pregled pre tretmana?",
      answer: recommendation.safetyNote,
    },
  ];
}

function buildServiceJsonLd({ service, categorySpec, relatedServices, recommendation, faq, siteUrl }) {
  const categoryUrl = `${siteUrl}/tretmani/${categorySpec.slug}`;
  const serviceUrl = `${categoryUrl}/${service.slug}`;
  const price = Number(service.priceRsd || 0);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MedicalProcedure",
        "@id": `${serviceUrl}#procedure`,
        name: service.name,
        description: service.description || categorySpec.heroIntro,
        howPerformed: categorySpec.procedure,
        followup: categorySpec.aftercare,
        procedureType: {
          "@type": "MedicalProcedureType",
          name: "Aesthetic and regenerative medicine",
        },
        recognizingAuthority: { "@id": `${siteUrl}/#organization` },
        performedBy: { "@id": `${siteUrl}/nikola-igic#physician` },
        url: serviceUrl,
        ...(categorySpec.image ? { image: `${siteUrl}${categorySpec.image}` } : {}),
        beneficialFor: recommendation.bestFor.map((item) => ({
          "@type": "MedicalIndication",
          name: item,
        })),
      },
      {
        "@type": "Service",
        "@id": `${serviceUrl}#service`,
        name: service.name,
        description: service.description || categorySpec.seoDescription,
        serviceType: categorySpec.name,
        provider: { "@id": `${siteUrl}/#organization` },
        areaServed: { "@type": "City", name: "Niš" },
        url: serviceUrl,
        offers: {
          "@type": "Offer",
          price: price > 0 ? String(price) : undefined,
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
          url: serviceUrl,
        },
        isRelatedTo: relatedServices.map((item) => ({
          "@type": "Service",
          name: item.name,
          url: `${categoryUrl}/${item.slug}`,
        })),
        additionalProperty: [
          {
            "@type": "PropertyValue",
            name: "Treatment guidance",
            value: recommendation.summary,
          },
          {
            "@type": "PropertyValue",
            name: "Typical duration",
            value: service.durationMin ? `${service.durationMin} minutes` : "Individual assessment",
          },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${serviceUrl}#faq`,
        mainEntity: faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Pocetna", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "Tretmani", item: `${siteUrl}/tretmani` },
          { "@type": "ListItem", position: 3, name: categorySpec.name, item: categoryUrl },
          { "@type": "ListItem", position: 4, name: service.name, item: serviceUrl },
        ],
      },
    ],
  };
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const data = await loadServiceDetails(resolvedParams?.categorySlug, resolvedParams?.serviceSlug);

  if (!data) {
    return {
      title: "Tretman",
    };
  }

  const siteUrl = getConfiguredSiteUrl();
  const canonicalPath = `/tretmani/${data.categorySpec.slug}/${data.service.slug}`;
  const description = compactText(
    data.service.description || `${data.service.name}: ${data.categorySpec.seoDescription}`
  );
  const image = data.categorySpec.image
    ? `${siteUrl}${data.categorySpec.image}`
    : `${siteUrl}/icons/icon-512.png`;

  return {
    title: {
      absolute: `${data.service.name} - ${data.categorySpec.name} | ${SITE_NAME}`,
    },
    description,
    keywords: [
      data.service.name,
      data.categorySpec.name,
      ...(data.categorySpec.seoKeywords || []),
      "estetska medicina",
      "estetska medicina Niš",
      `${data.service.name} Niš`,
      "preporuka tretmana",
    ],
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: `${data.service.name} - ${data.categorySpec.name}`,
      description,
      url: `${siteUrl}${canonicalPath}`,
      siteName: SITE_NAME,
      type: "article",
      locale: "sr_RS",
      images: [{ url: image, width: data.categorySpec.image ? 1600 : 512, height: data.categorySpec.image ? 900 : 512, alt: data.service.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${data.service.name} - ${data.categorySpec.name}`,
      description,
      images: [image],
    },
  };
}

export default async function TreatmentServicePage({ params }) {
  const resolvedParams = await params;
  const data = await loadServiceDetails(resolvedParams?.categorySlug, resolvedParams?.serviceSlug);

  if (!data) {
    notFound();
  }

  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_KEY)?.value);
  const t = (path, replacements) => translate(locale, path, replacements);
  const { categorySpec, service, relatedServices, beforeAfter } = data;
  const siteUrl = getConfiguredSiteUrl();
  const recommendation = buildServiceRecommendations(service, categorySpec, relatedServices);
  const faq = buildServiceFaq(service, categorySpec, recommendation);
  const jsonLd = buildServiceJsonLd({
    service,
    categorySpec,
    relatedServices,
    recommendation,
    faq,
    siteUrl,
  });

  return (
    <div className="clinic-home5">
      <Header4 />
      <main style={{ paddingTop: 130, paddingBottom: 90 }}>
        <section className="container">
          <div className="title-area text-center clinic-reveal">
            <h1 className="sec-title text-smoke" style={{ marginBottom: 12 }}>
              {service.name}
            </h1>
            <p className="sec-text text-smoke" style={{ maxWidth: 860, margin: "0 auto" }}>
              {service.description || categorySpec.heroIntro}
            </p>
          </div>

          <div className="clinic-treatment-detail-layout">
            <article className="clinic-treatment-detail-content glass-panel clinic-reveal">
              <h2>{t("treatments.serviceDetailsTitle")}</h2>
              <p>{service.description || categorySpec.procedure}</p>
              <div className="clinic-treatment-service-meta" style={{ marginTop: 16 }}>
                <span>{service.durationMin} min</span>
                <span>{formatPrice(service.priceRsd)}</span>
                {service.reminderEnabled ? (
                  <span>Podsetnik nakon {service.reminderDelayDays} dana</span>
                ) : null}
              </div>
              <section className="clinic-treatment-guidance" aria-labelledby="treatment-guidance-title">
                <h3 id="treatment-guidance-title">Kada izabrati ovaj tretman</h3>
                <p>{recommendation.summary}</p>
                <ul>
                  {recommendation.bestFor.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p className="clinic-treatment-guidance__note">{recommendation.safetyNote}</p>
              </section>
              <section className="clinic-treatment-plan" aria-labelledby="treatment-plan-title">
                <h3 id="treatment-plan-title">Preporucen plan</h3>
                <ol>
                  {recommendation.plan.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </section>
              <div className="btn-wrap mt-30" style={{ gap: 12 }}>
                <Link href="/booking" className="btn bg-theme text-title clinic-glow-btn">
                  <span className="link-effect">
                    <span className="effect-1">{t("treatments.bookAppointment")}</span>
                    <span className="effect-1">{t("treatments.bookAppointment")}</span>
                  </span>
                </Link>
                <Link href={`/tretmani/${resolvedParams.categorySlug}`} className="btn bg-theme text-title clinic-glow-btn">
                  <span className="link-effect">
                    <span className="effect-1">{t("treatments.backToCategory")}</span>
                    <span className="effect-1">{t("treatments.backToCategory")}</span>
                  </span>
                </Link>
              </div>
            </article>

            <aside className="clinic-treatment-detail-gallery glass-panel clinic-reveal">
              <h3>{t("treatments.serviceResults")}</h3>
              {beforeAfter.length ? (
                <div className="clinic-treatment-gallery-grid">
                  {beforeAfter.map((item) => (
                    <div key={item.id} className="clinic-treatment-image-slot">
                      <img
                        src={item.collageImageUrl || item.beforeImageUrl}
                        alt={item.treatmentType || service.name}
                        loading="lazy"
                        decoding="async"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p>{t("treatments.serviceResultsEmpty")}</p>
              )}
            </aside>
          </div>

          <section className="clinic-treatment-faq glass-panel clinic-reveal">
            <h3>Najcesca pitanja za {service.name}</h3>
            <div className="clinic-treatment-faq-list">
              {faq.map((item) => (
                <details key={item.question}>
                  <summary>{item.question}</summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </section>

          {relatedServices.length ? (
            <section className="clinic-treatment-faq glass-panel clinic-reveal">
              <h3>Povezane usluge</h3>
              <div className="clinic-treatment-related-list">
                {relatedServices.map((item) => (
                  <Link key={item.id} href={`/tretmani/${categorySpec.slug}/${item.slug}`} className="clinic-treatment-related-card">
                    <span>{item.name}</span>
                    <small>{item.durationMin ? `${item.durationMin} min` : "Individualno"} - {formatPrice(item.priceRsd)}</small>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
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
