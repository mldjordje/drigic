import { eq } from "drizzle-orm";
import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api/http";
import { getDb, schema } from "@/lib/db/client";
import { generateOtpCode, hashOtpCode, normalizeIdentifier } from "@/lib/auth/otp";
import { sendOtpEmail } from "@/lib/auth/email";

export const runtime = "nodejs";

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

  const db = getDb();
  let user = null;
  let targetEmail = null;

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
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

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

  return ok({
    ok: true,
    channel: "email",
    identifierType: type,
    expiresAt: expiresAt.toISOString(),
    ...(process.env.NODE_ENV !== "production" && !emailResult.sent
      ? { devOtp: code, warning: emailResult.reason }
      : {}),
  });
}
