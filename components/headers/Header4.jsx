"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Header4() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const lastScrollYRef = useRef(0);
  const navItems = [
    { href: "#hero", label: "Početna" },
    { href: "#tretmani", label: "Tretmani" },
    { href: "#osnivac", label: "Osnivač" },
    { href: "#rezultati", label: "Rezultati" },
    { href: "#aktuelnosti", label: "Aktuelnosti" },
    { href: "/booking", label: "Booking" },
    { href: "#konsultacije", label: "Kontakt" },
  ];

  useEffect(() => {
    const handleDocumentClick = (event) => {
      const menuWrapper = document.querySelector(".mobile-menu-wrapper");
      const menuContainer = document.querySelector(".mobile-menu-area");

      if (
        menuWrapper &&
        menuContainer &&
        !menuContainer.contains(event.target) &&
        menuWrapper.contains(event.target)
      ) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("click", handleDocumentClick);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const lastScrollY = lastScrollYRef.current;

      if (currentScrollY <= 10) {
        setIsScrolled(false);
        setIsHeaderHidden(false);
      } else {
        setIsScrolled(true);
        const isScrollingDown = currentScrollY > lastScrollY;
        setIsHeaderHidden(isScrollingDown && currentScrollY > 120);
      }

      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll);
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
                width={150}
                height={60}
                src="/assets/img/logo.png"
                alt="Dr Igić logo"
              />
            </Link>
          </div>
          <div className="mobile-menu">
            <ul>
              {navItems.map((item) => (
                <li key={item.href} onClick={() => setMobileMenuOpen(false)}>
                  <a href={item.href}>{item.label}</a>
                </li>
              ))}
            </ul>
          </div>
          <div className="sidebar-wrap">
            <h6>Dr Nikola Igić</h6>
            <h6>Klinika estetske medicine</h6>
          </div>
          <div className="sidebar-wrap">
            <h6>Rezervacije putem kontakt forme</h6>
          </div>
        </div>
      </div>

      <header className="nav-header header-layout2 clinic-header">
        <div
          className={`sticky-wrapper ${isScrolled ? "header-sticky" : ""} ${
            isHeaderHidden ? "header-hidden" : ""
          } `}
        >
          <div className="menu-area">
            <div className="container-fluid">
              <div className="row align-items-center justify-content-between">
                <div className="col-auto">
                  <div className="header-logo">
                    <Link scroll={false} href="/">
                      <Image
                        width={150}
                        height={60}
                        src="/assets/img/logo.png"
                        alt="Dr Igić logo"
                      />
                    </Link>
                  </div>
                </div>
                <div className="col-auto ms-auto">
                  <nav className="main-menu d-none d-lg-inline-block">
                    <ul>
                      {navItems.map((item) => (
                        <li key={item.href}>
                          <a href={item.href}>{item.label}</a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                  <div className="navbar-right d-inline-flex d-lg-none">
                    <button
                      onClick={() => setMobileMenuOpen(true)}
                      type="button"
                      className="menu-toggle sidebar-btn"
                    >
                      <span className="line"></span>
                      <span className="line"></span>
                      <span className="line"></span>
                    </button>
                  </div>
                </div>
                <div className="col-auto d-none d-lg-block">
                  <div className="header-button ms-0">
                    <a href="#konsultacije" className="search-btn">
                      <span className="link-effect">
                        <span className="effect-1">ZAKAŽI KONSULTACIJU</span>
                        <span className="effect-1">ZAKAŽI KONSULTACIJU</span>
                      </span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
