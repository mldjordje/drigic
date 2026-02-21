"use client";
import addGsap from "@/utils/addGsap";
import Link from "next/link";
import { useEffect } from "react";
import Slider from "react-slick";
import GooglePopupButton from "@/components/auth/GooglePopupButton";

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
  };

  return (
    <div className="hero-wrapper hero-5" id="hero">
      <Slider className="global-carousel" id="heroSlider5" {...sliderOptions}>
        <div>
          <div
            className="hero-slider background-image por"
            style={{ backgroundImage: "url(/assets/img/slika1.png)" }}
          >
            <div className="clinic-hero-mobile-video" aria-hidden="true">
              <iframe
                src="https://www.youtube.com/embed/T2w-sqZ2_BY?autoplay=1&mute=1&controls=0&loop=1&playlist=T2w-sqZ2_BY&playsinline=1&modestbranding=1&rel=0"
                title="Dr Igic hero background video"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="hero-overlay" data-overlay="title" data-opacity="5"></div>
            <div className="container">
              <div className="row">
                <div className="col-lg-7">
                  <div className="hero-style5 clinic-reveal">
                    <h1 className="hero-title" data-ani="slideindown" data-ani-delay="0.1s">
                      Dr Igić klinika estetske medicine
                    </h1>
                    <p className="hero-text" data-ani="slideindown" data-ani-delay="0.2s">
                      Prirodni rezultati, bez preterivanja.
                    </p>
                    <div className="hero-year-tag movingX" data-ani="slideindown" data-ani-delay="0.3s">
                      <Link scroll={false} href="/nikola-igic" className="clinic-founder-link">
                        Dr Nikola Igić
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="col-lg-5 align-self-end text-lg-end">
                  <div
                    className="text-lg-end hero-cta-group"
                    data-ani="slideindown"
                    data-ani-delay="0.3s"
                  >
                    <GooglePopupButton className="btn clinic-hero-cta-btn clinic-glow-btn" nextPath="/">
                      <span className="link-effect">
                        <span className="effect-1">LOGIN</span>
                        <span className="effect-1">LOGIN</span>
                      </span>
                    </GooglePopupButton>
                    <Link
                      scroll={false}
                      className="btn clinic-hero-cta-btn clinic-glow-btn"
                      href="#booking"
                    >
                      <span className="link-effect">
                        <span className="effect-1">ZAKAŽI TERMIN</span>
                        <span className="effect-1">ZAKAŽI TERMIN</span>
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
