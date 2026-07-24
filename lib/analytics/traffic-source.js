const AI_SOURCE_PATTERNS = [
  ["ChatGPT", /(^|\.)chatgpt\.com$|(^|\.)openai\.com$/i],
  ["Perplexity", /(^|\.)perplexity\.ai$/i],
  ["Claude", /(^|\.)claude\.ai$|(^|\.)anthropic\.com$/i],
  ["Gemini", /(^|\.)gemini\.google\.com$|(^|\.)bard\.google\.com$/i],
  ["Microsoft Copilot", /(^|\.)copilot\.microsoft\.com$|(^|\.)bing\.com\/chat$/i],
  ["You.com", /(^|\.)you\.com$/i],
];

const SEARCH_SOURCE_PATTERNS = [
  ["Google", /(^|\.)google\.[a-z.]+$/i],
  ["Bing", /(^|\.)bing\.com$/i],
  ["Yahoo", /(^|\.)yahoo\.[a-z.]+$/i],
  ["DuckDuckGo", /(^|\.)duckduckgo\.com$/i],
];

const SOCIAL_SOURCE_PATTERNS = [
  ["Instagram", /(^|\.)instagram\.com$/i],
  ["Facebook", /(^|\.)facebook\.com$/i],
  ["TikTok", /(^|\.)tiktok\.com$/i],
  ["LinkedIn", /(^|\.)linkedin\.com$/i],
  ["YouTube", /(^|\.)youtube\.com$|(^|\.)youtu\.be$/i],
];

function normalizeHostname(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^www\./, "");
}

function hostnameFromReferrer(referrer) {
  if (!referrer) {
    return "";
  }

  try {
    return normalizeHostname(new URL(referrer).hostname);
  } catch {
    return "";
  }
}

function findSource(value, patterns) {
  const normalized = normalizeHostname(value);
  return patterns.find(([, pattern]) => pattern.test(normalized))?.[0] || "";
}

function normalizeUtmValue(value) {
  return String(value || "").trim().slice(0, 255);
}

export function parseTrafficAttribution({ referrer = "", search = "" } = {}) {
  const params = new URLSearchParams(String(search || "").replace(/^\?/, ""));
  const utmSource = normalizeUtmValue(params.get("utm_source"));
  const utmMedium = normalizeUtmValue(params.get("utm_medium"));
  const utmCampaign = normalizeUtmValue(params.get("utm_campaign"));
  const referrerHost = hostnameFromReferrer(referrer);

  const aiSource =
    findSource(utmSource, AI_SOURCE_PATTERNS) ||
    findSource(referrerHost, AI_SOURCE_PATTERNS);
  if (aiSource) {
    return {
      referrerHost,
      trafficSource: aiSource,
      trafficChannel: "AI",
      utmSource,
      utmMedium,
      utmCampaign,
      isAiReferral: true,
    };
  }

  if (utmSource) {
    return {
      referrerHost,
      trafficSource: utmSource,
      trafficChannel: utmMedium || "Campaign",
      utmSource,
      utmMedium,
      utmCampaign,
      isAiReferral: false,
    };
  }

  const searchSource = findSource(referrerHost, SEARCH_SOURCE_PATTERNS);
  if (searchSource) {
    return {
      referrerHost,
      trafficSource: searchSource,
      trafficChannel: "Organic Search",
      utmSource,
      utmMedium,
      utmCampaign,
      isAiReferral: false,
    };
  }

  const socialSource = findSource(referrerHost, SOCIAL_SOURCE_PATTERNS);
  if (socialSource) {
    return {
      referrerHost,
      trafficSource: socialSource,
      trafficChannel: "Social",
      utmSource,
      utmMedium,
      utmCampaign,
      isAiReferral: false,
    };
  }

  if (referrerHost) {
    return {
      referrerHost,
      trafficSource: referrerHost,
      trafficChannel: "Referral",
      utmSource,
      utmMedium,
      utmCampaign,
      isAiReferral: false,
    };
  }

  return {
    referrerHost: "",
    trafficSource: "Direct / Unknown",
    trafficChannel: "Direct",
    utmSource,
    utmMedium,
    utmCampaign,
    isAiReferral: false,
  };
}

export function isAiTrafficSource(value) {
  return Boolean(findSource(value, AI_SOURCE_PATTERNS));
}
