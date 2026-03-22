import { desc } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { publicOk } from "@/lib/api/http";
import { getDb, schema } from "@/lib/db/client";

export const runtime = "nodejs";
export const revalidate = 600;

const getCachedGalleryMedia = unstable_cache(
  async () => {
    const db = getDb();
    return db
      .select()
      .from(schema.galleryMedia)
      .orderBy(desc(schema.galleryMedia.createdAt))
      .limit(100);
  },
  ["public-gallery-media"],
  { revalidate }
);

export async function GET() {
  const data = await getCachedGalleryMedia();

  return publicOk(
    { ok: true, data },
    { sMaxAge: revalidate, staleWhileRevalidate: 3600 }
  );
}
