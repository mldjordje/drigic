import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { fail, ok } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";

export const runtime = "nodejs";

/** Stops an in-flight campaign. Already delivered mails cannot be recalled. */
export async function POST(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const { id } = (await params) || {};
  if (!z.string().uuid().safeParse(id).success) {
    return fail(400, "Neispravan ID kampanje.");
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
  if (campaign.status !== "sending") {
    return fail(409, "Zaustavljanje je moguće samo dok je kampanja u slanju.");
  }

  await db
    .delete(schema.emailCampaignRecipients)
    .where(
      and(
        eq(schema.emailCampaignRecipients.campaignId, id),
        eq(schema.emailCampaignRecipients.status, "pending")
      )
    );

  const [record] = await db
    .update(schema.emailCampaigns)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(schema.emailCampaigns.id, id))
    .returning();

  return ok({ ok: true, data: record });
}
