import Link from "next/link";
import { and, asc, eq, gte, isNull, lte, or } from "drizzle-orm";
import { notFound } from "next/navigation";
import Header4 from "@/components/headers/Header4";
import Footer5 from "@/components/footers/Footer5";
import { getDb, schema } from "@/lib/db/client";
import {
  SERVICE_CATEGORY_SPECS,
  getCategorySpecBySlug,
} from "@/lib/services/category-map";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return SERVICE_CATEGORY_SPECS.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const category = getCategorySpecBySlug(resolvedParams?.slug);
  if (!category) {
    return { title: "Tretmani | Dr Igic" };
  }
  return {
    title: `${category.name} | Dr Igic`,
  };
}

async function loadCategoryServices(slug) {
  const categorySpec = getCategorySpecBySlug(slug);
  if (!categorySpec) {
    return null;
  }

  const db = getDb();
  const now = new Date();

  const [category] = await db
    .select({
      id: schema.serviceCategories.id,
      name: schema.serviceCategories.name,
      sortOrder: schema.serviceCategories.sortOrder,
    })
    .from(schema.serviceCategories)
    .where(
      and(
        eq(schema.serviceCategories.name, categorySpec.name),
        eq(schema.serviceCategories.isActive, true)
      )
    )
    .orderBy(asc(schema.serviceCategories.sortOrder))
    .limit(1);

  if (!category) {
    return {
      categorySpec,
      category: null,
      services: [],
    };
  }

  const rows = await db
    .select({
      id: schema.services.id,
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
    .where(
      and(
        eq(schema.services.categoryId, category.id),
        eq(schema.services.isActive, true),
        eq(schema.services.kind, "single")
      )
    )
    .orderBy(asc(schema.services.name));

  const dedupedRows = Array.from(new Map(rows.map((row) => [row.id, row])).values());
  const services = dedupedRows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description || "",
    durationMin: Number(row.durationMin || 0),
    price: Number(row.priceRsd || 0),
    promotion:
      row.promoPriceRsd !== null && row.promoPriceRsd !== undefined && row.promoActive
        ? {
            title: row.promotionTitle || "Promocija",
            price: Number(row.promoPriceRsd),
          }
        : null,
  }));

  return {
    categorySpec,
    category,
    services,
  };
}

export default async function TreatmentCategoryPage({ params }) {
  const resolvedParams = await params;
  const data = await loadCategoryServices(resolvedParams?.slug);
  if (!data) {
    notFound();
  }

  const { categorySpec, services } = data;

  return (
    <div className="clinic-home5">
      <Header4 />
      <main style={{ paddingTop: 130, paddingBottom: 90 }}>
        <section className="container">
          <div className="title-area text-center clinic-reveal is-visible">
            <h1 className="sec-title text-smoke" style={{ marginBottom: 12 }}>
              {categorySpec.name}
            </h1>
            <p className="sec-text text-smoke" style={{ maxWidth: 760, margin: "0 auto" }}>
              {categorySpec.shortDescription}
            </p>
          </div>

          <div className="clinic-treatment-service-grid">
            {services.map((service) => (
              <article
                key={service.id}
                className="clinic-treatment-service-card glass-panel clinic-hover-raise"
              >
                <h3>{service.name}</h3>
                <p>{service.description || "Individualni tretman."}</p>
                <div className="clinic-treatment-service-meta">
                  <span>{service.durationMin} min</span>
                  <span>
                    {service.promotion ? (
                      <>
                        <del>{service.price} EUR</del> {service.promotion.price} EUR
                      </>
                    ) : (
                      `${service.price} EUR`
                    )}
                  </span>
                </div>
              </article>
            ))}
          </div>

          {!services.length ? (
            <div className="admin-card" style={{ marginTop: 18 }}>
              <p style={{ margin: 0, color: "#d9e6f8" }}>
                Trenutno nema aktivnih usluga u ovoj kategoriji.
              </p>
            </div>
          ) : null}

          <div className="btn-wrap mt-50 justify-content-center" style={{ gap: 12 }}>
            <Link href="/tretmani" className="btn bg-theme text-title clinic-glow-btn">
              <span className="link-effect">
                <span className="effect-1">SVE KATEGORIJE</span>
                <span className="effect-1">SVE KATEGORIJE</span>
              </span>
            </Link>
            <Link href="/#booking" className="btn bg-theme text-title clinic-glow-btn">
              <span className="link-effect">
                <span className="effect-1">ZAKAZI TERMIN</span>
                <span className="effect-1">ZAKAZI TERMIN</span>
              </span>
            </Link>
          </div>
        </section>
      </main>
      <Footer5 />
    </div>
  );
}
