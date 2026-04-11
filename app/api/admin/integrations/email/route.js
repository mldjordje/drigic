import { ok } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/guards";
import { getEmailConfigurationStatus } from "@/lib/auth/email";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const config = getEmailConfigurationStatus();

  return ok({
    ok: true,
    data: {
      ...config,
      adminInbox: String(env.ADMIN_BOOKING_NOTIFY_EMAIL || "").trim() || null,
    },
  });
}
