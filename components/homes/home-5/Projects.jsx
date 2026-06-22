"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef } from "react";
import { useLocale } from "@/components/common/LocaleProvider";
import { getLocalizedCategoryCopy } from "@/lib/services/category-copy";
import { SERVICE_CATEGORY_SPECS } from "@/lib/services/category-map";

const SHOWCASE_COPY = {
  sr: {
    eyebrow: "Estetske oblasti",
    lead: "Svaka oblast tretmana ima poseban pristup — individualan plan, prirodan rezultat.",
  },
  en: {
    eyebrow: "Treatment areas",
    lead: "Each treatment area has a unique approach — a personalised plan, a natural result.",
  },
  de: {
    eyebrow: "Behandlungsbereiche",
    lead: "Jede Behandlungszone hat einen eigenen Ansatz — individueller Plan, natuerliches Ergebnis.",
  },
  it: {
    eyebrow: "Aree di trattamento",
    lead: "Ogni area di trattamento ha un approccio unico — piano personale, risultato naturale.",
  },
};

// Unique entrance for every card — no two the same
const CARD_ENTRANCES = [
  { from: { x: -130, rotateY: -20, opacity: 0 },              ease: "expo.out",    dur: 1.05 },
  { from: { y: 100, scale: 0.78, opacity: 0 },                ease: "back.out(1.5)", dur: 1.0 },
  { from: { x: 130, rotateY: 20, opacity: 0 },                ease: "expo.out",    dur: 1.05 },
  { from: { y: -90, rotateX: 20, scale: 0.9, opacity: 0 },    ease: "power4.out",  dur: 0.95 },
  { from: { x: -90, rotateZ: -8, scale: 0.88, opacity: 0 },   ease: "expo.out",    dur: 1.0  },
  { from: { x: 90, rotateZ: 8, scale: 0.88, opacity: 0 },     ease: "expo.out",    dur: 1.0  },
  { from: { y: 110, rotateY: -14, opacity: 0 },               ease: "expo.out",    dur: 1.05 },
  { from: { scale: 0.45, rotateZ: 12, opacity: 0 },           ease: "back.out(2)", dur: 1.1  },
  { from: { x: -80, y: -80, rotateZ: -10, opacity: 0 },       ease: "power4.out",  dur: 1.0  },
  { from: { x: 80, y: -80, rotateZ: 10, opacity: 0 },         ease: "power4.out",  dur: 1.0  },
];

