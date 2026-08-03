import { and, eq, ilike, not, sql } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import { env } from "@/lib/env";

export const CAMPAIGN_AUDIENCES = [
  "all",
  "with_bookings",
  "without_bookings",
  "inactive_90d",
];

export const CAMPAIGN_AUDIENCE_LABELS = {
  all: "Svi klijenti sa važećim mejlom",
  with_bookings: "Klijenti koji su bar jednom zakazali",
  without_bookings: "Registrovani bez ijedne rezervacije",
  inactive_90d: "Klijenti bez termina u poslednjih 90 dana",
};

const PLACEHOLDER_DOMAINS = ["%@drigic.local", "%@example.com"];

export const DEFAULT_CTA_LABEL = "Zakaži termin";

export function resolveAppUrl() {
  const url = String(env.NEXT_PUBLIC_APP_URL || env.APP_URL || "").trim();
  return url.replace(/\/+$/, "") || "https://drigic.rs";
}

export function buildUnsubscribeUrl(token) {
  return `${resolveAppUrl()}/odjava/${token}`;
}

/**
 * One-click (RFC 8058) target. Must accept POST, so it points at the API route
 * rather than the confirmation page.
 */
export function buildUnsubscribeApiUrl(token) {
  return `${resolveAppUrl()}/api/unsubscribe/${token}`;
}

export function buildCampaignCtaUrl(campaign) {
  const explicit = String(campaign?.ctaUrl || "").trim();
  const base = explicit || `${resolveAppUrl()}/booking`;

  try {
    const url = new URL(base, resolveAppUrl());
    url.searchParams.set("utm_source", "email");
    url.searchParams.set("utm_medium", "campaign");
    if (campaign?.id) {
      url.searchParams.set("utm_campaign", String(campaign.id));
    }
    return url.toString();
  } catch {
    return base;
  }
}

/**
 * Reachable = real client mailbox that has not opted out.
 * Placeholder addresses generated for walk-in clients entered by the admin
 * (`@drigic.local`) can never receive anything, so they are always excluded.
 */
export function buildReachableCondition() {
  return and(
    eq(schema.users.role, "client"),
    eq(schema.users.marketingConsent, true),
    ...PLACEHOLDER_DOMAINS.map((pattern) => not(ilike(schema.users.email, pattern)))
  );
}

export function buildAudienceCondition(audience) {
  const reachable = buildReachableCondition();

  if (audience === "with_bookings") {
    return and(
      reachable,
      sql`exists (select 1 from ${schema.bookings} b where b.user_id = ${schema.users.id})`
    );
  }

  if (audience === "without_bookings") {
    return and(
      reachable,
      sql`not exists (select 1 from ${schema.bookings} b where b.user_id = ${schema.users.id})`
    );
  }

  if (audience === "inactive_90d") {
    return and(
      reachable,
      sql`not exists (
        select 1 from ${schema.bookings} b
        where b.user_id = ${schema.users.id}
          and b.starts_at >= now() - interval '90 days'
      )`
    );
  }

  return reachable;
}

export async function selectAudienceRecipients(db, audience) {
  return db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      unsubscribeToken: schema.users.unsubscribeToken,
    })
    .from(schema.users)
    .where(buildAudienceCondition(audience));
}

export async function countAudience(db, audience) {
  const [row] = await db
    .select({ total: sql`count(*)::int` })
    .from(schema.users)
    .where(buildAudienceCondition(audience));

  return Number(row?.total || 0);
}

export async function getAudienceBreakdown(db) {
  const entries = await Promise.all(
    CAMPAIGN_AUDIENCES.map(async (audience) => [audience, await countAudience(db, audience)])
  );

  return Object.fromEntries(entries);
}

export function buildCampaignEmailContent(campaign, { unsubscribeUrl } = {}) {
  const ctaLabel = String(campaign?.ctaLabel || "").trim() || DEFAULT_CTA_LABEL;

  return {
    previewText: campaign?.previewText || campaign?.heading || campaign?.subject || "",
    heading: campaign?.heading || campaign?.subject || "",
    intro: campaign?.body || "",
    imageUrl: campaign?.imageUrl || undefined,
    ctaLabel,
    ctaUrl: buildCampaignCtaUrl(campaign),
    footerLines: [
      "Dr Igic Clinic - Niš",
      "Ovu poruku dobijate jer ste klijent naše klinike.",
    ],
    unsubscribeUrl,
  };
}

export function buildUnsubscribeHeaders(token) {
  if (!token) {
    return undefined;
  }

  return {
    "List-Unsubscribe": `<${buildUnsubscribeApiUrl(token)}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}
