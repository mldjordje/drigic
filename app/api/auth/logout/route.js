import { ok } from "@/lib/api/http";
import { clearSessionCookie } from "@/lib/auth/session";

export async function POST() {
  const response = ok({ ok: true });
  clearSessionCookie(response);
  return response;
}

