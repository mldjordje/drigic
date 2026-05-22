"use client";

import React, { useEffect, useRef } from "react";
import { useLocale } from "@/components/common/LocaleProvider";

const STEPS_COPY = {
  sr: {
    title: "Oblasti tretmana",
    body: "Plan tretmana je uvek personalizovan nakon konsultacije i procene.",
    categories: [
      { number: "01", title: "Lice", text: "Botox, hijaluron, skin booster i tretmani harmonizacije kontura." },
      { number: "02", title: "Anti-age", text: "Individualni planovi za osvežen izgled bez neprirodnih promena." },
      { number: "03", title: "Telo", text: "Nehirurške procedure za definiciju i unapređenje kvaliteta kože." },
      { number: "04", title: "Muska estetika", text: "Diskretni tretmani prilagođeni muškoj anatomiji i ocekivanjima." },
    ],
  },
  en: {
    title: "Treatment areas",
    body: "Each treatment plan is personalized after consultation and assessment.",
    categories: [
      { number: "01", title: "Face", text: "Botox, fillers, skinboosters and contour harmonization treatments." },
      { number: "02", title: "Anti-age", text: "Individual plans for a fresher look without an overdone effect." },
      { number: "03", title: "Body", text: "Non-surgical procedures for definition and improved skin quality." },
      { number: "04", title: "Men's aesthetics", text: "Discreet treatments tailored to male anatomy and expectations." },
    ],
  },
  de: {
    title: "Behandlungsbereiche",
    body: "Jeder Behandlungsplan wird nach Beratung und Analyse individuell erstellt.",
    categories: [
      { number: "01", title: "Gesicht", text: "Botox, Filler, Skinbooster und Behandlungen zur Konturharmonie." },
      { number: "02", title: "Anti-age", text: "Individuelle Plaene fuer ein frischeres Aussehen ohne Uebertreibung." },
      { number: "03", title: "Koerper", text: "Nichtoperative Verfahren fuer Kontur und bessere Hautqualitaet." },
      { number: "04", title: "Maenneraesthetik", text: "Diskrete Behandlungen passend zu Anatomie und Erwartungen." },
    ],
  },
  it: {
    title: "Aree di trattamento",
    body: "Ogni piano viene personalizzato dopo consulenza e valutazione.",
    categories: [
      { number: "01", title: "Viso", text: "Botox, filler, skinbooster e trattamenti per armonizzare i contorni." },
      { number: "02", title: "Anti-age", text: "Piani individuali per un aspetto fresco senza effetti artificiali." },
      { number: "03", title: "Corpo", text: "Procedure non chirurgiche per definizione e migliore qualita cutanea." },
      { number: "04", title: "Estetica maschile", text: "Trattamenti discreti pensati per anatomia ed esigenze maschili." },
    ],
  },
};

export default function Steps() {
  const { locale } = useLocale();
  const copy = STEPS_COPY[locale] || STEPS_COPY.sr;

  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const bodyRef = useRef(null);
  const cardRefs = useRef([]);
  const numberRefs = useRef([]);

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

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduceMotion) return;

      ctx = gsap.context(() => {
        // Section title reveal
        if (titleRef.current) {
          gsap.fromTo(
            titleRef.current,
            { y: 30, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.8,
              ease: "power3.out",
              scrollTrigger: { trigger: sectionRef.current, start: "top 82%" },
            }
          );
        }

        if (bodyRef.current) {
          gsap.fromTo(
            bodyRef.current,
            { y: 20, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.7,
              ease: "power3.out",
              scrollTrigger: { trigger: sectionRef.current, start: "top 82%" },
              delay: 0.12,
            }
          );
        }

        // Cards — stagger from alternating sides
        const cards = cardRefs.current.filter(Boolean);
        if (cards.length) {
          cards.forEach((card, i) => {
            const xFrom = i % 2 === 0 ? -40 : 40;
            gsap.fromTo(
              card,
              { x: xFrom, y: 30, opacity: 0 },
              {
                x: 0,
                y: 0,
                opacity: 1,
                duration: 0.85,
                ease: "expo.out",
                scrollTrigger: { trigger: sectionRef.current, start: "top 72%" },
                delay: 0.08 + i * 0.12,
              }
            );
          });
        }

        // Number counter animation
        const numbers = numberRefs.current.filter(Boolean);
        numbers.forEach((el, i) => {
          const target = parseInt(el.dataset.target, 10);
          gsap.fromTo(
            { val: 0 },
            { val: target },
            {
              duration: 0.9,
              ease: "power2.out",
              scrollTrigger: { trigger: sectionRef.current, start: "top 72%" },
              delay: 0.12 + i * 0.14,
              onUpdate: function () {
                const v = Math.round(this.targets()[0].val);
                el.textContent = String(v).padStart(2, "0");
              },
            }
          );
        });
      }, sectionRef);
    }

    init().catch(() => {});
    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  return (
    <div className="feature-area-1 space" id="tretmani" ref={sectionRef}>
      <div className="container">
        <div className="title-area text-center">
          <h2 className="sec-title text-smoke" ref={titleRef} data-scramble>{copy.title}</h2>
          <p className="sec-text text-smoke mt-20" ref={bodyRef}>{copy.body}</p>
        </div>
        <div className="row gx-0 gy-30">
          {copy.categories.map((item, index) => (
            <div
              key={item.number}
              className="col-lg-3 col-md-6"
              ref={(el) => { cardRefs.current[index] = el; }}
            >
              <div className="process-card glass-panel h-100 clinic-float-card">
                <div
                  className="process-card-number"
                  ref={(el) => { numberRefs.current[index] = el; }}
                  data-target={parseInt(item.number, 10)}
                >
                  {item.number}
                </div>
                <h4 className="process-card-title">{item.title}</h4>
                <p className="process-card-text">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
