"use client";
import Image from "next/image";
import { useEffect, useState } from "react";

const TAGLINE = "Estetska i anti-age medicina";
const MIN_DISPLAY_MS = 1400;
const MAX_WAIT_MS = 2200;

export default function ClinicPreloader() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const start = Date.now();
    let closed = false;
    let finishTimer = null;
    let maxWaitTimer = null;

    const dismiss = () => {
      if (closed) {
        return;
      }
      closed = true;
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);

      finishTimer = window.setTimeout(() => {
        setFadeOut(true);
        window.setTimeout(() => {
          setVisible(false);
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("clinic:preloader:done"));
          }
        }, 700);
      }, remaining);
    };

    maxWaitTimer = window.setTimeout(dismiss, MAX_WAIT_MS);

    if (document.readyState === "complete" || document.readyState === "interactive") {
      dismiss();
    } else {
      window.addEventListener("load", dismiss, { once: true });
      document.addEventListener("readystatechange", dismiss, { once: true });
      return () => {
        window.removeEventListener("load", dismiss);
        document.removeEventListener("readystatechange", dismiss);
        if (finishTimer) {
          window.clearTimeout(finishTimer);
        }
        if (maxWaitTimer) {
          window.clearTimeout(maxWaitTimer);
        }
      };
    }

    return () => {
      if (finishTimer) {
        window.clearTimeout(finishTimer);
      }
      if (maxWaitTimer) {
        window.clearTimeout(maxWaitTimer);
      }
    };
  }, []);

  if (!visible) return null;

  return (
    <div className={`clinic-preloader ${fadeOut ? "clinic-preloader--out" : ""}`}>
      <div className="clinic-preloader__content">
        <div className="clinic-preloader__logo-wrap">
          <Image src="/assets/img/logo.png" alt="Dr Igić" width={220} height={88} priority className="clinic-preloader__logo" />
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
