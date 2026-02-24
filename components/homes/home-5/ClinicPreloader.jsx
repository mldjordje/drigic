"use client";
import Image from "next/image";
import { useEffect, useState } from "react";

const TAGLINE = "Estetska i anti-age medicina";
const MIN_DISPLAY_MS = 3200;

export default function ClinicPreloader() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

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

  return (
    <div className={`clinic-preloader ${fadeOut ? "clinic-preloader--out" : ""}`}>
      <div className="clinic-preloader__content">
        <div className="clinic-preloader__logo-wrap">
          {/* dark theme slot — visible by default, hidden via CSS when body has clinic-theme-light */}
          <span className="clinic-preloader__logo-slot clinic-preloader__logo-slot--dark">
            <Image src="/assets/img/logo.png" alt="Dr Igić" width={220} height={88} priority className="clinic-preloader__logo" />
          </span>
          {/* light theme slot — hidden by default, shown via CSS when body has clinic-theme-light */}
          <span className="clinic-preloader__logo-slot clinic-preloader__logo-slot--light">
            <Image src="/assets/img/logo-dark.png" alt="Dr Igić" width={220} height={88} priority className="clinic-preloader__logo" />
          </span>
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
