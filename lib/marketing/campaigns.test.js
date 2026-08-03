import { describe, expect, it } from "vitest";
import { buildEmailContent } from "@/lib/auth/email";
import {
  CAMPAIGN_AUDIENCES,
  buildCampaignCtaUrl,
  buildCampaignEmailContent,
  buildUnsubscribeApiUrl,
  buildUnsubscribeHeaders,
  buildUnsubscribeUrl,
} from "@/lib/marketing/campaigns";

const campaign = {
  id: "11111111-1111-4111-8111-111111111111",
  subject: "Avgustovska ponuda",
  heading: "Nova ponuda",
  body: "Prvi pasus.\nDrugi pasus.",
  imageUrl: "https://blob.example/slika.jpg",
  ctaLabel: "Zakaži termin",
  ctaUrl: "",
};

describe("campaign links", () => {
  it("falls back to the booking page and tags it for attribution", () => {
    const url = new URL(buildCampaignCtaUrl(campaign));

    expect(url.pathname).toBe("/booking");
    expect(url.searchParams.get("utm_source")).toBe("email");
    expect(url.searchParams.get("utm_medium")).toBe("campaign");
    expect(url.searchParams.get("utm_campaign")).toBe(campaign.id);
  });

  it("keeps an explicit destination but still tags it", () => {
    const url = new URL(
      buildCampaignCtaUrl({ ...campaign, ctaUrl: "https://drigic.rs/service/botoks" })
    );

    expect(url.pathname).toBe("/service/botoks");
    expect(url.searchParams.get("utm_campaign")).toBe(campaign.id);
  });

  it("points one-click unsubscribe at the API route, not the confirmation page", () => {
    const token = "22222222-2222-4222-8222-222222222222";

    expect(buildUnsubscribeUrl(token)).toContain(`/odjava/${token}`);
    expect(buildUnsubscribeApiUrl(token)).toContain(`/api/unsubscribe/${token}`);
    expect(buildUnsubscribeHeaders(token)).toEqual({
      "List-Unsubscribe": `<${buildUnsubscribeApiUrl(token)}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    });
  });

  it("omits unsubscribe headers when there is no token", () => {
    expect(buildUnsubscribeHeaders(null)).toBeUndefined();
  });
});

describe("campaign email content", () => {
  const unsubscribeUrl = "https://drigic.rs/odjava/token-123";

  it("renders image, paragraphs, CTA and unsubscribe link", () => {
    const { html, text } = buildEmailContent(
      buildCampaignEmailContent(campaign, { unsubscribeUrl })
    );

    expect(html).toContain(campaign.imageUrl);
    expect(html).toContain("Prvi pasus.");
    expect(html).toContain("Drugi pasus.");
    expect(html).toContain("Zakaži termin");
    expect(html).toContain(unsubscribeUrl);
    expect(text).toContain(unsubscribeUrl);
  });

  it("defaults the CTA label when the admin left it empty", () => {
    const content = buildCampaignEmailContent({ ...campaign, ctaLabel: "  " });
    expect(content.ctaLabel).toBe("Zakaži termin");
  });

  it("escapes HTML so campaign copy cannot inject markup", () => {
    const { html } = buildEmailContent(
      buildCampaignEmailContent({ ...campaign, body: "<script>alert(1)</script>" })
    );

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("audience list", () => {
  it("exposes exactly the four supported segments", () => {
    expect(CAMPAIGN_AUDIENCES).toEqual([
      "all",
      "with_bookings",
      "without_bookings",
      "inactive_90d",
    ]);
  });
});
