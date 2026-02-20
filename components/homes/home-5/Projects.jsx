import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function Projects() {
  const highlights = [
    {
      id: 1,
      title: "Botox tretmani",
      text: "Suptilna relaksacija mimičnih bora za svež i odmoran izgled.",
      imageSrc: "/assets/img/slika1.png",
    },
    {
      id: 2,
      title: "Hijaluronski fileri",
      text: "Konture, volumen i hidratacija uz prirodan rezultat.",
      imageSrc: "/assets/img/normal/service_2-1.jpg",
    },
    {
      id: 3,
      title: "Before / After",
      text: "Primer realnog rezultata uz očuvanu prirodnu ekspresiju lica.",
      imageSrc: "/assets/img/before-after1.png",
    },
    {
      id: 4,
      title: "Anti-age planovi",
      text: "Kombinovani pristup za prevenciju i korekciju znakova starenja.",
      imageSrc: "/assets/img/normal/about_4-1.jpg",
    },
  ];

  return (
    <div className="project-area-5 space overflow-hidden" id="rezultati">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-xl-8 col-lg-10">
            <div className="title-area text-center clinic-reveal">
              <h2 className="sec-title text-smoke">Najtraženiji tretmani i rezultati</h2>
            </div>
          </div>
        </div>
        <div className="row gy-40 gx-30 justify-content-center">
          {highlights.map((item, index) => (
            <div
              key={item.id}
              className={`col-xl-6 col-lg-6 clinic-reveal wow ${
                index % 2 === 0 ? "img-custom-anim-left" : "img-custom-anim-right"
              } animated`}
              data-wow-duration="1.5s"
              data-wow-delay={`${0.1 + index * 0.1}s`}
            >
              <div className="portfolio-wrap style4 glass-panel h-100 clinic-hover-raise">
                <div className="portfolio-thumb wow img-custom-anim-top animated" data-wow-duration="1.2s" data-wow-delay={`${0.2 + index * 0.1}s`}>
                  <Image width={618} height={470} src={item.imageSrc} alt={item.title} />
                </div>
                <div className="portfolio-details">
                  <h3 className="portfolio-title">{item.title}</h3>
                  <ul className="portfolio-meta">
                    <li>{item.text}</li>
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="btn-wrap mt-50 justify-content-center">
          <Link scroll={false} href="#konsultacije" className="btn bg-theme text-title">
            <span className="link-effect">
              <span className="effect-1">ZAKAŽI PRVI PREGLED</span>
              <span className="effect-1">ZAKAŽI PRVI PREGLED</span>
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
