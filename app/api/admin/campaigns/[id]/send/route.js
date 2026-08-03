import { eq } from "drizzle-orm";
import { z } from "zod";
import { fail, ok } from "@/lib/api/http";
import { getEmailConfigurationStatus } from "@/lib/auth/email";
import { requireAdmin } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";
import { runCampaignDispatch } from "@/lib/marketing/campaign-dispatch";
import { selectAudienceRecipients } from "@/lib/marketing/campaigns";

export const runtime = "nodejs";

/**
 * Queues the audience for a draft campaign and immediately sends the first
 * slice. Everything left over is drained by the daily cron.
 */
export async function POST(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const { id } = (await params) || {};
  if (!z.string().uuid().safeParse(id).success) {
    return fail(400, "Neispravan ID kampanje.");
  }

  const emailConfig = getEmailConfigurationStatus();
  if (!emailConfig.configured) {
    return fail(
      503,
      `Slanje mejlova nije podešeno (nedostaje: ${emailConfig.missing.join(", ")}).`
    );
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
  if (campaign.status !== "draft") {
    return fail(409, "Samo kampanja u statusu nacrta može da se pošalje.");
  }

  const audience = await selectAudienceRecipients(db, campaign.audience);
  if (!audience.length) {
    return fail(400, "Izabrana publika trenutno nema nijednog primaoca.");
  }

  await db
    .insert(schema.emailCampaignRecipients)
    .values(
      audience.map((recipient) => ({
        campaignId: campaign.id,
        userId: recipient.id,
        email: recipient.email,
      }))
    )
    .onConflictDoNothing();

  await db
    .update(schema.emailCampaigns)
    .set({
      status: "sending",
      queuedAt: new Date(),
      totalRecipients: audience.length,
      lastError: null,
      updatedAt: new Date(),
    })
    .where(eq(schema.emailCampaigns.id, campaign.id));

  const dispatch = await runCampaignDispatch();

  const [refreshed] = await db
    .select()
    .from(schema.emailCampaigns)
    .where(eq(schema.emailCampaigns.id, campaign.id))
    .limit(1);

  return ok({ ok: true, data: refreshed, queued: audience.length, dispatch });
}
