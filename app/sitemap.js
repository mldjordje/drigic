import { and, asc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { getConfiguredSiteUrl } from "@/lib/site";
import { SERVICE_CATEGORY_SPECS, getCategorySlugByName } from "@/lib/services/category-map";

export const revalidate = 3600;

const STATIC_ROUTES = [
  { path: "",               changeFrequency: "daily",   priority: 1.0  },
  { path: "/tretmani",      changeFrequency: "weekly",  priority: 0.9  },
  { path: "/booking",       changeFrequency: "weekly",  priority: 0.9  },
  { path: "/beauty-pass",   changeFrequency: "weekly",  priority: 0.85 },
  { path: "/nikola-igic",   changeFrequency: "monthly", priority: 0.85 },
  { path: "/about",         changeFrequency: "monthly", priority: 0.8  },
  { path: "/rezultati",     changeFrequency: "weekly",  priority: 0.8  },
  { path: "/video-galerija",changeFrequency: "weekly",  priority: 0.75 },
  { path: "/pricing",       changeFrequency: "monthly", priority: 0.75 },
  { path: "/contact",       changeFrequency: "monthly", priority: 0.75 },
  { path: "/faq",                    changeFrequency: "monthly", priority: 0.7  },
  { path: "/estetska-medicina-nis", changeFrequency: "monthly", priority: 0.95 },
];

export default async function sitemap() {
  const siteUrl = getConfiguredSiteUrl();
  const db = getDb();

  const staticEntries = STATIC_ROUTES.map(({ path, changeFrequency, priority }) => ({
    url: `${siteUrl}${path || "/"}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));

  const categoryEntries = SERVICE_CATEGORY_SPECS.map((category) => ({
    url: `${siteUrl}/tretmani/${category.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    // categories with a dedicated image are richer pages → higher priority
    priority: category.image ? 0.9 : 0.8,
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
        priority: 0.75,
      };
    })
    .filter(Boolean);

  let blogEntries = [];
  try {
    const blogRows = await db
      .select({
        slug: schema.blogPosts.slug,
        publishedAt: schema.blogPosts.publishedAt,
        updatedAt: schema.blogPosts.updatedAt,
      })
      .from(schema.blogPosts)
      .where(eq(schema.blogPosts.isPublished, true))
      .orderBy(asc(schema.blogPosts.publishedAt));

    blogEntries = blogRows.map((row) => ({
      url: `${siteUrl}/blog-details/${row.slug}`,
      lastModified: row.updatedAt || row.publishedAt || new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    }));

    if (blogRows.length > 0) {
      blogEntries.push({
        url: `${siteUrl}/blog`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  } catch {
    // blog table not ready yet — skip
  }

  return [...staticEntries, ...categoryEntries, ...serviceEntries, ...blogEntries];
}
