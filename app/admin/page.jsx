import { count } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";

async function getStats() {
  const db = getDb();
  const [servicesCount] = await db
    .select({ value: count() })
    .from(schema.services);
  const [bookingsCount] = await db
    .select({ value: count() })
    .from(schema.bookings);
  const [vipCount] = await db
    .select({ value: count() })
    .from(schema.vipRequests);
  const [mediaCount] = await db
    .select({ value: count() })
    .from(schema.galleryMedia);

  return {
    services: servicesCount?.value || 0,
    bookings: bookingsCount?.value || 0,
    vipRequests: vipCount?.value || 0,
    galleryMedia: mediaCount?.value || 0,
  };
}

export default async function AdminDashboardPage() {
  const stats = await getStats();

  const cardStyle = {
    background: "rgba(217,232,248,0.18)",
    border: "1px solid rgba(217,232,248,0.35)",
    borderRadius: 16,
    padding: 20,
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  };

  return (
    <section>
      <h2 style={{ marginBottom: 20 }}>Operativni pregled</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 16,
        }}
      >
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>Usluge</h3>
          <p style={{ fontSize: 32, marginBottom: 0 }}>{stats.services}</p>
        </div>
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>Termini</h3>
          <p style={{ fontSize: 32, marginBottom: 0 }}>{stats.bookings}</p>
        </div>
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>VIP upiti</h3>
          <p style={{ fontSize: 32, marginBottom: 0 }}>{stats.vipRequests}</p>
        </div>
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>Galerija</h3>
          <p style={{ fontSize: 32, marginBottom: 0 }}>{stats.galleryMedia}</p>
        </div>
      </div>
    </section>
  );
}
