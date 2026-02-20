import Image from "next/image";
import React from "react";

export default function Features() {
  const treatments = [
    {
      icon: "/assets/img/icon/feature-icon1-1.svg",
      title: "Botox tretmani",
      text: "Suptilna relaksacija mišića za svež, odmoran izgled.",
    },
    {
      icon: "/assets/img/icon/feature-icon1-2.svg",
      title: "Hijaluronski fileri",
      text: "Naglašavanje kontura i volumena uz prirodan rezultat.",
    },
    {
      icon: "/assets/img/icon/feature-icon1-3.svg",
      title: "Anti-age pristupi",
      text: "Stimulacija mladalačkog izgleda bez preteranih zahvata.",
    },
    {
      icon: "/assets/img/icon/feature-icon1-4.svg",
      title: "Harmonizacija lica",
      text: "Tretmani koji doprinose ravnoteži i proporcijama.",
    },
  ];

  const reasons = [
    "Stručnost: sertifikovani doktor estetske i anti-age medicine i specijalizant plastične hirurgije.",
    "Prirodni rezultati: fokus na diskretnu lepotu bez efekta \"previše\".",
    "Bezbednost i preciznost: svaki tretman izveden po visokim standardima profesionalizma.",
    "Edukovan pristup: vaša lepota je informisana, planirana i personalizovana.",
  ];

  return (
    <div className="feature-area-1 space" id="prirodna-lepota">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-xl-8 col-lg-10">
            <div className="title-area text-center">
              <h2 className="sec-title">
                🌿 Prirodna lepota, bez preterivanja
              </h2>
              <p className="sec-text mt-30">
                U svetu gde se često teži preterivanju, Dr Igić se fokusira na
                skladne i diskretne rezultate. Pristup se temelji na balansu,
                harmoniji lica i individualnom planiranju tretmana kako bi vaša
                lepota izgledala prirodno i autentično.
              </p>
            </div>
          </div>
        </div>
        <div className="row justify-content-center">
          <div className="col-xl-8 col-lg-10">
            <div className="title-area text-center">
              <h3 className="sec-title">💉 Tretmani koje nudimo</h3>
            </div>
          </div>
        </div>
        <div className="row gy-4 align-items-center justify-content-center" id="tretmani">
          {treatments.map((item, i) => (
            <div key={i} className="col-xxl-5 col-md-6">
              <div className="feature-card">
                <div className="feature-card-icon">
                  <Image width={40} height={40} src={item.icon} alt="icon" />
                </div>
                <h4 className="feature-card-title">{item.title}</h4>
                <p className="feature-card-text">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="row justify-content-center mt-5">
          <div className="col-xl-10">
            <div className="pricing-card bg-smoke">
              <h4 className="pricing-card_title">📌 Zašto odabrati Dr Igića</h4>
              <div className="checklist">
                <ul>
                  {reasons.map((reason, index) => (
                    <li key={index}>
                      <i className="fas fa-check"></i> {reason}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="mt-4 mb-0">
                Svaki tretman se planira prema vašim potrebama, uz stručno
                znanje i pažljiv pristup.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
