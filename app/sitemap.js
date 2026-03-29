import { and, asc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { getConfiguredSiteUrl } from "@/lib/site";
import { SERVICE_CATEGORY_SPECS, getCategorySlugByName } from "@/lib/services/category-map";

export const revalidate = 3600;

const STATIC_ROUTES = [
  "",
  "/booking",
  "/about",
  "/contact",
  "/faq",
  "/pricing",
  "/beauty-pass",
  "/rezultati",
  "/video-galerija",
  "/tretmani",
  "/nikola-igic",
];

export default async function sitemap() {
  const siteUrl = getConfiguredSiteUrl();
  const db = getDb();

  const staticEntries = STATIC_ROUTES.map((route) => ({
    url: `${siteUrl}${route || "/"}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.7,
  }));

  const categoryEntries = SERVICE_CATEGORY_SPECS.map((category) => ({
    url: `${siteUrl}/tretmani/${category.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const serviceRows = await db
    .select({
      slug: schema.services.slug,
      updatedAt: schema.services.updatedAt,
      categoryName: schema.serviceCategories.name,
    })
    .from(schema.services)
    .innerJoin(
      schema.serviceCategories,
      eq(schema.serviceCategories.id, schema.services.categoryId)
    )
    .where(
      and(
        eq(schema.services.isActive, true),
        eq(schema.serviceCategories.isActive, true)
      )
    )
    .orderBy(asc(schema.serviceCategories.sortOrder), asc(schema.services.name));

  const serviceEntries = serviceRows
    .map((row) => {
      const categorySlug = getCategorySlugByName(row.categoryName);
      if (!categorySlug || !row.slug) {
        return null;
      }

      return {
        url: `${siteUrl}/tretmani/${categorySlug}/${row.slug}`,
        lastModified: row.updatedAt || new Date(),
        changeFrequency: "weekly",
        priority: 0.6,
      };
    })
    .filter(Boolean);

  return [...staticEntries, ...categoryEntries, ...serviceEntries];
}
