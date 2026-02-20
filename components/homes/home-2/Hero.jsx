import Image from "next/image";
import React from "react";

export default function Hero() {
  return (
    <div className="hero-wrapper hero-2" id="hero">
      <div className="hero-2-thumb wow img-custom-anim-right animated">
        <Image
          width={724}
          height={727}
          src="/assets/img/slika1.png"
          alt="Dr Igić klinika hero"
        />
      </div>
      <div className="container">
        <div className="hero-style2">
          <div className="row">
            <div className="col-lg-9">
              <h1 className="hero-title wow img-custom-anim-right animated text-white">
                ✨ Dobrodošli kod
              </h1>
              <h1 className="hero-title wow img-custom-anim-left animated text-white">
                Dr Igića
              </h1>
            </div>
            <div className="col-lg-10 offset-lg-2">
              <h1 className="hero-title wow img-custom-anim-right animated text-white">
                gde prirodna lepota dobija pravu formu
              </h1>
            </div>
            <div className="col-xxl-6 col-xl-7 col-lg-8">
              <p className="hero-text wow img-custom-anim-left animated text-white">
                Dr Nikola Igić je sertifikovani doktor estetske i anti-age
                medicine i specijalizant plastične hirurgije, posvećen
                preciznosti, sigurnosti i prirodnim rezultatima. Njegov pristup
                nije trend, to je profesija i poziv.
              </p>
              <a
                href="#konsultacije"
                className="btn style2 wow img-custom-anim-left animated"
              >
                <span className="link-effect">
                  <span className="effect-1">REZERVIŠITE KONSULTACIJU</span>
                  <span className="effect-1">REZERVIŠITE KONSULTACIJU</span>
                </span>
              </a>
            </div>
          </div>
          <div className="row justify-content-end">
            <div className="col-xxl-6 col-xl-7 col-lg-9">
              <div className="wow img-custom-anim-right animated">
                <div className="hero-contact-wrap">
                  Estetska medicina nije trend, već profesija i poziv koji Dr
                  Igić svakodnevno praktikuje sa strašću i odgovornošću prema
                  svakom pacijentu.
                </div>
                <div className="hero-contact-wrap d-flex flex-column flex-sm-row gap-3 align-items-sm-center">
                  <Image
                    width={138}
                    height={55}
                    src="/assets/img/logo.png"
                    alt="Dr Igić logo"
                  />
                  <span>Klinika estetske i anti-age medicine</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
