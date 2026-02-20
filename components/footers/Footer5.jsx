import React from "react";
import Link from "next/link";
import Image from "next/image";
import GooglePopupButton from "@/components/auth/GooglePopupButton";

export default function Footer5() {
  return (
    <footer className="footer-wrapper footer-layout5 overflow-hidden">
      <div className="footer-top space bg-theme" id="konsultacije">
        <div className="container">
          <div className="row align-items-center justify-content-between">
            <div className="col-lg-6">
              <h2 className="footer-top-title clinic-reveal">Rezervisite konsultaciju kod Dr Igica</h2>
            </div>
            <div className="col-lg-5">
              <div className="footer-top-wrap glass-panel clinic-reveal clinic-hover-raise">
                <p className="mb-30">
                  Prvi korak ka prirodnoj i sigurnoj transformaciji je razgovor
                  sa strucnjakom i personalizovan plan tretmana.
                </p>
                <div className="clinic-footer-cta-wrap">
                  <Link scroll={false} href="#booking" className="btn clinic-cta-pulse clinic-glow-btn">
                    <span className="link-effect">
                      <span className="effect-1">ZAKAZI ONLINE</span>
                      <span className="effect-1">ZAKAZI ONLINE</span>
                    </span>
                  </Link>
                  <GooglePopupButton className="btn clinic-glow-btn clinic-login-footer-btn" nextPath="/">
                    <span className="link-effect">
                      <span className="effect-1">LOGIN</span>
                      <span className="effect-1">LOGIN</span>
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
                <h3 className="widget_title mt-30">Dr Igic klinika estetske medicine</h3>
                <p className="about-text">
                  Fokus na prirodan izgled, strucan i odgovoran pristup, kao i
                  bezbednost svakog pacijenta.
                </p>
              </div>
            </div>
            <div className="col-md-6 col-xl-3 col-lg-4">
              <div className="widget widget_nav_menu footer-widget">
                <h3 className="widget_title">Brzi linkovi</h3>
                <div className="menu-all-pages-container list-column2">
                  <ul className="menu">
                    <li>
                      <a href="#tretmani">Tretmani</a>
                    </li>
                    <li>
                      <a href="#rezultati">Rezultati</a>
                    </li>
                    <li>
                      <a href="#aktuelnosti">Aktuelnosti</a>
                    </li>
                    <li>
                      <Link scroll={false} href="/contact">
                        Kontakt
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
              <p>Dr Nikola Igic, estetska i anti-age medicina</p>
            </div>
            <div className="col-md-6 align-self-center text-md-end">
              <p className="copyright-text">Copyright © {new Date().getFullYear()} Dr Igic klinika</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
