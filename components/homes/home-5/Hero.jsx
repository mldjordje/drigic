"use client";
import addGsap from "@/utils/addGsap";
import Link from "next/link";
import { useEffect } from "react";
import Slider from "react-slick";

export default function Hero() {
  useEffect(() => {
    document.body.classList.add("bg-title");
    return () => {
      document.body.classList.remove("bg-title");
    };
  }, []);

  useEffect(() => {
    addGsap();
  }, []);

  const sliderOptions = {
    fade: true,
    slidesToShow: 1,
    arrows: false,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 6000,
  };

  return (
    <div className="hero-wrapper hero-5" id="hero">
      <Slider className="global-carousel" id="heroSlider5" {...sliderOptions}>
        <div>
          <div
            className="hero-slider background-image por"
            style={{ backgroundImage: "url(/assets/img/slika1.png)" }}
          >
            <div className="hero-overlay"></div>
            <div className="container">
              <div className="row">
                <div className="col-lg-8">
                  <div className="hero-style5 glass-panel">
                    <h1 className="hero-title" data-ani="slideindown" data-ani-delay="0.1s">
                      Dr Igić klinika estetske medicine
                    </h1>
                    <p className="hero-text" data-ani="slideindown" data-ani-delay="0.2s">
                      Prirodni rezultati, bez preterivanja.
                    </p>
                    <div className="hero-year-tag" data-ani="slideindown" data-ani-delay="0.3s">
                      <h6>Dr Nikola Igić</h6>
                    </div>
                  </div>
                </div>
                <div className="col-lg-4 align-self-end text-lg-end">
                  <div className="text-lg-end" data-ani="slideindown" data-ani-delay="0.3s">
                    <Link
                      scroll={false}
                      className="circle-btn style2 btn bg-theme text-title gsap-magnetic"
                      href="#konsultacije"
                    >
                      <span className="link-effect">
                        <span className="effect-1">
                          REZERVIŠI <br /> TERMIN
                        </span>
                        <span className="effect-1">
                          REZERVIŠI <br /> TERMIN
                        </span>
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div>
          <div
            className="hero-slider background-image por"
            style={{ backgroundImage: "url(/assets/img/before-after1.png)" }}
          >
            <div className="hero-overlay"></div>
            <div className="container">
              <div className="row">
                <div className="col-lg-8">
                  <div className="hero-style5 glass-panel">
                    <h2 className="hero-title" data-ani="slideindown" data-ani-delay="0.1s">
                      Botox, fileri i anti-age tretmani
                    </h2>
                    <p className="hero-text" data-ani="slideindown" data-ani-delay="0.2s">
                      Personalizovan plan i siguran pristup za svaki termin.
                    </p>
                    <div className="hero-year-tag" data-ani="slideindown" data-ani-delay="0.3s">
                      <h6>Zakazivanje online</h6>
                    </div>
                  </div>
                </div>
                <div className="col-lg-4 align-self-end text-lg-end">
                  <div className="text-lg-end" data-ani="slideindown" data-ani-delay="0.3s">
                    <Link
                      scroll={false}
                      className="circle-btn style2 btn bg-theme text-title gsap-magnetic"
                      href="#tretmani"
                    >
                      <span className="link-effect">
                        <span className="effect-1">
                          POGLEDAJ <br /> TRETMANE
                        </span>
                        <span className="effect-1">
                          POGLEDAJ <br /> TRETMANE
                        </span>
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Slider>
    </div>
  );
}
