import { and, eq } from "drizzle-orm";
import { ok, fail } from "@/lib/api/http";
import { getDb, schema } from "@/lib/db/client";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET(request, { params }) {
  const { slug } = await params;
  try {
    const db = getDb();
    const [post] = await db
      .select()
      .from(schema.blogPosts)
      .where(and(eq(schema.blogPosts.slug, slug), eq(schema.blogPosts.isPublished, true)))
      .limit(1);

    if (!post) return fail("Post nije pronađen", 404);
    return ok({ post });
  } catch (err) {
    return fail(err.message, 500);
  }
}
