import { resolveLocale } from "@/lib/i18n";

const CATEGORY_COPY = {
  en: {
    "hijaluronski-fileri": {
      name: "Hyaluronic Fillers",
      shortDescription: "Natural correction of volume, wrinkles and facial contours.",
    },
    botox: {
      name: "Botox",
      shortDescription: "Softer expression lines with a fresh and natural look.",
    },
    skinbusteri: {
      name: "Skinboosters",
      shortDescription: "Deep hydration and visible improvement in skin quality.",
    },
    "kolagen-stimulatori": {
      name: "Collagen Stimulators",
      shortDescription: "Gradual rejuvenation through natural collagen support.",
    },
    "polinukleotidi-i-egzozomi": {
      name: "Polynucleotides and Exosomes",
      shortDescription: "Regenerative protocols for skin recovery and tissue quality.",
    },
    lipoliza: {
      name: "Lipolysis",
      shortDescription: "Targeted non-surgical treatment for localized fat deposits.",
    },
    "hemijski-piling": {
      name: "Chemical Peel",
      shortDescription: "Controlled skin renewal for a smoother and brighter complexion.",
    },
    dermapen: {
      name: "Dermapen",
      shortDescription: "Microneedling stimulation for texture, tone and glow.",
    },
    prp: {
      name: "PRP",
      shortDescription: "Autologous regenerative treatment for skin and hair support.",
    },
    mezoterapija: {
      name: "Mesotherapy",
      shortDescription: "Targeted revitalization for face, scalp and selected body areas.",
    },
  },
  de: {
    "hijaluronski-fileri": {
      name: "Hyaluron-Filler",
      shortDescription: "Natuerliche Korrektur von Volumen, Falten und Gesichtskonturen.",
    },
    botox: {
      name: "Botox",
      shortDescription: "Mimikfalten mildern und dabei natuerlich frisch wirken.",
    },
    skinbusteri: {
      name: "Skinbooster",
      shortDescription: "Tiefe Hydration und sichtbar bessere Hautqualitaet.",
    },
    "kolagen-stimulatori": {
      name: "Kollagen-Stimulatoren",
      shortDescription: "Schrittweise Verjuengung durch Anregung der Kollagenbildung.",
    },
    "polinukleotidi-i-egzozomi": {
      name: "Polynukleotide und Exosomen",
      shortDescription: "Regenerative Protokolle fuer Hauterneuerung und Gewebequalitaet.",
    },
    lipoliza: {
      name: "Lipolyse",
      shortDescription: "Gezielte Behandlung lokaler Fettdepots ohne Operation.",
    },
    "hemijski-piling": {
      name: "Chemisches Peeling",
      shortDescription: "Kontrollierte Hauterneuerung fuer einen frischeren Teint.",
    },
    dermapen: {
      name: "Dermapen",
      shortDescription: "Microneedling fuer bessere Struktur, Spannkraft und Ausstrahlung.",
    },
    prp: {
      name: "PRP",
      shortDescription: "Autologe regenerative Therapie zur Unterstuetzung von Haut und Haar.",
    },
    mezoterapija: {
      name: "Mesotherapie",
      shortDescription: "Gezielte Revitalisierung fuer Gesicht, Kopfhaut und Koerperzonen.",
    },
  },
  it: {
    "hijaluronski-fileri": {
      name: "Filler all'acido ialuronico",
      shortDescription: "Correzione naturale di volume, rughe e contorni del viso.",
    },
    botox: {
      name: "Botox",
      shortDescription: "Riduzione delle rughe d'espressione con un risultato fresco e naturale.",
    },
    skinbusteri: {
      name: "Skinbooster",
      shortDescription: "Idratazione profonda e miglioramento visibile della qualita della pelle.",
    },
    "kolagen-stimulatori": {
      name: "Stimolatori di collagene",
      shortDescription: "Ringiovanimento graduale attraverso la stimolazione del collagene.",
    },
    "polinukleotidi-i-egzozomi": {
      name: "Polinucleotidi ed esosomi",
      shortDescription: "Protocolli rigenerativi per recupero cutaneo e qualita dei tessuti.",
    },
    lipoliza: {
      name: "Lipolisi",
      shortDescription: "Trattamento mirato delle adiposita localizzate senza chirurgia.",
    },
    "hemijski-piling": {
      name: "Peeling chimico",
      shortDescription: "Rinnovo controllato della pelle per un incarnato piu luminoso.",
    },
    dermapen: {
      name: "Dermapen",
      shortDescription: "Stimolazione microneedling per texture, tono e luminosita.",
    },
    prp: {
      name: "PRP",
      shortDescription: "Trattamento rigenerativo autologo per pelle e capelli.",
    },
    mezoterapija: {
      name: "Mesoterapia",
      shortDescription: "Rivitalizzazione mirata per viso, cuoio capelluto e aree del corpo.",
    },
  },
};

export function getLocalizedCategoryCopy(locale, category) {
  const safeLocale = resolveLocale(locale);
  const slug = String(category?.slug || "").trim();
  const fallback = {
    name: String(category?.name || "").trim(),
    shortDescription: String(category?.shortDescription || "").trim(),
  };

  if (!slug || safeLocale === "sr") {
    return fallback;
  }

  return {
    ...fallback,
    ...(CATEGORY_COPY[safeLocale]?.[slug] || {}),
  };
}
