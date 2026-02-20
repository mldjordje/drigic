"use client";
import { categories, products, socialLinks, tags } from "@/data/products";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import Pagination from "../common/Pagination";
import Slider from "rc-slider";
import { useContextElement } from "@/context/Context";
export default function Shop() {
  const [value, setValue] = useState([40, 140]);
  const { addProductToCart, isAddedToCartProducts } = useContextElement();
  return (
    <section className="shop__area space">
      <div className="container">
        <div className="shop__inner-wrap">
          <div className="row">
            <div className="col-70">
              <div className="shop-sort-bar">
                <div className="row justify-content-between align-items-center">
                  <div className="col-sm-auto">
                    <p className="woocommerce-result-count">
                      Showing 1–12 of 27 results
                    </p>
                  </div>
                  <div className="col-sm-auto">
                    <form className="woocommerce-ordering" method="get">
                      <select
                        name="orderby"
                        className="orderby"
                        aria-label="Shop order"
                      >
                        <option value="menu_order">Short by latest</option>
                        <option value="popularity">Sort by popularity</option>
                        <option value="rating">Sort by average rating</option>
                        <option value="price">
                          Sort by price: low to high
                        </option>
                        <option value="price-desc">
                          Sort by price: high to low
                        </option>
                      </select>
                    </form>
                  </div>
                </div>
              </div>
              <div className="row gy-60">
                {products.map((product, index) => (
                  <div className="col-sm-6" key={index}>
                    <div className="product-card">
                      <div className="product-img">
                        <img
                          alt="Product Image"
                          src={product.imgSrc}
                          width={416}
                          height={440}
                        />
                        <div className="actions">
                          <a
                            className="btn"
                            onClick={() => addProductToCart(product.id)}
                          >
                            <span className="link-effect">
                              <span className="effect-1">
                                {isAddedToCartProducts(product.id)
                                  ? "ALREADY ADDED"
                                  : "ADD TO CART"}
                              </span>
                              <span className="effect-1">
                                {isAddedToCartProducts(product.id)
                                  ? "ALREADY ADDED"
                                  : "ADD TO CART"}
                              </span>
                            </span>
                          </a>
                        </div>
                        {product.isSale && <div className="tag">SALE</div>}
                      </div>
                      <div className="product-content">
                        <h3 className="product-title">
                          <Link href={`/shop-details/${product.id}`}>
                            {product.title}
                          </Link>
                        </h3>
                        <span className="price">
                          {product.originalPrice && (
                            <del>€{product.originalPrice.toFixed(2)}</del>
                          )}{" "}
                          €{product.price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pagination-wrap mt-80">
                <nav aria-label="Page navigation example">
                  <ul className="pagination list-wrap">
                    <Pagination />
                  </ul>
                </nav>
              </div>
            </div>
            <div className="col-30">
              <aside className="shop__sidebar">
                <div className="sidebar__widget sidebar__widget-two">
                  <div className="sidebar__search">
                    <form action="#">
                      <input type="text" placeholder="Search . . ." />
                      <button type="submit">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="none"
                        >
                          <path
                            d="M19.0002 19.0002L14.6572 14.6572M14.6572 14.6572C15.4001 13.9143 15.9894 13.0324 16.3914 12.0618C16.7935 11.0911 17.0004 10.0508 17.0004 9.00021C17.0004 7.9496 16.7935 6.90929 16.3914 5.93866C15.9894 4.96803 15.4001 4.08609 14.6572 3.34321C13.9143 2.60032 13.0324 2.01103 12.0618 1.60898C11.0911 1.20693 10.0508 1 9.00021 1C7.9496 1 6.90929 1.20693 5.93866 1.60898C4.96803 2.01103 4.08609 2.60032 3.34321 3.34321C1.84288 4.84354 1 6.87842 1 9.00021C1 11.122 1.84288 13.1569 3.34321 14.6572C4.84354 16.1575 6.87842 17.0004 9.00021 17.0004C11.122 17.0004 13.1569 16.1575 14.6572 14.6572Z"
                            stroke="currentcolor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </form>
                  </div>
                </div>
                <div className="sidebar__widget">
                  <h4 className="sidebar__widget-title">Categories</h4>
                  <div className="sidebar__cat-list">
                    <ul className="list-wrap">
                      {categories.map((category, index) => (
                        <li key={index}>
                          <a href="#">
                            {category.name} ({category.count})
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="sidebar__widget">
                  <h4 className="sidebar__widget-title">Filter by Price</h4>
                  <div className="widget_price_filter">
                    <div className="price_slider_wrapper">
                      <Slider
                        range
                        max={200}
                        min={0}
                        value={value}
                        onChange={setValue}
                      />
                      <div className="price_label mt-3">
                        Price: <span className="from">${value[0]}</span> —
                        <span className="to">${value[1]}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="sidebar__widget">
                  <h4 className="sidebar__widget-title">Tags</h4>
                  <div className="sidebar__tag-list">
                    <ul className="list-wrap">
                      {tags.map((tag, index) => (
                        <li key={index}>
                          <a href="#">{tag}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="sidebar__widget">
                  <h4 className="sidebar__widget-title mb-20">Share</h4>
                  <div className="social-btn style3">
                    {socialLinks.map((link, index) => (
                      <a href={link.url} key={index}>
                        <span className="link-effect">
                          <span className="effect-1">
                            <i className={link.icon} />
                          </span>
                          <span className="effect-1">
                            <i className={link.icon} />
                          </span>
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
