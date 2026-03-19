export const LOCALE_STORAGE_KEY = "drigic-locale";
export const LOCALE_COOKIE_KEY = "drigic-locale";
export const DEFAULT_LOCALE = "sr";

export const LOCALES = [
  { code: "sr", label: "Srpski", intl: "sr-RS" },
  { code: "en", label: "English", intl: "en-US" },
  { code: "de", label: "Deutsch", intl: "de-DE" },
  { code: "it", label: "Italiano", intl: "it-IT" },
];

const LOCALE_MAP = new Map(LOCALES.map((item) => [item.code, item]));

export function resolveLocale(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return LOCALE_MAP.has(normalized) ? normalized : DEFAULT_LOCALE;
}

export function getLocaleInfo(locale) {
  return LOCALE_MAP.get(resolveLocale(locale)) || LOCALE_MAP.get(DEFAULT_LOCALE);
}

export function getIntlLocale(locale) {
  return getLocaleInfo(locale)?.intl || "sr-RS";
}

export function getSupportedLocales() {
  return LOCALES;
}
