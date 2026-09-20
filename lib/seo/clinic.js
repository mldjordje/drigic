import { CLINIC_ADDRESS, CLINIC_EMAIL } from "@/lib/clinicContact";

/**
 * Verified facts about the clinic, written down once. Everything that ends up
 * in JSON-LD, llms.txt or ai.txt reads from here, so a change to a phone
 * number or an opening hour cannot leave one surface stale while another is
 * updated.
 *
 * Nothing goes in this file that cannot be checked from a public page or a
 * public profile — an unverifiable claim in markup is worse than no claim.
 */

/**
 * E.164, which is the only phone format an answer engine can dial or match
 * against a Google Business Profile. The local form ("062 238 888") stays in
 * `lib/clinicContact.js` for display.
 */
export const CLINIC_PHONE_E164 = "+38162238888";

export const CLINIC_LEGAL = {
  brand: "Dr Igić Clinic",
  alternateName: ["Klinika Dr Igić", "Dr Igic Clinic", "Ordinacija Dr Igić"],
  /**
   * Legal name, tax id (PIB) and registration number (matični broj) are left
   * empty until the client supplies them from the APR record. An invented or
   * guessed identifier is a cross-check that fails, not a missing field.
   */
  legalName: "",
  taxId: "",
  registrationNumber: "",
  foundingDate: "2022",
};

export const CLINIC_ADDRESS_PARTS = {
  streetAddress: CLINIC_ADDRESS,
  addressLocality: "Niš",
  addressRegion: "Nišavski okrug",
  postalCode: "18000",
  addressCountry: "RS",
};

export const CLINIC_GEO = { latitude: 43.3209, longitude: 21.8954 };

export const CLINIC_CONTACT = {
  email: CLINIC_EMAIL,
  telephone: CLINIC_PHONE_E164,
};

/**
 * Structured hours instead of the legacy `openingHours` string: the string
 * form is a single opaque value, while the specification is what local search
 * surfaces actually read to answer "are they open now".
 */
export const OPENING_HOURS = [
  {
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    opens: "16:00",
    closes: "21:00",
  },
];

export function openingHoursSpecification() {
  return OPENING_HOURS.map(({ days, opens, closes }) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: days.map((day) => `https://schema.org/${day}`),
    opens,
    closes,
  }));
}

/** Languages the clinic converses in — distinct from the site's translations. */
export const CONTACT_LANGUAGES = ["sr", "en"];
export const SITE_LANGUAGES = ["sr", "en", "de", "it"];

/**
 * Cities the clinic already stated it serves on its Niš landing page. Nothing
 * is added here on a hunch — a city in `areaServed` that the clinic does not
 * actually draw patients from is a claim, and an unverifiable one.
 */
export const AREA_SERVED = ["Niš", "Niška Banja", "Aleksinac"];

/**
 * Profiles that independently confirm the clinic exists. Hardcoded rather
 * than env-only: an env var nobody sets in production is the same as having
 * no profile at all. If this list is ever empty, `sameAs` is omitted entirely
 * instead of shipping an empty array.
 */
const VERIFIED_PROFILES = [
  "https://www.instagram.com/drigic.clinic/",
  "https://maps.google.com/?cid=16708722205926497279",
  "https://g.page/r/CQxFm_yQyYsVEAE",
];

export function orgSameAs() {
  const extra = String(process.env.NEXT_PUBLIC_ORG_SAME_AS ?? "")
    .split(/[\s,]+/)
    .map((value) => value.trim())
    .filter((value) => value.startsWith("http"));
  return Array.from(new Set([...VERIFIED_PROFILES, ...extra]));
}

/**
 * What the clinic explicitly does NOT do. Published so an assistant can rule
 * the clinic out instead of recommending it wrongly — a wrong referral costs
 * more than a missed one.
 */
export const CLAIM_LIMITS = [
  "Ordinacija ne izvodi hirurške zahvate niti operacije u opštoj anesteziji.",
  "Ne postoji garancija rezultata tretmana — efekat zavisi od anatomije, metabolizma i broja tretmana.",
  "Cena i plan tretmana se potvrđuju tek na konsultaciji, posle procene lekara.",
  "Ne tvrde se partnerstva, sertifikati niti rezultati koji nisu dokumentovani na javnim stranicama sajta.",
];
