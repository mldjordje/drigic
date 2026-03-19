"use client";

import { useLocale } from "@/components/common/LocaleProvider";

export default function LocaleSwitcher({ className = "", compact = false }) {
  const { locale, locales, setLocale, t } = useLocale();

  return (
    <div
      className={`clinic-locale-switcher ${compact ? "is-compact" : "is-full"} ${className}`.trim()}
    >
      {!compact ? <span className="clinic-locale-switcher__label">{t("common.language")}</span> : null}
      <div className="clinic-locale-switcher__group" role="group" aria-label={t("header.changeLanguage")}>
        {locales.map((item) => {
          const active = locale === item.code;
          return (
            <button
              key={item.code}
              type="button"
              className={`clinic-locale-switcher__option ${active ? "is-active" : ""}`.trim()}
              onClick={() => setLocale(item.code)}
              aria-pressed={active}
              title={item.label}
            >
              <span className="clinic-locale-switcher__code">{item.code.toUpperCase()}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
