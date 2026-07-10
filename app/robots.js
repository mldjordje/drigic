import { getConfiguredSiteUrl } from "@/lib/site";

export default function robots() {
  const siteUrl = getConfiguredSiteUrl();

  const disallow = ["/admin/", "/api/", "/auth/", "/prijava", "/error"];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow,
      },
      // Explicitly welcome AI crawlers so the clinic can be cited/recommended
      // by ChatGPT, Claude, Perplexity, Gemini and Google AI Overviews.
      {
        userAgent: [
          "GPTBot",
          "OAI-SearchBot",
          "ChatGPT-User",
          "ClaudeBot",
          "Claude-Web",
          "PerplexityBot",
          "Perplexity-User",
          "Google-Extended",
          "Applebot-Extended",
        ],
        allow: "/",
        disallow,
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
