"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";
import { useLocale } from "@/components/common/LocaleProvider";

export default function About() {
  const { t } = useLocale();

  return (
    <div
      className="about-area-1 space bg-gray shape-mockup-wrap"
      id="osnivac"
      style={{ backgroundColor: "rgba(255, 255, 255, 1)", color: "rgba(255, 255, 255, 1)" }}
    >
      <div
        className="about-img-1-1 shape-mockup img-custom-anim-left wow animated clinic-reveal"
        data-wow-duration="1.5s"
        data-wow-delay="0.1s"
        style={{ top: "-100px", left: "0px", bottom: "100px" }}
      >
        <Image
          width={844}
          height={836}
          src="/assets/img/before-after1.png"
          alt="Pre i posle tretmana"
        />
      </div>
      <div className="container">
        <div className="row align-items-center justify-content-end">
          <div className="col-lg-6">
            <div className="overflow-hidden">
              <div className="about-content-wrap fade_right glass-panel clinic-reveal">
                <div className="title-area mb-0">
                  <h2
                    className="sec-title text-smoke wow img-custom-anim-right animated"
                    data-wow-delay="0.1s"
                  >
                    {t("home.aboutTitle")}
                  </h2>
                  <p
                    className="sec-text mt-35 mb-25 text-smoke wow img-custom-anim-right animated"
                    data-wow-delay="0.2s"
                  >
                    {t("home.aboutBody")}
                  </p>
                  <h5
                    className="text-smoke mb-2 wow img-custom-anim-right animated"
                    data-wow-delay="0.3s"
                  >
                    {t("home.aboutBullet1")}
                  </h5>
                  <h5
                    className="text-smoke mb-2 wow img-custom-anim-right animated"
                    data-wow-delay="0.35s"
                  >
                    {t("home.aboutBullet2")}
                  </h5>
                  <h5
                    className="text-smoke mb-0 wow img-custom-anim-right animated"
                    data-wow-delay="0.4s"
                  >
                    {t("home.aboutBullet3")}
                  </h5>
                  <div className="btn-wrap mt-50 d-flex align-items-center gap-3">
                    <Link scroll={false} href="/booking" className="link-btn text-theme clinic-glow-btn">
                      <span className="link-effect">
                        <span className="effect-1">{t("home.reserveConsultation")}</span>
                        <span className="effect-1">{t("home.reserveConsultation")}</span>
                      </span>
                      <Image
                        width={13}
                        height={13}
                        src="/assets/img/icon/arrow-left-top.svg"
                        alt="icon"
                      />
                    </Link>
                    <Image width={138} height={55} src="/assets/img/logo.png" alt="Dr Igic logo" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
