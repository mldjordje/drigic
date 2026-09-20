import { buildLlmsFullTxt } from "@/lib/seo/llms";

export const dynamic = "force-dynamic";

export async function GET() {
  return new Response(buildLlmsFullTxt(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
    },
  });
}
