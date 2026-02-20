"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Header2() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navItems = [
    { href: "#hero", label: "Početna" },
    { href: "#prirodna-lepota", label: "Pristup" },
    { href: "#tretmani", label: "Tretmani" },
    { href: "#rezultati", label: "Rezultati" },
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
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 80);
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

      <header className="nav-header header-layout2">
        <div className={`sticky-wrapper ${isScrolled ? "header-sticky" : ""} `}>
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
                  <div className="header-button">
                    <a href="#konsultacije" className="search-btn">
                      <span className="link-effect">
                        <span className="effect-1">REZERVIŠI KONSULTACIJU</span>
                        <span className="effect-1">REZERVIŠI KONSULTACIJU</span>
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
