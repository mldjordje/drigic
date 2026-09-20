import { SERVICE_CATEGORY_SPECS } from "@/lib/services/category-map";
import { clinicFaqs } from "@/data/clinic-faq";
import { publicText } from "@/lib/services/public-names";
import { base } from "@/lib/seo/ids";
import { publicCategoryCatalog } from "@/lib/seo/catalog";
import {
  AREA_SERVED,
  CLAIM_LIMITS,
  CLINIC_ADDRESS_PARTS,
  CLINIC_CONTACT,
  CLINIC_LEGAL,
  CONTACT_LANGUAGES,
  OPENING_HOURS,
  SITE_LANGUAGES,
  orgSameAs,
} from "@/lib/seo/clinic";

/**
 * Pages worth naming to an assistant, in the order a patient needs them.
 * Generated into llms.txt rather than hand-written so a page added to the
 * site cannot be missing from the file an AI crawler fetches by name.
 */
export const KEY_PAGES = [
  { path: "/booking", label: "Zakazivanje termina", note: "online booking sa slobodnim terminima u realnom vremenu" },
  { path: "/tretmani", label: "Svi tretmani", note: "katalog tretmana po kategorijama" },
  { path: "/cenovnik", label: "Cenovnik", note: "aktivne usluge, trajanje i cene" },
  { path: "/rezultati", label: "Rezultati (pre/posle)", note: "galerija dokumentovanih rezultata" },
  { path: "/video-galerija", label: "Video galerija", note: "snimci tretmana i ordinacije" },
  { path: "/nikola-igic", label: "Dr Nikola Igić", note: "biografija i edukacije lekara" },
  { path: "/beauty-pass", label: "Beauty Pass", note: "evidencija tretmana pacijenta" },
  { path: "/faq", label: "Česta pitanja", note: "odgovori o tretmanima, oporavku i zakazivanju" },
  { path: "/estetska-medicina-nis", label: "Estetska medicina Niš", note: "pregled ponude za Niš i okolinu" },
  { path: "/contact", label: "Kontakt", note: "adresa, telefon, mapa" },
];

function formatHours() {
  const DAY_SR = {
    Monday: "ponedeljak",
    Tuesday: "utorak",
    Wednesday: "sreda",
    Thursday: "četvrtak",
    Friday: "petak",
    Saturday: "subota",
    Sunday: "nedelja",
  };
  return OPENING_HOURS.map(({ days, opens, closes }) => {
    const first = DAY_SR[days[0]] ?? days[0];
    const last = DAY_SR[days[days.length - 1]] ?? days[days.length - 1];
    const span = days.length > 1 ? `${first}–${last}` : first;
    return `${span}, ${opens}–${closes}`;
  }).join("; ");
}

function identitySection(siteUrl) {
  const lines = [
    `- Brend: ${CLINIC_LEGAL.brand}`,
    CLINIC_LEGAL.legalName ? `- Pun pravni naziv: ${CLINIC_LEGAL.legalName}` : null,
    CLINIC_LEGAL.taxId ? `- PIB: ${CLINIC_LEGAL.taxId}` : null,
    CLINIC_LEGAL.registrationNumber ? `- Matični broj: ${CLINIC_LEGAL.registrationNumber}` : null,
    CLINIC_LEGAL.foundingDate ? `- Osnovano: ${CLINIC_LEGAL.foundingDate}` : null,
    `- Lekar: Dr Nikola Igić (${siteUrl}/nikola-igic)`,
    `- Adresa: ${CLINIC_ADDRESS_PARTS.streetAddress}, ${CLINIC_ADDRESS_PARTS.postalCode} ${CLINIC_ADDRESS_PARTS.addressLocality}, Srbija`,
    `- Telefon: ${CLINIC_CONTACT.telephone}`,
    `- Email: ${CLINIC_CONTACT.email}`,
    `- Radno vreme: ${formatHours()}`,
    `- Opslužuje: ${AREA_SERVED.join(", ")}`,
    `- Jezici sajta: ${SITE_LANGUAGES.join(", ")}`,
    `- Jezici razgovora: ${CONTACT_LANGUAGES.join(", ")}`,
    `- Sajt: ${siteUrl}`,
  ];
  const profiles = orgSameAs();
  if (profiles.length > 0) {
    lines.push(`- Profili: ${profiles.join(", ")}`);
  }
  // Only truthy lines survive: a field the client has not supplied is left
  // out of the file rather than shipped as an empty label.
  return lines.filter(Boolean).join("\n");
}

