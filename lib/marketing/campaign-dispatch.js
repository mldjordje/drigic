import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { buildEmailContent, sendEmailBatch } from "@/lib/auth/email";
import { getDb, schema } from "@/lib/db/client";
import { env } from "@/lib/env";
import {
  buildCampaignEmailContent,
  buildUnsubscribeHeaders,
  buildUnsubscribeUrl,
} from "@/lib/marketing/campaigns";

/** Resend rejects batches larger than this. */
export const RESEND_BATCH_MAX = 100;

export function resolveDailyLimit() {
  return Number(env.RESEND_DAILY_LIMIT || 100);
}

export async function countSentLast24h(db) {
  const [row] = await db
    .select({ total: sql`count(*)::int` })
    .from(schema.emailCampaignRecipients)
    .where(
      and(
        eq(schema.emailCampaignRecipients.status, "sent"),
        sql`${schema.emailCampaignRecipients.sentAt} >= now() - interval '24 hours'`
      )
    );

  return Number(row?.total || 0);
}

export async function getRemainingDailyQuota(db) {
  const used = await countSentLast24h(db);
  return Math.max(0, resolveDailyLimit() - used);
}

function buildBatchMessages(campaign, recipients) {
  return recipients.map((recipient) => {
    const unsubscribeUrl = buildUnsubscribeUrl(recipient.unsubscribeToken);
    const { text, html } = buildEmailContent(
      buildCampaignEmailContent(campaign, { unsubscribeUrl })
    );

    return {
      to: recipient.email,
      subject: campaign.subject,
      text,
      html,
      headers: buildUnsubscribeHeaders(recipient.unsubscribeToken),
    };
  });
}

async function loadPendingRecipients(db, campaignId, limit) {
  return db
    .select({
      id: schema.emailCampaignRecipients.id,
      email: schema.emailCampaignRecipients.email,
      unsubscribeToken: schema.users.unsubscribeToken,
      marketingConsent: schema.users.marketingConsent,
    })
    .from(schema.emailCampaignRecipients)
    .leftJoin(schema.users, eq(schema.users.id, schema.emailCampaignRecipients.userId))
    .where(
      and(
        eq(schema.emailCampaignRecipients.campaignId, campaignId),
        eq(schema.emailCampaignRecipients.status, "pending")
      )
    )
    .orderBy(asc(schema.emailCampaignRecipients.createdAt))
    .limit(limit);
}

async function countPending(db, campaignId) {
  const [row] = await db
    .select({ total: sql`count(*)::int` })
    .from(schema.emailCampaignRecipients)
    .where(
      and(
        eq(schema.emailCampaignRecipients.campaignId, campaignId),
        eq(schema.emailCampaignRecipients.status, "pending")
      )
    );

  return Number(row?.total || 0);
}

async function refreshCampaignCounters(db, campaignId) {
  const [row] = await db
    .select({
      sent: sql`count(*) filter (where ${schema.emailCampaignRecipients.status} = 'sent')::int`,
      failed: sql`count(*) filter (where ${schema.emailCampaignRecipients.status} = 'failed')::int`,
      pending: sql`count(*) filter (where ${schema.emailCampaignRecipients.status} = 'pending')::int`,
    })
    .from(schema.emailCampaignRecipients)
    .where(eq(schema.emailCampaignRecipients.campaignId, campaignId));

  const sent = Number(row?.sent || 0);
  const failed = Number(row?.failed || 0);
  const pending = Number(row?.pending || 0);
  const finished = pending === 0;

  await db
    .update(schema.emailCampaigns)
    .set({
      sentCount: sent,
      failedCount: failed,
      updatedAt: new Date(),
      ...(finished ? { status: "sent", sentAt: new Date() } : {}),
    })
    .where(eq(schema.emailCampaigns.id, campaignId));

  return { sent, failed, pending, finished };
}

/**
 * Sends one slice of every campaign that is still in `sending`, never exceeding
 * the provider's rolling 24h quota. On the free Resend plan (100/day) a 370
 * person list therefore drains over four daily cron runs.
 */
export async function runCampaignDispatch({ maxBatch = RESEND_BATCH_MAX } = {}) {
  const db = getDb();
  const result = {
    dailyLimit: resolveDailyLimit(),
    quotaRemaining: await getRemainingDailyQuota(db),
    processedCampaigns: 0,
    sent: 0,
    failed: 0,
    skippedOptOut: 0,
    errors: [],
  };

  if (result.quotaRemaining <= 0) {
    return result;
  }

  const campaigns = await db
    .select()
    .from(schema.emailCampaigns)
    .where(eq(schema.emailCampaigns.status, "sending"))
    .orderBy(asc(schema.emailCampaigns.queuedAt));

  for (const campaign of campaigns) {
    if (result.quotaRemaining <= 0) {
      break;
    }

    const sliceSize = Math.min(result.quotaRemaining, maxBatch);
    const recipients = await loadPendingRecipients(db, campaign.id, sliceSize);

    if (!recipients.length) {
      await refreshCampaignCounters(db, campaign.id);
      continue;
    }

    result.processedCampaigns += 1;

    // Someone may have unsubscribed after the campaign was queued.
    const optedOut = recipients.filter((item) => item.marketingConsent === false);
    const deliverable = recipients.filter((item) => item.marketingConsent !== false);

    if (optedOut.length) {
      await db
        .update(schema.emailCampaignRecipients)
        .set({
          status: "failed",
          lastError: "Klijent se odjavio sa liste pre slanja.",
          updatedAt: new Date(),
        })
        .where(
          inArray(
            schema.emailCampaignRecipients.id,
            optedOut.map((item) => item.id)
          )
        );
      result.skippedOptOut += optedOut.length;
      result.failed += optedOut.length;
    }

    if (!deliverable.length) {
      await refreshCampaignCounters(db, campaign.id);
      continue;
    }

    let batchResult;
    try {
      batchResult = await sendEmailBatch(buildBatchMessages(campaign, deliverable));
    } catch (error) {
      batchResult = { sent: false, reason: error?.message || "Batch send threw" };
    }

    if (!batchResult.sent) {
      // Leave recipients pending so the next run retries them.
      result.errors.push({ campaignId: campaign.id, reason: batchResult.reason });
      await db
        .update(schema.emailCampaigns)
        .set({ lastError: batchResult.reason, updatedAt: new Date() })
        .where(eq(schema.emailCampaigns.id, campaign.id));
      continue;
    }

    // One statement instead of one per recipient: the Hobby plan caps function
    // runtime at 60s and a 100-row slice would otherwise be 100 round trips.
    const sentAt = new Date();
    const providerIdCases = sql.join(
      deliverable.map(
        (recipient, index) =>
          sql`when ${schema.emailCampaignRecipients.id} = ${recipient.id} then ${
            batchResult.ids[index] || null
          }::varchar`
      ),
      sql` `
    );

    await db
      .update(schema.emailCampaignRecipients)
      .set({
        status: "sent",
        providerMessageId: sql`case ${providerIdCases} else null::varchar end`,
        sentAt,
        lastError: null,
        updatedAt: sentAt,
      })
      .where(
        inArray(
          schema.emailCampaignRecipients.id,
          deliverable.map((recipient) => recipient.id)
        )
      );

    result.sent += deliverable.length;
    result.quotaRemaining -= deliverable.length;

    await refreshCampaignCounters(db, campaign.id);
  }

  result.pendingAfterRun = await Promise.all(
    campaigns.map(async (campaign) => ({
      campaignId: campaign.id,
      pending: await countPending(db, campaign.id),
    }))
  );

  return result;
}
