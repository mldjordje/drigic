import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function About() {
  return (
    <div className="about-area-1 space bg-gray shape-mockup-wrap" id="osnivac">
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
                  <h2 className="sec-title text-smoke wow img-custom-anim-right animated" data-wow-delay="0.1s">
                    Dr Nikola Igić, osnivač klinike
                  </h2>
                  <p className="sec-text mt-35 mb-25 text-smoke wow img-custom-anim-right animated" data-wow-delay="0.2s">
                    Sertifikovani doktor estetske i anti-age medicine i
                    specijalizant plastične hirurgije. Fokus rada je bezbedna,
                    precizna i prirodna estetika, bez efekta preterivanja.
                  </p>
                  <h5 className="text-smoke mb-2 wow img-custom-anim-right animated" data-wow-delay="0.3s">Preciznost i sigurnost svakog tretmana</h5>
                  <h5 className="text-smoke mb-2 wow img-custom-anim-right animated" data-wow-delay="0.35s">Individualni plan za svako lice</h5>
                  <h5 className="text-smoke mb-0 wow img-custom-anim-right animated" data-wow-delay="0.4s">Prirodni rezultati i dugoročna harmonija</h5>
                  <div className="btn-wrap mt-50 d-flex align-items-center gap-3">
                    <Link scroll={false} href="#booking" className="link-btn text-theme clinic-glow-btn">
                      <span className="link-effect">
                        <span className="effect-1">REZERVIŠITE KONSULTACIJU</span>
                        <span className="effect-1">REZERVIŠITE KONSULTACIJU</span>
                      </span>
                      <Image
                        width={13}
                        height={13}
                        src="/assets/img/icon/arrow-left-top.svg"
                        alt="icon"
                      />
                    </Link>
                    <Image width={138} height={55} src="/assets/img/logo.png" alt="Dr Igić logo" />
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
