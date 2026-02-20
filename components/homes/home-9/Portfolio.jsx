import { portfolioItems } from "@/data/portfolio";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function Portfolio() {
  return (
    <div className="portfolio-area-1 space-bottom overflow-hidden">
      <div className="container">
        <div className="row gy-40 gx-60 justify-content-center">
          {portfolioItems.map((item, index) => (
            <div className="col-xl-6 col-lg-6" key={index}>
              <div className="portfolio-wrap">
                <div className="portfolio-thumb">
                  <Link href={`/project-details/${item.id}`}>
                    <Image
                      alt="portfolio"
                      src={item.imgSrc}
                      width={618}
                      height={470}
                    />
                  </Link>
                </div>
                <div className="portfolio-details">
                  <h3 className="portfolio-title mb-3">
                    <Link href={`/project-details/${item.id}`}>
                      {item.title}
                    </Link>
                  </h3>
                  <ul className="portfolio-meta">
                    {item.categories.map((category, catIndex) => (
                      <li key={catIndex}>
                        <Link href={`/blog`}>{category}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
