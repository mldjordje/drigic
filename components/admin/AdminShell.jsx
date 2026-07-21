"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import LocaleSwitcher from "@/components/common/LocaleSwitcher";
import { useLocale } from "@/components/common/LocaleProvider";
import AdminNotificationsBell from "@/components/admin/AdminNotificationsBell";
import AdminModal from "@/components/admin/ui/AdminModal";
import {
  ADMIN_NAVIGATION_GROUPS,
  resolveAdminNavigationItem,
} from "@/lib/admin/navigation";

const quickLinks = [
  { href: "/booking", labelKey: "admin.bookingForm" },
  { href: "/api/auth/google?next=/admin", labelKey: "admin.changeAccount" },
];

const directMobileItems = [
  { href: "/admin/dashboard", labelKey: "admin.groups.today", icon: "today" },
  { href: "/admin/kalendar", labelKey: "admin.calendar", icon: "calendar" },
  { href: "/admin/klijenti", labelKey: "admin.clients", icon: "clients" },
  { href: "/admin/bookings", labelKey: "admin.bookings", icon: "bookings" },
];

function resolveNavLabel(item, t) {
  return item.labelKey ? t(item.labelKey) : item.label || "";
}

function getNavigationGroupId(scope, labelKey) {
  return `admin-navigation-${scope}-${labelKey.replaceAll(".", "-")}`;
}

function NavigationIcon({ type }) {
  const paths = {
    today: <path d="M4 5.5h16M7 3.5v4M17 3.5v4M5 9h14v10H5zM8 12h3M13 12h3M8 15h3" />,
    calendar: <path d="M5 4.5h14v15H5zM8 2.5v4M16 2.5v4M5 9h14M8 12h3M13 12h3M8 15h3" />,
    clients: <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.5 20c.5-3.2 2.4-5 5.5-5s5 1.8 5.5 5M16 11a2.5 2.5 0 1 0 0-5M17 15c2.1.3 3.4 1.8 3.8 4" />,
    bookings: <path d="M5 4.5h14v15H5zM8 2.5v4M16 2.5v4M5 9h14M8 13l2 2 4-4" />,
    more: <path d="M6.5 12h.01M12 12h.01M17.5 12h.01" strokeWidth="3" strokeLinecap="round" />,
    menu: <path d="M4 7h16M4 12h16M4 17h16" strokeWidth="2" strokeLinecap="round" />,
  };

  return (
    <svg className="admin-template-nav-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
      {paths[type]}
    </svg>
  );
}

function GroupedNavigation({ scope, pathname, t, onNavigate, includeUtilities = false }) {
  const activeItem = resolveAdminNavigationItem(pathname);

  return (
    <>
      {ADMIN_NAVIGATION_GROUPS.map((group) => {
        const groupId = getNavigationGroupId(scope, group.labelKey);
        return (
          <div className="admin-template-group" key={group.labelKey}>
            <p className="admin-template-group-title" id={groupId}>{t(group.labelKey)}</p>
            <nav aria-labelledby={groupId} className="admin-template-nav">
              {group.items.map((item) => {
                const active = activeItem?.href === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`admin-template-nav-item ${active ? "is-active" : ""}`}
                    aria-current={active ? "page" : undefined}
                    onClick={onNavigate}
                  >
                    <span>{resolveNavLabel(item, t)}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        );
      })}

      {includeUtilities ? (
        <div className="admin-template-group">
          <p className="admin-template-group-title" id={getNavigationGroupId(scope, "utilities")}>{t("admin.navigation")}</p>
          <LocaleSwitcher compact className="admin-template-locale-switcher" />
          <nav aria-labelledby={getNavigationGroupId(scope, "utilities")} className="admin-template-nav">
            {quickLinks.map((item) => (
              item.href.startsWith("/api/") ? (
                <a key={item.href} href={item.href} className="admin-template-nav-item" onClick={onNavigate}>
                  <span>{resolveNavLabel(item, t)}</span>
                </a>
              ) : (
                <Link key={item.href} href={item.href} className="admin-template-nav-item" onClick={onNavigate}>
                  <span>{resolveNavLabel(item, t)}</span>
                </Link>
              )
            ))}
          </nav>
        </div>
      ) : null}
    </>
  );
}

export default function AdminShell({ children, primaryAction = null }) {
  const pathname = usePathname();
  const { t } = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("drigic-pwa-admin-start", "1");
      document.cookie = "drigic-pwa-admin-start=1; path=/; max-age=31536000; SameSite=Lax";
    } catch {
      // localStorage is optional
    }
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const activeModuleTitle = useMemo(() => {
    const current = resolveAdminNavigationItem(pathname);
    return current ? resolveNavLabel(current, t) : "Admin";
  }, [pathname, t]);

  const activeItem = resolveAdminNavigationItem(pathname);
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="admin-template-root">
      <aside className="admin-template-sidebar admin-template-sidebar--desktop">
        <div className="admin-template-brand">
          <h1>Dr Igić</h1>
          <p>{t("admin.controlPanel")}</p>
        </div>
        <GroupedNavigation scope="desktop" pathname={pathname} t={t} onNavigate={closeMenu} includeUtilities />
      </aside>

      <div className="admin-template-main">
        <header className="admin-template-topbar">
          <div className="admin-template-topbar-left">
            <button
              type="button"
              className="admin-template-menu-btn"
              onClick={() => setMenuOpen(true)}
              aria-label={t("admin.openMenu")}
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
            >
              <NavigationIcon type="menu" />
            </button>
            <div>
              <h2>{activeModuleTitle}</h2>
              <p>{t("admin.officeAdmin")}</p>
            </div>
          </div>
          <div className="admin-template-topbar-actions">
            {primaryAction ? <div className="admin-template-primary-action">{primaryAction}</div> : null}
            <AdminNotificationsBell />
          </div>
        </header>
        <main className="admin-template-content">{children}</main>
      </div>

      <nav className="admin-template-mobile-nav" aria-label={t("admin.navigation")}>
        {directMobileItems.map((item) => {
          const active = activeItem?.href === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-template-mobile-nav-item ${active ? "is-active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <NavigationIcon type={item.icon} />
              <span>{t(item.labelKey)}</span>
            </Link>
          );
        })}
        <button
          type="button"
          className="admin-template-mobile-nav-item"
          onClick={() => setMenuOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
        >
          <NavigationIcon type="more" />
          <span>{t("admin.more")}</span>
        </button>
      </nav>

      <div className="admin-template-drawer">
        <AdminModal open={menuOpen} onClose={closeMenu} title={t("admin.navigation")}>
          <div className="admin-template-drawer-content">
            <GroupedNavigation scope="drawer" pathname={pathname} t={t} onNavigate={closeMenu} includeUtilities />
          </div>
        </AdminModal>
      </div>
    </div>
  );
}
