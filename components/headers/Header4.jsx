"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import GooglePopupButton from "@/components/auth/GooglePopupButton";
import LocaleSwitcher from "@/components/common/LocaleSwitcher";
import { useLocale } from "@/components/common/LocaleProvider";
import PWAMenuActions from "@/components/common/PWAMenuActions";
import { useSession } from "@/components/common/SessionProvider";
import { getLocalizedCategoryCopy } from "@/lib/services/category-copy";
import { SERVICE_CATEGORY_SPECS } from "@/lib/services/category-map";

const THEME_STORAGE_KEY = "clinic-theme-mode";

export default function Header4() {
  const pathname = usePathname();
  const { locale, t } = useLocale();
  const { user: currentUser, clearUser } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [themeMode, setThemeMode] = useState("light");
  const lastScrollYRef = useRef(0);

  const navItems = useMemo(() => {
    const items = [
      { href: "/", label: t("header.home") },
      { href: "/tretmani", label: t("header.treatments") },
      { href: "/nikola-igic", label: t("header.founder") },
      { href: "/rezultati", label: t("header.beforeAfter") },
      { href: "/video-galerija", label: t("header.videos") },
      { href: "/blog", label: t("header.news") },
      { href: "/booking", label: t("header.booking") },
      { href: "/contact", label: t("header.contact") },
    ];

    if (currentUser) {
      items.splice(5, 0, { href: "/beauty-pass", label: t("common.beautyPass") });
    }

    return items;
  }, [currentUser, t]);

  const localizedCategories = useMemo(
    () =>
      SERVICE_CATEGORY_SPECS.map((category) => ({
        ...category,
        ...getLocalizedCategoryCopy(locale, category),
      })),
    [locale]
  );

  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileCategoryOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    let persistedMode = null;
    try {
      persistedMode = window.localStorage.getItem(THEME_STORAGE_KEY);
    } catch {
      persistedMode = null;
    }
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
    if (typeof document === "undefined") {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = previousBodyOverflow || "";
    }

    return () => {
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const lastScrollY = lastScrollYRef.current;
      const isMobileViewport = window.innerWidth <= 991;

      // Mobile keeps header stable to avoid janky hide/show transitions.
      if (isMobileViewport) {
        setIsScrolled(currentScrollY > 10);
        setIsHeaderHidden(false);
        lastScrollYRef.current = currentScrollY;
        return;
      }

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
  const mobileLogoSrc = themeMode === "dark" ? "/assets/img/logo.png" : "/assets/img/logo-dark.webp";

  function handleLogoClick() {
    setMobileMenuOpen(false);
    setMobileCategoryOpen(false);

    if (pathname === "/" && typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function toggleThemeMode() {
    setThemeMode((prev) => (prev === "dark" ? "light" : "dark"));
  }

  async function handleLogout() {
    if (logoutBusy) {
      return;
    }
    setLogoutBusy(true);
    clearUser();
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
        {mobileMenuOpen ? (
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
              <Link href="/" onClick={handleLogoClick}>
                <Image
                  src={mobileLogoSrc}
                  alt="Dr Igic logo"
                  width={220}
                  height={88}
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
                {t("header.treatmentCategories")}
              </button>
              {mobileCategoryOpen ? (
                <ul className="mobile-category-list">
                  {localizedCategories.map((category) => (
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
                aria-label={t("header.changeTheme")}
              >
                <span className="clinic-theme-switch-track">
                  <span className="clinic-theme-switch-knob" />
                </span>
                <span className="clinic-theme-switch-text">
                  {themeMode === "dark"
                    ? `${t("common.dark")} mode`
                    : `${t("common.light")} mode`}
                </span>
              </button>
              <LocaleSwitcher compact />
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
                    {logoutBusy ? t("header.loggingOut") : t("header.logout")}
                  </span>
                </button>
              ) : (
                <GooglePopupButton
                  className="mobile-cta-link clinic-glow-btn"
                  nextPath="/"
                  onBeforeOpen={() => setMobileMenuOpen(false)}
                >
                  <span className="mobile-cta-link-text">{t("common.login")}</span>
                </GooglePopupButton>
              )}
              <Link
                scroll={false}
                href="/booking"
                className="mobile-cta-link clinic-glow-btn"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="mobile-cta-link-text">{t("common.booking")}</span>
              </Link>
              {currentUser ? (
                <Link
                  scroll={false}
                  href="/beauty-pass"
                  className="mobile-cta-link clinic-glow-btn"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="mobile-cta-link-text">{t("common.beautyPass")}</span>
                </Link>
              ) : null}
            </div>
            <PWAMenuActions />
            <div className="sidebar-wrap">
              <h6>Dr Nikola Igic</h6>
              <h6>{t("header.office")}</h6>
            </div>
            <div className="sidebar-wrap">
              <h6>{t("header.reservations")}</h6>
            </div>
          </div>
        ) : null}
      </div>

      <header className="nav-header header-layout2 clinic-header">
        <div
          className={`sticky-wrapper ${isScrolled ? "header-sticky" : ""} ${
            isHeaderHidden ? "header-hidden" : ""
          } `}
        >
          <div className="menu-area">
            <div className="container-fluid">
              <div className="row align-items-center justify-content-between" style={{ flexWrap: "nowrap", display: "flex", alignItems: "center" }}>
                <div className="col-auto">
                  <div className="header-logo">
                    <Link href="/" onClick={handleLogoClick}>
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
                      aria-label={t("header.changeTheme")}
                    >
                      <span className="clinic-theme-switch-track">
                        <span className="clinic-theme-switch-knob" />
                      </span>
                      <span className="clinic-theme-switch-text">
                        {themeMode === "dark" ? t("common.dark") : t("common.light")}
                      </span>
                    </button>
                    <LocaleSwitcher />
                    {currentUser ? (
                      <>
                        <Link
                          scroll={false}
                          href="/beauty-pass"
                          className="search-btn clinic-glow-btn"
                        >
                          <span className="link-effect">
                            <span className="effect-1">{t("common.beautyPass").toUpperCase()}</span>
                            <span className="effect-1">{t("common.beautyPass").toUpperCase()}</span>
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
                            {logoutBusy
                              ? t("header.loggingOut").toUpperCase()
                              : t("header.logout").toUpperCase()}
                          </span>
                          <span className="effect-1">
                            {logoutBusy
                              ? t("header.loggingOut").toUpperCase()
                              : t("header.logout").toUpperCase()}
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
