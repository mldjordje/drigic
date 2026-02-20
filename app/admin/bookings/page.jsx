import { desc } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";

async function getBookings() {
  const db = getDb();
  return db.select().from(schema.bookings).orderBy(desc(schema.bookings.startsAt)).limit(100);
}

export default async function AdminBookingsPage() {
  const bookings = await getBookings();

  return (
    <section>
      <h2>Dnevni i mesečni termini</h2>
      <div style={{ overflowX: "auto", marginTop: 16 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>Početak</th>
              <th style={thStyle}>Kraj</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Cena</th>
              <th style={thStyle}>Trajanje</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td style={tdStyle}>{new Date(booking.startsAt).toLocaleString("sr-RS")}</td>
                <td style={tdStyle}>{new Date(booking.endsAt).toLocaleString("sr-RS")}</td>
                <td style={tdStyle}>{booking.status}</td>
                <td style={tdStyle}>{booking.totalPriceRsd} RSD</td>
                <td style={tdStyle}>{booking.totalDurationMin} min</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const thStyle = {
  textAlign: "left",
  borderBottom: "1px solid rgba(217,232,248,0.2)",
  padding: "10px 8px",
};

const tdStyle = {
  borderBottom: "1px solid rgba(217,232,248,0.1)",
  padding: "10px 8px",
};

