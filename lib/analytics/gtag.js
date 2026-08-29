"use client";

/**
 * Google tag (gtag.js) helpers for Google Ads conversion tracking.
 *
 * Two ids are involved and they do different jobs:
 *   - GA4 measurement id (G-XXXXXXX)  -> analytics, optional
 *   - Google Ads conversion id (AW-XXXXXXXXX) -> what Ads optimizes on
 *
 * Every export is a no-op when the ids are missing, when gtag has not loaded,
 * or on the server. Tracking must never block or break the booking flow.
 */

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";
export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || "";

/** Conversion labels come from Ads: "AW-123456789/AbC-D_efGh". Store only the label part. */
const CONVERSION_LABELS = {
  booking_submitted: process.env.NEXT_PUBLIC_GOOGLE_ADS_BOOKING_LABEL || "",
};

export function hasGoogleTag() {
  return Boolean(GA_MEASUREMENT_ID || GOOGLE_ADS_ID);
}

function getGtag() {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return null;
  }
  return window.gtag;
}

/**
 * Sends a named event to every configured tag (GA4 + Ads).
 * Use for funnel steps that are NOT conversions.
 */
export function trackEvent(name, params = {}) {
  const gtag = getGtag();
  if (!gtag || !name) {
    return;
  }

  try {
    gtag("event", name, params);
  } catch {
    // Analytics must never block the user flow.
  }
}

/**
 * Sends a conversion to Google Ads.
 *
 * Fires twice on purpose when a label is configured: the named event feeds
 * GA4 (and Ads imports from GA4), while the `conversion` event with `send_to`
 * is the direct Ads hit that works even without a GA4 link. Ads deduplicates
 * per conversion action, so this does not double-count.
 */
export function trackConversion(name, { value, currency = "EUR", transactionId } = {}) {
  const gtag = getGtag();
  if (!gtag || !name) {
    return;
  }

  const payload = {};
  if (typeof value === "number") payload.value = value;
  if (currency) payload.currency = currency;
  if (transactionId) payload.transaction_id = transactionId;

  try {
    gtag("event", name, payload);

    const label = CONVERSION_LABELS[name];
    if (GOOGLE_ADS_ID && label) {
      gtag("event", "conversion", {
        ...payload,
        send_to: `${GOOGLE_ADS_ID}/${label}`,
      });
    }
  } catch {
    // Analytics must never block the user flow.
  }
}
