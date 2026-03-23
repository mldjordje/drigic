"use client";

import Link from "next/link";
import React from "react";
import { useLocale } from "@/components/common/LocaleProvider";
import { getLocalizedCategoryCopy } from "@/lib/services/category-copy";
import { SERVICE_CATEGORY_SPECS } from "@/lib/services/category-map";

export default function Projects() {
  const { locale, t } = useLocale();

  return (
    <div className="project-area-5 space overflow-hidden" id="tretmani">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-xl-8 col-lg-10">
            <div className="title-area text-center clinic-reveal">
              <h2 className="sec-title text-smoke">{t("treatments.categoriesTitle")}</h2>
              <p className="sec-text text-smoke">{t("treatments.categoriesBody")}</p>
            </div>
          </div>
        </div>
        <div className="clinic-treatment-grid">
          {SERVICE_CATEGORY_SPECS.map((item, index) => {
            const localizedItem = getLocalizedCategoryCopy(locale, item);

            return (
              <Link
                key={item.slug}
                href={`/tretmani/${item.slug}`}
                className={`clinic-treatment-card glass-panel clinic-hover-raise clinic-reveal wow ${
                  index % 2 === 0 ? "img-custom-anim-left" : "img-custom-anim-right"
                } animated`}
                data-wow-duration="1.5s"
                data-wow-delay={`${0.1 + index * 0.06}s`}
                aria-label={`${localizedItem.name} - ${t("treatments.seeServices")}`}
              >
                <span className="clinic-treatment-card__icon" aria-hidden="true">
                  <i className={item.iconClass || "fas fa-spa"} />
                </span>
                <div className="portfolio-details clinic-treatment-card__body">
                  <h3 className="portfolio-title">{localizedItem.name}</h3>
                  <p className="portfolio-meta" style={{ marginBottom: 10 }}>
                    {localizedItem.shortDescription}
                  </p>
                  <span className="clinic-treatment-link">
                    {t("treatments.seeServices")}
                  </span>
                </div>
                <span className="clinic-treatment-card__arrow" aria-hidden="true">
                  <i className="fas fa-arrow-right" />
                </span>
              </Link>
            );
          })}
        </div>
        <div className="btn-wrap mt-50 justify-content-center">
          <Link
            scroll={false}
            href="/tretmani"
            className="btn bg-theme text-title clinic-glow-btn"
          >
            <span className="link-effect">
              <span className="effect-1">{t("treatments.allCategories")}</span>
              <span className="effect-1">{t("treatments.allCategories")}</span>
            </span>
          </Link>
          <Link
            scroll={false}
            href="/booking"
            className="btn bg-theme text-title clinic-glow-btn"
          >
            <span className="link-effect">
              <span className="effect-1">{t("treatments.bookAppointment")}</span>
              <span className="effect-1">{t("treatments.bookAppointment")}</span>
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
