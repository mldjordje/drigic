"use client";

import React from "react";
import { useLocale } from "@/components/common/LocaleProvider";

const STEPS_COPY = {
  sr: {
    title: "Oblasti tretmana",
    body: "Plan tretmana je uvek personalizovan nakon konsultacije i procene.",
    categories: [
      {
        number: "01",
        title: "Lice",
        text: "Botox, hijaluron, skin booster i tretmani harmonizacije kontura.",
      },
      {
        number: "02",
        title: "Anti-age",
        text: "Individualni planovi za osvezen izgled bez neprirodnih promena.",
      },
      {
        number: "03",
        title: "Telo",
        text: "Nehirurske procedure za definiciju i unapredjenje kvaliteta koze.",
      },
      {
        number: "04",
        title: "Muska estetika",
        text: "Diskretni tretmani prilagodjeni muskoj anatomiji i ocekivanjima.",
      },
    ],
  },
  en: {
    title: "Treatment areas",
    body: "Each treatment plan is personalized after consultation and assessment.",
    categories: [
      {
        number: "01",
        title: "Face",
        text: "Botox, fillers, skinboosters and contour harmonization treatments.",
      },
      {
        number: "02",
        title: "Anti-age",
        text: "Individual plans for a fresher look without an overdone effect.",
      },
      {
        number: "03",
        title: "Body",
        text: "Non-surgical procedures for definition and improved skin quality.",
      },
      {
        number: "04",
        title: "Men's aesthetics",
        text: "Discreet treatments tailored to male anatomy and expectations.",
      },
    ],
  },
  de: {
    title: "Behandlungsbereiche",
    body: "Jeder Behandlungsplan wird nach Beratung und Analyse individuell erstellt.",
    categories: [
      {
        number: "01",
        title: "Gesicht",
        text: "Botox, Filler, Skinbooster und Behandlungen zur Konturharmonie.",
      },
      {
        number: "02",
        title: "Anti-age",
        text: "Individuelle Plaene fuer ein frischeres Aussehen ohne Uebertreibung.",
      },
      {
        number: "03",
        title: "Koerper",
        text: "Nichtoperative Verfahren fuer Kontur und bessere Hautqualitaet.",
      },
      {
        number: "04",
        title: "Maenneraesthetik",
        text: "Diskrete Behandlungen passend zu Anatomie und Erwartungen.",
      },
    ],
  },
  it: {
    title: "Aree di trattamento",
    body: "Ogni piano viene personalizzato dopo consulenza e valutazione.",
    categories: [
      {
        number: "01",
        title: "Viso",
        text: "Botox, filler, skinbooster e trattamenti per armonizzare i contorni.",
      },
      {
        number: "02",
        title: "Anti-age",
        text: "Piani individuali per un aspetto fresco senza effetti artificiali.",
      },
      {
        number: "03",
        title: "Corpo",
        text: "Procedure non chirurgiche per definizione e migliore qualita cutanea.",
      },
      {
        number: "04",
        title: "Estetica maschile",
        text: "Trattamenti discreti pensati per anatomia ed esigenze maschili.",
      },
    ],
  },
};

export default function Steps() {
  const { locale } = useLocale();
  const copy = STEPS_COPY[locale] || STEPS_COPY.sr;

  return (
    <div className="feature-area-1 space" id="tretmani">
      <div className="container">
        <div className="title-area text-center clinic-reveal">
          <h2 className="sec-title text-smoke">{copy.title}</h2>
          <p className="sec-text text-smoke mt-20">{copy.body}</p>
        </div>
        <div className="row gx-0 gy-30">
          {copy.categories.map((item, index) => (
            <div
              key={item.number}
              className={`col-lg-3 col-md-6 clinic-reveal wow ${
                index % 2 === 0 ? "img-custom-anim-left" : "img-custom-anim-right"
              } animated`}
              data-wow-duration="1.2s"
              data-wow-delay={`${0.15 + index * 0.1}s`}
            >
              <div className="process-card glass-panel h-100 clinic-float-card">
                <div className="process-card-number">{item.number}</div>
                <h4 className="process-card-title">{item.title}</h4>
                <p className="process-card-text">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
