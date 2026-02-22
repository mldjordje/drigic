import Link from "next/link";
import React from "react";
import { SERVICE_CATEGORY_SPECS } from "@/lib/services/category-map";

export default function Projects() {
  return (
    <div className="project-area-5 space overflow-hidden" id="tretmani">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-xl-8 col-lg-10">
            <div className="title-area text-center clinic-reveal">
              <h2 className="sec-title text-smoke">Tretmani po kategorijama</h2>
              <p className="sec-text text-smoke">
                Za svaku kategoriju postoji posebna stranica sa svim aktivnim uslugama.
              </p>
            </div>
          </div>
        </div>
        <div className="clinic-treatment-grid">
          {SERVICE_CATEGORY_SPECS.map((item, index) => (
            <div
              key={item.slug}
              className={`clinic-treatment-card glass-panel clinic-hover-raise clinic-reveal wow ${
                index % 2 === 0 ? "img-custom-anim-left" : "img-custom-anim-right"
              } animated`}
              data-wow-duration="1.5s"
              data-wow-delay={`${0.1 + index * 0.06}s`}
            >
              <div className="portfolio-details">
                <h3 className="portfolio-title">{item.name}</h3>
                <p className="portfolio-meta" style={{ marginBottom: 10 }}>
                  {item.shortDescription}
                </p>
                <Link href={`/tretmani/${item.slug}`} className="clinic-treatment-link">
                  Pogledaj usluge
                </Link>
              </div>
            </div>
          ))}
        </div>
        <div className="btn-wrap mt-50 justify-content-center">
          <Link
            scroll={false}
            href="/tretmani"
            className="btn bg-theme text-title clinic-glow-btn"
          >
            <span className="link-effect">
              <span className="effect-1">SVE KATEGORIJE</span>
              <span className="effect-1">SVE KATEGORIJE</span>
            </span>
          </Link>
          <Link
            scroll={false}
            href="#booking"
            className="btn bg-theme text-title clinic-glow-btn"
          >
            <span className="link-effect">
              <span className="effect-1">ZAKAZI TERMIN</span>
              <span className="effect-1">ZAKAZI TERMIN</span>
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
