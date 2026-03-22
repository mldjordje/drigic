import { and, desc, eq, gte, isNull, lte, or } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { publicOk } from "@/lib/api/http";
import { getDb, schema } from "@/lib/db/client";

export const runtime = "nodejs";
export const revalidate = 300;

const getCachedAnnouncements = unstable_cache(
  async () => {
  const db = getDb();
  const now = new Date();

    return db
    .select()
    .from(schema.homeAnnouncements)
    .where(
      and(
        eq(schema.homeAnnouncements.isActive, true),
        or(isNull(schema.homeAnnouncements.startsAt), lte(schema.homeAnnouncements.startsAt, now)),
        or(isNull(schema.homeAnnouncements.endsAt), gte(schema.homeAnnouncements.endsAt, now))
      )
    )
    .orderBy(desc(schema.homeAnnouncements.createdAt))
    .limit(5);
  },
  ["public-announcements"],
  { revalidate }
);

export async function GET() {
  const data = await getCachedAnnouncements();

  return publicOk(
    { ok: true, data },
    { sMaxAge: revalidate, staleWhileRevalidate: 1800 }
  );
}
