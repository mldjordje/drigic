/**
 * One list of AI crawlers, shared by robots.txt and by anything that measures
 * them. Allowing a bot and counting it can never fall out of step if both
 * read the same array.
 *
 * `kind` matters more than it looks:
 *  - "index" fills an index — the page *can* be recommended later.
 *  - "live" only fires while a person is mid-conversation and the assistant
 *    opens the page, so it is the closest signal to "we came up in someone's
 *    answer". Conflating the two turns crawl budget into a success metric.
 *
 * Token spellings follow vendor documentation as of 2026-09; re-check before
 * adding new families.
 */
export const CRAWLERS = [
  { id: "gptbot", label: "GPTBot", token: "gptbot", engine: "OpenAI", kind: "index" },
  { id: "oai-searchbot", label: "OAI-SearchBot", token: "oai-searchbot", engine: "OpenAI", kind: "index" },
  { id: "chatgpt-user", label: "ChatGPT-User", token: "chatgpt-user", engine: "OpenAI", kind: "live" },
  { id: "claudebot", label: "ClaudeBot", token: "claudebot", engine: "Anthropic", kind: "index" },
  { id: "claude-searchbot", label: "Claude-SearchBot", token: "claude-searchbot", engine: "Anthropic", kind: "index" },
  { id: "anthropic-ai", label: "anthropic-ai", token: "anthropic-ai", engine: "Anthropic", kind: "index" },
  { id: "claude-user", label: "Claude-User", token: "claude-user", engine: "Anthropic", kind: "live" },
  { id: "perplexitybot", label: "PerplexityBot", token: "perplexitybot", engine: "Perplexity", kind: "index" },
  { id: "perplexity-user", label: "Perplexity-User", token: "perplexity-user", engine: "Perplexity", kind: "live" },
  { id: "google-extended", label: "Google-Extended", token: "google-extended", engine: "Google", kind: "index" },
  { id: "googleother", label: "GoogleOther", token: "googleother", engine: "Google", kind: "index" },
  { id: "applebot", label: "Applebot", token: "applebot", engine: "Apple", kind: "index" },
  { id: "applebot-extended", label: "Applebot-Extended", token: "applebot-extended", engine: "Apple", kind: "index" },
  { id: "amazonbot", label: "Amazonbot", token: "amazonbot", engine: "Amazon", kind: "index" },
  { id: "bingbot", label: "bingbot", token: "bingbot", engine: "Microsoft", kind: "index" },
  { id: "duckassistbot", label: "DuckAssistBot", token: "duckassistbot", engine: "DuckDuckGo", kind: "index" },
  { id: "meta-externalagent", label: "meta-externalagent", token: "meta-externalagent", engine: "Meta", kind: "index" },
  { id: "ccbot", label: "CCBot", token: "ccbot", engine: "Common Crawl", kind: "index" },
  { id: "cohere-ai", label: "cohere-ai", token: "cohere-ai", engine: "Cohere", kind: "index" },
  { id: "youbot", label: "YouBot", token: "youbot", engine: "You.com", kind: "index" },
  { id: "bytespider", label: "Bytespider", token: "bytespider", engine: "ByteDance", kind: "index" },
];

/** User-agent tokens in the spelling each vendor documents, for robots.txt. */
export const CRAWLER_USER_AGENTS = CRAWLERS.map((crawler) => crawler.label);

/**
 * Longest token first: "Applebot-Extended" contains "applebot", so matching in
 * declaration order files every Extended hit under the plain bot.
 */
const BY_TOKEN_LENGTH = [...CRAWLERS].sort((a, b) => b.token.length - a.token.length);

export function identifyCrawler(userAgent) {
  if (!userAgent) {
    return null;
  }
  const ua = String(userAgent).toLowerCase();
  return BY_TOKEN_LENGTH.find((crawler) => ua.includes(crawler.token)) ?? null;
}

/**
 * Hosts that send a referrer distinguishable from ordinary search. Google,
 * Bing and DuckDuckGo are deliberately absent: their AI summaries send the
 * same referrer as a plain result, and what cannot be separated does not go
 * into the number.
 */
export const AI_REFERRER_HOSTS = [
  "chatgpt.com",
  "chat.openai.com",
  "perplexity.ai",
  "claude.ai",
  "gemini.google.com",
  "copilot.microsoft.com",
  "you.com",
  "poe.com",
  "grok.com",
  "chat.mistral.ai",
];

export function isAiReferrer(referrer, utmSource) {
  const source = String(utmSource || "").toLowerCase();
  if (AI_REFERRER_HOSTS.some((host) => source === host || source.startsWith(host))) {
    return true;
  }
  try {
    const host = new URL(String(referrer)).hostname.replace(/^www\./, "");
    return AI_REFERRER_HOSTS.some((known) => host === known || host.endsWith(`.${known}`));
  } catch {
    return false;
  }
}
