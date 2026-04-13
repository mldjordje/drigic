"use client";
import Image from "next/image";
import React from "react";
import Slider from "react-slick";
import { useLocale } from "@/components/common/LocaleProvider";

const TESTIMONIALS_COPY = {
  sr: {
    title: "Utisci pacijenata",
    cta: "Ostavi recenziju na Google-u",
    items: [
      {
        text: "Pristup je vrlo profesionalan, rezultat diskretan i baš prirodan.",
        name: "Pacijentkinja",
        designation: "Hijaluronski tretman",
      },
      {
        text: "Sve je detaljno objašnjeno pre tretmana, osećao sam se potpuno sigurno.",
        name: "Pacijent",
        designation: "Botox tretman",
      },
      {
        text: "Najviše mi znači što izgledam osveženo, a i dalje kao ja.",
        name: "Pacijentkinja",
        designation: "Anti-age plan",
      },
    ],
  },
  en: {
    title: "Patient feedback",
    cta: "Leave a Google review",
    items: [
      {
        text: "The approach was highly professional and the result subtle and natural.",
        name: "Patient",
        designation: "Hyaluronic treatment",
      },
      {
        text: "Everything was explained in detail before treatment and I felt completely safe.",
        name: "Patient",
        designation: "Botox treatment",
      },
      {
        text: "What matters most is that I look fresher and still like myself.",
        name: "Patient",
        designation: "Anti-age plan",
      },
    ],
  },
  de: {
    title: "Patientenstimmen",
    cta: "Google-Bewertung schreiben",
    items: [
      {
        text: "Der Ansatz war sehr professionell und das Ergebnis dezent und natuerlich.",
        name: "Patientin",
        designation: "Hyaluron-Behandlung",
      },
      {
        text: "Alles wurde vor der Behandlung genau erklaert und ich fuehlte mich sicher.",
        name: "Patient",
        designation: "Botox-Behandlung",
      },
      {
        text: "Am meisten bedeutet mir, dass ich frischer aussehe und trotzdem ich selbst bleibe.",
        name: "Patientin",
        designation: "Anti-age Plan",
      },
    ],
  },
  it: {
    title: "Recensioni dei pazienti",
    cta: "Lascia una recensione su Google",
    items: [
      {
        text: "L'approccio e stato molto professionale e il risultato discreto e naturale.",
        name: "Paziente",
        designation: "Trattamento ialuronico",
      },
      {
        text: "Tutto e stato spiegato con chiarezza prima del trattamento e mi sono sentito al sicuro.",
        name: "Paziente",
        designation: "Trattamento botox",
      },
      {
        text: "Per me conta soprattutto apparire piu fresca restando comunque me stessa.",
        name: "Paziente",
        designation: "Piano anti-age",
      },
    ],
  },
};

export default function Testimonials() {
  const { locale } = useLocale();
  const copy = TESTIMONIALS_COPY[locale] || TESTIMONIALS_COPY.sr;
  const googleReviewUrl =
    "https://search.google.com/local/writereview?placeid=ChIJ6491w7WxVUcR_0VL_FC5jOg";

  const slickSettings = {
    slidesToShow: 1,
    dots: false,
    centerMode: true,
    centerPadding: "470px",
    arrows: false,
    autoplay: true,
    speed: 700,
    autoplaySpeed: 3600,
    responsive: [
      {
        breakpoint: 1400,
        settings: {
          centerPadding: "320px",
          centerMode: true,
        },
      },
      {
        breakpoint: 992,
        settings: {
          centerPadding: "120px",
          centerMode: true,
        },
      },
      {
        breakpoint: 576,
        settings: {
          centerPadding: "10px",
          centerMode: true,
        },
      },
    ],
  };

  return (
    <div className="testimonial-area-2 space bg-gray overflow-hidden">
      <div className="container">
        <div className="title-area text-center clinic-reveal">
          <h2 className="sec-title text-smoke">{copy.title}</h2>
          <div className="btn-wrap mt-25 justify-content-center">
            <a
              href={googleReviewUrl}
              target="_blank"
              rel="noreferrer"
              className="btn bg-theme text-title clinic-glow-btn"
              aria-label={`${copy.cta} — Dr Igić Clinic`}
            >
              {copy.cta}
            </a>
          </div>
        </div>
      </div>
      <div className="container-fluid p-0">
        <Slider {...slickSettings} className="row global-carousel testi-slider2">
          {copy.items.map((elm, i) => (
            <div key={i} className="col-lg-4 clinic-reveal">
              <div className="testi-box style2 glass-panel clinic-hover-raise">
                <div className="quote-icon">
                  <Image width={52} height={32} src="/assets/img/icon/quote.svg" alt="icon" />
                </div>
                <p className="testi-box_text">"{elm.text}"</p>
                <div className="testi-box_profile">
                  <h4 className="testi-box_name">{elm.name}</h4>
                  <span className="testi-box_desig">{elm.designation}</span>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </div>
    </div>
  );
}
