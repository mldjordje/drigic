"use client";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import GooglePopupButton from "@/components/auth/GooglePopupButton";
import { useLocale } from "@/components/common/LocaleProvider";
import { useSession } from "@/components/common/SessionProvider";
import {
  CLINIC_ADDRESS,
  CLINIC_PHONE_DISPLAY,
  CLINIC_PHONE_TEL,
} from "@/lib/clinicContact";

gsap.registerPlugin(ScrollTrigger);

const HERO_COPY = {
  sr: {
    lines: [
      ["Estetska,", "anti-age", "i"],
      ["regenerativna", "medicina"],
    ],
    booking: "Zakaži termin",
    phone: "Telefon",
    location: "Lokacija",
  },
  en: {
    lines: [
      ["Aesthetic,", "anti-age", "and"],
      ["regenerative", "medicine"],
    ],
    booking: "Book appointment",
    phone: "Phone",
    location: "Location",
  },
  de: {
    lines: [
      ["Aesthetische,", "anti-age", "und"],
      ["regenerative", "Medizin"],
    ],
    booking: "Termin buchen",
    phone: "Telefon",
    location: "Standort",
  },
  it: {
    lines: [
      ["Medicina", "estetica,", "anti-age"],
      ["e", "rigenerativa"],
    ],
    booking: "Prenota appuntamento",
    phone: "Telefono",
    location: "Posizione",
  },
};

const CLINIC_MAP_URL =
  "https://www.google.com/maps?ll=43.323902,21.9050293&z=16&t=m&hl=sr&gl=RS&mapclient=embed&cid=16708722205926497279";

function ArrowIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M1 7.5H14M14 7.5L8 1.5M14 7.5L8 13.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8.2 3.5 5.6 4.7c-.8.4-1.2 1.3-1 2.2 1.2 6.2 6.2 11.2 12.4 12.4.9.2 1.8-.2 2.2-1l1.2-2.6c.3-.7.1-1.5-.5-1.9l-3.1-2.1c-.6-.4-1.4-.3-1.9.2l-1.2 1.2a12.2 12.2 0 0 1-4.8-4.8l1.2-1.2c.5-.5.6-1.3.2-1.9L8.2 3.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.35" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function prepareHeroVideo(video) {
  video.muted = true;
  video.defaultMuted = true;
  video.autoplay = true;
  video.loop = true;
  video.playsInline = true;
  video.controls = false;
  video.setAttribute("muted", "");
  video.setAttribute("autoplay", "");
  video.setAttribute("loop", "");
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  video.setAttribute("preload", "auto");
  video.removeAttribute("controls");
}

