import { SERVICE_CATEGORY_SPECS } from "@/lib/services/category-map";
import { base, categoryPath, categoryUrl } from "@/lib/seo/ids";

/**
 * The public name of each treatment category — the one the landing page, the
 * offer catalog and llms.txt all print.
 *
 * The Botox category needs an override twice over: the ad destination may not
 * carry a prescription drug name, and the page at that URL already publishes
 * `#procedure` under the wording below. Two different names on one `@id` is
 * one treatment claiming to be two, so the name is written here once and read
 * from here everywhere.
 */
const PUBLIC_NAME_OVERRIDES = {
  botox: "Tretman mimičnih bora",
};

const PUBLIC_DESCRIPTION_OVERRIDES = {
  botox: "Ublažavanje mimičnih bora na čelu, između obrva i oko očiju, bez operacije.",
};

export function categoryPublicName(slug, fallback) {
  return PUBLIC_NAME_OVERRIDES[slug] ?? fallback;
}

export function categoryPublicDescription(slug, fallback) {
  return PUBLIC_DESCRIPTION_OVERRIDES[slug] ?? fallback;
}

/** One entry per category, already resolved to public name, path and ids. */
export function publicCategoryCatalog() {
  return SERVICE_CATEGORY_SPECS.map((category) => ({
    slug: category.slug,
    name: categoryPublicName(category.slug, category.name),
    description: categoryPublicDescription(category.slug, category.shortDescription),
    path: categoryPath(category.slug),
    url: categoryUrl(category.slug),
    procedureId: `${categoryUrl(category.slug)}#procedure`,
  }));
}

export const catalogIndexUrl = () => `${base()}/tretmani`;
