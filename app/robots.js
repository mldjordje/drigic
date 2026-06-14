import { getConfiguredSiteUrl } from "@/lib/site";

export default function robots() {
  const siteUrl = getConfiguredSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/auth/", "/prijava", "/error"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
