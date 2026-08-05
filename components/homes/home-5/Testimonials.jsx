"use client";
import React from "react";
import GoogleReviewButton from "@/components/common/GoogleReviewButton";
import { useLocale } from "@/components/common/LocaleProvider";

const TESTIMONIALS_COPY = {
  sr: {
    title: "Utisci pacijenata",
    lead: "Sve recenzije su na Google profilu ordinacije — pročitajte ih ili ostavite svoju.",
    cta: "Ostavi recenziju na Google-u",
  },
  en: {
    title: "Patient feedback",
    lead: "All reviews live on the clinic's Google profile — read them or leave your own.",
    cta: "Leave a Google review",
  },
  de: {
    title: "Patientenstimmen",
    lead: "Alle Bewertungen finden Sie im Google-Profil der Praxis — lesen oder selbst schreiben.",
    cta: "Google-Bewertung schreiben",
  },
  it: {
    title: "Recensioni dei pazienti",
    lead: "Tutte le recensioni sono sul profilo Google dello studio — leggile o lascia la tua.",
    cta: "Lascia una recensione su Google",
  },
};

export default function Testimonials() {
  const { locale } = useLocale();
  const copy = TESTIMONIALS_COPY[locale] || TESTIMONIALS_COPY.sr;

  return (
    <div className="testimonial-area-2 space bg-gray overflow-hidden">
      <div className="container">
        <div className="title-area text-center clinic-reveal mb-0">
          <h2 className="sec-title text-smoke">{copy.title}</h2>
          <p className="clinic-review-lead">{copy.lead}</p>
          <div className="btn-wrap mt-25 justify-content-center">
            <GoogleReviewButton
              label={copy.cta}
              className="btn bg-theme text-title clinic-glow-btn"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
