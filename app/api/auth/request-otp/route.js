import { and, desc, eq, gte } from "drizzle-orm";
import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api/http";
import { env } from "@/lib/env";
import { getDb, schema } from "@/lib/db/client";
import {
  generateOtpCode,
  hashOtpCode,
  hasOtpSalt,
  normalizeIdentifier,
} from "@/lib/auth/otp";
import { sendOtpEmail } from "@/lib/auth/email";

export const runtime = "nodejs";

const OTP_REQUEST_WINDOW_MINUTES = 15;
const OTP_MAX_REQUESTS_PER_WINDOW = 4;
const OTP_REQUEST_COOLDOWN_SECONDS = 45;

const payloadSchema = z.object({
  identifier: z.string().min(3),
});

export async function POST(request) {
  const body = await readJson(request);
  const parsed = payloadSchema.safeParse(body);

  if (!parsed.success) {
    return fail(400, "Invalid payload", parsed.error.flatten());
  }

  const { type, value } = normalizeIdentifier(parsed.data.identifier);
  if (!type) {
    return fail(400, "Use valid email or phone.");
  }
  if (!hasOtpSalt()) {
    return fail(503, "OTP delivery is temporarily unavailable. Contact the clinic.");
  }

  const db = getDb();
  let user = null;
  let targetEmail = null;
  const now = new Date();
  const windowStart = new Date(now.getTime() - OTP_REQUEST_WINDOW_MINUTES * 60 * 1000);

  const recentRequests = await db
    .select({
      createdAt: schema.otpCodes.createdAt,
    })
    .from(schema.otpCodes)
    .where(
      and(
        eq(schema.otpCodes.identifier, value),
        gte(schema.otpCodes.createdAt, windowStart)
      )
    )
    .orderBy(desc(schema.otpCodes.createdAt))
    .limit(OTP_MAX_REQUESTS_PER_WINDOW);

  const latestRequestAt = recentRequests[0]?.createdAt
    ? new Date(recentRequests[0].createdAt).getTime()
    : 0;
  if (latestRequestAt && now.getTime() - latestRequestAt < OTP_REQUEST_COOLDOWN_SECONDS * 1000) {
    return fail(
      429,
      `Sačekajte ${OTP_REQUEST_COOLDOWN_SECONDS} sekundi pre novog koda.`
    );
  }

  if (recentRequests.length >= OTP_MAX_REQUESTS_PER_WINDOW) {
    return fail(429, "Previše OTP zahteva. Pokušajte ponovo kasnije.");
  }

  if (type === "email") {
    const [existing] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, value))
      .limit(1);

    if (!existing) {
      [user] = await db
        .insert(schema.users)
        .values({
          email: value,
          role: "client",
        })
        .returning();
    } else {
      user = existing;
    }
    targetEmail = user.email;
  } else {
    const [existing] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.phone, value))
      .limit(1);

    if (!existing || !existing.email) {
      return fail(
        404,
        "Phone number is not linked to an account email. Register with email first."
      );
    }

    user = existing;
    targetEmail = existing.email;
  }

  const code = generateOtpCode();
  const codeHash = hashOtpCode(code);
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

  await db.insert(schema.otpCodes).values({
    identifier: value,
    userId: user.id,
    codeHash,
    expiresAt,
  });

  const emailResult = await sendOtpEmail({
    to: targetEmail,
    code,
  });

  if (!emailResult.sent && env.NODE_ENV === "production") {
    return fail(503, "OTP delivery is temporarily unavailable. Try again shortly.");
  }

  return ok({
    ok: true,
    channel: "email",
    identifierType: type,
    expiresAt: expiresAt.toISOString(),
    ...(env.NODE_ENV !== "production" && !emailResult.sent
      ? { devOtp: code, warning: emailResult.reason }
      : {}),
  });
}
