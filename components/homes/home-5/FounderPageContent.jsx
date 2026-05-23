"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/common/LocaleProvider";
import { getFounderCopy } from "@/lib/content/founder-copy";

const STATS = [
  {
    value: 3,
    suffix: "+",
    label: { sr: "višegodišnje iskustvo", en: "years of expertise", de: "mehrjährige Erfahrung", it: "pluriennale esperienza" },
  },
  {
    value: 98,
    suffix: "%",
    label: { sr: "zadovoljnih pacijenata", en: "satisfied patients", de: "zufriedene Patienten", it: "pazienti soddisfatti" },
  },
  {
    value: 15,
    suffix: "+",
    label: { sr: "vrsta tretmana", en: "treatment types", de: "Behandlungsarten", it: "tipi di trattamento" },
  },
];

const CRED_ICONS = ["fa-graduation-cap", "fa-stethoscope", "fa-globe", "fa-award"];

function CountUp({ target, suffix = "", duration = 1800 }) {
  const [count, setCount] = useState(0);
  const elRef = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;
        started.current = true;
        const t0 = Date.now();
        const tick = () => {
          const elapsed = Date.now() - t0;
          const p = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          setCount(Math.round(eased * target));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.6 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);

  return (
    <span ref={elRef}>
      {count}
      {suffix}
    </span>
  );
}

