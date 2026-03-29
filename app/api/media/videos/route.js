import { desc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { publicOk } from "@/lib/api/http";
import { getDb, schema } from "@/lib/db/client";

export const runtime = "nodejs";
export const revalidate = 600;

const getCachedVideoLinks = unstable_cache(
  async (limit) => {
    const db = getDb();
    return db
      .select()
      .from(schema.videoLinks)
      .where(eq(schema.videoLinks.isPublished, true))
      .orderBy(desc(schema.videoLinks.createdAt))
      .limit(limit);
  },
  ["public-video-links"],
  { revalidate }
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.max(1, Math.min(20, Number(searchParams.get("limit") || 20)));
  const data = await getCachedVideoLinks(limit);

  return publicOk(
    { ok: true, data },
    { sMaxAge: revalidate, staleWhileRevalidate: 3600 }
  );
}
