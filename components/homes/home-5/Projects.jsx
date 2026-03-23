"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef } from "react";
import { useLocale } from "@/components/common/LocaleProvider";
import { getLocalizedCategoryCopy } from "@/lib/services/category-copy";
import { SERVICE_CATEGORY_SPECS } from "@/lib/services/category-map";

const CATEGORY_SHOWCASE_COPY = {
  sr: {
    eyebrow: "Estetske oblasti",
    lead:
      "Izdvojene oblasti tretmana su postavljene kao interaktivne kartice, sa jacim fokusom na prirodan rezultat, anatomiju i individualan plan.",
    labels: {
      natural: "Prirodan efekat",
      anatomy: "Prati anatomiju",
      plan: "Individualan plan",
      face: "Lice",
      body: "Telo",
      regenerative: "Regenerativno",
    },
  },
  en: {
    eyebrow: "Treatment areas",
    lead:
      "Highlighted treatment areas are presented as interactive cards with a stronger focus on natural outcomes, anatomy and an individual plan.",
    labels: {
      natural: "Natural look",
      anatomy: "Anatomy first",
      plan: "Personal plan",
      face: "Face",
      body: "Body",
      regenerative: "Regenerative",
    },
  },
  de: {
    eyebrow: "Behandlungsbereiche",
    lead:
      "Die wichtigsten Behandlungsbereiche sind als interaktive Karten dargestellt, mit Fokus auf natuerliche Ergebnisse, Anatomie und individuelle Planung.",
    labels: {
      natural: "Natuerlicher Effekt",
      anatomy: "Anatomie im Fokus",
      plan: "Individueller Plan",
      face: "Gesicht",
      body: "Koerper",
      regenerative: "Regenerativ",
    },
  },
  it: {
    eyebrow: "Aree di trattamento",
    lead:
      "Le principali aree di trattamento sono presentate come card interattive, con maggiore enfasi su risultato naturale, anatomia e piano individuale.",
    labels: {
      natural: "Effetto naturale",
      anatomy: "Anatomia al centro",
      plan: "Piano individuale",
      face: "Viso",
      body: "Corpo",
      regenerative: "Rigenerativo",
    },
  },
};

function getCategoryMood(slug, labels) {
  if (["lipoliza", "mezoterapija"].includes(slug)) {
    return labels.body;
  }
  if (["polinukleotidi-i-egzozomi", "prp", "kolagen-stimulatori"].includes(slug)) {
    return labels.regenerative;
  }
  return labels.face;
}

