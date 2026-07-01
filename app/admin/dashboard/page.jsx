import { count, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb, schema } from "@/lib/db/client";
import { LOCALE_COOKIE_KEY, resolveLocale, translate } from "@/lib/i18n";

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

export default async function AdminDashboardPage() {
  const stats = await getStats();
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_KEY)?.value);
  const t = (path) => translate(locale, path);

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <div className="admin-card">
        <h2 style={{ marginTop: 0 }}>{t("admin.dash.overview")}</h2>
        <div className="admin-card-grid">
          <div className="admin-card">
            <h3 style={{ marginTop: 0 }}>{t("admin.dash.services")}</h3>
            <p style={{ fontSize: 28, marginBottom: 0 }}>{stats.services}</p>
          </div>
          <div className="admin-card">
            <h3 style={{ marginTop: 0 }}>{t("admin.dash.bookings")}</h3>
            <p style={{ fontSize: 28, marginBottom: 0 }}>{stats.bookings}</p>
          </div>
          <div className="admin-card">
            <h3 style={{ marginTop: 0 }}>{t("admin.dash.clients")}</h3>
            <p style={{ fontSize: 28, marginBottom: 0 }}>{stats.clients}</p>
          </div>
          <div className="admin-card">
            <h3 style={{ marginTop: 0 }}>{t("admin.dash.vip")}</h3>
            <p style={{ fontSize: 28, marginBottom: 0 }}>{stats.vipRequests}</p>
          </div>
          <div className="admin-card">
            <h3 style={{ marginTop: 0 }}>{t("admin.dash.gallery")}</h3>
            <p style={{ fontSize: 28, marginBottom: 0 }}>{stats.galleryMedia}</p>
          </div>
          <div className="admin-card">
            <h3 style={{ marginTop: 0 }}>{t("admin.dash.announcements")}</h3>
            <p style={{ fontSize: 28, marginBottom: 0 }}>{stats.announcements}</p>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <h3 style={{ marginTop: 0 }}>{t("admin.dash.lockedTitle")}</h3>
        <ul className="admin-locked-list">
          <li>{t("admin.dash.lockedEmployees")}</li>
          <li>{t("admin.dash.lockedFinance")}</li>
          <li>{t("admin.dash.lockedStock")}</li>
        </ul>
      </div>
    </section>
  );
}
