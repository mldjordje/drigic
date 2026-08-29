import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The module reads env at import time, so each test sets env first and then
 * imports a fresh copy via vi.resetModules().
 */
async function loadGtag({ ga = "", ads = "", label = "" } = {}) {
  vi.resetModules();
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = ga;
  process.env.NEXT_PUBLIC_GOOGLE_ADS_ID = ads;
  process.env.NEXT_PUBLIC_GOOGLE_ADS_BOOKING_LABEL = label;
  return import("@/lib/analytics/gtag");
}

describe("gtag analytics", () => {
  beforeEach(() => {
    window.gtag = vi.fn();
  });

  afterEach(() => {
    delete window.gtag;
    delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    delete process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
    delete process.env.NEXT_PUBLIC_GOOGLE_ADS_BOOKING_LABEL;
  });

  it("reports no tag when no id is configured", async () => {
    const { hasGoogleTag } = await loadGtag();
    expect(hasGoogleTag()).toBe(false);
  });

  it("sends a plain event", async () => {
    const { trackEvent } = await loadGtag({ ga: "G-TEST" });
    trackEvent("booking_started");
    expect(window.gtag).toHaveBeenCalledWith("event", "booking_started", {});
  });

  it("sends the named event and the Ads conversion hit", async () => {
    const { trackConversion } = await loadGtag({
      ads: "AW-123456789",
      label: "AbC-D_efGh",
    });

    trackConversion("booking_submitted", { value: 40, currency: "EUR" });

    expect(window.gtag).toHaveBeenNthCalledWith(1, "event", "booking_submitted", {
      value: 40,
      currency: "EUR",
    });
    expect(window.gtag).toHaveBeenNthCalledWith(2, "event", "conversion", {
      value: 40,
      currency: "EUR",
      send_to: "AW-123456789/AbC-D_efGh",
    });
  });

  it("skips the Ads hit when the conversion label is missing", async () => {
    const { trackConversion } = await loadGtag({ ads: "AW-123456789" });
    trackConversion("booking_submitted", { value: 40 });
    expect(window.gtag).toHaveBeenCalledTimes(1);
  });

  it("never throws when gtag is absent", async () => {
    delete window.gtag;
    const { trackConversion, trackEvent } = await loadGtag({ ads: "AW-123456789" });
    expect(() => trackEvent("booking_started")).not.toThrow();
    expect(() => trackConversion("booking_submitted", { value: 40 })).not.toThrow();
  });
});
