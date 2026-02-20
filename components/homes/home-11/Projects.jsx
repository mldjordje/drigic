"use client";

import { portfolioItems } from "@/data/portfolio";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import Slider from "react-slick";

export default function Projects() {
  const sliderSettings = {
    slidesToShow: 3,
    arrows: false, // Removes navigation buttons
    autoplay: true, // Enable autoplay
    autoplaySpeed: 1500, // 3 seconds per slide
    responsive: [
      {
        breakpoint: 1200, // Large screens (lg)
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 992, // Medium screens (md)
        settings: {
          slidesToShow: 1,
        },
      },
      {
        breakpoint: 768, // Small screens (sm)
        settings: {
          slidesToShow: 1,
        },
      },
      {
        breakpoint: 576, // Extra small screens (xs)
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };
  const handleWheel = (e, sliderRef) => {
    if (sliderRef?.current) {
      if (e.deltaY > 0) {
        sliderRef.current.slickNext(); // Scroll right
      } else {
        sliderRef.current.slickPrev(); // Scroll left
      }
    }
  };
  const sliderRef = useRef(null);

  return (
    <div className="project-area-11 overflow-hidden">
      <div className="container-fluid">
        <div
          className="project-slider-showcase-wrap"
          onWheel={(e) => handleWheel(e, sliderRef)}
        >
          <Slider
            {...sliderSettings}
            ref={sliderRef}
            className="row global-carousel project-slider-showcase"
          >
            {portfolioItems.slice(0, 6).map((item, i) => (
              <div key={i} className="col-lg-4">
                <div className="portfolio-wrap style6">
                  <div className="portfolio-thumb">
                    <Link href={`/project-details/${item.id}`}>
                      <Image
                        alt="portfolio"
                        src={item.imgSrc}
                        width={581}
                        height={840}
                      />
                    </Link>
                  </div>
                  <div className="portfolio-details">
                    <h3 className="portfolio-title">
                      <Link href={`/project-details/${item.id}`}>
                        {item.title}
                      </Link>
                    </h3>
                    <ul className="portfolio-meta">
                      <li>
                        <a href={`#`}>{item.categories[0]}</a>
                      </li>
                    </ul>
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
