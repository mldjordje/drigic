"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";
import { useLocale } from "@/components/common/LocaleProvider";

const BLOGS_COPY = {
  sr: {
    title: "Aktuelnosti i strucni saveti",
    cta: "SAZNAJTE VISE",
    articles: [
      {
        id: 1,
        date: "Anti-age",
        category: "Saveti",
        title: "Kako odabrati tretman koji daje prirodan rezultat",
        image: "/assets/img/blog/blog_2_1.png",
      },
      {
        id: 2,
        date: "Botox",
        category: "Vodic",
        title: "Sta ocekivati pre i posle prvog botox tretmana",
        image: "/assets/img/blog/blog_2_2.png",
      },
      {
        id: 3,
        date: "Hijaluron",
        category: "Vodic",
        title: "Harmonizacija usana i kontura bez preteranog volumena",
        image: "/assets/img/blog/blog_2_3.png",
      },
    ],
  },
  en: {
    title: "News and expert advice",
    cta: "LEARN MORE",
    articles: [
      {
        id: 1,
        date: "Anti-age",
        category: "Advice",
        title: "How to choose a treatment with a natural-looking result",
        image: "/assets/img/blog/blog_2_1.png",
      },
      {
        id: 2,
        date: "Botox",
        category: "Guide",
        title: "What to expect before and after your first botox treatment",
        image: "/assets/img/blog/blog_2_2.png",
      },
      {
        id: 3,
        date: "Fillers",
        category: "Guide",
        title: "Lip and contour harmonization without excessive volume",
        image: "/assets/img/blog/blog_2_3.png",
      },
    ],
  },
  de: {
    title: "Aktuelles und fachliche Tipps",
    cta: "MEHR ERFAHREN",
    articles: [
      {
        id: 1,
        date: "Anti-age",
        category: "Tipps",
        title: "Wie waehlt man eine Behandlung mit natuerlichem Ergebnis",
        image: "/assets/img/blog/blog_2_1.png",
      },
      {
        id: 2,
        date: "Botox",
        category: "Guide",
        title: "Was Sie vor und nach der ersten Botox-Behandlung erwarten koennen",
        image: "/assets/img/blog/blog_2_2.png",
      },
      {
        id: 3,
        date: "Filler",
        category: "Guide",
        title: "Harmonisierung von Lippen und Konturen ohne uebertriebenes Volumen",
        image: "/assets/img/blog/blog_2_3.png",
      },
    ],
  },
  it: {
    title: "Novita e consigli degli esperti",
    cta: "SCOPRI DI PIU",
    articles: [
      {
        id: 1,
        date: "Anti-age",
        category: "Consigli",
        title: "Come scegliere un trattamento dal risultato naturale",
        image: "/assets/img/blog/blog_2_1.png",
      },
      {
        id: 2,
        date: "Botox",
        category: "Guida",
        title: "Cosa aspettarsi prima e dopo il primo trattamento botox",
        image: "/assets/img/blog/blog_2_2.png",
      },
      {
        id: 3,
        date: "Filler",
        category: "Guida",
        title: "Armonizzazione di labbra e contorni senza volume eccessivo",
        image: "/assets/img/blog/blog_2_3.png",
      },
    ],
  },
};

export default function Blogs() {
  const { locale } = useLocale();
  const copy = BLOGS_COPY[locale] || BLOGS_COPY.sr;

  return (
    <section className="blog-area space" id="aktuelnosti">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-xxl-8 col-xl-8 col-lg-10">
            <div className="title-area text-center clinic-reveal">
              <h2 className="sec-title text-smoke">{copy.title}</h2>
            </div>
          </div>
        </div>
        <div className="row gy-40 justify-content-center">
          {copy.articles.map((elm, index) => (
            <div
              key={elm.id}
              className="col-lg-4 col-md-6 clinic-reveal wow img-custom-anim-top animated"
              data-wow-delay={`${0.1 + index * 0.1}s`}
            >
              <div className="blog-card style3 glass-panel h-100 clinic-hover-raise">
                <div className="blog-img clinic-media-zoom">
                  <Image width={416} height={340} src={elm.image} alt={elm.title} />
                </div>
                <div className="blog-content">
                  <div className="post-meta-item blog-meta">
                    <span>{elm.date}</span>
                    <span>{elm.category}</span>
                  </div>
                  <h4 className="blog-title">{elm.title}</h4>
                  <Link scroll={false} href="#konsultacije" className="link-btn">
                    <span className="link-effect">
                      <span className="effect-1">{copy.cta}</span>
                      <span className="effect-1">{copy.cta}</span>
                    </span>
                    <Image width={13} height={13} src="/assets/img/icon/arrow-left-top.svg" alt="icon" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
