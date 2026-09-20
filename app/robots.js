import { getConfiguredSiteUrl } from "@/lib/site";
import { CRAWLER_USER_AGENTS } from "@/lib/analytics/crawlers";

export default function robots() {
  const siteUrl = getConfiguredSiteUrl();

  // Patient-facing private areas. `/odjava/` carries a one-time token in the
  // path — that is a credential, so it never gets crawled and never enters
  // the sitemap.
  const disallow = ["/admin/", "/api/", "/auth/", "/prijava", "/moji-termini", "/odjava/"];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow,
      },
      // Explicitly welcome AI crawlers so the clinic can be cited by ChatGPT,
      // Claude, Perplexity, Gemini and Google AI Overviews. An allow rule only
      // permits crawling — it guarantees neither inclusion nor citation. The
      // list is shared with `lib/analytics/crawlers.js` so what is allowed and
      // what is measured cannot drift apart.
      {
        userAgent: CRAWLER_USER_AGENTS,
        allow: "/",
        disallow,
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
