import { fail, ok } from "@/lib/api/http";
import { getEmailConfigurationStatus } from "@/lib/auth/email";
import { requireAdmin } from "@/lib/auth/guards";
import { runCampaignDispatch } from "@/lib/marketing/campaign-dispatch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Manual "send the next slice now" trigger, mirrors the daily cron. */
export async function POST(request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const emailConfig = getEmailConfigurationStatus();
  if (!emailConfig.configured) {
    return fail(
      503,
      `Slanje mejlova nije podešeno (nedostaje: ${emailConfig.missing.join(", ")}).`
    );
  }

  const result = await runCampaignDispatch();
  return ok({ ok: true, ...result });
}