export default function Projects() {
  const { locale, t } = useLocale();
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const eyebrowRef = useRef(null);
  const titleRef = useRef(null);
  const leadRef = useRef(null);
  const lineRef = useRef(null);
  const cardRefs = useRef([]);

  const copy = useMemo(() => SHOWCASE_COPY[locale] || SHOWCASE_COPY.sr, [locale]);

  // 3D tilt on hover — desktop
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(hover: none)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const MAX = 7;
    const handlers = cardRefs.current.filter(Boolean).map((card) => {
      const onMove = (e) => {
        const r = card.getBoundingClientRect();
        const rotX = ((e.clientY - r.top - r.height / 2) / (r.height / 2)) * -MAX;
        const rotY = ((e.clientX - r.left - r.width / 2) / (r.width / 2)) * MAX;
        card.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.04,1.04,1.04) translateZ(12px)`;
      };
      const onLeave = () => {
        card.style.transition = "transform 0.65s cubic-bezier(0.22,1,0.36,1)";
        card.style.transform = "";
        setTimeout(() => { card.style.transition = ""; }, 700);
      };
      card.addEventListener("mousemove", onMove, { passive: true });
      card.addEventListener("mouseleave", onLeave);
      return { card, onMove, onLeave };
    });

    return () => handlers.forEach(({ card, onMove, onLeave }) => {
      card.removeEventListener("mousemove", onMove);
      card.removeEventListener("mouseleave", onLeave);
    });
  }, []);

  useEffect(() => {
    let ctx;
    let cancelled = false;

    async function run() {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled || !sectionRef.current) return;
      gsap.registerPlugin(ScrollTrigger);
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      ctx = gsap.context(() => {
        // Eyebrow line sweep
        if (lineRef.current) {
          gsap.fromTo(lineRef.current,
            { scaleX: 0, transformOrigin: "left center", opacity: 0 },
            { scaleX: 1, opacity: 1, duration: 1.1, ease: "expo.inOut",
              scrollTrigger: { trigger: headerRef.current, start: "top 84%" } }
          );
        }

        // Eyebrow scramble text entrance
        if (eyebrowRef.current) {
          gsap.fromTo(eyebrowRef.current,
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.7, ease: "power3.out", delay: 0.2,
              scrollTrigger: { trigger: headerRef.current, start: "top 84%" } }
          );
        }

        // Heading reveal — simple, reliable fade (never leaves title clipped)
        if (titleRef.current) {
          gsap.fromTo(titleRef.current,
            { y: 28, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.9, ease: "expo.out", delay: 0.18,
              scrollTrigger: { trigger: headerRef.current, start: "top 82%" },
              onComplete() { gsap.set(titleRef.current, { clearProps: "transform,opacity" }); } }
          );
        }

        if (leadRef.current) {
          gsap.fromTo(leadRef.current,
            { y: 24, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.9, ease: "power3.out", delay: 0.35,
              scrollTrigger: { trigger: leadRef.current, start: "top 86%" } }
          );
        }

        // Per-card unique 3D entrance
        cardRefs.current.filter(Boolean).forEach((card, i) => {
          const anim = CARD_ENTRANCES[i % CARD_ENTRANCES.length];

          gsap.set(card, { transformPerspective: 1000, ...anim.from });

          gsap.to(card, {
            x: 0, y: 0, scale: 1, rotateX: 0, rotateY: 0, rotateZ: 0, opacity: 1,
            duration: anim.dur,
            ease: anim.ease,
            scrollTrigger: {
              trigger: card,
              start: "top 90%",
            },
            onComplete() {
              // Allow tilt to take over cleanly
              gsap.set(card, { clearProps: "x,y,rotateX,rotateY,rotateZ,scale,transformPerspective" });
              card.dataset.animDone = "1";
            },
          });

          // Subtle parallax after entrance
          gsap.to(card, {
            yPercent: i % 2 === 0 ? -5 : -9,
            ease: "none",
            scrollTrigger: {
              trigger: card,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.9,
            },
          });
        });
      }, sectionRef);
    }

    run().catch(() => {});
    return () => { cancelled = true; ctx?.revert(); };
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
                  <span
                    className="clinic-founder-eyebrow clinic-treatment-showcase__eyebrow"
                    ref={eyebrowRef}
                    data-scramble
                  >
                    {copy.eyebrow}
                  </span>
                  <span className="clinic-eyebrow-line" aria-hidden="true" />
                </div>

                <h2 className="sec-title text-smoke" ref={titleRef}>
                  {t("treatments.categoriesTitle")}
                </h2>

                <p className="sec-text text-smoke" ref={leadRef}>
                  {copy.lead}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="svc-grid">
          {SERVICE_CATEGORY_SPECS.map((item, index) => {
            const loc = getLocalizedCategoryCopy(locale, item);
            const isPhoto = Boolean(item.imageCard);

            return (
              <Link
                key={item.slug}
                href={`/tretmani/${item.slug}`}
                className={`svc-card ${isPhoto ? "svc-card--photo" : "svc-card--plain"} clinic-svc-tilt`}
                aria-label={`${loc.name} — ${t("treatments.seeServices")}`}
                ref={(node) => { cardRefs.current[index] = node; }}
              >
                {isPhoto && (
                  <>
                    <img className="svc-card__bg" src={item.imageCard} alt=""
                      width={740} height={500} loading="lazy" decoding="async" />
                    <span className="svc-card__scrim" aria-hidden="true" />
                  </>
                )}

                <span className="svc-card__num" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>

                {!isPhoto && (
                  <span className="svc-card__icon" aria-hidden="true">
                    <i className={item.iconClass || "fas fa-spa"} />
                  </span>
                )}

                <div className="svc-card__body">
                  <h3 className="svc-card__title">{loc.name}</h3>
                  <p className="svc-card__desc">{loc.shortDescription}</p>
                </div>

                <span className="svc-card__arrow" aria-hidden="true">
                  <i className="fas fa-arrow-right" />
                </span>

                {/* Hover shimmer layer */}
                <span className="svc-card__shimmer" aria-hidden="true" />
              </Link>
            );
          })}
        </div>

        <div className="btn-wrap mt-50 justify-content-center">
          <Link scroll={false} href="/tretmani"
            className="btn bg-theme text-title clinic-glow-btn clinic-magnetic">
            <span className="link-effect">
              <span className="effect-1">{t("treatments.allCategories")}</span>
              <span className="effect-1">{t("treatments.allCategories")}</span>
            </span>
          </Link>
          <Link scroll={false} href="/booking"
            className="btn bg-theme text-title clinic-glow-btn clinic-magnetic">
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
