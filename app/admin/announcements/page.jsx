"use client";

import { useEffect, useState } from "react";

function toIsoOrNull(value) {
  if (!value) {
    return null;
  }
  return new Date(value).toISOString();
}

export default function AdminAnnouncementsPage() {
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    message: "",
    startsAt: "",
    endsAt: "",
    isActive: true,
  });

  async function loadAnnouncements() {
    const response = await fetch("/api/admin/announcements");
    const data = await response.json();
    if (!response.ok || !data?.ok) {
      throw new Error(data?.message || "Neuspesno ucitavanje obavestenja.");
    }
    setItems(data.data || []);
  }

  useEffect(() => {
    loadAnnouncements().catch((err) => setError(err.message));
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          message: form.message,
          startsAt: toIsoOrNull(form.startsAt),
          endsAt: toIsoOrNull(form.endsAt),
          isActive: form.isActive,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Neuspesno kreiranje obavestenja.");
      }
      setForm({
        title: "",
        message: "",
        startsAt: "",
        endsAt: "",
        isActive: true,
      });
      setMessage("Obavestenje je sacuvano.");
      await loadAnnouncements();
    } catch (err) {
      setError(err.message || "Greska pri cuvanju obavestenja.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <div className="admin-card">
        <h2 style={{ marginTop: 0 }}>Obavestenja na pocetnoj strani</h2>
        <p style={{ color: "#c7d8ef" }}>
          Ovo je odobrena funkcija. Objavljena obavestenja vide klijenti na landing stranici.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10 }}>
          <label>
            Naslov
            <input
              required
              value={form.title}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, title: event.target.value }))
              }
              style={inputStyle}
            />
          </label>

          <label>
            Poruka
            <textarea
              required
              value={form.message}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, message: event.target.value }))
              }
              rows={4}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </label>

          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
            <label>
              Pocetak (opciono)
              <input
                type="datetime-local"
                value={form.startsAt}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, startsAt: event.target.value }))
                }
                style={inputStyle}
              />
            </label>
            <label>
              Kraj (opciono)
              <input
                type="datetime-local"
                value={form.endsAt}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, endsAt: event.target.value }))
                }
                style={inputStyle}
              />
            </label>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, isActive: event.target.checked }))
              }
            />
            Aktivno obavestenje
          </label>

          <button type="submit" disabled={loading} className="admin-template-link-btn">
            {loading ? "Cuvanje..." : "Sacuvaj obavestenje"}
          </button>
        </form>

        {message ? <p style={{ color: "#95e7aa" }}>{message}</p> : null}
        {error ? <p style={{ color: "#ffabab" }}>{error}</p> : null}
      </div>

      <div className="admin-card">
        <h3 style={{ marginTop: 0 }}>Lista obavestenja</h3>
        {items.length ? (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {items.map((item) => (
              <li key={item.id} style={{ marginBottom: 10 }}>
                <strong>{item.title}</strong> - {item.isActive ? "aktivno" : "neaktivno"}
              </li>
            ))}
          </ul>
        ) : (
          <p>Nema obavestenja.</p>
        )}
      </div>
    </section>
  );
}

const inputStyle = {
  width: "100%",
  marginTop: 6,
  borderRadius: 10,
  border: "1px solid rgba(217,232,248,0.35)",
  padding: "10px 12px",
  background: "rgba(10,12,0,0.52)",
  color: "#f2f5fb",
};
