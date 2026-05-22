"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "@/components/common/LocaleProvider";
import { getFounderCopy } from "@/lib/content/founder-copy";

function SplitHeading({ text, className }) {
  const words = text.split(" ");
  return (
    <h2 className={className} aria-label={text}>
      {words.map((word, i) => (
        <span
          key={i}
          className="clinic-word-wrap"
          style={{ "--word-delay": `${i * 0.09}s` }}
          aria-hidden="true"
        >
          <span className="clinic-word-inner">{word}</span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </h2>
  );
}

export default function About() {
  const { locale } = useLocale();
  const [expanded, setExpanded] = useState(false);
  const copy = useMemo(() => getFounderCopy(locale), [locale]);
  const visibleParagraphs = expanded ? copy.paragraphs : copy.paragraphs.slice(0, 2);

  const sectionRef = useRef(null);
  const imageRef = useRef(null);
  const contentRef = useRef(null);
  const eyebrowRef = useRef(null);
  const titleRef = useRef(null);
  const textRefs = useRef([]);
  const highlightsRef = useRef(null);
  const btnsRef = useRef(null);

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
        // Image — slide from left + parallax scroll
        if (imageRef.current) {
          gsap.fromTo(
            imageRef.current,
            { x: -70, opacity: 0 },
            {
              x: 0,
              opacity: 1,
              duration: 1.2,
              ease: "expo.out",
              scrollTrigger: { trigger: sectionRef.current, start: "top 78%" },
            }
          );
          gsap.to(imageRef.current, {
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

        // Eyebrow
        if (eyebrowRef.current) {
          gsap.fromTo(
            eyebrowRef.current,
            { y: 20, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.65,
              ease: "power3.out",
              scrollTrigger: { trigger: contentRef.current, start: "top 84%" },
            }
          );
        }

        // Title word-clips
        if (titleRef.current) {
          const wordInners = titleRef.current.querySelectorAll(".clinic-word-inner");
          gsap.fromTo(
            wordInners,
            { yPercent: 110 },
            {
              yPercent: 0,
              duration: 0.8,
              stagger: 0.07,
              ease: "expo.out",
              scrollTrigger: { trigger: contentRef.current, start: "top 82%" },
              delay: 0.1,
            }
          );
        }

        // Text paragraphs
        const texts = textRefs.current.filter(Boolean);
        if (texts.length) {
          gsap.fromTo(
            texts,
            { y: 26, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.8,
              stagger: 0.13,
              ease: "power3.out",
              scrollTrigger: { trigger: contentRef.current, start: "top 80%" },
              delay: 0.28,
            }
          );
        }

        // Highlight chips
        if (highlightsRef.current) {
          const chips = highlightsRef.current.querySelectorAll(".clinic-founder-highlight-chip");
          gsap.fromTo(
            chips,
            { scale: 0.78, opacity: 0, y: 10 },
            {
              scale: 1,
              opacity: 1,
              y: 0,
              duration: 0.5,
              stagger: 0.07,
              ease: "back.out(1.9)",
              scrollTrigger: { trigger: highlightsRef.current, start: "top 90%" },
            }
          );
        }

        // Buttons
        if (btnsRef.current) {
          gsap.fromTo(
            btnsRef.current,
            { y: 22, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.65,
              ease: "power3.out",
              scrollTrigger: { trigger: btnsRef.current, start: "top 92%" },
            }
          );
        }
      }, sectionRef);
    }

    init().catch(() => {});
    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  return (
    <div
      className="about-area-1 space bg-gray shape-mockup-wrap clinic-about-section"
      id="osnivac"
      ref={sectionRef}
    >
      <div
        className="about-img-1-1 shape-mockup"
        style={{ top: "-100px", left: "0px", bottom: "100px" }}
        ref={imageRef}
      >
        <Image
          width={844}
          height={836}
          src="/assets/img/doctor-about.webp"
          alt={copy.imageAlt}
          sizes="(max-width: 991px) 92vw, 42vw"
        />
      </div>

      <div className="container">
        <div className="row align-items-center justify-content-end">
          <div className="col-lg-6">
            <div className="overflow-hidden">
              <div className="about-content-wrap fade_right glass-panel" ref={contentRef}>
                <div className="title-area mb-0">
                  <span className="clinic-founder-eyebrow" ref={eyebrowRef}>
                    {copy.eyebrow}
                  </span>

                  <div ref={titleRef}>
                    <SplitHeading
                      text={copy.title}
                      className="sec-title clinic-about-title"
                    />
                  </div>

                  <p
                    className="sec-text mt-35 mb-25"
                    ref={(el) => { textRefs.current[0] = el; }}
                  >
                    {copy.summary}
                  </p>

                  <div className={`clinic-founder-copy${expanded ? " is-expanded" : ""}`}>
                    {visibleParagraphs.map((paragraph, index) => (
                      <p
                        key={`${index}-${paragraph.slice(0, 24)}`}
                        className="clinic-founder-paragraph"
                        ref={(el) => { textRefs.current[index + 1] = el; }}
                      >
                        {paragraph}
                      </p>
                    ))}
                    {!expanded ? <div className="clinic-founder-fade" aria-hidden="true" /> : null}
                  </div>

                  <button
                    type="button"
                    className="clinic-founder-readmore"
                    onClick={() => setExpanded((prev) => !prev)}
                  >
                    {expanded ? copy.readLess : copy.readMore}
                  </button>

                  <div className="clinic-founder-highlights" ref={highlightsRef}>
                    {copy.highlights.map((highlight) => (
                      <span key={highlight} className="clinic-founder-highlight-chip">
                        {highlight}
                      </span>
                    ))}
                  </div>

                  <div className="about-founder-btns" ref={btnsRef}>
                    <Link
                      scroll={false}
                      href="/booking"
                      className="about-founder-btn about-founder-btn--primary"
                    >
                      {copy.primaryCta}
                      <span className="about-founder-btn__icon" aria-hidden="true">
                        <i className="fas fa-arrow-right" />
                      </span>
                    </Link>
                    <Link
                      scroll={false}
                      href="/nikola-igic"
                      className="about-founder-btn about-founder-btn--ghost"
                    >
                      {copy.secondaryCta}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
