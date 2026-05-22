"use client";

import React from "react";
import Marquee from "react-fast-marquee";
import { useLocale } from "@/components/common/LocaleProvider";

const TREATMENTS = {
  sr: [
    "Botox", "Hijaluronski Fileri", "Skin Booster", "PRF Terapija",
    "PDRN — Polinukleotidi", "Mezoterapija", "Lipoliza", "Kolagen Stimulatori",
    "Egzozomi", "Anti-Age Medicina", "Muška Estetika", "Konturisanje Lica",
  ],
  en: [
    "Botox", "Hyaluronic Fillers", "Skin Booster", "PRF Therapy",
    "PDRN — Polynucleotides", "Mesotherapy", "Lipolysis", "Collagen Stimulators",
    "Exosomes", "Anti-Age Medicine", "Men's Aesthetics", "Facial Contouring",
  ],
  de: [
    "Botox", "Hyaluron Filler", "Skin Booster", "PRF Therapie",
    "PDRN — Polynukleotide", "Mesotherapie", "Lipolyse", "Kollagen Stimulatoren",
    "Exosomen", "Anti-Age Medizin", "Maenner Aesthetik", "Gesichtskonturierung",
  ],
  it: [
    "Botox", "Filler all'Acido Ialuronico", "Skin Booster", "Terapia PRF",
    "PDRN — Polinucleotidi", "Mesoterapia", "Lipolisi", "Stimolatori del Collagene",
    "Esosomi", "Medicina Anti-Age", "Estetica Maschile", "Contorno del Viso",
  ],
};

const DOT = "✦";

function MarqueeItem({ text }) {
  return (
    <span className="clinic-marquee-item">
      <span className="clinic-marquee-dot" aria-hidden="true">{DOT}</span>
      {text}
    </span>
  );
}

export default function TreatmentMarquee() {
  const { locale } = useLocale();
  const treatments = TREATMENTS[locale] || TREATMENTS.sr;

  return (
    <div className="clinic-marquee-section" aria-label="Tretmani">
      {/* Row 1 — left to right */}
      <div className="clinic-marquee-row clinic-marquee-row--top">
        <Marquee speed={38} gradient={false} pauseOnHover>
          {treatments.map((t, i) => <MarqueeItem key={i} text={t} />)}
          {treatments.map((t, i) => <MarqueeItem key={`b${i}`} text={t} />)}
        </Marquee>
      </div>

      {/* Row 2 — right to left */}
      <div className="clinic-marquee-row clinic-marquee-row--bottom">
        <Marquee speed={30} direction="right" gradient={false} pauseOnHover>
          {[...treatments].reverse().map((t, i) => <MarqueeItem key={i} text={t} />)}
          {[...treatments].reverse().map((t, i) => <MarqueeItem key={`b${i}`} text={t} />)}
        </Marquee>
      </div>
    </div>
  );
}
