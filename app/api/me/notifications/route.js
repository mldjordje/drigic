import { desc, eq } from "drizzle-orm";
import { fail, ok } from "@/lib/api/http";
import { requireUser } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";
import { stripNotificationMarkerSuffix } from "@/lib/notifications/delivery";

export const runtime = "nodejs";

const LIMIT = 40;

export async function GET(request) {
  const auth = await requireUser(request);
  if (auth.error) {
    return auth.error;
  }

  const db = getDb();
  const rows = await db
    .select({
      id: schema.notifications.id,
      type: schema.notifications.type,
      title: schema.notifications.title,
      message: schema.notifications.message,
      sentAt: schema.notifications.sentAt,
      scheduledFor: schema.notifications.scheduledFor,
    })
    .from(schema.notifications)
    .where(eq(schema.notifications.userId, auth.user.id))
    .orderBy(desc(schema.notifications.sentAt), desc(schema.notifications.createdAt))
    .limit(LIMIT);

  const data = rows.map((row) => ({
    ...row,
    message: stripNotificationMarkerSuffix(row.message),
  }));

  return ok({ ok: true, data });
}
