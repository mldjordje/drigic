import { asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { created, fail, ok, readJson } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";

export const runtime = "nodejs";

const blogSchema = z.object({
  slug: z.string().min(2).max(255).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug mora biti lowercase-kebab-case"),
  title: z.string().min(2).max(255),
  excerpt: z.string().max(500).optional().nullable(),
  content: z.string().min(10),
  category: z.string().max(80).optional().nullable(),
  featuredImageUrl: z.string().url().optional().nullable(),
  seoTitle: z.string().max(255).optional().nullable(),
  seoDescription: z.string().max(500).optional().nullable(),
  seoKeywords: z.array(z.string().max(100)).max(20).optional().nullable(),
  isPublished: z.boolean().optional(),
  publishedAt: z.string().datetime().optional().nullable(),
});

export async function GET(request) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const db = getDb();
    const posts = await db
      .select({
        id: schema.blogPosts.id,
        slug: schema.blogPosts.slug,
        title: schema.blogPosts.title,
        excerpt: schema.blogPosts.excerpt,
        category: schema.blogPosts.category,
        isPublished: schema.blogPosts.isPublished,
        publishedAt: schema.blogPosts.publishedAt,
        createdAt: schema.blogPosts.createdAt,
        updatedAt: schema.blogPosts.updatedAt,
      })
      .from(schema.blogPosts)
      .orderBy(desc(schema.blogPosts.createdAt));

    return ok({ posts });
  } catch (err) {
    return fail(err.message, 500);
  }
}

export async function POST(request) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const body = await readJson(request);
  const parsed = blogSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message || "Validation error", 422);
  }

  const { slug, title, excerpt, content, category, featuredImageUrl,
          seoTitle, seoDescription, seoKeywords, isPublished, publishedAt } = parsed.data;

  try {
    const db = getDb();
    const [post] = await db
      .insert(schema.blogPosts)
      .values({
        slug,
        title,
        excerpt: excerpt || null,
        content,
        category: category || null,
        featuredImageUrl: featuredImageUrl || null,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        seoKeywords: seoKeywords?.length ? seoKeywords : null,
        isPublished: isPublished ?? false,
        publishedAt: isPublished && !publishedAt ? new Date() : (publishedAt ? new Date(publishedAt) : null),
      })
      .returning();

    return created({ post });
  } catch (err) {
    if (err.message?.includes("unique")) {
      return fail("Slug već postoji — izaberi drugi slug", 409);
    }
    return fail(err.message, 500);
  }
}
