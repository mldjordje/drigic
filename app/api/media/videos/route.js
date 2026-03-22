import { desc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { publicOk } from "@/lib/api/http";
import { getDb, schema } from "@/lib/db/client";

export const runtime = "nodejs";
export const revalidate = 600;

const getCachedVideoLinks = unstable_cache(
  async () => {
    const db = getDb();
    return db
      .select()
      .from(schema.videoLinks)
      .where(eq(schema.videoLinks.isPublished, true))
      .orderBy(desc(schema.videoLinks.createdAt))
      .limit(20);
  },
  ["public-video-links"],
  { revalidate }
);

export async function GET() {
  const data = await getCachedVideoLinks();

  return publicOk(
    { ok: true, data },
    { sMaxAge: revalidate, staleWhileRevalidate: 3600 }
  );
}
