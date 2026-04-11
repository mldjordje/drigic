import { count, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";

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

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <div className="admin-card">
        <h2 style={{ marginTop: 0 }}>Operativni pregled klinike</h2>
        <div className="admin-card-grid">
          <div className="admin-card">
            <h3 style={{ marginTop: 0 }}>Usluge</h3>
            <p style={{ fontSize: 28, marginBottom: 0 }}>{stats.services}</p>
          </div>
          <div className="admin-card">
            <h3 style={{ marginTop: 0 }}>Termini</h3>
            <p style={{ fontSize: 28, marginBottom: 0 }}>{stats.bookings}</p>
          </div>
          <div className="admin-card">
            <h3 style={{ marginTop: 0 }}>Klijenti</h3>
            <p style={{ fontSize: 28, marginBottom: 0 }}>{stats.clients}</p>
          </div>
          <div className="admin-card">
            <h3 style={{ marginTop: 0 }}>VIP upiti</h3>
            <p style={{ fontSize: 28, marginBottom: 0 }}>{stats.vipRequests}</p>
          </div>
          <div className="admin-card">
            <h3 style={{ marginTop: 0 }}>Galerija</h3>
            <p style={{ fontSize: 28, marginBottom: 0 }}>{stats.galleryMedia}</p>
          </div>
          <div className="admin-card">
            <h3 style={{ marginTop: 0 }}>Obaveštenja</h3>
            <p style={{ fontSize: 28, marginBottom: 0 }}>{stats.announcements}</p>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <h3 style={{ marginTop: 0 }}>Zaključane funkcije (čekaju odobrenje klijenta)</h3>
        <ul className="admin-locked-list">
          <li>Zaposleni i smene</li>
          <li>Finansije i fakturisanje</li>
          <li>Skladiste preparata</li>
        </ul>
      </div>
    </section>
  );
}