export default function FounderPageContent() {
  const { locale } = useLocale();
  const copy = getFounderCopy(locale);

  const heroRef = useRef(null);
  const imgColRef = useRef(null);
  const imgInnerRef = useRef(null);
  const titleRef = useRef(null);
  const eyebrowRef = useRef(null);
  const ruleRef = useRef(null);
  const summaryRef = useRef(null);
  const statsRef = useRef(null);
  const bioRef = useRef(null);
  const credsRef = useRef(null);
  const galleryRef = useRef(null);
  const ctaRef = useRef(null);

  useEffect(() => {
    let ctx = null;
    let cancelled = false;

    async function init() {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      ctx = gsap.context(() => {
        // Hero image — dramatic clip reveal
        if (imgColRef.current) {
          gsap.fromTo(
            imgColRef.current,
            { clipPath: "inset(0 100% 0 0)", opacity: 0 },
            { clipPath: "inset(0 0% 0 0)", opacity: 1, duration: 1.5, ease: "expo.inOut", delay: 0.2 }
          );
        }

        // Image parallax
        if (imgInnerRef.current && heroRef.current) {
          gsap.to(imgInnerRef.current, {
            yPercent: -10,
            ease: "none",
            scrollTrigger: {
              trigger: heroRef.current,
              start: "top top",
              end: "bottom top",
              scrub: 1.6,
            },
          });
        }

        // Eyebrow
        if (eyebrowRef.current) {
          gsap.fromTo(
            eyebrowRef.current,
            { y: 16, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, ease: "power3.out", delay: 0.55 }
          );
        }

        // Title words
        if (titleRef.current) {
          const words = titleRef.current.querySelectorAll(".fp-word");
          gsap.fromTo(
            words,
            { yPercent: 115, rotateX: 42, transformOrigin: "50% 100%", transformPerspective: 900, opacity: 0 },
            { yPercent: 0, rotateX: 0, opacity: 1, duration: 1.0, stagger: 0.1, ease: "expo.out", delay: 0.72 }
          );
        }

        // Rule
        if (ruleRef.current) {
          gsap.fromTo(
            ruleRef.current,
            { scaleX: 0, transformOrigin: "left", opacity: 0 },
            { scaleX: 1, opacity: 1, duration: 0.8, ease: "power3.inOut", delay: 1.1 }
          );
        }

        // Summary
        if (summaryRef.current) {
          gsap.fromTo(
            summaryRef.current,
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.7, ease: "power3.out", delay: 1.26 }
          );
        }

        // Stats cards
        if (statsRef.current) {
          const cards = statsRef.current.querySelectorAll(".fp-stat");
          gsap.fromTo(
            cards,
            { y: 50, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.75,
              stagger: 0.14,
              ease: "back.out(1.4)",
              scrollTrigger: { trigger: statsRef.current, start: "top 82%" },
            }
          );
        }

        // Bio paragraphs
        if (bioRef.current) {
          const paras = bioRef.current.querySelectorAll(".fp-para");
          gsap.fromTo(
            paras,
            { y: 28, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.65,
              stagger: 0.13,
              ease: "power3.out",
              scrollTrigger: { trigger: bioRef.current, start: "top 78%" },
            }
          );
        }

        // Credentials
        if (credsRef.current) {
          const items = credsRef.current.querySelectorAll(".fp-cred");
          gsap.fromTo(
            items,
            { x: -28, opacity: 0 },
            {
              x: 0,
              opacity: 1,
              duration: 0.6,
              stagger: 0.1,
              ease: "power3.out",
              scrollTrigger: { trigger: credsRef.current, start: "top 80%" },
            }
          );
        }

        // Gallery images
        if (galleryRef.current) {
          const imgs = galleryRef.current.querySelectorAll(".fp-gallery-img");
          gsap.fromTo(
            imgs,
            { scale: 1.08, opacity: 0 },
            {
              scale: 1,
              opacity: 1,
              duration: 0.9,
              stagger: 0.18,
              ease: "power3.out",
              scrollTrigger: { trigger: galleryRef.current, start: "top 82%" },
            }
          );
        }

        // CTA
        if (ctaRef.current) {
          gsap.fromTo(
            ctaRef.current,
            { y: 30, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.65,
              ease: "back.out(1.5)",
              scrollTrigger: { trigger: ctaRef.current, start: "top 88%" },
            }
          );
        }
      });
    }

    init().catch(() => {});
    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  const nameWords = copy.title.split(" ");
  const statLabels = STATS.map((s) => s.label[locale] || s.label.sr);

  return (
    <div className="fp-wrap" style={wrapStyle}>
      {/* ── HERO ── */}
      <section className="fp-hero" ref={heroRef} style={heroStyle}>
        <div className="fp-hero__img-col" ref={imgColRef} style={imgColStyle}>
          <div ref={imgInnerRef} style={imgInnerStyle}>
            <Image
              src="/assets/img/doctor-about.webp"
              alt={copy.imageAlt}
              fill
              priority
              sizes="(max-width: 991px) 100vw, 50vw"
              style={{ objectFit: "cover", objectPosition: "center top" }}
            />
          </div>
          <div style={imgOverlayStyle} aria-hidden="true" />

          {/* Experience badge */}
          <div style={badgeStyle}>
            <span style={badgeNumStyle}>3<sup>+</sup></span>
            <span style={badgeLabelStyle}>
              {{
                sr: "višegodišnje",
                en: "yrs. expertise",
                de: "J. Erfahrung",
                it: "pluriennale",
              }[locale] || "višegodišnje"}
            </span>
          </div>
        </div>

        <div className="fp-hero__content" style={heroContentStyle}>
          <span style={eyebrowStyle} ref={eyebrowRef}>{copy.eyebrow}</span>

          <div ref={titleRef} style={{ overflow: "hidden" }}>
            <h1 style={h1Style} aria-label={copy.title}>
              {nameWords.map((word, i) => (
                <span key={i} className="fp-word-clip" style={wordClipStyle}>
                  <span className="fp-word" style={wordStyle}>{word}</span>
                  {i < nameWords.length - 1 ? " " : ""}
                </span>
              ))}
            </h1>
          </div>

          <div ref={ruleRef} style={ruleStyle} aria-hidden="true" />

          <p ref={summaryRef} style={summaryHeroStyle}>{copy.summary}</p>

          <div style={heroCtaStyle}>
            <Link href="/booking" className="clinic-magnetic" style={primaryBtnStyle}>
              {copy.primaryCta}
              <i className="fas fa-arrow-right" style={{ marginLeft: 10 }} aria-hidden="true" />
            </Link>
            <Link href="/" style={ghostBtnStyle}>
              ← {locale === "sr" ? "Početna" : locale === "en" ? "Home" : locale === "de" ? "Startseite" : "Home"}
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section ref={statsRef} style={statsSectionStyle}>
        <div style={statsGridStyle}>
          {STATS.map((stat, i) => (
            <div key={i} className="fp-stat" style={statCardStyle}>
              <span style={statNumStyle}>
                <CountUp target={stat.value} suffix={stat.suffix} />
              </span>
              <span style={statLabelStyle}>{statLabels[i]}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── BIO ── */}
      <section style={bioSectionStyle} ref={bioRef}>
        <div style={bioInnerStyle}>
          <h2 style={sectionTitleStyle}>
            {locale === "sr" ? "O doktoru" : locale === "en" ? "About the doctor" : locale === "de" ? "Über den Arzt" : "Sul medico"}
          </h2>
          {copy.paragraphs.map((para, i) => (
            <p key={i} className="fp-para" style={paraStyle}>{para}</p>
          ))}
        </div>

        {/* Credentials */}
        <div style={credColStyle} ref={credsRef}>
          <h3 style={credTitleStyle}>
            {locale === "sr" ? "Pristup i vrednosti" : locale === "en" ? "Approach & values" : locale === "de" ? "Ansatz & Werte" : "Approccio & valori"}
          </h3>
          <ul style={credListStyle}>
            {copy.highlights.map((h, i) => (
              <li key={i} className="fp-cred" style={credItemStyle}>
                <span style={credDotStyle} aria-hidden="true">
                  <i className={`fas ${CRED_ICONS[i] || "fa-check"}`} style={{ fontSize: 14 }} />
                </span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── GALLERY ── */}
      <section style={gallerySectionStyle} ref={galleryRef}>
        <h2 style={{ ...sectionTitleStyle, textAlign: "center", marginBottom: 32 }}>
          {locale === "sr" ? "Rezultati" : locale === "en" ? "Results" : locale === "de" ? "Ergebnisse" : "Risultati"}
        </h2>
        <div style={galleryGridStyle}>
          <div className="fp-gallery-img" style={galleryImgWrapStyle}>
            <Image
              src="/assets/img/doctor-about.webp"
              alt={copy.imageAlt}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              style={{ objectFit: "cover", objectPosition: "center top" }}
            />
          </div>
          <div className="fp-gallery-img" style={galleryImgWrapStyle}>
            <Image
              src="/assets/img/before-after1.webp"
              alt="Pre i posle tretmana"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              style={{ objectFit: "cover", objectPosition: "center" }}
            />
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={ctaSectionStyle} ref={ctaRef}>
        <div style={ctaBoxStyle}>
          <h2 style={ctaTitleStyle}>
            {locale === "sr"
              ? "Zakažite konsultaciju"
              : locale === "en"
              ? "Book a consultation"
              : locale === "de"
              ? "Beratung buchen"
              : "Prenota consulenza"}
          </h2>
          <p style={ctaSubStyle}>
            {locale === "sr"
              ? "Individualan pristup svakom pacijentu — početak je uvek razgovor."
              : locale === "en"
              ? "An individual approach for every patient — it always starts with a conversation."
              : locale === "de"
              ? "Ein individueller Ansatz für jeden Patienten — es beginnt immer mit einem Gespräch."
              : "Un approccio individuale per ogni paziente — inizia sempre con una conversazione."}
          </p>
          <Link href="/booking" className="clinic-magnetic clinic-glow-btn" style={ctaBtnStyle}>
            {copy.primaryCta}
            <i className="fas fa-arrow-right" style={{ marginLeft: 10 }} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}

/* ─── Inline styles ─────────────────────────────────────── */

const wrapStyle = {
  background: "#0a0b0e",
  color: "#e4eaf4",
  minHeight: "100vh",
};

const heroStyle = {
  display: "grid",
  gridTemplateColumns: "1fr",
  minHeight: "100svh",
  position: "relative",
};

const imgColStyle = {
  position: "relative",
  overflow: "hidden",
  minHeight: "60vw",
  maxHeight: "100svh",
};

const imgInnerStyle = {
  position: "absolute",
  inset: "-10% 0 0",
  overflow: "hidden",
};

const imgOverlayStyle = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(to bottom, rgba(10,11,14,0.25) 0%, rgba(10,11,14,0.55) 60%, rgba(10,11,14,0.92) 100%)",
  zIndex: 1,
};

const badgeStyle = {
  position: "absolute",
  bottom: "6%",
  right: "5%",
  zIndex: 3,
  background: "rgba(200,169,110,0.12)",
  border: "1px solid rgba(200,169,110,0.45)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  borderRadius: 16,
  padding: "14px 18px",
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 2,
  minWidth: 90,
};

const badgeNumStyle = {
  fontSize: "clamp(2rem, 6vw, 2.8rem)",
  fontWeight: 800,
  lineHeight: 1,
  color: "#c8a96e",
  letterSpacing: "-0.02em",
};

const badgeLabelStyle = {
  fontSize: 11,
  fontWeight: 600,
  color: "rgba(200,169,110,0.85)",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
};

const heroContentStyle = {
  position: "relative",
  zIndex: 2,
  padding: "clamp(48px, 8vw, 80px) clamp(20px, 6vw, 72px)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  gap: 18,
  background: "#0a0b0e",
};

const eyebrowStyle = {
  display: "inline-block",
  fontSize: "clamp(10px, 2vw, 12px)",
  fontWeight: 700,
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: "#c8a96e",
  padding: "5px 14px",
  border: "1px solid rgba(200,169,110,0.35)",
  borderRadius: 40,
  width: "fit-content",
};

const h1Style = {
  margin: 0,
  fontSize: "clamp(2.4rem, 7vw, 4.8rem)",
  fontWeight: 800,
  lineHeight: 1.08,
  letterSpacing: "-0.02em",
  color: "#ffffff",
  display: "flex",
  flexWrap: "wrap",
  gap: "0 0.22em",
};

const wordClipStyle = {
  overflow: "hidden",
  display: "inline-block",
  verticalAlign: "bottom",
};

const wordStyle = {
  display: "inline-block",
  willChange: "transform",
};

const ruleStyle = {
  width: "clamp(56px, 12vw, 100px)",
  height: 2,
  background: "linear-gradient(90deg, #c8a96e 0%, rgba(200,169,110,0.12) 100%)",
  borderRadius: 2,
};

const summaryHeroStyle = {
  margin: 0,
  fontSize: "clamp(0.95rem, 2.2vw, 1.1rem)",
  lineHeight: 1.7,
  color: "rgba(228,234,244,0.78)",
  maxWidth: 520,
};

const heroCtaStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
  paddingTop: 8,
};

const primaryBtnStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "13px 26px",
  borderRadius: 999,
  background: "linear-gradient(135deg, #c8a96e 0%, #a8874e 100%)",
  color: "#0a0b0e",
  fontWeight: 800,
  fontSize: 13,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  textDecoration: "none",
  border: "none",
  cursor: "pointer",
  transition: "opacity 0.2s",
};

const ghostBtnStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "13px 26px",
  borderRadius: 999,
  border: "1px solid rgba(200,169,110,0.35)",
  color: "rgba(228,234,244,0.8)",
  fontWeight: 600,
  fontSize: 13,
  letterSpacing: "0.04em",
  textDecoration: "none",
  transition: "border-color 0.25s",
};

/* Stats */
const statsSectionStyle = {
  padding: "clamp(40px, 8vw, 72px) clamp(16px, 6vw, 56px)",
  borderTop: "1px solid rgba(200,169,110,0.12)",
  borderBottom: "1px solid rgba(200,169,110,0.12)",
  background: "rgba(200,169,110,0.04)",
};

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 24,
  maxWidth: 860,
  margin: "0 auto",
};

const statCardStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 6,
  textAlign: "center",
  padding: "24px 16px",
  borderRadius: 16,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.07)",
};

