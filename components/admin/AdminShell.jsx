"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import LocaleSwitcher from "@/components/common/LocaleSwitcher";
import { useLocale } from "@/components/common/LocaleProvider";
import AdminNotificationsBell from "@/components/admin/AdminNotificationsBell";
import AdminModal from "@/components/admin/ui/AdminModal";
import AdminIcon from "@/components/admin/ui/AdminIcon";
import {
  ADMIN_NAVIGATION_GROUPS,
  resolveAdminNavigationItem,
} from "@/lib/admin/navigation";

const quickLinks = [
  { href: "/booking", labelKey: "admin.bookingForm", icon: "external" },
  { href: "/api/auth/google?next=/admin", labelKey: "admin.changeAccount", icon: "user" },
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
  return <AdminIcon name={type} size={22} className="admin-template-nav-icon" />;
}

/**
 * Renders every navigation group. `query` narrows the visible items so the
 * sidebar stays usable once a clinic has twenty-plus modules — groups with no
 * match are hidden, but the group landmarks themselves stay in the tree.
 */
function GroupedNavigation({ scope, pathname, t, onNavigate, includeUtilities = false, query = "" }) {
  const activeItem = resolveAdminNavigationItem(pathname);
  const normalizedQuery = query.trim().toLowerCase();

  const matches = (item) =>
    !normalizedQuery || resolveNavLabel(item, t).toLowerCase().includes(normalizedQuery);

  const visibleGroups = ADMIN_NAVIGATION_GROUPS.map((group) => ({
    group,
    items: group.items.filter(matches),
  })).filter(({ group, items }) => items.length > 0 || !normalizedQuery || t(group.labelKey).toLowerCase().includes(normalizedQuery));

  return (
    <>
      {visibleGroups.map(({ group, items }) => {
        const groupId = getNavigationGroupId(scope, group.labelKey);
        const groupItems = items.length > 0 ? items : group.items;
        return (
          <div className="admin-template-group" key={group.labelKey}>
            <p className="admin-template-group-title" id={groupId}>
              {group.icon ? <AdminIcon name={group.icon} size={14} /> : null}
              {t(group.labelKey)}
            </p>
            <nav aria-labelledby={groupId} className="admin-template-nav">
              {groupItems.map((item) => {
                const active = activeItem?.href === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`admin-template-nav-item ${active ? "is-active" : ""}`}
                    aria-current={active ? "page" : undefined}
                    onClick={onNavigate}
                  >
                    {item.icon ? <AdminIcon name={item.icon} size={18} /> : null}
                    <span>{resolveNavLabel(item, t)}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        );
      })}

      {visibleGroups.length === 0 ? (
        <p className="admin-template-search-empty">{t("admin.ui.searchEmpty")}</p>
      ) : null}

      {includeUtilities ? (
        <div className="admin-template-group admin-template-sidebar-footer">
          <p className="admin-template-group-title" id={getNavigationGroupId(scope, "utilities")}>
            <AdminIcon name="globe" size={14} />
            {t("admin.navigation")}
          </p>
          <LocaleSwitcher compact className="admin-template-locale-switcher" />
          <nav aria-labelledby={getNavigationGroupId(scope, "utilities")} className="admin-template-nav">
            {quickLinks.map((item) => (
              item.href.startsWith("/api/") ? (
                <a key={item.href} href={item.href} className="admin-template-nav-item" onClick={onNavigate}>
                  <AdminIcon name={item.icon} size={18} />
                  <span>{resolveNavLabel(item, t)}</span>
                </a>
              ) : (
                <Link key={item.href} href={item.href} className="admin-template-nav-item" onClick={onNavigate}>
                  <AdminIcon name={item.icon} size={18} />
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
  const [query, setQuery] = useState("");

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

  const activeItem = resolveAdminNavigationItem(pathname);

  const activeModuleTitle = useMemo(
    () => (activeItem ? resolveNavLabel(activeItem, t) : "Admin"),
    [activeItem, t]
  );

  const activeModuleDescription = activeItem?.descriptionKey
    ? t(activeItem.descriptionKey)
    : t("admin.officeAdmin");

  const isMoreActive = Boolean(activeItem && !directMobileItems.some((item) => item.href === activeItem.href));
  const moreLabel = t("admin.more");
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="admin-template-root">
      <aside className="admin-template-sidebar admin-template-sidebar--desktop">
        <div className="admin-template-brand">
          <span className="admin-template-brand-mark" aria-hidden="true">DI</span>
          <div className="admin-template-brand-text">
            <h1>Dr Igić</h1>
            <p>{t("admin.controlPanel")}</p>
          </div>
        </div>

        <div className="admin-template-search">
          <AdminIcon name="search" size={16} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("admin.ui.searchPlaceholder")}
            aria-label={t("admin.ui.searchLabel")}
          />
        </div>

        <GroupedNavigation
          scope="desktop"
          pathname={pathname}
          t={t}
          onNavigate={closeMenu}
          query={query}
          includeUtilities
        />
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
            <span className="admin-template-topbar-icon" aria-hidden="true">
              <AdminIcon name={activeItem?.icon || "dashboard"} size={20} />
            </span>
            <div className="admin-template-topbar-heading">
              <h2>{activeModuleTitle}</h2>
              <p>{activeModuleDescription}</p>
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
          className={`admin-template-mobile-nav-item ${isMoreActive ? "is-active" : ""}`}
          onClick={() => setMenuOpen(true)}
          aria-label={isMoreActive ? `${moreLabel}: ${resolveNavLabel(activeItem, t)}` : undefined}
          aria-current={isMoreActive ? "page" : undefined}
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
        >
          <NavigationIcon type="more" />
          <span>{moreLabel}</span>
        </button>
      </nav>

      <div className="admin-template-drawer">
        <AdminModal open={menuOpen} onClose={closeMenu} title={t("admin.navigation")} closeLabel={t("admin.closeMenu")}>
          <div className="admin-template-drawer-content">
            <GroupedNavigation scope="drawer" pathname={pathname} t={t} onNavigate={closeMenu} includeUtilities />
          </div>
        </AdminModal>
      </div>
    </div>
  );
}
