"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import GooglePopupButton from "@/components/auth/GooglePopupButton";
import { useLocale } from "@/components/common/LocaleProvider";

export default function Footer5() {
  const { t } = useLocale();

  return (
    <footer className="footer-wrapper footer-layout5 overflow-hidden">
      <div className="footer-top space bg-theme" id="konsultacije">
        <div className="container">
          <div className="row align-items-center justify-content-between">
            <div className="col-lg-6">
              <h2 className="footer-top-title clinic-reveal">{t("footer.ctaTitle")}</h2>
            </div>
            <div className="col-lg-5">
              <div className="footer-top-wrap glass-panel clinic-reveal clinic-hover-raise">
                <p className="mb-30">{t("footer.ctaBody")}</p>
                <div className="clinic-footer-cta-wrap">
                  <Link scroll={false} href="/booking" className="btn clinic-cta-pulse clinic-glow-btn">
                    <span className="link-effect">
                      <span className="effect-1">{t("footer.bookOnline")}</span>
                      <span className="effect-1">{t("footer.bookOnline")}</span>
                    </span>
                  </Link>
                  <GooglePopupButton className="btn clinic-glow-btn clinic-login-footer-btn" nextPath="/">
                    <span className="link-effect">
                      <span className="effect-1">{t("common.login")}</span>
                      <span className="effect-1">{t("common.login")}</span>
                    </span>
                  </GooglePopupButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="container">
        <div className="widget-area space-top">
          <div className="row justify-content-between">
            <div className="col-md-6 col-xl-5 col-lg-6">
              <div className="widget widget-about footer-widget">
                <Image width={138} height={55} src="/assets/img/logo.png" alt="Dr Igic logo" />
                <h3 className="widget_title mt-30">{t("footer.officeTitle")}</h3>
                <p className="about-text">{t("footer.officeBody")}</p>
              </div>
            </div>
            <div className="col-md-6 col-xl-3 col-lg-4">
              <div className="widget widget_nav_menu footer-widget">
                <h3 className="widget_title">{t("footer.quickLinks")}</h3>
                <div className="menu-all-pages-container list-column2">
                  <ul className="menu">
                    <li>
                      <Link scroll={false} href="/tretmani">
                        {t("footer.treatments")}
                      </Link>
                    </li>
                    <li>
                      <Link scroll={false} href="/rezultati">
                        {t("footer.beforeAfter")}
                      </Link>
                    </li>
                    <li>
                      <Link scroll={false} href="/blog">
                        {t("footer.news")}
                      </Link>
                    </li>
                    <li>
                      <Link scroll={false} href="/contact">
                        {t("footer.contact")}
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="container">
        <div className="copyright-wrap">
          <div className="row gy-3 justify-content-between align-items-center">
            <div className="col-md-6">
              <p>{t("footer.doctorTagline")}</p>
            </div>
            <div className="col-md-6 align-self-center text-md-end">
              <p className="copyright-text">
                Copyright © {new Date().getFullYear()} {t("footer.copyrightSuffix")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