const statNumStyle = {
  fontSize: "clamp(2.2rem, 6vw, 3.2rem)",
  fontWeight: 800,
  color: "#c8a96e",
  letterSpacing: "-0.02em",
  lineHeight: 1,
};

const statLabelStyle = {
  fontSize: 13,
  fontWeight: 500,
  color: "rgba(228,234,244,0.6)",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

/* Bio */
const bioSectionStyle = {
  padding: "clamp(56px, 10vw, 100px) clamp(16px, 6vw, 56px)",
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "clamp(40px, 6vw, 64px)",
  maxWidth: 1100,
  margin: "0 auto",
};

const bioInnerStyle = {
  display: "grid",
  gap: 20,
};

const sectionTitleStyle = {
  margin: 0,
  fontSize: "clamp(1.5rem, 4vw, 2.4rem)",
  fontWeight: 700,
  color: "#ffffff",
  letterSpacing: "-0.01em",
};

const paraStyle = {
  margin: 0,
  lineHeight: 1.75,
  color: "rgba(228,234,244,0.72)",
  fontSize: "clamp(0.92rem, 2vw, 1.05rem)",
};

const credColStyle = {
  display: "grid",
  gap: 16,
};

const credTitleStyle = {
  margin: 0,
  fontSize: "clamp(1.1rem, 3vw, 1.5rem)",
  fontWeight: 700,
  color: "#ffffff",
};

const credListStyle = {
  margin: 0,
  padding: 0,
  listStyle: "none",
  display: "grid",
  gap: 14,
};

const credItemStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: 14,
  fontSize: "clamp(0.9rem, 2vw, 1rem)",
  color: "rgba(228,234,244,0.82)",
  lineHeight: 1.55,
};

