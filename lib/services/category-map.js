export const SERVICE_CATEGORY_SPECS = [
  {
    slug: "hijaluronski-fileri",
    name: "Hijaluronski fileri",
    shortDescription: "Konture, volumen i korekcije filer tretmanima.",
  },
  {
    slug: "botox",
    name: "Botox",
    shortDescription: "Precizni botox tretmani za prirodan, osvezen izgled.",
  },
  {
    slug: "skinbusteri",
    name: "Skinbusteri",
    shortDescription: "Hydro i biostimulativni skinbuster protokoli.",
  },
  {
    slug: "kolagen-stimulatori",
    name: "Kolagen stimulatori",
    shortDescription: "Dubinska stimulacija kolagena za cvrstinu i tonus.",
  },
  {
    slug: "polinukleotidi-i-egzozomi",
    name: "Polinukleotidi i Egzozomi",
    shortDescription: "Regenerativni tretmani za kvalitet i oporavak koze.",
  },
  {
    slug: "lipoliza",
    name: "Lipoliza",
    shortDescription: "Targetirana lipoliza za lokalne masne naslage.",
  },
  {
    slug: "hemijski-piling",
    name: "Hemijski piling",
    shortDescription: "Kontrolisana eksfolijacija i osvezavanje teksture koze.",
  },
  {
    slug: "prp",
    name: "PRP",
    shortDescription: "Autologni PRP protokoli za regeneraciju tkiva.",
  },
  {
    slug: "mezoterapija",
    name: "Mezoterapija",
    shortDescription: "Mezoterapijski tretmani za lice i podocnjake.",
  },
];

const SPEC_BY_SLUG = new Map(
  SERVICE_CATEGORY_SPECS.map((spec) => [spec.slug, spec])
);

const SLUG_BY_NAME = new Map(
  SERVICE_CATEGORY_SPECS.map((spec) => [spec.name.toLowerCase(), spec.slug])
);

export function getCategorySpecBySlug(slug = "") {
  return SPEC_BY_SLUG.get(String(slug).toLowerCase()) || null;
}

export function getCategorySlugByName(name = "") {
  return SLUG_BY_NAME.get(String(name).toLowerCase()) || null;
}
