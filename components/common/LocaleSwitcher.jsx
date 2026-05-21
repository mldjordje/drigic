"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/common/LocaleProvider";

export default function LocaleSwitcher({ className = "", compact = false }) {
  const { locale, locales, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onDoc(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const current = locales.find((l) => l.code === locale) || locales[0];
  const others = locales.filter((l) => l.code !== locale);

  return (
    <div
      ref={wrapRef}
      className={`cls-sw ${open ? "cls-sw--open" : ""} ${className}`.trim()}
      aria-label={t("header.changeLanguage")}
    >
      <button
        type="button"
        className="cls-sw__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={current.label}
      >
        <span className="cls-sw__code">{current.code.toUpperCase()}</span>
        <svg className="cls-sw__chevron" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          <path d="M2 3.5 L5 6.5 L8 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </svg>
      </button>

      {open && (
        <ul className="cls-sw__menu" role="listbox" aria-label={t("header.changeLanguage")}>
          {others.map((item) => (
            <li key={item.code} role="option" aria-selected={false}>
              <button
                type="button"
                className="cls-sw__option"
                onClick={() => { setLocale(item.code); setOpen(false); }}
                title={item.label}
              >
                <span className="cls-sw__code">{item.code.toUpperCase()}</span>
                <span className="cls-sw__label">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
