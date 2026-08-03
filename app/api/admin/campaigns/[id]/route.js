import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";
import { CAMPAIGN_AUDIENCES, countAudience } from "@/lib/marketing/campaigns";

export const runtime = "nodejs";

const idSchema = z.string().uuid();

const updateSchema = z.object({
  title: z.string().min(2).max(255).optional(),
  subject: z.string().min(2).max(255).optional(),
  previewText: z.string().max(255).nullable().optional(),
  heading: z.string().min(2).max(255).optional(),
  body: z.string().min(2).max(8000).optional(),
  imageUrl: z.string().nullable().optional(),
  ctaLabel: z.string().max(120).nullable().optional(),
  ctaUrl: z.string().max(2000).nullable().optional(),
  audience: z.enum(CAMPAIGN_AUDIENCES).optional(),
});

async function loadCampaign(db, id) {
  const [campaign] = await db
    .select()
    .from(schema.emailCampaigns)
    .where(eq(schema.emailCampaigns.id, id))
    .limit(1);

  return campaign || null;
}

export async function GET(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const { id } = (await params) || {};
  if (!idSchema.safeParse(id).success) {
    return fail(400, "Neispravan ID kampanje.");
  }

  const db = getDb();
  const campaign = await loadCampaign(db, id);
  if (!campaign) {
    return fail(404, "Kampanja nije pronađena.");
  }

  const [recipients, failedRecipients, audienceSize] = await Promise.all([
    db
      .select({
        email: schema.emailCampaignRecipients.email,
        status: schema.emailCampaignRecipients.status,
        sentAt: schema.emailCampaignRecipients.sentAt,
      })
      .from(schema.emailCampaignRecipients)
      .where(eq(schema.emailCampaignRecipients.campaignId, id))
      .orderBy(desc(schema.emailCampaignRecipients.sentAt))
      .limit(50),
    db
      .select({
        email: schema.emailCampaignRecipients.email,
        lastError: schema.emailCampaignRecipients.lastError,
      })
      .from(schema.emailCampaignRecipients)
      .where(
        and(
          eq(schema.emailCampaignRecipients.campaignId, id),
          eq(schema.emailCampaignRecipients.status, "failed")
        )
      )
      .limit(50),
    countAudience(db, campaign.audience),
  ]);

  return ok({
    ok: true,
    data: campaign,
    recipients,
    failedRecipients,
    audienceSize,
  });
}

export async function PATCH(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const { id } = (await params) || {};
  if (!idSchema.safeParse(id).success) {
    return fail(400, "Neispravan ID kampanje.");
  }

  const parsed = updateSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return fail(400, "Invalid payload", parsed.error.flatten());
  }

  const db = getDb();
  const campaign = await loadCampaign(db, id);
  if (!campaign) {
    return fail(404, "Kampanja nije pronađena.");
  }
  if (campaign.status !== "draft") {
    return fail(409, "Kampanja koja je već poslata ili je u slanju ne može da se menja.");
  }

  const [record] = await db
    .update(schema.emailCampaigns)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(schema.emailCampaigns.id, id))
    .returning();

  return ok({ ok: true, data: record });
}

export async function DELETE(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const { id } = (await params) || {};
  if (!idSchema.safeParse(id).success) {
    return fail(400, "Neispravan ID kampanje.");
  }

  const db = getDb();
  const campaign = await loadCampaign(db, id);
  if (!campaign) {
    return fail(404, "Kampanja nije pronađena.");
  }
  if (campaign.status === "sending") {
    return fail(409, "Zaustavi slanje pre brisanja kampanje.");
  }

  await db.delete(schema.emailCampaigns).where(eq(schema.emailCampaigns.id, id));

  return ok({ ok: true });
}
