import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb, schema } from "@/lib/db/client";
import { LOCALE_COOKIE_KEY, resolveLocale, translate } from "@/lib/i18n";
import AdminIcon from "@/components/admin/ui/AdminIcon";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminSection from "@/components/admin/ui/AdminSection";
import AdminStatCard from "@/components/admin/ui/AdminStatCard";

async function getStats() {
  const db = getDb();
  const [
    [servicesCount],
    [bookingsCount],
    [vipCount],
    [mediaCount],
    [announcementsCount],
    [clientsCount],
  ] = await Promise.all([
    db.select({ value: count() }).from(schema.services),
    db.select({ value: count() }).from(schema.bookings),
    db.select({ value: count() }).from(schema.vipRequests),
    db.select({ value: count() }).from(schema.galleryMedia),
    db.select({ value: count() }).from(schema.homeAnnouncements),
    db.select({ value: count() }).from(schema.users).where(eq(schema.users.role, "client")),
  ]);

  return {
    services: servicesCount?.value || 0,
    bookings: bookingsCount?.value || 0,
    vipRequests: vipCount?.value || 0,
    galleryMedia: mediaCount?.value || 0,
    announcements: announcementsCount?.value || 0,
    clients: clientsCount?.value || 0,
  };
}

const QUICK_ACTIONS = [
  { href: "/admin/kalendar", icon: "calendar", labelKey: "admin.calendar", descKey: "admin.desc.calendar" },
  { href: "/admin/bookings", icon: "bookings", labelKey: "admin.bookings", descKey: "admin.desc.bookings" },
  { href: "/admin/klijenti", icon: "clients", labelKey: "admin.clients", descKey: "admin.desc.clients" },
  { href: "/admin/services", icon: "services", labelKey: "admin.services", descKey: "admin.desc.services" },
  { href: "/admin/kampanje", icon: "campaigns", labelKey: "admin.campaigns", descKey: "admin.desc.campaigns" },
  { href: "/admin/analitika", icon: "analytics", labelKey: "admin.analytics", descKey: "admin.desc.analytics" },
];

export default async function AdminDashboardPage() {
  const stats = await getStats();
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_KEY)?.value);
  const t = (path) => translate(locale, path);

  const cards = [
    { key: "bookings", icon: "bookings", tone: "gold", value: stats.bookings, href: "/admin/bookings", label: t("admin.dash.bookings"), hint: t("admin.desc.bookings") },
    { key: "clients", icon: "clients", tone: "blue", value: stats.clients, href: "/admin/klijenti", label: t("admin.dash.clients"), hint: t("admin.desc.clients") },
    { key: "services", icon: "services", tone: "violet", value: stats.services, href: "/admin/services", label: t("admin.dash.services"), hint: t("admin.desc.services") },
    { key: "vip", icon: "vip", tone: "amber", value: stats.vipRequests, href: "/admin/vip", label: t("admin.dash.vip"), hint: t("admin.desc.vip") },
    { key: "gallery", icon: "media", tone: "green", value: stats.galleryMedia, href: "/admin/media", label: t("admin.dash.gallery"), hint: t("admin.desc.media") },
    { key: "announcements", icon: "announcements", tone: "rose", value: stats.announcements, href: "/admin/announcements", label: t("admin.dash.announcements"), hint: t("admin.desc.announcements") },
  ];

  return (
    <section className="admin-page">
      <AdminPageHeader
        icon="dashboard"
        title={t("admin.dash.overview")}
        description={t("admin.desc.dashboard")}
        actions={
          <Link href="/booking" className="admin-btn admin-btn--primary">
            <AdminIcon name="external" size={16} />
            {t("admin.bookingForm")}
          </Link>
        }
      />

      <div className="admin-stat-grid">
        {cards.map((card) => (
          <AdminStatCard
            key={card.key}
            icon={card.icon}
            tone={card.tone}
            label={card.label}
            value={card.value}
            hint={card.hint}
            href={card.href}
          />
        ))}
      </div>

      <AdminSection
        icon="sparkle"
        title={t("admin.ui.quickActions")}
        description={t("admin.ui.quickActionsHint")}
      >
        <div className="admin-tile-grid">
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.href} href={action.href} className="admin-tile">
              <span className="admin-tile-icon" aria-hidden="true">
                <AdminIcon name={action.icon} size={18} />
              </span>
              <span className="admin-tile-text">
                <strong>{t(action.labelKey)}</strong>
                <span>{t(action.descKey)}</span>
              </span>
            </Link>
          ))}
        </div>
      </AdminSection>

      <AdminSection
        icon="lock"
        title={t("admin.dash.lockedTitle")}
        description={t("admin.ui.lockedHint")}
      >
        <div className="admin-tile-grid">
          {[
            { icon: "user", label: t("admin.dash.lockedEmployees") },
            { icon: "money", label: t("admin.dash.lockedFinance") },
            { icon: "packages", label: t("admin.dash.lockedStock") },
          ].map((item) => (
            <div className="admin-tile" key={item.label} style={{ opacity: 0.62 }}>
              <span className="admin-tile-icon" aria-hidden="true">
                <AdminIcon name={item.icon} size={18} />
              </span>
              <span className="admin-tile-text">
                <strong>{item.label}</strong>
                <span>{t("admin.lockedReason")}</span>
              </span>
            </div>
          ))}
        </div>
      </AdminSection>
    </section>
  );
}
