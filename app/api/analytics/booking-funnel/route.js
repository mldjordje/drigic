import { cookies } from "next/headers";
import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api/http";
import { getDb, schema } from "@/lib/db/client";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

export const runtime = "nodejs";

const ALLOWED_STEPS = [
  "step_1_view",
  "step_2_view",
  "step_3_view",
  "booking_completed",
];

const payloadSchema = z.object({
  step: z.enum(ALLOWED_STEPS),
  locale: z.string().max(16).optional(),
  sessionId: z.string().min(8).max(128),
});

export async function POST(request) {
  const body = await readJson(request);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Invalid payload", parsed.error.flatten());
  }

  const { step, locale, sessionId } = parsed.data;

  let userId = null;
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = sessionToken ? await verifySessionToken(sessionToken) : null;
    userId = session?.id || null;
  } catch {
    userId = null;
  }

  // Analytics is best-effort: a missing table or a write failure must never
  // surface as an error to the booking flow.
  try {
    const db = getDb();
    await db
      .insert(schema.bookingFunnelEvents)
      .values({
        userId,
        sessionId,
        step,
        locale: locale || null,
      })
      .onConflictDoNothing();
  } catch {
    return ok({ ok: true, stored: false });
  }

  return ok({ ok: true, stored: true });
}
