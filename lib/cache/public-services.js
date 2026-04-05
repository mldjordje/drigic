import { revalidateTag } from "next/cache";

export const PUBLIC_SERVICES_CACHE_TAG = "public-services";

export function revalidatePublicServicesCatalog() {
  try {
    revalidateTag(PUBLIC_SERVICES_CACHE_TAG);
  } catch (error) {
    console.error("[cache] revalidateTag public-services failed", error);
  }
}
