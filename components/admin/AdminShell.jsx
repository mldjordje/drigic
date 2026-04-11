"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import LocaleSwitcher from "@/components/common/LocaleSwitcher";
import { useLocale } from "@/components/common/LocaleProvider";
import AdminNotificationsBell from "@/components/admin/AdminNotificationsBell";

const approvedModules = [
  { href: "/admin/kalendar", labelKey: "admin.calendar" },
  { href: "/admin/dashboard", labelKey: "admin.dashboard" },
  { href: "/admin/analitika", label: "Analitika" },
  { href: "/admin/tutorial", label: "Tutorial" },
  { href: "/admin/podesavanja", labelKey: "admin.settings" },
  { href: "/admin/prepodnevni-termini", label: "Prepodnevni termini" },
  { href: "/admin/nedelja", label: "Nedelja" },
  { href: "/admin/bookings", labelKey: "admin.bookings" },
  { href: "/admin/klijenti", labelKey: "admin.clients" },
  { href: "/admin/services", labelKey: "admin.services" },
  { href: "/admin/promotions", labelKey: "admin.promotions" },
  { href: "/admin/packages", labelKey: "admin.packages" },
  { href: "/admin/preparati", labelKey: "admin.products" },
  { href: "/admin/announcements", labelKey: "admin.announcements" },
  { href: "/admin/media", labelKey: "admin.media" },
  { href: "/admin/vip", labelKey: "admin.vip" },
];

const lockedModules = [
  { label: "Zaposleni", reason: "Nije odobreno" },
  { label: "Finansije", reason: "Nije odobreno" },
  { label: "Skladište preparata", reason: "Nije odobreno" },
];

const quickLinks = [
  { href: "/booking", labelKey: "admin.bookingForm" },
  { href: "/api/auth/google?next=/admin", labelKey: "admin.changeAccount" },
];

function resolveNavLabel(item, t) {
  if (item.labelKey) {
    return t(item.labelKey);
  }
  return item.label || "";
}

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const { t } = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem("drigic-pwa-admin-start", "1");
      document.cookie = "drigic-pwa-admin-start=1; path=/; max-age=31536000; SameSite=Lax";
    } catch {
      // localStorage is optional
    }
  }, []);

  const activeModuleTitle = useMemo(() => {
    const current = approvedModules.find((item) =>
      pathname === item.href || pathname.startsWith(`${item.href}/`)
    );
    return current ? resolveNavLabel(current, t) : "Admin";
  }, [pathname, t]);

  return (
    <div className="admin-template-root">
      <aside className={`admin-template-sidebar ${menuOpen ? "is-open" : ""}`}>
        <div className="admin-template-brand">
          <h1>Dr Igić</h1>
          <p>{t("admin.controlPanel")}</p>
        </div>

        <div className="admin-template-group">
          <p className="admin-template-group-title">{t("admin.approved")}</p>
          <nav className="admin-template-nav">
            {approvedModules.map((item) => {
              const active =
                pathname === item.href ||
                (item.href === "/admin/kalendar" && pathname === "/admin");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`admin-template-nav-item ${active ? "is-active" : ""}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span>{resolveNavLabel(item, t)}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="admin-template-group">
          <p className="admin-template-group-title">{t("admin.navigation")}</p>
          <LocaleSwitcher compact className="admin-template-locale-switcher" />
          <nav className="admin-template-nav">
            {quickLinks.map((item) =>
              item.href.startsWith("/api/") ? (
                <a
                  key={item.href}
                  href={item.href}
                  className="admin-template-nav-item"
                  onClick={() => setMenuOpen(false)}
                >
                  <span>{resolveNavLabel(item, t)}</span>
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className="admin-template-nav-item"
                  onClick={() => setMenuOpen(false)}
                >
                  <span>{resolveNavLabel(item, t)}</span>
                </Link>
              )
            )}
          </nav>
        </div>

        <div className="admin-template-group">
          <p className="admin-template-group-title">{t("admin.locked")}</p>
          <div className="admin-template-nav">
            {lockedModules.map((item) => (
              <button
                key={item.label}
                type="button"
                className="admin-template-nav-item is-locked"
                disabled
                title={`${item.label} - ${item.reason}`}
              >
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>
      {menuOpen ? (
        <button
          type="button"
          className="admin-template-sidebar-backdrop"
          onClick={() => setMenuOpen(false)}
          aria-label="Zatvori meni"
        />
      ) : null}

      <div className="admin-template-main">
        <header className="admin-template-topbar">
          <div className="admin-template-topbar-left">
            <button
              type="button"
              className="admin-template-menu-btn"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Otvori meni"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
            <div>
              <h2>{activeModuleTitle}</h2>
              <p>{t("admin.officeAdmin")}</p>
            </div>
          </div>
          <div className="admin-template-topbar-actions">
            <AdminNotificationsBell />
            <Link href="/admin/kalendar" className="admin-template-link-btn">
              {t("admin.calendar")}
            </Link>
            <Link href="/admin/klijenti" className="admin-template-link-btn">
              {t("admin.clients")}
            </Link>
          </div>
        </header>
        <main className="admin-template-content">{children}</main>
      </div>
    </div>
  );
}