export default function Projects() {
  const { locale, t } = useLocale();
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const leadRef = useRef(null);
  const cardRefs = useRef([]);
  const badgeRefs = useRef([]);

  const showcaseCopy = useMemo(
    () => CATEGORY_SHOWCASE_COPY[locale] || CATEGORY_SHOWCASE_COPY.sr,
    [locale]
  );

  useEffect(() => {
    cardRefs.current = cardRefs.current.slice(0, SERVICE_CATEGORY_SPECS.length);
    badgeRefs.current = badgeRefs.current.slice(0, 2);
  }, []);

  useEffect(() => {
    let ctx;
    let cancelled = false;

    async function runAnimations() {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);

      if (cancelled || !sectionRef.current) {
        return;
      }

      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        const cards = cardRefs.current.filter(Boolean);
        const badges = badgeRefs.current.filter(Boolean);

        if (headerRef.current) {
          gsap.fromTo(
            headerRef.current,
            { y: 32, opacity: 0, filter: "blur(10px)" },
            {
              y: 0,
              opacity: 1,
              filter: "blur(0px)",
              duration: 0.9,
              ease: "power3.out",
              scrollTrigger: {
                trigger: headerRef.current,
                start: "top 82%",
              },
            }
          );
        }

        if (leadRef.current) {
          gsap.fromTo(
            leadRef.current,
            { y: 24, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.85,
              delay: 0.08,
              ease: "power3.out",
              scrollTrigger: {
                trigger: leadRef.current,
                start: "top 84%",
              },
            }
          );
        }

        if (cards.length) {
          gsap.fromTo(
            cards,
            {
              y: 70,
              opacity: 0,
              rotateX: 10,
              scale: 0.94,
              transformOrigin: "50% 100%",
              filter: "blur(10px)",
            },
            {
              y: 0,
              opacity: 1,
              rotateX: 0,
              scale: 1,
              filter: "blur(0px)",
              duration: 1,
              stagger: 0.08,
              ease: "power3.out",
              scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 72%",
              },
            }
          );

          cards.forEach((card, index) => {
            gsap.to(card, {
              yPercent: index % 2 === 0 ? -4 : -8,
              ease: "none",
              scrollTrigger: {
                trigger: card,
                start: "top bottom",
                end: "bottom top",
                scrub: 0.7,
              },
            });
          });
        }

        badges.forEach((badge, index) => {
          gsap.fromTo(
            badge,
            { y: index === 0 ? -12 : 12, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.9,
              delay: 0.15 + index * 0.08,
              ease: "power2.out",
              scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 78%",
              },
            }
          );
        });
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
              <div className="title-area text-center clinic-reveal" ref={headerRef}>
                <span className="clinic-founder-eyebrow clinic-treatment-showcase__eyebrow">
                  {showcaseCopy.eyebrow}
                </span>
                <h2 className="sec-title text-smoke">{t("treatments.categoriesTitle")}</h2>
                <p className="sec-text text-smoke" ref={leadRef}>
                  {showcaseCopy.lead}
                </p>
              </div>
            </div>
          </div>

          <div className="clinic-treatment-showcase__badges" aria-hidden="true">
            <div
              className="clinic-treatment-showcase__badge clinic-treatment-showcase__badge--left"
              ref={(node) => {
                badgeRefs.current[0] = node;
              }}
            >
              <span>{showcaseCopy.labels.natural}</span>
            </div>
            <div
              className="clinic-treatment-showcase__badge clinic-treatment-showcase__badge--right"
              ref={(node) => {
                badgeRefs.current[1] = node;
              }}
            >
              <span>{showcaseCopy.labels.anatomy}</span>
            </div>
          </div>
        </div>

        <div className="clinic-treatment-grid clinic-treatment-grid--showcase">
          {SERVICE_CATEGORY_SPECS.map((item, index) => {
            const localizedItem = getLocalizedCategoryCopy(locale, item);

            return (
              <Link
                key={item.slug}
                href={`/tretmani/${item.slug}`}
                className={`clinic-treatment-card clinic-treatment-card--showcase glass-panel clinic-hover-raise clinic-reveal wow ${
                  index % 2 === 0 ? "img-custom-anim-left" : "img-custom-anim-right"
                } animated`}
                data-wow-duration="1.5s"
                data-wow-delay={`${0.1 + index * 0.06}s`}
                aria-label={`${localizedItem.name} - ${t("treatments.seeServices")}`}
                ref={(node) => {
                  cardRefs.current[index] = node;
                }}
              >
                <span className="clinic-treatment-card__shine" aria-hidden="true" />
                <div className="clinic-treatment-card__topline">
                  <span className="clinic-treatment-card__index">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="clinic-treatment-card__mood">
                    {getCategoryMood(item.slug, showcaseCopy.labels)}
                  </span>
                </div>

                <span className="clinic-treatment-card__icon" aria-hidden="true">
                  <i className={item.iconClass || "fas fa-spa"} />
                </span>

                <div className="portfolio-details clinic-treatment-card__body">
                  <h3 className="portfolio-title">{localizedItem.name}</h3>
                  <p className="portfolio-meta">{localizedItem.shortDescription}</p>

                  <div className="clinic-treatment-card__tags">
                    <span>{showcaseCopy.labels.plan}</span>
                    <span>{showcaseCopy.labels.natural}</span>
                  </div>

                  <span className="clinic-treatment-link">{t("treatments.seeServices")}</span>
                </div>

                <span className="clinic-treatment-card__arrow" aria-hidden="true">
                  <i className="fas fa-arrow-right" />
                </span>
              </Link>
            );
          })}
        </div>

        <div className="btn-wrap mt-50 justify-content-center">
          <Link
            scroll={false}
            href="/tretmani"
            className="btn bg-theme text-title clinic-glow-btn"
          >
            <span className="link-effect">
              <span className="effect-1">{t("treatments.allCategories")}</span>
              <span className="effect-1">{t("treatments.allCategories")}</span>
            </span>
          </Link>
          <Link
            scroll={false}
            href="/booking"
            className="btn bg-theme text-title clinic-glow-btn"
          >
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
