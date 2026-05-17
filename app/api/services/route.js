import { publicOk } from "@/lib/api/http";
import { getCachedServicesCatalog } from "@/lib/catalog/services";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET() {
  const categories = await getCachedServicesCatalog();

  return publicOk(
    { ok: true, categories },
    { sMaxAge: revalidate, staleWhileRevalidate: 1800 }
  );
}