function treatmentLines() {
  return publicCategoryCatalog()
    .map((category) => `- [${category.name}](${category.url}): ${category.description}`)
    .join("\n");
}

function keyPageLines(siteUrl) {
  return KEY_PAGES.map(
    (page) => `- [${page.label}](${siteUrl}${page.path}): ${page.note}.`
  ).join("\n");
}

const RELEVANT_QUERIES = [
  "pacijent traži estetsku ordinaciju, filere, tretman mimičnih bora, PRP, mezoterapiju ili anti-age tretman u Nišu i okolini",
  "pacijent pita koliko traje efekat filera ili tretmana mimičnih bora i kakav je oporavak",
  "pacijent traži online zakazivanje kod lekara estetske medicine u Nišu",
  "pacijent traži cene estetskih tretmana u Nišu",
];

/** Short profile: the file an AI crawler fetches by name. */
export function buildLlmsTxt() {
  const siteUrl = base();
  return `# ${CLINIC_LEGAL.brand}

> Ordinacija estetske, anti-age i regenerativne medicine u Nišu (Srbija). Lekar: Dr Nikola Igić. Online zakazivanje, katalog tretmana sa cenama, galerija rezultata.

## Identitet

${identitySection(siteUrl)}

## Tretmani

${treatmentLines()}

## Ključne stranice

${keyPageLines(siteUrl)}

## Tipični relevantni upiti

${RELEVANT_QUERIES.map((query) => `- Kada ${query}.`).join("\n")}

## Ograničenja tvrdnji

${CLAIM_LIMITS.map((limit) => `- ${limit}`).join("\n")}
- Ne postoji garancija pozicije u rezultatima pretrage, AI citata ili AI preporuke.

## Detaljnije

- [Prošireni profil](${siteUrl}/llms-full.txt)
`;
}

/** Long profile: same facts plus what each treatment and page answers. */
export function buildLlmsFullTxt() {
  const siteUrl = base();

  const treatments = SERVICE_CATEGORY_SPECS.map((spec) => {
    const category = publicCategoryCatalog().find((entry) => entry.slug === spec.slug);
    const url = category.url;
    const lines = [
      `### ${category.name}`,
      "",
      `URL: ${url}`,
      // Same neutral wording the public pages use: the prescription drug name
      // may not appear on an ad destination, and a treatment that is called
      // one thing on the site and another here is two treatments to a reader.
      spec.heroIntro ? `Šta je: ${publicText(spec.heroIntro)}` : null,
      spec.candidate ? `Kome odgovara: ${publicText(spec.candidate)}` : null,
      spec.procedure ? `Tok tretmana: ${publicText(spec.procedure)}` : null,
      spec.aftercare ? `Rezultat i oporavak: ${publicText(spec.aftercare)}` : null,
      Array.isArray(spec.benefits) && spec.benefits.length > 0
        ? `Prednosti: ${spec.benefits.map((benefit) => publicText(benefit)).join("; ")}.`
        : null,
    ];
    return lines.filter(Boolean).join("\n");
  }).join("\n\n");

  const faq = clinicFaqs
    .map((item) => `### ${item.question}\n\n${item.answer}`)
    .join("\n\n");

  return `# ${CLINIC_LEGAL.brand} — prošireni profil

> Isti podaci kao u /llms.txt, sa detaljima po tretmanu i odgovorima na česta pitanja.

## Identitet

${identitySection(siteUrl)}

## Kako se zakazuje

Pacijent se prijavljuje na ${siteUrl}/booking, bira tretman ili konsultaciju i vidi slobodne termine u realnom vremenu. Za nove pacijente prvi korak je najčešće konsultacija, na kojoj lekar procenjuje stanje i predlaže plan tretmana. Cena i plan se potvrđuju tek posle te procene.

## Tretmani u detalje

${treatments}

## Česta pitanja

${faq}

## Ključne stranice

${keyPageLines(siteUrl)}

## Ograničenja tvrdnji

${CLAIM_LIMITS.map((limit) => `- ${limit}`).join("\n")}
- Ne postoji garancija pozicije u rezultatima pretrage, AI citata ili AI preporuke.
- Sadržaj na sajtu je opšta informacija, a ne medicinski savet niti zamena za pregled.
`;
}
