"use client";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
    booking: "Zakazi termin",
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
  const mobileVideoRef = useRef(null);
  const { locale, t } = useLocale();
  const { user: currentUser } = useSession();
  const [showMobileVideo, setShowMobileVideo] = useState(false);
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

  useEffect(() => {
    let timerId = null;
    const revealVideo = () => setShowMobileVideo(true);
    const hasPreloader = !!document.querySelector(".clinic-preloader");

    if (hasPreloader) {
      window.addEventListener("clinic:preloader:done", revealVideo, { once: true });
      timerId = window.setTimeout(revealVideo, 1200);
    } else {
      timerId = window.setTimeout(revealVideo, 450);
    }

    return () => {
      window.removeEventListener("clinic:preloader:done", revealVideo);
      if (timerId) {
        window.clearTimeout(timerId);
      }
    };
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const words = wordRefs.current.filter(Boolean);
    const ctaGroup = ctaGroupRef.current;
    const founder = founderRef.current;
    const veil = heroVeilRef.current;
    const line = lineRevealRef.current;

    // --- Set initial hidden state immediately (shows while preloader is up) ---
    if (!reducedMotion) {
      gsap.set(veil, { opacity: 1 });
      gsap.set(words, { yPercent: 110, opacity: 0, filter: "blur(6px)" });
      gsap.set(line, { scaleX: 0, opacity: 0, transformOrigin: "left center" });
      gsap.set(ctaGroup, { y: 30, opacity: 0, scale: 0.92 });
      gsap.set(founder, { x: -18, opacity: 0 });
    }

    let tl = null;

    function startHeroAnimation() {
      if (reducedMotion) return;

      tl = gsap.timeline();

      // 1. Veil lifts — dark curtain fades out revealing video/image
      tl.to(veil, {
        opacity: 0,
        duration: 1.1,
        ease: "power2.inOut",
      }, 0);

      // 2. Words rise from below with blur clearing — staggered per word
      tl.to(words, {
        yPercent: 0,
        opacity: 1,
        filter: "blur(0px)",
        duration: 0.85,
        ease: "expo.out",
        stagger: { amount: 0.42, ease: "power1.inOut" },
      }, 0.25);

      // 3. Horizontal accent line sweeps in left→right
      tl.to(line, {
        scaleX: 1,
        opacity: 1,
        duration: 0.7,
        ease: "power3.inOut",
      }, 0.85);

      // 4. Buttons appear — scale up from slightly small
      tl.to(ctaGroup, {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.65,
        ease: "back.out(1.4)",
      }, 1.05);

      // 5. Founder link slides in from left
      tl.to(founder, {
        x: 0,
        opacity: 1,
        duration: 0.55,
        ease: "power3.out",
      }, 1.3);

      // Scroll-driven parallax fade
      const heroEl = document.getElementById("hero");
      const contentEl = heroContentRef.current;
      if (heroEl && contentEl) {
        gsap.to(contentEl, {
          yPercent: -8,
          opacity: 0,
          ease: "none",
          scrollTrigger: {
            trigger: heroEl,
            start: "top top",
            end: "75% top",
            scrub: 1.1,
          },
        });
      }

      // Magnetic buttons — desktop/mouse only
      const isTouch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
      if (!isTouch) {
        const magnets = document.querySelectorAll(".clinic-hero-cta-btn.gsap-magnetic");
        const strength = 28;
        const moveMagnet = (e) => {
          const el = e.currentTarget;
          const b = el.getBoundingClientRect();
          gsap.to(el, {
            duration: 0.8, ease: "power3.out",
            x: ((e.clientX - b.left) / el.offsetWidth - 0.5) * strength,
            y: ((e.clientY - b.top) / el.offsetHeight - 0.5) * strength,
          });
        };
        const resetMagnet = (e) => gsap.to(e.currentTarget, { duration: 0.8, ease: "power3.out", x: 0, y: 0 });
        magnets.forEach((m) => {
          m.addEventListener("mousemove", moveMagnet);
          m.addEventListener("mouseleave", resetMagnet);
        });
        tl._magnetCleanup = () => magnets.forEach((m) => {
          m.removeEventListener("mousemove", moveMagnet);
          m.removeEventListener("mouseleave", resetMagnet);
        });
      }
    }

    // Detect if preloader is on page — if yes, wait for its event.
    // If no preloader (dev mode), start quickly.
    const hasPreloader = !!document.querySelector(".clinic-preloader");
    let fallbackTimer = null;

    const onPreloaderDone = () => {
      clearTimeout(fallbackTimer);
      startHeroAnimation();
    };

    if (hasPreloader) {
      // Real preloader present — wait for it, 8s safety fallback
      window.addEventListener("clinic:preloader:done", onPreloaderDone, { once: true });
      fallbackTimer = setTimeout(onPreloaderDone, 8000);
    } else {
      // Dev mode / no preloader — start after 120ms
      fallbackTimer = setTimeout(onPreloaderDone, 120);
    }

    return () => {
      clearTimeout(fallbackTimer);
      window.removeEventListener("clinic:preloader:done", onPreloaderDone);
      tl?._magnetCleanup?.();
      tl?.kill();
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  const heroVideoSrc = useMemo(
    () => "https://www.youtube-nocookie.com/embed/T2w-sqZ2_BY?autoplay=1&mute=1&controls=0&disablekb=1&loop=1&playlist=T2w-sqZ2_BY&playsinline=1&modestbranding=1&rel=0&iv_load_policy=3&fs=0&enablejsapi=1&vq=small",
    []
  );

  const forcePlayMuted = useCallback(() => {
    const iframe = mobileVideoRef.current;
    const frameWindow = iframe?.contentWindow;
    if (!frameWindow) return;
    frameWindow.postMessage(JSON.stringify({ event: "command", func: "mute", args: [] }), "*");
    frameWindow.postMessage(JSON.stringify({ event: "command", func: "playVideo", args: [] }), "*");
  }, []);

  const triggerPlaybackWithGesture = useCallback(() => {
    forcePlayMuted();
    window.setTimeout(() => forcePlayMuted(), 220);
    window.setTimeout(() => forcePlayMuted(), 900);
  }, [forcePlayMuted]);

  useEffect(() => {
    const retryTimer = window.setTimeout(() => forcePlayMuted(), 1200);
    return () => window.clearTimeout(retryTimer);
  }, [forcePlayMuted]);

  useEffect(() => {
    const resume = () => {
      if (document.visibilityState === "hidden") {
        return;
      }
      triggerPlaybackWithGesture();
    };
    window.addEventListener("touchstart", resume, { passive: true });
    window.addEventListener("pointerdown", resume, { passive: true });
    window.addEventListener("visibilitychange", resume);
    return () => {
      window.removeEventListener("touchstart", resume);
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("visibilitychange", resume);
    };
  }, [triggerPlaybackWithGesture]);

  return (
    <div className="hero-wrapper hero-5" id="hero">
      <div
        className="hero-slider background-image por"
        style={{ backgroundImage: "url(/assets/img/slika1.webp)" }}
        onTouchStart={triggerPlaybackWithGesture}
        onPointerDown={triggerPlaybackWithGesture}
      >
        {/* Mobile video background */}
        <div className="clinic-hero-mobile-video" aria-hidden="true">
          {showMobileVideo ? (
            <iframe
              ref={mobileVideoRef}
              src={heroVideoSrc}
              title="Dr Igic hero background video"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              loading="eager"
              onLoad={forcePlayMuted}
            />
          ) : null}
        </div>

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
