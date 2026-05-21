"use client";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import GooglePopupButton from "@/components/auth/GooglePopupButton";
import { useLocale } from "@/components/common/LocaleProvider";
import { useSession } from "@/components/common/SessionProvider";

gsap.registerPlugin(ScrollTrigger);

const HERO_COPY = {
  sr: {
    lines: [
      ["Estetska,", "anti-age", "i"],
      ["regenerativna", "medicina"],
    ],
    booking: "Zakaži termin",
  },
  en: {
    lines: [
      ["Aesthetic,", "anti-age", "and"],
      ["regenerative", "medicine"],
    ],
    booking: "Book appointment",
  },
  de: {
    lines: [
      ["Aesthetische,", "anti-age", "und"],
      ["regenerative", "Medizin"],
    ],
    booking: "Termin buchen",
  },
  it: {
    lines: [
      ["Medicina", "estetica,", "anti-age"],
      ["e", "rigenerativa"],
    ],
    booking: "Prenota appuntamento",
  },
};

function ArrowIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M1 7.5H14M14 7.5L8 1.5M14 7.5L8 13.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Hero() {
  const videoRef = useRef(null);
  const { locale, t } = useLocale();
  const { user: currentUser } = useSession();
  const heroContentRef = useRef(null);
  const wordRefs = useRef([]);
  const ctaGroupRef = useRef(null);
  const founderRef = useRef(null);
  const heroVeilRef = useRef(null);
  const lineRevealRef = useRef(null);
  const heroCopy = HERO_COPY[locale] || HERO_COPY.sr;
  const heroTitleLines = useMemo(
    () =>
      heroCopy.lines.map((lineWords, lineIndex) =>
        lineWords.map((word, wordIndex) => ({
          word,
          idx: lineIndex * 10 + wordIndex,
        }))
      ),
    [heroCopy.lines]
  );

  useEffect(() => {
    document.body.classList.add("bg-title");
    return () => document.body.classList.remove("bg-title");
  }, []);

  // Resume playback on tab/visibility restore
  useEffect(() => {
    const resume = () => {
      if (document.visibilityState !== "hidden" && videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", resume);
    return () => document.removeEventListener("visibilitychange", resume);
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const words = wordRefs.current.filter(Boolean);
    const ctaGroup = ctaGroupRef.current;
    const founder = founderRef.current;
    const veil = heroVeilRef.current;
    const line = lineRevealRef.current;

    if (!reducedMotion) {
      gsap.set(veil, { opacity: 1 });
      gsap.set(words, { yPercent: 110, opacity: 0 });
      gsap.set(line, { scaleX: 0, opacity: 0, transformOrigin: "left center" });
      gsap.set(ctaGroup, { y: 24, opacity: 0, scale: 0.94 });
      gsap.set(founder, { x: -14, opacity: 0 });
    }

    let ctx = null;
    let fallbackTimer = null;

    function startHeroAnimation() {
      if (reducedMotion) return;

      ctx = gsap.context(() => {
        const tl = gsap.timeline();

        tl.to(veil, { opacity: 0, duration: 1.0, ease: "power2.inOut" }, 0);

        tl.to(words, {
          yPercent: 0,
          opacity: 1,
          duration: 0.72,
          ease: "expo.out",
          stagger: { amount: 0.36, ease: "power1.inOut" },
        }, 0.22);

        tl.to(line, { scaleX: 1, opacity: 1, duration: 0.6, ease: "power3.inOut" }, 0.78);

        tl.to(ctaGroup, { y: 0, opacity: 1, scale: 1, duration: 0.58, ease: "back.out(1.3)" }, 0.96);

        tl.to(founder, { x: 0, opacity: 1, duration: 0.48, ease: "power3.out" }, 1.18);

        const heroEl = document.getElementById("hero");
        const contentEl = heroContentRef.current;
        if (heroEl && contentEl) {
          gsap.to(contentEl, {
            yPercent: -7,
            opacity: 0,
            ease: "none",
            scrollTrigger: {
              trigger: heroEl,
              start: "top top",
              end: "70% top",
              scrub: 1.0,
            },
          });
        }
      });
    }

    const hasPreloader = !!document.querySelector(".clinic-preloader");

    const onPreloaderDone = () => {
      clearTimeout(fallbackTimer);
      startHeroAnimation();
    };

    if (hasPreloader) {
      window.addEventListener("clinic:preloader:done", onPreloaderDone, { once: true });
      fallbackTimer = setTimeout(onPreloaderDone, 8000);
    } else {
      fallbackTimer = setTimeout(onPreloaderDone, 120);
    }

    return () => {
      clearTimeout(fallbackTimer);
      window.removeEventListener("clinic:preloader:done", onPreloaderDone);
      ctx?.revert();
    };
  }, []);

  return (
    <div className="hero-wrapper hero-5" id="hero">
      <div
        className="hero-slider por"
        style={{ background: "#020508" }}
      >
        {/* Self-hosted background video */}
        <video
          ref={videoRef}
          className="clinic-hero-video"
          autoPlay
          muted
          loop
          playsInline
          poster="/assets/video/hero-poster.webp"
          aria-hidden="true"
        >
          <source src="/assets/video/hero.webm" type="video/webm" />
          <source src="/assets/video/hero.mp4"  type="video/mp4" />
        </video>

        {/* Overlays */}
        <div className="hero-overlay" data-overlay="title" data-opacity="5" />
        <div className="clinic-hero-modern-overlay" aria-hidden="true" />

        {/* Dark curtain veil — lifted by GSAP on enter */}
        <div className="clinic-hero-veil" ref={heroVeilRef} aria-hidden="true" />

        {/* Floating ambient particles */}
        <div className="clinic-hero-particles" aria-hidden="true">
          <span className="clinic-hero-particle clinic-hero-particle--1" />
          <span className="clinic-hero-particle clinic-hero-particle--2" />
          <span className="clinic-hero-particle clinic-hero-particle--3" />
          <span className="clinic-hero-particle clinic-hero-particle--4" />
          <span className="clinic-hero-particle clinic-hero-particle--5" />
          <span className="clinic-hero-particle clinic-hero-particle--6" />
          <span className="clinic-hero-particle clinic-hero-particle--7" />
          <span className="clinic-hero-particle clinic-hero-particle--8" />
        </div>

        <div className="container">
          <div className="row">
            <div className="col-lg-9">
              <div className="hero-style5" ref={heroContentRef}>

                {/* Title — line-grouped for consistent mobile layout */}
                <h1 className="hero-title clinic-hero-title" style={{ color: "#ffffff" }}>
                  {heroTitleLines.map((lineWords, lineIdx) => (
                    <span key={lineIdx} className="clinic-hero-line">
                      {lineWords.map(({ word, idx }) => (
                        <span key={idx} className="clinic-word-clip">
                          <span
                            className="clinic-word"
                            ref={(el) => { wordRefs.current[idx] = el; }}
                            style={{ color: "#ffffff" }}
                          >
                            {word}
                          </span>
                        </span>
                      ))}
                    </span>
                  ))}
                </h1>

                {/* Horizontal accent line — sweeps in after title */}
                <div className="clinic-hero-reveal-line" ref={lineRevealRef} aria-hidden="true" />

                {/* CTA buttons */}
                <div ref={ctaGroupRef} className="hero-cta-group hero-cta-group-top">
                  {!currentUser ? (
                    <GooglePopupButton className="clinic-hero-cta-btn gsap-magnetic" nextPath="/">
                      <span className="clinic-hero-btn-inner">
                        <span className="clinic-hero-btn-label">{t("common.login")}</span>
                        <span className="clinic-hero-btn-arrow"><ArrowIcon /></span>
                      </span>
                    </GooglePopupButton>
                  ) : null}
                  <Link scroll={false} className="clinic-hero-cta-btn gsap-magnetic" href="/booking">
                    <span className="clinic-hero-btn-inner">
                      <span className="clinic-hero-btn-label">{heroCopy.booking}</span>
                      <span className="clinic-hero-btn-arrow"><ArrowIcon /></span>
                    </span>
                  </Link>
                </div>

                {/* Founder link */}
                <div ref={founderRef} className="hero-year-tag movingX">
                  <Link scroll={false} href="/nikola-igic" className="clinic-founder-link">
                    Dr Nikola Igić
                  </Link>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
