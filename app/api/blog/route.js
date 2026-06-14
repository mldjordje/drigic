import { and, desc, eq } from "drizzle-orm";
import { ok, fail } from "@/lib/api/http";
import { getDb, schema } from "@/lib/db/client";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET() {
  try {
    const db = getDb();
    const posts = await db
      .select({
        id: schema.blogPosts.id,
        slug: schema.blogPosts.slug,
        title: schema.blogPosts.title,
        excerpt: schema.blogPosts.excerpt,
        category: schema.blogPosts.category,
        featuredImageUrl: schema.blogPosts.featuredImageUrl,
        publishedAt: schema.blogPosts.publishedAt,
      })
      .from(schema.blogPosts)
      .where(eq(schema.blogPosts.isPublished, true))
      .orderBy(desc(schema.blogPosts.publishedAt));

    return ok({ posts });
  } catch (err) {
    return fail(err.message, 500);
  }
}
