import { cookies } from "next/headers";
import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api/http";
import { getDb, schema } from "@/lib/db/client";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

export const runtime = "nodejs";

const payloadSchema = z.object({
  pathname: z.string().min(1).max(512),
  referrer: z.string().max(2048).optional(),
  locale: z.string().max(16).optional(),
  sessionId: z.string().min(8).max(128),
});

function shouldSkipPath(pathname) {
  return pathname.startsWith("/admin") || pathname.startsWith("/api");
}

export async function POST(request) {
  const body = await readJson(request);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Invalid payload", parsed.error.flatten());
  }

  const { pathname, referrer, locale, sessionId } = parsed.data;
  if (shouldSkipPath(pathname)) {
    return ok({ ok: true, skipped: true });
  }

  let userId = null;
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = sessionToken ? await verifySessionToken(sessionToken) : null;
    userId = session?.id || null;
  } catch {
    userId = null;
  }

  const db = getDb();
  await db.insert(schema.sitePageViews).values({
    userId,
    sessionId,
    pathname,
    referrer: referrer || null,
    locale: locale || null,
  });

  return ok({ ok: true });
}
