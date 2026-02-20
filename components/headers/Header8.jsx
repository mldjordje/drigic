"use client";
import Image from "next/image";
import MobileMenuSocials from "./component/MobileMenuSocials";
import MobileNav from "./component/MobileNav";
import Nav from "./component/Nav";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import CartLength from "./component/CartLength";

export default function Header8() {
  const [isScrolled, setIsScrolled] = useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => {
    const handleDocumentClick = (event) => {
      const menuWrapper = document.querySelector(".mobile-menu-wrapper");
      const menuContainer = document.querySelector(".mobile-menu-area");

      // Check if the click is outside of modal-content but inside modal-dialog
      if (
        menuWrapper &&
        menuContainer &&
        !menuContainer.contains(event.target) &&
        menuWrapper.contains(event.target)
      ) {
        // Your logic for handling the click outside modal-content
        setMobileMenuOpen(false);
      }
    };

    // Attach the event listener when the component mounts
    document.addEventListener("click", handleDocumentClick);

    // Detach the event listener when the component unmounts
    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, []); // Empty dependency array ensures the effect runs once after the initial render

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 500);
    };

    // Attach the event listener when the component mounts
    window.addEventListener("scroll", handleScroll);

    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  return (
    <>
      <div
        className={`mobile-menu-wrapper ${
          mobileMenuOpen ? "body-visible" : ""
        } `}
      >
        <div className="mobile-menu-area">
          <button
            className="menu-toggle"
            onClick={() => setMobileMenuOpen(false)}
          >
            <i className="fas fa-times"></i>
          </button>
          <div className="mobile-logo">
            <Link scroll={false} href="/">
              <Image
                width={86}
                height={24}
                src="/assets/img/logo.svg"
                alt="Ovation"
              />
            </Link>
          </div>
          <div className="mobile-menu">
            <ul>
              <MobileNav />
            </ul>
          </div>
          <div className="sidebar-wrap">
            <h6>27 Division St, New York,</h6>
            <h6>NY 10002, USA</h6>
          </div>
          <div className="sidebar-wrap">
            <h6>
              <a href="tel:1800123654987">+1 800 123 654 987 </a>
            </h6>
            <h6>
              <a href="mailto:frisk.agency@mail.com">frisk.agency@mail.com</a>
            </h6>
          </div>
          <div className="social-btn style3">
            <MobileMenuSocials />
          </div>
        </div>
      </div>
      <header className="nav-header header-layout3 bg-white">
        <div
          className={`sticky-wrapper  ${isScrolled ? "header-sticky" : ""} `}
        >
          {/* Main Menu Area */}
          <div className="menu-area">
            <div className="container-fluid">
              <div className="row align-items-center justify-content-between">
                <div className="col-auto">
                  <div className="header-logo">
                    <Link href={`/`}>
                      <Image
                        alt="logo"
                        src="/assets/img/logo.svg"
                        width="86"
                        height="24"
                      />
                    </Link>
                  </div>
                </div>
                <div className="col-auto ms-auto">
                  <nav className="main-menu d-none d-lg-inline-block">
                    <ul>
                      <Nav />
                    </ul>
                  </nav>
                  <div className="navbar-right d-inline-flex d-lg-none">
                    <button
                      type="button"
                      className="header-cart sideMenuToggler"
                      href="cart.html"
                    >
                      <Image
                        alt="img"
                        src="/assets/img/icon/shopping-cart.svg"
                        width="24"
                        height="24"
                      />
                      <span className="link-effect header-cart-text">
                        <span className="effect-1">
                          CART{" "}
                          <span>
                            (<CartLength />)
                          </span>
                        </span>
                        <span className="effect-1">
                          CART{" "}
                          <span>
                            (<CartLength />)
                          </span>
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      className="menu-toggle sidebar-btn"
                      onClick={() => setMobileMenuOpen(true)}
                    >
                      <span className="line" />
                      <span className="line" />
                      <span className="line" />
                    </button>
                  </div>
                </div>
                <div className="col-auto d-none d-lg-block">
                  <div className="header-button">
                    <Link
                      type="button"
                      className="header-cart sideMenuToggler"
                      href={`/cart`}
                    >
                      <Image
                        alt="img"
                        src="/assets/img/icon/shopping-cart.svg"
                        width="24"
                        height="24"
                      />
                      <span className="link-effect header-cart-text">
                        <span className="effect-1">
                          CART{" "}
                          <span>
                            (<CartLength />)
                          </span>
                        </span>
                        <span className="effect-1">
                          CART{" "}
                          <span>
                            (<CartLength />)
                          </span>
                        </span>
                      </span>
                    </Link>
                    <Link href={`/project`} className="btn">
                      <span className="link-effect">
                        <span className="effect-1">WORKS WITH US</span>
                        <span className="effect-1">WORKS WITH US</span>
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>{" "}
    </>
  );
}
