"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useMemo, useRef } from "react";
import { useLocale } from "@/components/common/LocaleProvider";
import { getFounderCopy } from "@/lib/content/founder-copy";

const EXP_LABEL = {
  sr: "godina iskustva",
  en: "years experience",
  de: "Jahre Erfahrung",
  it: "anni d'esperienza",
};

function NameSplit({ text }) {
  const words = text.split(" ");
  return (
    <h2 className="clinic-about-v2__name" aria-label={text}>
      {words.map((word, i) => (
        <span key={i} className="clinic-word-wrap" aria-hidden="true">
          <span className="clinic-word-inner">{word}</span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </h2>
  );
}

export default function About() {
  const { locale } = useLocale();
  const copy = useMemo(() => getFounderCopy(locale), [locale]);

  const sectionRef   = useRef(null);
  const imgColRef    = useRef(null);
  const imgWrapRef   = useRef(null);
  const badgeRef     = useRef(null);
  const eyebrowRef   = useRef(null);
  const nameWrapRef  = useRef(null);
  const ruleRef      = useRef(null);
  const summaryRef   = useRef(null);
  const credListRef  = useRef(null);
  const actionsRef   = useRef(null);

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
        const st = { trigger: sectionRef.current, start: "top 72%" };

        // Image col — dramatic clip-path reveal from left
        if (imgColRef.current) {
          gsap.fromTo(imgColRef.current,
            { clipPath: "inset(0 100% 0 0)" },
            { clipPath: "inset(0 0% 0 0)", duration: 1.3, ease: "expo.inOut",
              scrollTrigger: st }
          );
        }

        // Image inner — parallax scroll
        if (imgWrapRef.current) {
          gsap.to(imgWrapRef.current, {
            yPercent: -8,
            ease: "none",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.4,
            },
          });
        }

        // Badge pop
        if (badgeRef.current) {
          gsap.fromTo(badgeRef.current,
            { scale: 0, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.8, ease: "back.out(2.2)",
              delay: 1.05, scrollTrigger: st }
          );
        }

        // Eyebrow
        if (eyebrowRef.current) {
          gsap.fromTo(eyebrowRef.current,
            { y: 16, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.65, ease: "power3.out",
              delay: 0.22, scrollTrigger: st }
          );
        }

        // Name words — 3D unfold
        if (nameWrapRef.current) {
          const wordInners = nameWrapRef.current.querySelectorAll(".clinic-word-inner");
          gsap.fromTo(wordInners,
            { yPercent: 115, rotateX: 42, transformOrigin: "50% 100%", transformPerspective: 800 },
            { yPercent: 0, rotateX: 0, duration: 1.0, stagger: 0.09, ease: "expo.out",
              delay: 0.36, scrollTrigger: st }
          );
        }

        // Gold rule draw
        if (ruleRef.current) {
          gsap.fromTo(ruleRef.current,
            { scaleX: 0, transformOrigin: "left", opacity: 0 },
            { scaleX: 1, opacity: 1, duration: 0.9, ease: "power3.inOut",
              delay: 0.6, scrollTrigger: st }
          );
        }

        // Summary fade-up
        if (summaryRef.current) {
          gsap.fromTo(summaryRef.current,
            { y: 22, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, ease: "power3.out",
              delay: 0.7, scrollTrigger: st }
          );
        }

        // Credentials slide from left
        if (credListRef.current) {
          const items = credListRef.current.querySelectorAll(".clinic-about-v2__cred-item");
          gsap.fromTo(items,
            { x: -30, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.65, stagger: 0.1, ease: "power3.out",
              delay: 0.86, scrollTrigger: st }
          );
        }

        // CTAs
        if (actionsRef.current) {
          gsap.fromTo(actionsRef.current,
            { y: 18, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, ease: "power3.out",
              delay: 1.14, scrollTrigger: st }
          );
        }
      }, sectionRef);
    }

    init().catch(() => {});
    return () => { cancelled = true; ctx?.revert(); };
  }, []);

  return (
    <section className="clinic-about-v2" id="osnivac" ref={sectionRef}>

      {/* ── Left column: Doctor image ── */}
      <div className="clinic-about-v2__img-col" ref={imgColRef}>
        <div className="clinic-about-v2__img-wrap" ref={imgWrapRef}>
          <Image
            src="/assets/img/doctor-about.webp"
            alt={copy.imageAlt}
            fill
            style={{ objectFit: "cover", objectPosition: "center top" }}
            sizes="(max-width: 991px) 100vw, 50vw"
            priority
          />
        </div>

        {/* Gradient overlay */}
        <div className="clinic-about-v2__img-overlay" aria-hidden="true" />

        {/* Decorative corner frame */}
        <div className="clinic-about-v2__img-frame" aria-hidden="true" />

        {/* Experience badge */}
        <div className="clinic-about-v2__badge" ref={badgeRef}>
          <span className="clinic-about-v2__badge-num">7<sup>+</sup></span>
          <span className="clinic-about-v2__badge-text">
            {EXP_LABEL[locale] || EXP_LABEL.sr}
          </span>
        </div>
      </div>

      {/* ── Right column: Content ── */}
      <div className="clinic-about-v2__content">
        {/* Eyebrow */}
        <span
          className="clinic-about-v2__eyebrow"
          ref={eyebrowRef}
          data-scramble
        >
          {copy.eyebrow}
        </span>

        {/* Doctor name with word split */}
        <div ref={nameWrapRef}>
          <NameSplit text={copy.title} />
        </div>

        {/* Gold accent rule */}
        <div className="clinic-about-v2__rule" ref={ruleRef} aria-hidden="true" />

        {/* Summary */}
        <p className="clinic-about-v2__summary" ref={summaryRef}>
          {copy.summary}
        </p>

        {/* Credential list */}
        <ul className="clinic-about-v2__cred-list" ref={credListRef}>
          {copy.highlights.map((h, i) => (
            <li key={i} className="clinic-about-v2__cred-item">
              <span className="clinic-about-v2__cred-dot" aria-hidden="true" />
              <span>{h}</span>
            </li>
          ))}
        </ul>

        {/* Action buttons */}
        <div className="clinic-about-v2__actions" ref={actionsRef}>
          <Link
            href="/booking"
            className="clinic-about-v2__btn clinic-about-v2__btn--primary clinic-magnetic"
          >
            <span>{copy.primaryCta}</span>
            <span className="clinic-about-v2__btn-icon" aria-hidden="true">
              <i className="fas fa-arrow-right" />
            </span>
          </Link>
          <Link
            href="/nikola-igic"
            className="clinic-about-v2__btn clinic-about-v2__btn--ghost clinic-magnetic"
          >
            {copy.secondaryCta}
          </Link>
        </div>
      </div>
    </section>
  );
}
