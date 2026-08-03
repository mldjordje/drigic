import { desc } from "drizzle-orm";
import { z } from "zod";
import { created, fail, ok } from "@/lib/api/http";
import { getEmailConfigurationStatus } from "@/lib/auth/email";
import { requireAdmin } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";
import { getRemainingDailyQuota, resolveDailyLimit } from "@/lib/marketing/campaign-dispatch";
import { CAMPAIGN_AUDIENCES, getAudienceBreakdown } from "@/lib/marketing/campaigns";
import { uploadOptionalFile } from "@/lib/storage/upload";

export const runtime = "nodejs";

const createSchema = z.object({
  title: z.string().min(2).max(255),
  subject: z.string().min(2).max(255),
  previewText: z.string().max(255).optional(),
  heading: z.string().min(2).max(255),
  body: z.string().min(2).max(8000),
  imageUrl: z.string().optional(),
  ctaLabel: z.string().max(120).optional(),
  ctaUrl: z.string().max(2000).optional(),
  audience: z.enum(CAMPAIGN_AUDIENCES).default("all"),
});

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const db = getDb();
  const [campaigns, audience, quotaRemaining] = await Promise.all([
    db
      .select()
      .from(schema.emailCampaigns)
      .orderBy(desc(schema.emailCampaigns.createdAt))
      .limit(100),
    getAudienceBreakdown(db),
    getRemainingDailyQuota(db),
  ]);

  return ok({
    ok: true,
    data: campaigns,
    audience,
    delivery: {
      ...getEmailConfigurationStatus(),
      dailyLimit: resolveDailyLimit(),
      quotaRemaining,
    },
  });
}

export async function POST(request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const formData = await request.formData();
  const readField = (name) => String(formData.get(name) || "").trim();

  let imageUrl = readField("imageUrl");
  try {
    const uploaded = await uploadOptionalFile(formData.get("file"), "campaigns");
    if (uploaded) {
      imageUrl = uploaded;
    }
  } catch (error) {
    return fail(400, error?.message || "Neuspešan upload slike.");
  }

  const parsed = createSchema.safeParse({
    title: readField("title"),
    subject: readField("subject"),
    previewText: readField("previewText") || undefined,
    heading: readField("heading"),
    body: readField("body"),
    imageUrl: imageUrl || undefined,
    ctaLabel: readField("ctaLabel") || undefined,
    ctaUrl: readField("ctaUrl") || undefined,
    audience: readField("audience") || "all",
  });

  if (!parsed.success) {
    return fail(400, "Invalid payload", parsed.error.flatten());
  }

  const db = getDb();
  const [record] = await db
    .insert(schema.emailCampaigns)
    .values({
      title: parsed.data.title,
      subject: parsed.data.subject,
      previewText: parsed.data.previewText || null,
      heading: parsed.data.heading,
      body: parsed.data.body,
      imageUrl: parsed.data.imageUrl || null,
      ctaLabel: parsed.data.ctaLabel || null,
      ctaUrl: parsed.data.ctaUrl || null,
      audience: parsed.data.audience,
      createdByUserId: auth.user.id,
    })
    .returning();

  return created({ ok: true, data: record });
}
