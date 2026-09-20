import { buildLlmsTxt } from "@/lib/seo/llms";

/**
 * Served from a route rather than /public: this is the file AI crawlers fetch
 * by name, and a static file on the CDN means never knowing whether any of
 * them did. The body is a few kilobytes and the crawl volume is tiny.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return new Response(buildLlmsTxt(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
    },
  });
}
