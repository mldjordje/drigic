"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef } from "react";
import { useLocale } from "@/components/common/LocaleProvider";
import { getLocalizedCategoryCopy } from "@/lib/services/category-copy";
import { SERVICE_CATEGORY_SPECS } from "@/lib/services/category-map";

const CATEGORY_SHOWCASE_COPY = {
  sr: {
    eyebrow: "Estetske oblasti",
    lead: "Izdvojene oblasti tretmana su postavljene kao interaktivne kartice, sa jačim fokusom na prirodan rezultat, anatomiju i individualan plan.",
    labels: { natural: "Prirodan efekat", anatomy: "Prati anatomiju", plan: "Individualan plan", face: "Lice", body: "Telo", regenerative: "Regenerativno" },
  },
  en: {
    eyebrow: "Treatment areas",
    lead: "Highlighted treatment areas are presented as interactive cards with a stronger focus on natural outcomes, anatomy and an individual plan.",
    labels: { natural: "Natural look", anatomy: "Anatomy first", plan: "Personal plan", face: "Face", body: "Body", regenerative: "Regenerative" },
  },
  de: {
    eyebrow: "Behandlungsbereiche",
    lead: "Die wichtigsten Behandlungsbereiche sind als interaktive Karten dargestellt, mit Fokus auf natuerliche Ergebnisse, Anatomie und individuelle Planung.",
    labels: { natural: "Natuerlicher Effekt", anatomy: "Anatomie im Fokus", plan: "Individueller Plan", face: "Gesicht", body: "Koerper", regenerative: "Regenerativ" },
  },
  it: {
    eyebrow: "Aree di trattamento",
    lead: "Le principali aree di trattamento sono presentate come card interattive, con maggiore enfasi su risultato naturale, anatomia e piano individuale.",
    labels: { natural: "Effetto naturale", anatomy: "Anatomia al centro", plan: "Piano individuale", face: "Viso", body: "Corpo", regenerative: "Rigenerativo" },
  },
};

