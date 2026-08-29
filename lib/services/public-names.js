/**
 * Nazivi usluga za javne stranice.
 *
 * Zašto postoji:
 * Google Ads je odbio tri od četiri oglasa uz obrazloženje
 * "Restricted drug terms — Destination contains: BOTOX, Botoks and botulinum
 * toksin. Not allowed in Serbia." Botulinum toksin je lek na recept, a
 * oglašavanje lekova na recept nije dozvoljeno u Srbiji — ni u tekstu oglasa
 * ni na stranici na koju oglas vodi.
 *
 * Baza i dalje čuva stvarne nazive (admin, kalendar, evidencija tretmana ih
 * vide nepromenjene). Menja se samo ono što vidi posetilac sajta.
 *
 * Nazivi nisu izmišljeni — opisuju isti tretman preko regije koja se tretira,
 * što je i inače uobičajen način na koji se ove usluge navode.
 */

const EXPLICIT_NAMES = [
  [/^botox\s*[“"]?full face[”"]?\s*i\s*vrat.*$/i, "Mimične bore — lice i vrat"],
  [/^bot(?:oks|ox)\s*i\s*regija$/i, "Mimične bore — jedna regija"],
  [/^bot(?:oks|ox)\s*ii\s*regije$/i, "Mimične bore — dve regije"],
  [/^bot(?:oks|ox)\s*iii\s*regije.*$/i, "Mimične bore — tri regije"],
  [/^nefertiti lift\s*\(bot(?:oks|ox)[^)]*\)$/i, "Nefertiti lift (vrat)"],
];

/** Rezervna zamena za sve ostale pojavnosti naziva leka u slobodnom tekstu. */
const TERM_REPLACEMENTS = [
  [/botulinum\s*toksin[a-zšđčćž]*/gi, "tretman mimičnih bora"],
  [/bot(?:oks|ox)(?:om|a|u|em)?/gi, "tretman mimičnih bora"],
];

/** Naziv kategorije "Botox" na javnim stranicama. */
export const PUBLIC_CATEGORY_NAMES = {
  Botox: "Mimične bore",
  Botoks: "Mimične bore",
};

/**
 * Naziv jedne usluge, onako kako sme da stoji na javnoj stranici.
 * Nepoznati nazivi prolaze kroz opštu zamenu, pa nova usluga u cenovniku ne
 * može slučajno da vrati naziv leka na sajt.
 */
export function publicServiceName(name) {
  const value = String(name || "").trim();
  if (!value) return value;

  for (const [pattern, replacement] of EXPLICIT_NAMES) {
    if (pattern.test(value)) return replacement;
  }

  return publicText(value);
}

/** Ista zamena za slobodan tekst (opisi, alt atributi, sažeci slučajeva). */
export function publicText(text) {
  let value = String(text || "");
  for (const [pattern, replacement] of TERM_REPLACEMENTS) {
    value = value.replace(pattern, replacement);
  }
  return value;
}

export function publicCategoryName(name) {
  const value = String(name || "").trim();
  return PUBLIC_CATEGORY_NAMES[value] || publicText(value);
}

/** Da li tekst još uvek sadrži naziv leka — koristi se u testu. */
export function containsRestrictedDrugTerm(text) {
  return /bot(?:oks|ox)|botulinum/i.test(String(text || ""));
}
