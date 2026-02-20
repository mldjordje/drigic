"use client";

import { useContextElement } from "@/context/Context";
import { products } from "@/data/products";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Slider from "react-slick";

export default function ShopDetails({ product }) {
  const mainSliderRef = useRef(null);
  const thumbSliderRef = useRef(null);
  const [nav1, setNav1] = useState(null);
  const [nav2, setNav2] = useState(null);

  // Set slider refs after component mounts
  useEffect(() => {
    setNav1(mainSliderRef.current);
    setNav2(thumbSliderRef.current);
  }, []);

  // Main Slider Settings
  const mainSliderSettings = {
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    infinite: true,

    autoplaySpeed: 3000,

    asNavFor: nav2, // Sync with thumbnail slider
  };

  // Thumbnail Slider Settings
  const thumbSliderSettings = {
    slidesToShow: 3, // Show 3 thumbnails at a time

    asNavFor: nav1, // Sync with main slider

    focusOnSelect: true, // Click to navigate
    infinite: true, // Loop enabled
    arrows: false, // Hide navigation buttons
    // centerMode: true, // Center active thumbnail
    responsive: [
      {
        breakpoint: 992, // Medium (md)
        settings: { slidesToShow: 3 },
      },
      {
        breakpoint: 768, // Small (sm)
        settings: { slidesToShow: 3 },
      },
      {
        breakpoint: 576, // Extra Small (xs)
        settings: { slidesToShow: 2 },
      },
    ],
  };
  const settings = {
    slidesToShow: 3,
    slidesToScroll: 1,
    arrows: false,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2,
        },
      },
    ],
  };
  let slidesData = [
    {
      src: "/assets/img/product/product_details_1_1.jpg",
      alt: "Product Image",
    },
    {
      src: "/assets/img/product/product_details_1_2.jpg",
      alt: "Product Image",
    },
    {
      src: "/assets/img/product/product_details_1_3.jpg",
      alt: "Product Image",
    },
    {
      src: "/assets/img/product/product_details_1_1.jpg",
      alt: "Product Image",
    },
    {
      src: "/assets/img/product/product_details_1_2.jpg",
      alt: "Product Image",
    },
    {
      src: "/assets/img/product/product_details_1_3.jpg",
      alt: "Product Image",
    },
  ];
  slidesData = slidesData.filter((elm) => elm.src != product.imgSrc);
  slidesData[0].src = product.imgSrc;
  const [value, setValue] = useState(1);
  const {
    productQuantityInCart,
    addProductToCart,
    isAddedToCartProducts,
    updateQuantity,
  } = useContextElement();
  return (
    <section className="shop__area space">
      <div className="container">
        <div className="row gx-60 gy-60">
          <div className="col-xl-6">
            <div className="product-big-img">
              <Slider
                {...mainSliderSettings}
                ref={mainSliderRef}
                className="global-carousel "
              >
                {slidesData.map((slide, index) => (
                  <div className="slide" key={index}>
                    <div className="img">
                      <Image
                        alt={slide.alt}
                        src={slide.src}
                        width={636}
                        height={640}
                      />
                    </div>
                  </div>
                ))}
              </Slider>
              <div className="tag">SALE</div>
            </div>
            <Slider
              className="row global-carousel product-small-img product-thumb-slider"
              {...thumbSliderSettings}
              ref={thumbSliderRef}
            >
              {slidesData.map((slide, i) => (
                <div key={i} className="col-lg-4 slide-thumb">
                  <div className="img">
                    <Image
                      alt="Product Image"
                      src={slide.src}
                      width={636}
                      height={640}
                    />
                  </div>
                </div>
              ))}
            </Slider>
          </div>
          <div className="col-xl-6">
            <div className="product-about">
              <h2 className="product-title">{product.title}</h2>
              <div className="product-rating">
                <div
                  className="star-rating"
                  role="img"
                  aria-label="Rated 5.00 out of 5"
                >
                  <span style={{ width: "100%" }}>
                    Rated <strong className="rating">5.00</strong> out of 5
                    based on <span className="rating">1</span> customer rating
                  </span>
                </div>
                <a href={`#`} className="woocommerce-review-link">
                  (<span className="count">1</span> customer reviews)
                </a>
              </div>
              <p className="price">
                {product.originalPrice && (
                  <del>€{product.originalPrice.toFixed(2)}</del>
                )}{" "}
                €{product.price.toFixed(2)}
              </p>
              <p className="text">
                Our tees are carefully cut and sewn by hand in Los Angeles,
                California and enzyme washed for added softness. The tees are
                garment dyed which creates subtle variations of color, making
                each tee truly unique. Each tee is screen printed with water
                based ink which makes the print
              </p>
              <div className="actions">
                <div className="quantity">
                  <span className="title">Quantity</span>
                  <button
                    className="quantity-minus qty-btn"
                    onClick={() => setValue((pre) => (pre == 1 ? 1 : pre - 1))}
                  >
                    <i className="fas fa-minus" />
                  </button>
                  <input
                    type="number"
                    className="qty-input"
                    min={1}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    max={99}
                    title="Qty"
                  />
                  <button
                    className="quantity-plus qty-btn"
                    onClick={() => setValue((pre) => pre + 1)}
                  >
                    <i className="fas fa-plus" />
                  </button>
                </div>
                <a
                  className="btn"
                  onClick={() => addProductToCart(product.id, value)}
                >
                  <span className="link-effect">
                    <span className="effect-1">
                      {" "}
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
              <div className="product_meta">
                <span className="sku_wrapper">
                  SKU: <span className="sku">RO-15743</span>
                </span>
                <span className="posted_in">
                  Category:{" "}
                  <Link href={`/shop`} rel="tag">
                    T-SHIRTS
                  </Link>
                </span>
                <span>
                  Tags:
                  <span>
                    <Link href={`/shop`}>ART</Link>
                    <Link href={`/shop`}>COLORS</Link>
                    <Link href={`/shop`}>DESIGN</Link>
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
        <ul className="nav product-tab-style1" id="productTab" role="tablist">
          <li className="nav-item" role="presentation">
            <a
              className="nav-link th-btn active"
              id="description-tab"
              data-bs-toggle="tab"
              href="#description"
              role="tab"
              aria-controls="description"
              aria-selected="true"
            >
              Description
            </a>
          </li>
          <li className="nav-item" role="presentation">
            <a
              className="nav-link th-btn"
              id="info-tab"
              data-bs-toggle="tab"
              href="#info"
              role="tab"
              aria-controls="info"
              aria-selected="false"
            >
              Information
            </a>
          </li>
          <li className="nav-item" role="presentation">
            <a
              className="nav-link th-btn"
              id="reviews-tab"
              data-bs-toggle="tab"
              href="#reviews"
              role="tab"
              aria-controls="reviews"
              aria-selected="false"
            >
              Reviews(1)
            </a>
          </li>
        </ul>
        <div className="tab-content" id="productTabContent">
          <div
            className="tab-pane fade show active"
            id="description"
            role="tabpanel"
            aria-labelledby="description-tab"
          >
            <p>
              One of the key features of cotton T-shirts is their versatility.
              They can be worn on their own or layered under jackets, sweaters,
              or other clothing items. Cotton is highly breathable and absorbs
              moisture, making cotton T-shirts comfortable to wear in various
              weather conditions. The fabric allows air circulation, preventing
              the wearer from feeling too hot or sweaty.
            </p>
          </div>
          <div
            className="tab-pane fade"
            id="info"
            role="tabpanel"
            aria-labelledby="info-tab"
          >
            <table className="woocommerce-table">
              <tbody>
                <tr>
                  <th>Brand</th>
                  <td>Jakuna</td>
                </tr>
                <tr>
                  <th>Color</th>
                  <td>Yellow</td>
                </tr>
                <tr>
                  <th>Weight</th>
                  <td>400 gm</td>
                </tr>
                <tr>
                  <th>Battery</th>
                  <td>Lithium</td>
                </tr>
                <tr>
                  <th>Material</th>
                  <td>Wood</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div
            className="tab-pane fade"
            id="reviews"
            role="tabpanel"
            aria-labelledby="reviews-tab"
          >
            <div className="woocommerce-Reviews mb-25">
              <div className="comments-wrap">
                <div className="latest-comments">
                  <ul className="list-wrap">
                    <li>
                      <div className="comments-box">
                        <div className="comments-avatar">
                          <Image
                            alt="img"
                            src="/assets/img/blog/comment01.png"
                            width={110}
                            height={100}
                          />
                        </div>
                        <div className="comments-text">
                          <div className="avatar-name">
                            <span className="date">March 26, 2024</span>
                            <h6 className="name">Parker Strong</h6>
                          </div>
                          <p>
                            But in order that you may see whence all this born
                            error of those who accuse pleasure and praise pain
                            will open the whole matter explain
                          </p>
                          <Link href={`/blog-details`} className="link-btn">
                            <span className="link-effect">
                              <span className="effect-1">REPLY</span>
                              <span className="effect-1">REPLY</span>
                            </span>
                            <Image
                              alt="icon"
                              src="/assets/img/icon/arrow-left-top.svg"
                              width={13}
                              height={13}
                            />
                          </Link>
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="comment-respond">
                <h3 className="comment-reply-title">Leave a Reply</h3>
                <form
                  onSubmit={(e) => e.preventDefault()}
                  className="comment-form"
                >
                  <p className="comment-notes">
                    Your email address will not be published. Required fields
                    are marked *
                  </p>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <input
                          type="text"
                          className="form-control style-border"
                          name="name"
                          id="name"
                          placeholder="Full name*"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <input
                          type="text"
                          className="form-control style-border"
                          name="email"
                          id="email"
                          placeholder="Email address*"
                        />
                      </div>
                    </div>
                    <div className="col-lg-12">
                      <div className="form-group">
                        <textarea
                          name="message"
                          placeholder="Write your comment *"
                          id="contactForm"
                          className="form-control style-border style2"
                          defaultValue={""}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="form-btn col-12">
                    <button type="submit" className="btn mt-25">
                      <span className="link-effect">
                        <span className="effect-1">POST COMMENT</span>
                        <span className="effect-1">POST COMMENT</span>
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
        <div className="space-top">
          <h3 className="fw-semibold mb-30 mt-n2">Related Products</h3>
          <Slider
            className="row global-carousel related-products"
            {...settings}
          >
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
                      <a href="/cart" className="btn">
                        <span className="link-effect">
                          <span className="effect-1">ADD TO CART</span>
                          <span className="effect-1">ADD TO CART</span>
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
          </Slider>
        </div>
      </div>
    </section>
  );
}
