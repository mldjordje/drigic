import { and, desc, eq, gte, isNull, lte, or } from "drizzle-orm";
import { ok } from "@/lib/api/http";
import { getDb, schema } from "@/lib/db/client";

export const runtime = "nodejs";

export async function GET() {
  const db = getDb();
  const now = new Date();

  const rows = await db
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

  return ok({ ok: true, data: rows });
}

