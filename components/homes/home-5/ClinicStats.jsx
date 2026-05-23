"use client";

import React, { useEffect, useRef } from "react";
import { useLocale } from "@/components/common/LocaleProvider";

const STATS = {
  sr: [
    { value: 3, suffix: "+", label: "Višegodišnje iskustvo", sublabel: "u estetskoj medicini" },
    { value: 1200, suffix: "+", label: "Tretmana", sublabel: "uspešno izvedenih" },
    { value: 98, suffix: "%", label: "Zadovoljnih", sublabel: "pacijenata" },
    { value: 15, suffix: "+", label: "Procedura", sublabel: "u ponudi" },
  ],
  en: [
    { value: 3, suffix: "+", label: "Years of expertise", sublabel: "in aesthetic medicine" },
    { value: 1200, suffix: "+", label: "Treatments", sublabel: "successfully performed" },
    { value: 98, suffix: "%", label: "Satisfied", sublabel: "patients" },
    { value: 15, suffix: "+", label: "Procedures", sublabel: "available" },
  ],
  de: [
    { value: 3, suffix: "+", label: "Mehrjährige Erfahrung", sublabel: "in ästhetischer Medizin" },
    { value: 1200, suffix: "+", label: "Behandlungen", sublabel: "erfolgreich durchgeführt" },
    { value: 98, suffix: "%", label: "Zufriedene", sublabel: "Patienten" },
    { value: 15, suffix: "+", label: "Verfahren", sublabel: "im Angebot" },
  ],
  it: [
    { value: 3, suffix: "+", label: "Pluriennale esperienza", sublabel: "in medicina estetica" },
    { value: 1200, suffix: "+", label: "Trattamenti", sublabel: "eseguiti con successo" },
    { value: 98, suffix: "%", label: "Soddisfatti", sublabel: "pazienti" },
    { value: 15, suffix: "+", label: "Procedure", sublabel: "disponibili" },
  ],
};

export default function ClinicStats() {
  const { locale } = useLocale();
  const stats = STATS[locale] || STATS.sr;

  const sectionRef = useRef(null);
  const numberRefs = useRef([]);
  const cardRefs = useRef([]);
  const lineRef = useRef(null);

  useEffect(() => {
    let ctx = null;
    let cancelled = false;

    async function init() {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);

      if (cancelled || !sectionRef.current) return;
      gsap.registerPlugin(ScrollTrigger);

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      ctx = gsap.context(() => {
        // Decorative line sweep
        if (lineRef.current) {
          gsap.fromTo(lineRef.current,
            { scaleX: 0, transformOrigin: "center" },
            { scaleX: 1, duration: 1.2, ease: "expo.inOut",
              scrollTrigger: { trigger: sectionRef.current, start: "top 80%" } }
          );
        }

        // Cards stagger in with scale + fade
        const cards = cardRefs.current.filter(Boolean);
        gsap.fromTo(cards,
          { y: 50, opacity: 0, scale: 0.88 },
          {
            y: 0, opacity: 1, scale: 1,
            duration: 0.9,
            stagger: { amount: 0.45, ease: "power2.inOut" },
            ease: "expo.out",
            scrollTrigger: { trigger: sectionRef.current, start: "top 75%" },
          }
        );

        // Counter animations — dramatic exponential
        const numbers = numberRefs.current.filter(Boolean);
        numbers.forEach((el, i) => {
          const target = parseFloat(el.dataset.target);
          const isFloat = !Number.isInteger(target);
          const suffix = el.dataset.suffix || "";

          gsap.fromTo({ val: 0 }, { val: target }, {
            duration: 1.8,
            ease: "power4.out",
            delay: 0.15 + i * 0.12,
            scrollTrigger: { trigger: sectionRef.current, start: "top 75%" },
            onUpdate: function () {
              const v = this.targets()[0].val;
              el.textContent = (isFloat ? v.toFixed(1) : Math.round(v)) + suffix;
            },
            onComplete: function () {
              el.textContent = target + suffix;
            },
          });
        });
      }, sectionRef);
    }

    init().catch(() => {});
    return () => { cancelled = true; ctx?.revert(); };
  }, []);

  return (
    <section className="clinic-stats-section" ref={sectionRef} aria-label="Statistike klinike">
      <div className="clinic-stats-bg" aria-hidden="true">
        <div className="clinic-stats-glow clinic-stats-glow--l" />
        <div className="clinic-stats-glow clinic-stats-glow--r" />
      </div>

      <div className="container">
        <div className="clinic-stats-line" ref={lineRef} aria-hidden="true" />

        <div className="clinic-stats-grid">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="clinic-stat-card"
              ref={(el) => { cardRefs.current[i] = el; }}
            >
              <div className="clinic-stat-card__number-wrap">
                <span
                  className="clinic-stat-card__number"
                  ref={(el) => { numberRefs.current[i] = el; }}
                  data-target={stat.value}
                  data-suffix={stat.suffix}
                  aria-label={`${stat.value}${stat.suffix} ${stat.label}`}
                >
                  0{stat.suffix}
                </span>
              </div>
              <div className="clinic-stat-card__text">
                <span className="clinic-stat-card__label">{stat.label}</span>
                <span className="clinic-stat-card__sublabel">{stat.sublabel}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="clinic-stats-line" aria-hidden="true" />
      </div>
    </section>
  );
}
