"use client";

import { useLocale } from "@/components/common/LocaleProvider";

export default function LocaleSwitcher({ className = "", compact = false }) {
  const { locale, locales, setLocale, t } = useLocale();

  return (
    <label className={className} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      {!compact ? (
        <span style={{ color: "var(--clinic-text-strong, #f4f8ff)", fontSize: 13 }}>
          {t("common.language")}
        </span>
      ) : null}
      <select
        aria-label={t("header.changeLanguage")}
        value={locale}
        onChange={(event) => setLocale(event.target.value)}
        className="clinic-locale-switch"
      >
        {locales.map((item) => (
          <option key={item.code} value={item.code}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}
