import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api/http";
import { getDb, schema } from "@/lib/db/client";
import { hashOtpCode, normalizeIdentifier } from "@/lib/auth/otp";
import {
  setSessionCookie,
  signSessionToken,
} from "@/lib/auth/session";

export const runtime = "nodejs";

const payloadSchema = z.object({
  identifier: z.string().min(3),
  code: z.string().min(4).max(8),
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

  const db = getDb();
  const now = new Date();

  const [otpRow] = await db
    .select()
    .from(schema.otpCodes)
    .where(
      and(
        eq(schema.otpCodes.identifier, value),
        isNull(schema.otpCodes.usedAt),
        gt(schema.otpCodes.expiresAt, now)
      )
    )
    .orderBy(desc(schema.otpCodes.createdAt))
    .limit(1);

  if (!otpRow) {
    return fail(401, "OTP code is invalid or expired.");
  }

  const incomingHash = hashOtpCode(parsed.data.code);
  if (incomingHash !== otpRow.codeHash) {
    return fail(401, "OTP code is invalid.");
  }

  await db
    .update(schema.otpCodes)
    .set({ usedAt: now })
    .where(eq(schema.otpCodes.id, otpRow.id));

  let user;
  if (otpRow.userId) {
    [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, otpRow.userId))
      .limit(1);
  }

  if (!user) {
    if (type === "email") {
      [user] = await db
        .insert(schema.users)
        .values({ email: value, role: "client" })
        .returning();
    } else {
      [user] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.phone, value))
        .limit(1);
    }
  }

  if (!user) {
    return fail(404, "User not found.");
  }

  await db
    .update(schema.users)
    .set({
      lastLoginAt: now,
      updatedAt: now,
    })
    .where(eq(schema.users.id, user.id));

  const token = await signSessionToken({
    sub: user.id,
    role: user.role,
    email: user.email,
    phone: user.phone,
  });

  const response = ok({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
  });
  setSessionCookie(response, token);
  return response;
}