const credDotStyle = {
  width: 36,
  height: 36,
  borderRadius: "50%",
  background: "rgba(200,169,110,0.12)",
  border: "1px solid rgba(200,169,110,0.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#c8a96e",
  flexShrink: 0,
  marginTop: 1,
};

/* Gallery */
const gallerySectionStyle = {
  padding: "clamp(40px, 8vw, 80px) clamp(16px, 5vw, 48px)",
  maxWidth: 1100,
  margin: "0 auto",
};

const galleryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 18,
};

const galleryImgWrapStyle = {
  position: "relative",
  aspectRatio: "4/5",
  overflow: "hidden",
  borderRadius: 18,
  background: "#111316",
};

/* CTA */
const ctaSectionStyle = {
  padding: "clamp(60px, 10vw, 100px) clamp(16px, 6vw, 56px)",
  borderTop: "1px solid rgba(255,255,255,0.07)",
};

const ctaBoxStyle = {
  maxWidth: 640,
  margin: "0 auto",
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 20,
};

const ctaTitleStyle = {
  margin: 0,
  fontSize: "clamp(1.6rem, 4.5vw, 2.8rem)",
  fontWeight: 800,
  color: "#ffffff",
  letterSpacing: "-0.02em",
};

const ctaSubStyle = {
  margin: 0,
  fontSize: "clamp(0.9rem, 2vw, 1.05rem)",
  color: "rgba(228,234,244,0.65)",
  lineHeight: 1.7,
  maxWidth: 460,
};

const ctaBtnStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "16px 36px",
  borderRadius: 999,
  background: "linear-gradient(135deg, #c8a96e 0%, #a8874e 100%)",
  color: "#0a0b0e",
  fontWeight: 800,
  fontSize: 14,
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  textDecoration: "none",
  border: "none",
  cursor: "pointer",
  marginTop: 8,
};
