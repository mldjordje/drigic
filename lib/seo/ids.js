import { getConfiguredSiteUrl } from "@/lib/site";

/**
 * Every JSON-LD node on the site is addressed from here. Without a single
 * address book each builder writes its own id string, and two of them
 * eventually put the same id on different types with different names — one
 * clinic claiming several identities, which is the opposite of what the
 * markup is for.
 */
export const base = () => getConfiguredSiteUrl();

export const orgId = () => `${base()}/#organization`;
export const websiteId = () => `${base()}/#website`;
export const physicianId = () => `${base()}/nikola-igic#physician`;
export const offerCatalogId = () => `${base()}/tretmani#offercatalog`;

export const ref = (id) => ({ "@id": id });
export const orgRef = () => ref(orgId());
export const websiteRef = () => ref(websiteId());
export const physicianRef = () => ref(physicianId());

/**
 * The Botox category is published under a plain-language URL because the ad
 * destination may not carry a prescription drug name. The exception lives
 * here so callers never re-derive it.
 */
export function categoryPath(slug) {
  return `/tretmani/${slug === "botox" ? "mimicne-bore" : slug}`;
}
export const categoryUrl = (slug) => `${base()}${categoryPath(slug)}`;
export const categoryProcedureId = (slug) => `${categoryUrl(slug)}#procedure`;

export const serviceUrl = (categorySlug, serviceSlug) =>
  `${categoryUrl(categorySlug)}/${serviceSlug}`;
export const serviceId = (categorySlug, serviceSlug) =>
  `${serviceUrl(categorySlug, serviceSlug)}#service`;

/** Per-page node ids. `url` is absolute and carries no fragment. */
export const webPageId = (url) => `${url}#webpage`;
export const breadcrumbId = (url) => `${url}#breadcrumb`;
export const faqId = (url) => `${url}#faq`;
export const itemListId = (url) => `${url}#itemlist`;
