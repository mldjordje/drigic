"use client";

import { useEffect, useState } from "react";

async function parseResponse(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export default function BeautyPassPage() {
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/me/profile")
      .then(async (res) => {
        if (!res.ok) {
          return null;
        }
        const payload = await parseResponse(res);
        return payload?.user || null;
      })
      .then((currentUser) => {
        setUser(currentUser);
        if (!currentUser) {
          return null;
        }
        return fetch("/api/me/beauty-pass").then(async (res) => ({
          ok: res.ok,
          json: await parseResponse(res),
        }));
      })
      .then((payload) => {
        if (!payload) {
          return;
        }
        if (!payload.ok || !payload.json?.ok) {
          throw new Error(payload.json?.message || "Neuspesno ucitavanje Beauty Pass podataka.");
        }
        setData(payload.json);
      })
      .catch((err) => setError(err.message || "Greska pri ucitavanju."));
  }, []);

  return (
    <main className="clinic-home5" style={pageStyle}>
      <div style={{ maxWidth: 980, margin: "0 auto", display: "grid", gap: 16 }}>
        <h1 style={{ marginTop: 0, color: "#f2f5fb" }}>Beauty Pass</h1>

        {!user ? (
          <section style={cardStyle}>
            <p>Prijavite se da vidite svoj Beauty Pass.</p>
            <a href="/api/auth/google?next=%2Fbeauty-pass" style={buttonStyle}>
              Login with Google
            </a>
          </section>
        ) : (
          <>
            <section style={cardStyle}>
              <h2 style={{ marginTop: 0 }}>Profil</h2>
              <p>Email: {user.email}</p>
              <a href="/booking" style={buttonStyle}>
                Zakazi termin
              </a>
            </section>

            <section style={cardStyle}>
              <h2 style={{ marginTop: 0 }}>Sledeci termini</h2>
              {data?.upcomingBookings?.length ? (
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {data.upcomingBookings.map((booking) => (
                    <li key={booking.id} style={{ marginBottom: 8 }}>
                      {new Date(booking.startsAt).toLocaleString("sr-RS")} - {booking.status}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Nema sledecih termina.</p>
              )}
            </section>

            <section style={cardStyle}>
              <h2 style={{ marginTop: 0 }}>Istorija tretmana</h2>
              {data?.treatmentHistory?.length ? (
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {data.treatmentHistory.map((record) => (
                    <li key={record.id} style={{ marginBottom: 8 }}>
                      {new Date(record.treatmentDate).toLocaleDateString("sr-RS")} -{" "}
                      {record.notes || "Bez napomene"}
                      {record.product?.name ? ` (${record.product.name})` : ""}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Istorija je trenutno prazna.</p>
              )}
            </section>

            <section style={cardStyle}>
              <h2 style={{ marginTop: 0 }}>Penali / dugovanja</h2>
              {data?.penalties?.length ? (
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {data.penalties.map((penalty) => (
                    <li key={penalty.id} style={{ marginBottom: 8 }}>
                      {penalty.amountRsd} RSD - {penalty.status}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Nemate aktivnih dugovanja.</p>
              )}
            </section>
          </>
        )}

        {error ? <p style={{ color: "#ff9f9f" }}>{error}</p> : null}
      </div>
    </main>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#0A0C00",
  color: "#f2f5fb",
  padding: "32px 14px",
};

const cardStyle = {
  background: "rgba(20, 29, 42, 0.48)",
  border: "1px solid rgba(217,232,248,0.28)",
  borderRadius: 16,
  padding: 18,
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

const buttonStyle = {
  borderRadius: 10,
  border: "1px solid rgba(217,232,248,0.55)",
  background: "rgba(20, 38, 61, 0.95)",
  color: "#f4f8ff",
  padding: "10px 14px",
  fontWeight: 700,
  textDecoration: "none",
  display: "inline-flex",
};