export default function Hero() {
  const videoRef = useRef(null);
  const { locale, t } = useLocale();
  const { user: currentUser } = useSession();
  const heroContentRef = useRef(null);
  const wordRefs = useRef([]);
  const ctaGroupRef = useRef(null);
  const founderRef = useRef(null);
  const contactRef = useRef(null);
  const heroVeilRef = useRef(null);
  const lineRevealRef = useRef(null);
  const heroWrapperRef = useRef(null);
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

  // Force play + muted on mount (fixes React muted-prop serialization + iOS/Android autoPlay)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const tryPlay = () => {
      prepareHeroVideo(video);
      video.play().catch(() => {});
    };

    prepareHeroVideo(video);
    tryPlay();

    video.addEventListener("canplay", tryPlay);
    video.addEventListener("loadedmetadata", tryPlay);
    video.addEventListener("loadeddata", tryPlay);
    window.addEventListener("focus", tryPlay);
    document.addEventListener("visibilitychange", tryPlay);

    return () => {
      video.removeEventListener("canplay", tryPlay);
      video.removeEventListener("loadedmetadata", tryPlay);
      video.removeEventListener("loadeddata", tryPlay);
      window.removeEventListener("focus", tryPlay);
      document.removeEventListener("visibilitychange", tryPlay);
    };
  }, []);

  // Spotlight — golden halo follows mouse through hero
  useEffect(() => {
    const wrapper = heroWrapperRef.current;
    if (!wrapper) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(hover: none)").matches) return;

    const onMove = (e) => {
      const r = wrapper.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      wrapper.style.setProperty("--spot-x", `${x}%`);
      wrapper.style.setProperty("--spot-y", `${y}%`);
    };

    wrapper.addEventListener("mousemove", onMove, { passive: true });
    return () => wrapper.removeEventListener("mousemove", onMove);
  }, []);

  // Resume playback on tab/visibility restore
  useEffect(() => {
    const resume = () => {
      if (document.visibilityState !== "hidden" && videoRef.current) {
        prepareHeroVideo(videoRef.current);
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
    const contact = contactRef.current;
    const veil = heroVeilRef.current;
    const line = lineRevealRef.current;

    if (!reducedMotion) {
      gsap.set(veil, { opacity: 1 });
      gsap.set(words, { yPercent: 120, rotateX: 45, opacity: 0, transformOrigin: "50% 100%", transformPerspective: 900 });
      gsap.set(line, { scaleX: 0, opacity: 0, transformOrigin: "left center" });
      gsap.set(ctaGroup, { y: 28, opacity: 0, scale: 0.92 });
      gsap.set(founder, { x: -18, opacity: 0 });
      gsap.set(contact, { y: 14, opacity: 0 });
    }

    let ctx = null;
    let fallbackTimer = null;

    function startHeroAnimation() {
      if (reducedMotion || ctx) return;

      ctx = gsap.context(() => {
        const tl = gsap.timeline();

        tl.to(veil, { opacity: 0, duration: 1.0, ease: "power2.inOut" }, 0);

        tl.to(words, {
          yPercent: 0,
          rotateX: 0,
          opacity: 1,
          duration: 0.85,
          ease: "expo.out",
          stagger: { amount: 0.42, ease: "power2.inOut" },
        }, 0.22);

        tl.to(line, { scaleX: 1, opacity: 1, duration: 0.6, ease: "power3.inOut" }, 0.78);

        tl.to(ctaGroup, { y: 0, opacity: 1, scale: 1, duration: 0.65, ease: "back.out(1.6)" }, 1.0);

        tl.to(founder, { x: 0, opacity: 1, duration: 0.52, ease: "power3.out" }, 1.22);

        tl.to(contact, { y: 0, opacity: 1, duration: 0.58, ease: "power3.out" }, 1.34);

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

    const onPreloaderDone = () => {
      clearTimeout(fallbackTimer);
      startHeroAnimation();
    };

    // Register listener FIRST to avoid race condition on slow devices
    window.addEventListener("clinic:preloader:done", onPreloaderDone, { once: true });

    const hasPreloader = !!document.querySelector(".clinic-preloader");
    if (!hasPreloader) {
      // Already gone or never present — start quickly
      fallbackTimer = setTimeout(onPreloaderDone, 80);
    } else {
      // Present — wait for event, 3s hard cap (not 8s)
      fallbackTimer = setTimeout(onPreloaderDone, 3000);
    }

    return () => {
      clearTimeout(fallbackTimer);
      window.removeEventListener("clinic:preloader:done", onPreloaderDone);
      ctx?.revert();
    };
  }, []);

  return (
    <div className="hero-wrapper hero-5" id="hero" ref={heroWrapperRef}>
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
          preload="auto"
          controls={false}
          disablePictureInPicture
          controlsList="nodownload nofullscreen noremoteplayback"
          poster="/assets/video/hero-poster.webp"
          aria-hidden="true"
        >
          <source src="/assets/video/hero.mp4"  type="video/mp4" />
          <source src="/assets/video/hero.webm" type="video/webm" />
        </video>

        {/* Overlays */}
        <div className="hero-overlay" data-overlay="title" data-opacity="5" />
        <div className="clinic-hero-modern-overlay" aria-hidden="true" />

        {/* Film grain — premium texture */}
        <div className="clinic-hero-grain" aria-hidden="true" />

        {/* Dark curtain veil — lifted by GSAP on enter */}
        <div className="clinic-hero-veil" ref={heroVeilRef} aria-hidden="true" />

        {/* Mouse-driven golden spotlight */}
        <div className="clinic-hero-spotlight" aria-hidden="true" />

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
                  <Link scroll={false} className="clinic-hero-cta-btn gsap-magnetic clinic-magnetic" href="/booking">
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

        <address ref={contactRef} className="clinic-hero-contact" aria-label="Kontakt i lokacija ordinacije">
          <a className="clinic-hero-contact__item" href={`tel:${CLINIC_PHONE_TEL}`}>
            <span className="clinic-hero-contact__icon"><PhoneIcon /></span>
            <span className="clinic-hero-contact__copy">
              <span className="clinic-hero-contact__label">{heroCopy.phone}</span>
              <span className="clinic-hero-contact__value">{CLINIC_PHONE_DISPLAY}</span>
            </span>
          </a>

          <span className="clinic-hero-contact__divider" aria-hidden="true" />

          <a
            className="clinic-hero-contact__item"
            href={CLINIC_MAP_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="clinic-hero-contact__icon"><LocationIcon /></span>
            <span className="clinic-hero-contact__copy">
              <span className="clinic-hero-contact__label">{heroCopy.location}</span>
              <span className="clinic-hero-contact__value">{CLINIC_ADDRESS}, Niš</span>
            </span>
          </a>
        </address>
      </div>
    </div>
  );
}
