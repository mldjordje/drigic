import { createHash, randomInt } from "crypto";
import { env } from "@/lib/env";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function hasOtpSalt() {
  return Boolean(env.AUTH_OTP_SALT);
}

export function normalizeIdentifier(rawIdentifier = "") {
  const identifier = rawIdentifier.trim();
  if (!identifier) {
    return { type: null, value: "" };
  }

  if (EMAIL_REGEX.test(identifier)) {
    return { type: "email", value: identifier.toLowerCase() };
  }

  const normalizedPhone = identifier.replace(/[^\d+]/g, "");
  if (normalizedPhone.length >= 6) {
    return { type: "phone", value: normalizedPhone };
  }

  return { type: null, value: "" };
}

export function generateOtpCode() {
  return String(randomInt(100000, 999999));
}

export function hashOtpCode(code) {
  if (!hasOtpSalt()) {
    throw new Error("AUTH_OTP_SALT is missing.");
  }

  return createHash("sha256")
    .update(`${code}:${env.AUTH_OTP_SALT}`)
    .digest("hex");
}
