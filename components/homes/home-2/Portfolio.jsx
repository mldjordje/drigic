import Image from "next/image";
import React from "react";

export default function Portfolio() {
  return (
    <div className="portfolio-area-1 space overflow-hidden" id="rezultati">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-xl-8 col-lg-10">
            <div className="title-area text-center">
              <h2 className="sec-title">Rezultati koji ostaju prirodni</h2>
              <p className="sec-text mt-30">
                Pogledajte primer harmonizacije uz očuvan prirodan izgled.
                Estetika treba da naglasi vašu autentičnost, a ne da je menja.
              </p>
            </div>
          </div>
        </div>
        <div className="row justify-content-center">
          <div className="col-xl-10">
            <div className="portfolio-wrap style2">
              <div className="portfolio-thumb">
                <Image
                  width={844}
                  height={836}
                  src="/assets/img/before-after1.png"
                  alt="Before and after tretman"
                />
              </div>
              <div className="portfolio-details">
                <ul className="portfolio-meta">
                  <li>Before / After</li>
                  <li>👩‍⚕️ Ljubav prema poslu</li>
                </ul>
                <h3 className="portfolio-title">
                  "Estetska medicina nije trend — to je moja profesija i poziv,
                  koji radim sa istom strašću svaki dan." — Dr Igić
                </h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
