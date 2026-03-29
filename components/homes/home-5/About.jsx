"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useMemo, useState } from "react";
import { useLocale } from "@/components/common/LocaleProvider";
import { getFounderCopy } from "@/lib/content/founder-copy";

export default function About() {
  const { locale } = useLocale();
  const [expanded, setExpanded] = useState(false);
  const copy = useMemo(() => getFounderCopy(locale), [locale]);
  const visibleParagraphs = expanded ? copy.paragraphs : copy.paragraphs.slice(0, 2);

  return (
    <div
      className="about-area-1 space bg-gray shape-mockup-wrap"
      id="osnivac"
      style={{ backgroundColor: "rgba(255, 255, 255, 1)", color: "rgba(255, 255, 255, 1)" }}
    >
      <div
        className="about-img-1-1 shape-mockup img-custom-anim-left wow animated clinic-reveal"
        data-wow-duration="1.5s"
        data-wow-delay="0.1s"
        style={{ top: "-100px", left: "0px", bottom: "100px" }}
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
              <div className="about-content-wrap fade_right glass-panel clinic-reveal">
                <div className="title-area mb-0">
                  <span className="clinic-founder-eyebrow">{copy.eyebrow}</span>
                  <h2
                    className="sec-title text-smoke wow img-custom-anim-right animated"
                    data-wow-delay="0.1s"
                  >
                    {copy.title}
                  </h2>
                  <p
                    className="sec-text mt-35 mb-25 text-smoke wow img-custom-anim-right animated"
                    data-wow-delay="0.2s"
                  >
                    {copy.summary}
                  </p>
                  <div className={`clinic-founder-copy${expanded ? " is-expanded" : ""}`}>
                    {visibleParagraphs.map((paragraph, index) => (
                      <p
                        key={`${index}-${paragraph.slice(0, 24)}`}
                        className="clinic-founder-paragraph text-smoke wow img-custom-anim-right animated"
                        data-wow-delay={`${0.25 + index * 0.05}s`}
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
                  <div className="clinic-founder-highlights">
                    {copy.highlights.map((highlight) => (
                      <span key={highlight} className="clinic-founder-highlight-chip">
                        {highlight}
                      </span>
                    ))}
                  </div>
                  <div className="btn-wrap mt-50 d-flex align-items-center gap-3">
                    <Link scroll={false} href="/booking" className="link-btn text-theme clinic-glow-btn">
                      <span className="link-effect">
                        <span className="effect-1">{copy.primaryCta}</span>
                        <span className="effect-1">{copy.primaryCta}</span>
                      </span>
                      <Image
                        width={13}
                        height={13}
                        src="/assets/img/icon/arrow-left-top.svg"
                        alt="icon"
                      />
                    </Link>
                    <Link scroll={false} href="/nikola-igic" className="clinic-treatment-link">
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
