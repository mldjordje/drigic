"use client";
import Image from "next/image";
import Link from "next/link";

export default function Footer2() {
  return (
    <footer className="footer-wrapper footer-layout2 bg-white overflow-hidden">
      <div className="container">
        <div className="widget-area space-top">
          <div className="row justify-content-between">
            <div className="col-md-6 col-xl-5 col-lg-6">
              <div className="widget widget-newsletter footer-widget">
                <Image
                  width={138}
                  height={55}
                  src="/assets/img/logo.png"
                  alt="Dr Igić logo"
                />
                <h3 className="widget_title mt-30">
                  Dr Igić klinika estetske i anti-age medicine
                </h3>
                <p>
                  Prirodna estetika, individualan plan tretmana i pažljiv
                  stručni pristup svakom pacijentu.
                </p>
              </div>
            </div>
            <div className="col-md-5 col-xl-4 col-lg-5">
              <div className="widget footer-widget widget-contact">
                <h3 className="widget_title">Kontakt i konsultacije</h3>
                <ul className="contact-info-list">
                  <li>Spremni za prirodnu i autentičnu transformaciju?</li>
                  <li>
                    <Link scroll={false} href="/contact">
                      Rezervišite termin putem kontakt forme
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="container">
        <div className="copyright-wrap">
          <div className="row gy-3 justify-content-between align-items-center">
            <div className="col-md-6">
              <p className="copyright-text">
                Copyright © {new Date().getFullYear()} Dr Igić klinika
              </p>
            </div>
            <div className="col-md-6 align-self-center text-md-end">
              <Link scroll={false} href="/contact" className="link-btn">
                <span className="link-effect">
                  <span className="effect-1">POŠALJITE UPIT</span>
                  <span className="effect-1">POŠALJITE UPIT</span>
                </span>
                <Image
                  width={13}
                  height={13}
                  src="/assets/img/icon/arrow-left-top.svg"
                  alt="icon"
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
