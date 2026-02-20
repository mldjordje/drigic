"use client";
import { projects2 } from "@/data/portfolio";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { useRef } from "react";
import Slider from "react-slick";
export default function Portfolio() {
  const slickSettings = {
    slidesToShow: 1, // Show 1 slide at a time
    slidesToScroll: 1,
    arrows: false, // Hide navigation buttons
    infinite: true, // Enable looping
    autoplaySpeed: 3000, // 3 seconds per slide
    vertical: true, // Enable vertical scrolling
    verticalSwiping: true, // Allow vertical swipe
    draggable: true, // Enable dragging
    swipe: true, // Enable swipe
    pauseOnHover: false, // Keep autoplay running on hover
    responsive: [
      {
        breakpoint: 768, // For mobile devices
        settings: {
          vertical: false, // Switch to horizontal scrolling on mobile
          verticalSwiping: false, // Disable vertical swipe on mobile
          swipe: true, // Enable swipe gestures for mobile
          swipeToSlide: true, // Enable swipe to slide (helps in smooth navigation)
        },
      },
    ],
  };

  const sliderRef = useRef(null);

  // Handle Mouse Wheel Scroll
  const handleWheel = (e, sliderRef) => {
    if (sliderRef?.current) {
      if (e.deltaY > 0) {
        sliderRef.current.slickNext(); // Scroll down
      } else {
        sliderRef.current.slickPrev(); // Scroll up
      }
    }
  };

  return (
    <div className="project-area-12 overflow-hidden">
      <div className="container-fluid p-0">
        <div
          className="project-slider-showcase-wrap style2"
          onWheel={(e) => handleWheel(e, sliderRef)}
        >
          <Slider
            ref={sliderRef}
            {...slickSettings}
            className="row g-0 global-carousel project-slider-showcase "
          >
            {projects2.map((elm, i) => (
              <div className="col-lg-4" key={i}>
                <div className="portfolio-wrap style12">
                  <div className="portfolio-thumb">
                    <Image
                      width={1920}
                      height={800}
                      src={elm.imageSrc}
                      alt="portfolio"
                    />
                  </div>
                  <div className="portfolio-details">
                    <div className="media-left">
                      <ul className="portfolio-meta">
                        {elm.categories.map((elm2, i2) => (
                          <li key={i2}>
                            <a href="#">{elm2}</a>
                          </li>
                        ))}
                      </ul>
                      <h3 className="portfolio-title">
                        <Link
                          scroll={false}
                          href={`/project-details/${elm.id}`}
                        >
                          Decentralized Lending Platform for Students
                        </Link>
                      </h3>
                    </div>
                    <div className="portfolio-details-btn">
                      <Link
                        scroll={false}
                        href={`/project-details/${elm.id}`}
                        className="link-btn"
                      >
                        <span className="link-effect">
                          <span className="effect-1">VIEW PROJECT</span>
                          <span className="effect-1">VIEW PROJECT</span>
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
            ))}
          </Slider>
        </div>
      </div>
    </div>
  );
}
