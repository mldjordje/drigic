"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  LOCALE_COOKIE_KEY,
  LOCALE_STORAGE_KEY,
  createTranslator,
  getIntlLocale,
  getLocaleInfo,
  getSupportedLocales,
  resolveLocale,
} from "@/lib/i18n";

const LocaleContext = createContext(null);

function persistLocale(locale) {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      // localStorage is optional
    }
  }

  if (typeof document !== "undefined") {
    document.cookie = `${LOCALE_COOKIE_KEY}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
    document.documentElement.lang = locale;
  }
}

export default function LocaleProvider({ initialLocale = "sr", children }) {
  const [locale, setLocaleState] = useState(resolveLocale(initialLocale));

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const localStorageValue = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    const cookieMatch = document.cookie
      .split("; ")
      .find((entry) => entry.startsWith(`${LOCALE_COOKIE_KEY}=`));
    const cookieValue = cookieMatch?.split("=")[1] || null;
    const nextLocale = resolveLocale(localStorageValue || cookieValue || initialLocale);

    setLocaleState(nextLocale);
    persistLocale(nextLocale);
  }, [initialLocale]);

  const value = useMemo(() => {
    const safeLocale = resolveLocale(locale);

    return {
      locale: safeLocale,
      intlLocale: getIntlLocale(safeLocale),
      localeInfo: getLocaleInfo(safeLocale),
      locales: getSupportedLocales(),
      setLocale(nextLocale) {
        const resolved = resolveLocale(nextLocale);
        setLocaleState(resolved);
        persistLocale(resolved);
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("clinic:localechange", {
              detail: { locale: resolved },
            })
          );
        }
      },
      t: createTranslator(safeLocale),
    };
  }, [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const value = useContext(LocaleContext);
  if (!value) {
    throw new Error("useLocale must be used inside LocaleProvider.");
  }
  return value;
}
