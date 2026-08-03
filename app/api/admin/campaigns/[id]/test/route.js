import { eq } from "drizzle-orm";
import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api/http";
import { sendTransactionalEmail } from "@/lib/auth/email";
import { requireAdmin } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";
import {
  buildCampaignEmailContent,
  buildUnsubscribeUrl,
} from "@/lib/marketing/campaigns";

export const runtime = "nodejs";

const payloadSchema = z.object({
  to: z.string().email().optional(),
});

export async function POST(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const { id } = (await params) || {};
  if (!z.string().uuid().safeParse(id).success) {
    return fail(400, "Neispravan ID kampanje.");
  }

  const parsed = payloadSchema.safeParse((await readJson(request)) || {});
  if (!parsed.success) {
    return fail(400, "Invalid payload", parsed.error.flatten());
  }

  const db = getDb();
  const [campaign] = await db
    .select()
    .from(schema.emailCampaigns)
    .where(eq(schema.emailCampaigns.id, id))
    .limit(1);

  if (!campaign) {
    return fail(404, "Kampanja nije pronađena.");
  }

  const to = parsed.data.to || auth.user.email;
  const content = buildCampaignEmailContent(campaign, {
    unsubscribeUrl: buildUnsubscribeUrl("test-token"),
  });

  const result = await sendTransactionalEmail({
    ...content,
    to,
    subject: `[TEST] ${campaign.subject}`,
  });

  if (!result.sent) {
    return fail(502, result.reason || "Slanje test poruke nije uspelo.");
  }

  return ok({ ok: true, to, id: result.id });
}
