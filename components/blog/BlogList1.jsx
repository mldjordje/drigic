import React from "react";
import BlogSerchbar from "./BlogSerchbar";
import Categories from "./Categories";
import Tags from "./Tags";
import Link from "next/link";
import Image from "next/image";

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("sr-RS", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function BlogList1({ posts = [] }) {
  return (
    <section className="blog__area space">
      <div className="container">
        <div className="blog__inner-wrap">
          <div className="row">
            <div className="col-70">
              <div className="blog-post-wrap">
                {posts.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "48px 0", opacity: 0.6 }}>
                    <p>Blog postovi uskoro...</p>
                  </div>
                ) : (
                  <div className="row gy-50 gutter-24">
                    {posts.map((post) => (
                      <div key={post.id} className="col-md-12">
                        <div className="blog-post-item">
                          {post.featuredImageUrl && (
                            <div className="blog-post-thumb">
                              <Link scroll={false} href={`/blog-details/${post.slug}`}>
                                <Image
                                  width={856}
                                  height={600}
                                  src={post.featuredImageUrl}
                                  alt={post.title}
                                />
                              </Link>
                            </div>
                          )}
                          <div className="blog-post-content">
                            <div className="blog-post-meta">
                              <ul className="list-wrap">
                                {post.publishedAt && <li>{formatDate(post.publishedAt)}</li>}
                                {post.category && (
                                  <li>
                                    <span>{post.category}</span>
                                  </li>
                                )}
                              </ul>
                            </div>
                            <h2 className="title">
                              <Link scroll={false} href={`/blog-details/${post.slug}`}>
                                {post.title}
                              </Link>
                            </h2>
                            {post.excerpt && (
                              <p style={{ marginBottom: 16, opacity: 0.8 }}>{post.excerpt}</p>
                            )}
                            <Link
                              scroll={false}
                              href={`/blog-details/${post.slug}`}
                              className="link-btn"
                            >
                              <span className="link-effect">
                                <span className="effect-1">PROČITAJ VIŠE</span>
                                <span className="effect-1">PROČITAJ VIŠE</span>
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
                    ))}
                  </div>
                )}
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
