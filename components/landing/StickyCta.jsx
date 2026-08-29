"use client";

import { useEffect, useState } from "react";
import styles from "./landing.module.css";

/**
 * Sticky CTA na mobilnom.
 *
 * Mobilni nosi oko 7x više saobraćaja i konvertuje ~22% slabije od desktopa
 * (Unbounce Conversion Benchmark 2024, zdravstvo), pa CTA mora da bude
 * dostupan bez skrolovanja nazad.
 *
 * Dva pravila koja traka poštuje:
 *  - ne pojavljuje se dok je hero na ekranu (tamo već postoji primarni CTA),
 *  - sklanja se kad je forma za zakazivanje u vidnom polju, da ne pokriva
 *    sopstveni cilj.
 */
export default function StickyCta({ heroId, bookingId, phoneHref, phoneLabel, href, label }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = heroId ? document.getElementById(heroId) : null;
    const booking = bookingId ? document.getElementById(bookingId) : null;

    let heroOut = false;
    let bookingIn = false;

    const sync = () => setVisible(heroOut && !bookingIn);

    const observers = [];

    if (hero) {
      const heroObserver = new IntersectionObserver(
        ([entry]) => {
          heroOut = !entry.isIntersecting;
          sync();
        },
        { threshold: 0.08 }
      );
      heroObserver.observe(hero);
      observers.push(heroObserver);
    } else {
      heroOut = true;
    }

    if (booking) {
      const bookingObserver = new IntersectionObserver(
        ([entry]) => {
          bookingIn = entry.isIntersecting;
          sync();
        },
        { threshold: 0.06 }
      );
      bookingObserver.observe(booking);
      observers.push(bookingObserver);
    }

    sync();
    return () => observers.forEach((observer) => observer.disconnect());
  }, [heroId, bookingId]);

  return (
    <div
      className={`${styles.sticky} ${visible ? styles.stickyVisible : ""}`}
      aria-hidden={!visible}
    >
      <a
        href={href}
        className={`${styles.btn} ${styles.btnPrimary}`}
        data-sheen
        tabIndex={visible ? 0 : -1}
      >
        {label}
      </a>
      <a
        href={phoneHref}
        className={styles.stickyCall}
        aria-label={`Pozovi ${phoneLabel}`}
        tabIndex={visible ? 0 : -1}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24 11.4 11.4 0 0 0 3.6.58 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .58 3.6 1 1 0 0 1-.25 1z" />
        </svg>
      </a>
    </div>
  );
}
