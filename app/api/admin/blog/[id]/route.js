import { eq } from "drizzle-orm";
import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";

export const runtime = "nodejs";

const updateSchema = z.object({
  slug: z.string().min(2).max(255).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  title: z.string().min(2).max(255).optional(),
  excerpt: z.string().max(500).nullable().optional(),
  content: z.string().min(10).optional(),
  category: z.string().max(80).nullable().optional(),
  featuredImageUrl: z.string().url().nullable().optional(),
  seoTitle: z.string().max(255).nullable().optional(),
  seoDescription: z.string().max(500).nullable().optional(),
  seoKeywords: z.array(z.string().max(100)).max(20).nullable().optional(),
  isPublished: z.boolean().optional(),
  publishedAt: z.string().datetime().nullable().optional(),
});

export async function GET(request, { params }) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const { id } = await params;
  const db = getDb();
  const [post] = await db.select().from(schema.blogPosts).where(eq(schema.blogPosts.id, id)).limit(1);
  if (!post) return fail("Post nije pronađen", 404);
  return ok({ post });
}

export async function PATCH(request, { params }) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const { id } = await params;
  const body = await readJson(request);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message || "Validation error", 422);
  }

  const updates = { ...parsed.data, updatedAt: new Date() };

  if (updates.isPublished === true && updates.publishedAt === undefined) {
    const db = getDb();
    const [existing] = await db
      .select({ publishedAt: schema.blogPosts.publishedAt })
      .from(schema.blogPosts)
      .where(eq(schema.blogPosts.id, id))
      .limit(1);
    if (!existing?.publishedAt) {
      updates.publishedAt = new Date();
    }
  }

  if (updates.publishedAt && typeof updates.publishedAt === "string") {
    updates.publishedAt = new Date(updates.publishedAt);
  }

  try {
    const db = getDb();
    const [post] = await db
      .update(schema.blogPosts)
      .set(updates)
      .where(eq(schema.blogPosts.id, id))
      .returning();

    if (!post) return fail("Post nije pronađen", 404);
    return ok({ post });
  } catch (err) {
    if (err.message?.includes("unique")) {
      return fail("Slug već postoji", 409);
    }
    return fail(err.message, 500);
  }
}

export async function DELETE(request, { params }) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const { id } = await params;
  try {
    const db = getDb();
    const [deleted] = await db
      .delete(schema.blogPosts)
      .where(eq(schema.blogPosts.id, id))
      .returning({ id: schema.blogPosts.id });

    if (!deleted) return fail("Post nije pronađen", 404);
    return ok({ deleted: true });
  } catch (err) {
    return fail(err.message, 500);
  }
}
