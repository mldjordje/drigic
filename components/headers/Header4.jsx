"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import GooglePopupButton from "@/components/auth/GooglePopupButton";
import PWAMenuActions from "@/components/common/PWAMenuActions";
import { SERVICE_CATEGORY_SPECS } from "@/lib/services/category-map";

const THEME_STORAGE_KEY = "clinic-theme-mode";

export default function Header4() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [themeMode, setThemeMode] = useState("light");
  const lastScrollYRef = useRef(0);

  const navItems = useMemo(() => {
    const items = [
      { href: "/", label: "Pocetna" },
      { href: "/tretmani", label: "Tretmani" },
      { href: "/nikola-igic", label: "Osnivac" },
      { href: "/rezultati", label: "Pre/Posle" },
      { href: "/blog", label: "Aktuelnosti" },
      { href: "/booking", label: "Zakazi" },
      { href: "/contact", label: "Kontakt" },
    ];

    if (currentUser) {
      items.splice(5, 0, { href: "/beauty-pass", label: "Beauty Pass" });
    }

    return items;
  }, [currentUser]);

  useEffect(() => {
    fetch("/api/me/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setCurrentUser(data?.user || null))
      .catch(() => setCurrentUser(null));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const persistedMode = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (persistedMode === "dark" || persistedMode === "light") {
      setThemeMode(persistedMode);
      return;
    }
    setThemeMode("light");
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    const isDark = themeMode === "dark";
    document.documentElement.classList.remove("clinic-theme-light", "clinic-theme-dark");
    document.body.classList.remove("clinic-theme-light", "clinic-theme-dark");
    document.documentElement.classList.add(isDark ? "clinic-theme-dark" : "clinic-theme-light");
    document.body.classList.add(isDark ? "clinic-theme-dark" : "clinic-theme-light");
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, isDark ? "dark" : "light");
    } catch {
      // localStorage is optional
    }
  }, [themeMode]);

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
        setMobileCategoryOpen(false);
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

    const handleResize = () => {
      handleScroll();
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const headerLogoSrc = "/assets/img/logo.png";
  const mobileLogoSrc = themeMode === "dark" ? "/assets/img/logo.png" : "/assets/img/logo-dark.png";

  function toggleThemeMode() {
    setThemeMode((prev) => (prev === "dark" ? "light" : "dark"));
  }

  async function handleLogout() {
    if (logoutBusy) {
      return;
    }
    setLogoutBusy(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch {
      // no-op, redirect anyway
    } finally {
      window.location.href = "/";
    }
  }

  return (
    <>
      <div className={`mobile-menu-wrapper ${mobileMenuOpen ? "body-visible" : ""} `}>
        <div className="mobile-menu-area">
          <button
            className="menu-toggle"
            onClick={() => {
              setMobileMenuOpen(false);
              setMobileCategoryOpen(false);
            }}
          >
            <i className="fas fa-times"></i>
          </button>
          <div className="mobile-logo">
            <Link scroll={false} href="/">
              <img
                src={mobileLogoSrc}
                alt="Dr Igic logo"
                className="clinic-nav-logo clinic-nav-logo-mobile"
              />
            </Link>
          </div>
          <div className="mobile-menu">
            <ul>
              {navItems.map((item) => (
                <li key={item.href} onClick={() => setMobileMenuOpen(false)}>
                  <Link scroll={false} href={item.href}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="mobile-category-dropdown">
            <button
              type="button"
              className="mobile-category-toggle"
              aria-expanded={mobileCategoryOpen}
              onClick={() => setMobileCategoryOpen((prev) => !prev)}
            >
              Kategorije tretmana
            </button>
            {mobileCategoryOpen ? (
              <ul className="mobile-category-list">
                {SERVICE_CATEGORY_SPECS.map((category) => (
                  <li key={category.slug}>
                    <Link
                      scroll={false}
                      href={`/tretmani/${category.slug}`}
                      onClick={() => {
                        setMobileCategoryOpen(false);
                        setMobileMenuOpen(false);
                      }}
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="mobile-theme-toggle-wrap">
            <button
              type="button"
              className={`clinic-theme-switch ${themeMode === "dark" ? "is-dark" : "is-light"}`}
              onClick={toggleThemeMode}
              aria-label="Promeni temu"
            >
              <span className="clinic-theme-switch-track">
                <span className="clinic-theme-switch-knob" />
              </span>
              <span className="clinic-theme-switch-text">
                {themeMode === "dark" ? "Dark mode" : "Light mode"}
              </span>
            </button>
          </div>
          <div className="mobile-cta-buttons">
            {currentUser ? (
              <button
                type="button"
                className="mobile-cta-link clinic-glow-btn"
                onClick={handleLogout}
                disabled={logoutBusy}
              >
                <span className="mobile-cta-link-text">
                  {logoutBusy ? "Odjava..." : "Odjavi me"}
                </span>
              </button>
            ) : (
              <GooglePopupButton
                className="mobile-cta-link clinic-glow-btn"
                nextPath="/"
                onBeforeOpen={() => setMobileMenuOpen(false)}
              >
                <span className="mobile-cta-link-text">Login</span>
              </GooglePopupButton>
            )}
            <Link
              scroll={false}
              href="/booking"
              className="mobile-cta-link clinic-glow-btn"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="mobile-cta-link-text">Zakazi</span>
            </Link>
            {currentUser ? (
              <Link
                scroll={false}
                href="/beauty-pass"
                className="mobile-cta-link clinic-glow-btn"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="mobile-cta-link-text">Beauty Pass</span>
              </Link>
            ) : null}
          </div>
          <PWAMenuActions />
          <div className="sidebar-wrap">
            <h6>Dr Nikola Igic</h6>
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
                        width={286}
                        height={84}
                        src={headerLogoSrc}
                        alt="Dr Igic logo"
                        className="clinic-nav-logo"
                      />
                    </Link>
                  </div>
                </div>
                <div className="col-auto ms-auto">
                  <nav className="main-menu d-none d-lg-inline-block">
                    <ul>
                      {navItems.map((item) => (
                        <li key={item.href}>
                          <Link scroll={false} href={item.href}>
                            {item.label}
                          </Link>
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
                  <div className="header-button ms-0 clinic-header-actions">
                    <button
                      type="button"
                      className={`clinic-theme-switch clinic-theme-switch-desktop ${
                        themeMode === "dark" ? "is-dark" : "is-light"
                      }`}
                      onClick={toggleThemeMode}
                      aria-label="Promeni temu"
                    >
                      <span className="clinic-theme-switch-track">
                        <span className="clinic-theme-switch-knob" />
                      </span>
                      <span className="clinic-theme-switch-text">
                        {themeMode === "dark" ? "Dark" : "Light"}
                      </span>
                    </button>
                    {currentUser ? (
                      <>
                        {currentUser.role === "admin" ? (
                          <Link
                            scroll={false}
                            href="/admin/kalendar"
                            className="search-btn clinic-glow-btn"
                          >
                            <span className="link-effect">
                              <span className="effect-1">ADMIN</span>
                              <span className="effect-1">ADMIN</span>
                            </span>
                          </Link>
                        ) : null}
                        <Link
                          scroll={false}
                          href="/beauty-pass"
                          className="search-btn clinic-glow-btn"
                        >
                          <span className="link-effect">
                            <span className="effect-1">BEAUTY PASS</span>
                            <span className="effect-1">BEAUTY PASS</span>
                          </span>
                        </Link>
                      </>
                    ) : null}

                    {currentUser ? (
                      <button
                        type="button"
                        className="search-btn clinic-glow-btn"
                        onClick={handleLogout}
                        disabled={logoutBusy}
                      >
                        <span className="link-effect">
                          <span className="effect-1">
                            {logoutBusy ? "ODJAVA..." : "ODJAVI ME"}
                          </span>
                          <span className="effect-1">
                            {logoutBusy ? "ODJAVA..." : "ODJAVI ME"}
                          </span>
                        </span>
                      </button>
                    ) : null}
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
