import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Header4 from "@/components/headers/Header4";
import Footer5 from "@/components/footers/Footer5";
import { getDb, schema } from "@/lib/db/client";
import { LOCALE_COOKIE_KEY, resolveLocale, translate } from "@/lib/i18n";
import { getCategorySpecBySlug } from "@/lib/services/category-map";

export const dynamic = "force-dynamic";

async function loadServiceDetails(categorySlug, serviceSlug) {
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
    beforeAfter,
  };
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const data = await loadServiceDetails(resolvedParams?.categorySlug, resolvedParams?.serviceSlug);

  if (!data) {
    return {
      title: "Tretman | Dr Igic",
    };
  }

  return {
    title: `${data.service.name} | Dr Igic`,
    description: data.service.description || data.categorySpec.seoDescription,
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
  const { categorySpec, service, beforeAfter } = data;

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
                <span>{service.priceRsd} EUR</span>
                {service.reminderEnabled ? (
                  <span>Podsetnik nakon {service.reminderDelayDays} dana</span>
                ) : null}
              </div>
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
        </section>
      </main>
      <Footer5 />
    </div>
  );
}
