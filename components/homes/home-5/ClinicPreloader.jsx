"use client";
import Image from "next/image";
import { useEffect, useLayoutEffect, useState } from "react";

const TAGLINE = "Estetska i anti-age medicina";
const MIN_DISPLAY_MS = 3200;

// Reads body class synchronously — runs before paint, so no flash
const useThemeMode = () => {
  const [isLight, setIsLight] = useState(false);
  useLayoutEffect(() => {
    const update = () =>
      setIsLight(
        document.body.classList.contains("clinic-theme-light") &&
          !document.body.classList.contains("clinic-theme-dark")
      );
    update();
    // Also react if Header4 swaps the class after mount
    const observer = new MutationObserver(update);
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return isLight;
};

export default function ClinicPreloader() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const isLight = useThemeMode();

  useEffect(() => {
    const start = Date.now();
    const dismiss = () => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);
      setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => setVisible(false), 700);
      }, remaining);
    };

    if (document.readyState === "complete") {
      dismiss();
    } else {
      window.addEventListener("load", dismiss, { once: true });
      return () => window.removeEventListener("load", dismiss);
    }
  }, []);

  if (!visible) return null;

  const logoSrc = isLight ? "/assets/img/logo-dark.png" : "/assets/img/logo.png";

  return (
    <div className={`clinic-preloader ${fadeOut ? "clinic-preloader--out" : ""}`}>
      <div className="clinic-preloader__content">
        <div className="clinic-preloader__logo-wrap">
          <Image
            src={logoSrc}
            alt="Dr Igić"
            width={220}
            height={88}
            priority
            className="clinic-preloader__logo"
          />
          <div className="clinic-preloader__sweep" aria-hidden="true" />
        </div>

        <span className="clinic-preloader__tagline">{TAGLINE}</span>

        <div className="clinic-preloader__bar-track">
          <div className="clinic-preloader__bar-fill" />
        </div>
      </div>
    </div>
  );
}