export default function Projects() {
  const { locale, t } = useLocale();
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const eyebrowRef = useRef(null);
  const leadRef = useRef(null);
  const cardRefs = useRef([]);
  const lineRef = useRef(null);

  const showcaseCopy = useMemo(
    () => CATEGORY_SHOWCASE_COPY[locale] || CATEGORY_SHOWCASE_COPY.sr,
    [locale]
  );

  useEffect(() => {
    cardRefs.current = cardRefs.current.slice(0, SERVICE_CATEGORY_SPECS.length);
  }, []);

  // 3D tilt on cards — desktop only
  useEffect(() => {
    if (window.matchMedia("(hover: none)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cards = cardRefs.current.filter(Boolean);
    const MAX_TILT = 6;

    const handlers = cards.map((card) => {
      const onMove = (e) => {
        const rect = card.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const rotX = ((e.clientY - cy) / (rect.height / 2)) * -MAX_TILT;
        const rotY = ((e.clientX - cx) / (rect.width / 2)) * MAX_TILT;
        card.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.03,1.03,1.03)`;
      };
      const onLeave = () => {
        card.style.transform = "";
      };
      card.addEventListener("mousemove", onMove, { passive: true });
      card.addEventListener("mouseleave", onLeave);
      return { card, onMove, onLeave };
    });

    return () => {
      handlers.forEach(({ card, onMove, onLeave }) => {
        card.removeEventListener("mousemove", onMove);
        card.removeEventListener("mouseleave", onLeave);
      });
    };
  }, []);

  useEffect(() => {
    let ctx;
    let cancelled = false;

    async function runAnimations() {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);

      if (cancelled || !sectionRef.current) return;
      gsap.registerPlugin(ScrollTrigger);

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduceMotion) return;

      ctx = gsap.context(() => {
        // Eyebrow line sweep
        if (lineRef.current) {
          gsap.fromTo(
            lineRef.current,
            { scaleX: 0, opacity: 0, transformOrigin: "left center" },
            {
              scaleX: 1,
              opacity: 1,
              duration: 0.9,
              ease: "expo.inOut",
              scrollTrigger: { trigger: headerRef.current, start: "top 84%" },
            }
          );
        }

        // Eyebrow text
        if (eyebrowRef.current) {
          gsap.fromTo(
            eyebrowRef.current,
            { y: 16, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.65,
              ease: "power3.out",
              scrollTrigger: { trigger: headerRef.current, start: "top 84%" },
              delay: 0.15,
            }
          );
        }

        // Heading — word clip-path reveal
        if (headerRef.current) {
          const words = headerRef.current.querySelectorAll(".clinic-word-inner");
          if (words.length) {
            gsap.fromTo(
              words,
              { yPercent: 110 },
              {
                yPercent: 0,
                duration: 0.8,
                stagger: 0.06,
                ease: "expo.out",
                scrollTrigger: { trigger: headerRef.current, start: "top 82%" },
                delay: 0.12,
              }
            );
          } else {
            // Fallback for plain headings
            const heading = headerRef.current.querySelector("h2");
            if (heading) {
              gsap.fromTo(
                heading,
                { y: 30, opacity: 0 },
                {
                  y: 0,
                  opacity: 1,
                  duration: 0.8,
                  ease: "power3.out",
                  scrollTrigger: { trigger: headerRef.current, start: "top 82%" },
                }
              );
            }
          }
        }

        if (leadRef.current) {
          gsap.fromTo(
            leadRef.current,
            { y: 22, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.85,
              ease: "power3.out",
              scrollTrigger: { trigger: leadRef.current, start: "top 85%" },
              delay: 0.08,
            }
          );
        }

        const cards = cardRefs.current.filter(Boolean);
        if (cards.length) {
          // Entrance — clip-path sweep from bottom
          gsap.fromTo(
            cards,
            { clipPath: "inset(100% 0 0 0)", opacity: 0 },
            {
              clipPath: "inset(0% 0 0 0)",
              opacity: 1,
              duration: 0.85,
              stagger: { amount: 0.55, ease: "power2.inOut" },
              ease: "expo.out",
              scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 70%",
              },
              onComplete: () => {
                // Reset clip-path so hover/tilt works properly
                cards.forEach((c) => {
                  c.style.clipPath = "";
                });
              },
            }
          );

          // Parallax scroll per card
          cards.forEach((card, index) => {
            gsap.to(card, {
              yPercent: index % 2 === 0 ? -5 : -10,
              ease: "none",
              scrollTrigger: {
                trigger: card,
                start: "top bottom",
                end: "bottom top",
                scrub: 0.8,
              },
            });
          });
        }
      }, sectionRef);
    }

    runAnimations().catch(() => {});

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  return (
    <div className="project-area-5 space overflow-hidden clinic-treatment-showcase" id="tretmani">
      <div className="clinic-treatment-showcase__bg" aria-hidden="true">
        <span className="clinic-treatment-showcase__orb clinic-treatment-showcase__orb--one" />
        <span className="clinic-treatment-showcase__orb clinic-treatment-showcase__orb--two" />
        <span className="clinic-treatment-showcase__grid" />
      </div>

      <div className="container" ref={sectionRef}>
        <div className="clinic-treatment-showcase__hero">
          <div className="row justify-content-center">
            <div className="col-xl-9 col-lg-10">
              <div className="title-area text-center" ref={headerRef}>
                <div className="clinic-eyebrow-row">
                  <span className="clinic-eyebrow-line" ref={lineRef} aria-hidden="true" />
                  <span className="clinic-founder-eyebrow clinic-treatment-showcase__eyebrow" ref={eyebrowRef}>
                    {showcaseCopy.eyebrow}
                  </span>
                  <span className="clinic-eyebrow-line" aria-hidden="true" />
                </div>
                <h2 className="sec-title text-smoke">
                  {t("treatments.categoriesTitle").split(" ").map((word, i, arr) => (
                    <span key={i} className="clinic-word-wrap" aria-hidden="true">
                      <span className="clinic-word-inner">{word}</span>
                      {i < arr.length - 1 ? " " : ""}
                    </span>
                  ))}
                  <span className="sr-only">{t("treatments.categoriesTitle")}</span>
                </h2>
                <p className="sec-text text-smoke" ref={leadRef}>
                  {showcaseCopy.lead}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="svc-grid">
          {SERVICE_CATEGORY_SPECS.map((item, index) => {
            const localizedItem = getLocalizedCategoryCopy(locale, item);
            const isPhoto = Boolean(item.imageCard);

            return (
              <Link
                key={item.slug}
                href={`/tretmani/${item.slug}`}
                className={`svc-card ${isPhoto ? "svc-card--photo" : "svc-card--plain"} clinic-svc-tilt`}
                aria-label={`${localizedItem.name} — ${t("treatments.seeServices")}`}
                ref={(node) => { cardRefs.current[index] = node; }}
              >
                {isPhoto ? (
                  <>
                    <img
                      className="svc-card__bg"
                      src={item.imageCard}
                      alt=""
                      width={740}
                      height={500}
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="svc-card__scrim" aria-hidden="true" />
                  </>
                ) : null}

                <span className="svc-card__num" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>

                {!isPhoto ? (
                  <span className="svc-card__icon" aria-hidden="true">
                    <i className={item.iconClass || "fas fa-spa"} />
                  </span>
                ) : null}

                <div className="svc-card__body">
                  <h3 className="svc-card__title">{localizedItem.name}</h3>
                  <p className="svc-card__desc">{localizedItem.shortDescription}</p>
                </div>

                <span className="svc-card__arrow" aria-hidden="true">
                  <i className="fas fa-arrow-right" />
                </span>
              </Link>
            );
          })}
        </div>

        <div className="btn-wrap mt-50 justify-content-center">
          <Link scroll={false} href="/tretmani" className="btn bg-theme text-title clinic-glow-btn">
            <span className="link-effect">
              <span className="effect-1">{t("treatments.allCategories")}</span>
              <span className="effect-1">{t("treatments.allCategories")}</span>
            </span>
          </Link>
          <Link scroll={false} href="/booking" className="btn bg-theme text-title clinic-glow-btn">
            <span className="link-effect">
              <span className="effect-1">{t("treatments.bookAppointment")}</span>
              <span className="effect-1">{t("treatments.bookAppointment")}</span>
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
