import { socialMediaLinks } from "@/data/socials";
import React from "react";
import BlogSerchbar from "./BlogSerchbar";
import Categories from "./Categories";
import Tags from "./Tags";
import Image from "next/image";
import Link from "next/link";

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("sr-RS", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function BlogDetails({ post }) {
  if (!post) {
    return (
      <section className="blog__details-area space">
        <div className="container">
          <p style={{ textAlign: "center", padding: "48px 0", opacity: 0.6 }}>
            Post nije pronađen.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="blog__details-area space">
      <div className="container">
        <div className="blog__inner-wrap">
          <div className="row">
            <div className="col-70">
              <div className="blog__details-wrap">
                {post.featuredImageUrl && (
                  <div className="blog__details-thumb">
                    <Image
                      width={856}
                      height={600}
                      src={post.featuredImageUrl}
                      alt={post.title}
                    />
                  </div>
                )}
                <div className="blog__details-content">
                  <div className="blog-post-meta">
                    <ul className="list-wrap">
                      {post.publishedAt && <li>{formatDate(post.publishedAt)}</li>}
                      {post.category && (
                        <li>
                          <span>{post.category}</span>
                        </li>
                      )}
                      <li>Dr Nikola Igić</li>
                    </ul>
                  </div>
                  <h1 className="title">{post.title}</h1>
                  <div
                    className="blog-content-html"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                    style={{ lineHeight: 1.8 }}
                  />
                  <div className="blog__details-bottom">
                    <div className="row align-items-center">
                      {post.seoKeywords?.length > 0 && (
                        <div className="col-md-7">
                          <div className="post-tags">
                            <ul className="list-wrap">
                              {post.seoKeywords.slice(0, 4).map((kw, i) => (
                                <li key={i}>
                                  <span>{kw}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                      <div className="col-md-5">
                        <div className="post-share">
                          <h5 className="title">Podeli:</h5>
                          <div className="social-btn style3 justify-content-md-end">
                            {socialMediaLinks.slice(0, 3).map((elm, i) => (
                              <a key={i} href={elm.href} target="_blank" rel="noreferrer">
                                <span className="link-effect">
                                  <span className="effect-1">
                                    <i className={elm.iconClass}></i>
                                  </span>
                                  <span className="effect-1">
                                    <i className={elm.iconClass}></i>
                                  </span>
                                </span>
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="inner__page-nav mt-20 mb-n1">
                    <Link href="/blog" className="nav-btn">
                      <i className="fa fa-arrow-left"></i>
                      <span>
                        <span className="link-effect">
                          <span className="effect-1">Svi postovi</span>
                          <span className="effect-1">Svi postovi</span>
                        </span>
                      </span>
                    </Link>
                  </div>
                </div>
                <div className="blog__avatar-wrap">
                  <div className="blog__avatar-img">
                    <Link href="/nikola-igic">
                      <Image
                        width={196}
                        height={180}
                        src="/assets/img/blog/blog_avatar01.png"
                        alt="Dr Nikola Igić"
                      />
                    </Link>
                  </div>
                  <div className="blog__avatar-info">
                    <h4 className="name">
                      <Link href="/nikola-igic">Dr Nikola Igić</Link>
                    </h4>
                    <p>
                      Specijalista estetske i anti-age medicine u Nišu. Dr Igić kombinuje
                      medicinsku preciznost sa estetskim senzibilitetom kako bi postigao
                      prirodne rezultate za svakog pacijenta.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-30">
              <aside className="blog__sidebar">
                <BlogSerchbar />
                <Categories />
                <Tags />
              </aside>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
