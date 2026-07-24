import { describe, expect, it } from "vitest";
import { parseTrafficAttribution } from "./traffic-source";

describe("parseTrafficAttribution", () => {
  it("recognizes ChatGPT from the official UTM parameter", () => {
    expect(
      parseTrafficAttribution({
        search: "?utm_source=chatgpt.com&utm_medium=referral&utm_campaign=answer",
      })
    ).toMatchObject({
      trafficSource: "ChatGPT",
      trafficChannel: "AI",
      utmSource: "chatgpt.com",
      isAiReferral: true,
    });
  });

  it("recognizes AI referrals from the referrer hostname", () => {
    expect(
      parseTrafficAttribution({
        referrer: "https://www.perplexity.ai/search/example",
      })
    ).toMatchObject({
      referrerHost: "perplexity.ai",
      trafficSource: "Perplexity",
      trafficChannel: "AI",
      isAiReferral: true,
    });
  });

  it("classifies organic search and social referrals", () => {
    expect(
      parseTrafficAttribution({ referrer: "https://www.google.com/search?q=dr+igic" })
    ).toMatchObject({
      trafficSource: "Google",
      trafficChannel: "Organic Search",
    });

    expect(
      parseTrafficAttribution({ referrer: "https://l.instagram.com/" })
    ).toMatchObject({
      trafficSource: "Instagram",
      trafficChannel: "Social",
    });
  });

  it("keeps direct traffic explicit when no attribution is available", () => {
    expect(parseTrafficAttribution()).toMatchObject({
      trafficSource: "Direct / Unknown",
      trafficChannel: "Direct",
      isAiReferral: false,
    });
  });
});
