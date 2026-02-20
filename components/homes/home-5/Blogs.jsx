import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function Blogs() {
  const articles = [
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
      category: "Vodič",
      title: "Šta očekivati pre i posle prvog botox tretmana",
      image: "/assets/img/blog/blog_2_2.png",
    },
    {
      id: 3,
      date: "Hijaluron",
      category: "Vodič",
      title: "Harmonizacija usana i kontura bez preteranog volumena",
      image: "/assets/img/blog/blog_2_3.png",
    },
  ];

  return (
    <section className="blog-area space" id="aktuelnosti">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-xxl-8 col-xl-8 col-lg-10">
            <div className="title-area text-center">
              <h2 className="sec-title text-smoke">Aktuelnosti i stručni saveti</h2>
            </div>
          </div>
        </div>
        <div className="row gy-40 justify-content-center">
          {articles.map((elm) => (
            <div key={elm.id} className="col-lg-4 col-md-6">
              <div className="blog-card style3 glass-panel h-100">
                <div className="blog-img">
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
                      <span className="effect-1">SAZNAJTE VIŠE</span>
                      <span className="effect-1">SAZNAJTE VIŠE</span>
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
