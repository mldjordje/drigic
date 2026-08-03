import { eq } from "drizzle-orm";
import { z } from "zod";
import { fail, ok } from "@/lib/api/http";
import { getDb, schema } from "@/lib/db/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function optOut(token) {
  if (!z.string().uuid().safeParse(token).success) {
    return { ok: false, status: 400, message: "Neispravan link za odjavu." };
  }

  const db = getDb();
  const [record] = await db
    .update(schema.users)
    .set({ marketingConsent: false, updatedAt: new Date() })
    .where(eq(schema.users.unsubscribeToken, token))
    .returning({ email: schema.users.email });

  if (!record) {
    return { ok: false, status: 404, message: "Link za odjavu više nije važeći." };
  }

  return { ok: true, email: record.email };
}

/** RFC 8058 one-click unsubscribe target used by the List-Unsubscribe header. */
export async function POST(request, { params }) {
  const { token } = (await params) || {};
  const result = await optOut(token);

  if (!result.ok) {
    return fail(result.status, result.message);
  }

  return ok({ ok: true });
}

/** Read-only lookup: link scanners must never opt somebody out by prefetching. */
export async function GET(request, { params }) {
  const { token } = (await params) || {};
  if (!z.string().uuid().safeParse(token).success) {
    return fail(400, "Neispravan link za odjavu.");
  }

  const db = getDb();
  const [user] = await db
    .select({
      email: schema.users.email,
      marketingConsent: schema.users.marketingConsent,
    })
    .from(schema.users)
    .where(eq(schema.users.unsubscribeToken, token))
    .limit(1);

  if (!user) {
    return fail(404, "Link za odjavu više nije važeći.");
  }

  return ok({ ok: true, email: user.email, subscribed: user.marketingConsent });
}
