import { fail, ok } from "@/lib/api/http";
import { isCronAuthorized } from "@/lib/cron/auth";
import { runReminderDispatch } from "@/lib/notifications/reminder-dispatch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  if (!isCronAuthorized(request)) {
    return fail(401, "Unauthorized cron request.");
  }

  const result = await runReminderDispatch();
  return ok(result);
}
