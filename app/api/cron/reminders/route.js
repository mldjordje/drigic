import { fail, ok } from "@/lib/api/http";
import { isCronAuthorized } from "@/lib/cron/auth";
import { runCampaignDispatch } from "@/lib/marketing/campaign-dispatch";
import { runReminderDispatch } from "@/lib/notifications/reminder-dispatch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  if (!isCronAuthorized(request)) {
    return fail(401, "Unauthorized cron request.");
  }

  const reminders = await runReminderDispatch();

  // Vercel Hobby allows only two cron jobs, so the daily campaign slice rides
  // along with the reminder run instead of owning a schedule of its own.
  let campaigns = null;
  try {
    campaigns = await runCampaignDispatch();
  } catch (error) {
    campaigns = { error: error?.message || "Campaign dispatch failed" };
  }

  return ok({ ...reminders, campaigns });
}
