"use client";
import addGsap from "@/utils/addGsap";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import GooglePopupButton from "@/components/auth/GooglePopupButton";

const HERO_TYPED_PHRASES = [
  "estetske medicine",
  "prirodnog anti-age pristupa",
  "sigurnih i preciznih tretmana",
];

export default function Hero() {
  const mobileVideoRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    document.body.classList.add("bg-title");
    return () => {
      document.body.classList.remove("bg-title");
    };
  }, []);

  useEffect(() => {
    addGsap();
  }, []);

  useEffect(() => {
    fetch("/api/me/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setCurrentUser(data?.user || null))
      .catch(() => setCurrentUser(null));
  }, []);

  useEffect(() => {
    const phrase = HERO_TYPED_PHRASES[phraseIndex];
    const atPhraseEnd = characterCount === phrase.length;
    const atPhraseStart = characterCount === 0;
    const tickDelay = isDeleting ? 42 : 80;
    const pauseDelay = atPhraseEnd ? 1100 : atPhraseStart && isDeleting ? 260 : tickDelay;

    const timeoutId = window.setTimeout(() => {
      if (!isDeleting) {
        if (characterCount < phrase.length) {
          setCharacterCount((prev) => prev + 1);
          return;
        }
        setIsDeleting(true);
        return;
      }

      if (characterCount > 0) {
        setCharacterCount((prev) => prev - 1);
        return;
      }

      setIsDeleting(false);
      setPhraseIndex((prev) => (prev + 1) % HERO_TYPED_PHRASES.length);
    }, pauseDelay);

    return () => window.clearTimeout(timeoutId);
  }, [characterCount, isDeleting, phraseIndex]);

  const heroVideoSrc = useMemo(
    () =>
      "https://www.youtube.com/embed/T2w-sqZ2_BY?autoplay=1&mute=1&controls=0&disablekb=1&loop=1&playlist=T2w-sqZ2_BY&playsinline=1&modestbranding=1&rel=0&iv_load_policy=3&fs=0&enablejsapi=1",
    []
  );

  const forcePlayMuted = useCallback(() => {
    const iframe = mobileVideoRef.current;
    const frameWindow = iframe?.contentWindow;
    if (!frameWindow) {
      return;
    }

    frameWindow.postMessage(
      JSON.stringify({
        event: "command",
        func: "mute",
        args: [],
      }),
      "*"
    );
    frameWindow.postMessage(
      JSON.stringify({
        event: "command",
        func: "playVideo",
        args: [],
      }),
      "*"
    );
  }, []);

  const triggerPlaybackWithGesture = useCallback(() => {
    forcePlayMuted();
    window.setTimeout(() => forcePlayMuted(), 220);
  }, [forcePlayMuted]);

  const typedHeadline = HERO_TYPED_PHRASES[phraseIndex].slice(0, characterCount);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      forcePlayMuted();
    }, 1800);

    return () => window.clearInterval(intervalId);
  }, [forcePlayMuted]);

  useEffect(() => {
    const resume = () => triggerPlaybackWithGesture();
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
        style={{ backgroundImage: "url(/assets/img/slika1.png)" }}
        onTouchStart={triggerPlaybackWithGesture}
        onPointerDown={triggerPlaybackWithGesture}
      >
        <div className="clinic-hero-mobile-video" aria-hidden="true">
          <iframe
            ref={mobileVideoRef}
            src={heroVideoSrc}
            title="Dr Igic hero background video"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            loading="eager"
            onLoad={forcePlayMuted}
          />
        </div>
        <div className="hero-overlay" data-overlay="title" data-opacity="5"></div>
        <div className="clinic-hero-modern-overlay" aria-hidden="true"></div>
        <div className="container">
          <div className="row">
            <div className="col-lg-9">
              <div className="hero-style5 clinic-reveal">
                <h1 className="hero-title" data-ani="slideindown" data-ani-delay="0.1s">
                  <span className="hero-title-static">Dr Igić klinika</span>
                  <span className="hero-title-typed">
                    {typedHeadline}
                    <span className="hero-title-caret" aria-hidden="true"></span>
                  </span>
                </h1>
                <div
                  className="hero-cta-group hero-cta-group-top"
                  data-ani="slideindown"
                  data-ani-delay="0.2s"
                >
                  {!currentUser ? (
                    <GooglePopupButton className="btn clinic-hero-cta-btn clinic-glow-btn" nextPath="/">
                      <span className="link-effect">
                        <span className="effect-1">LOGIN</span>
                        <span className="effect-1">LOGIN</span>
                      </span>
                    </GooglePopupButton>
                  ) : null}
                  <Link
                    scroll={false}
                    className="btn clinic-hero-cta-btn clinic-glow-btn"
                    href="/booking"
                  >
                    <span className="link-effect">
                      <span className="effect-1">ZAKAZI TERMIN</span>
                      <span className="effect-1">ZAKAZI TERMIN</span>
                    </span>
                  </Link>
                </div>
                <div className="hero-year-tag movingX" data-ani="slideindown" data-ani-delay="0.3s">
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
