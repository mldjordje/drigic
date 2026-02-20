"use client";

import { useEffect, useMemo, useState } from "react";

const statuses = ["pending", "confirmed", "completed", "cancelled", "no_show"];

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [notesById, setNotesById] = useState({});
  const [statusById, setStatusById] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  async function loadBookings() {
    const query = new URLSearchParams();
    if (from) {
      query.set("from", `${from}T00:00:00.000Z`);
    }
    if (to) {
      query.set("to", `${to}T23:59:59.999Z`);
    }

    const response = await fetch(
      `/api/admin/bookings${query.toString() ? `?${query.toString()}` : ""}`
    );
    const data = await response.json();
    if (!response.ok || !data?.ok) {
      throw new Error(data?.message || "Neuspešno učitavanje termina.");
    }

    setBookings(data.data || []);
    const nextStatus = {};
    const nextNotes = {};
    (data.data || []).forEach((item) => {
      nextStatus[item.id] = item.status;
      nextNotes[item.id] = item.notes || "";
    });
    setStatusById(nextStatus);
    setNotesById(nextNotes);
  }

  useEffect(() => {
    loadBookings().catch((err) => setError(err.message));
  }, []);

  async function updateBooking(bookingId) {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: bookingId,
          status: statusById[bookingId],
          notes: notesById[bookingId],
        }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Neuspešno ažuriranje termina.");
      }
      setMessage("Termin je ažuriran.");
      await loadBookings();
    } catch (err) {
      setError(err.message || "Greška pri ažuriranju.");
    } finally {
      setLoading(false);
    }
  }

  async function completeBooking(bookingId) {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: notesById[bookingId] || "",
        }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Neuspešno završavanje termina.");
      }
      setMessage("Termin je označen kao završen i kreiran je treatment record.");
      await loadBookings();
    } catch (err) {
      setError(err.message || "Greška pri završavanju termina.");
    } finally {
      setLoading(false);
    }
  }

  const totals = useMemo(() => {
    const map = { pending: 0, confirmed: 0, completed: 0, cancelled: 0, no_show: 0 };
    bookings.forEach((booking) => {
      map[booking.status] += 1;
    });
    return map;
  }, [bookings]);

  return (
    <section>
      <h2>Admin - Termini</h2>
      <p style={{ color: "#c6d7ef" }}>
        Menjaj status termina, beleške i završavanje tretmana.
      </p>

      <div style={statsWrapStyle}>
        {statuses.map((status) => (
          <div key={status} style={statCardStyle}>
            <strong>{status}</strong>
            <div style={{ fontSize: 24 }}>{totals[status]}</div>
          </div>
        ))}
      </div>

      <div style={{ ...cardStyle, marginTop: 14 }}>
        <h3 style={{ marginTop: 0 }}>Filter perioda</h3>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div>
            <label style={labelStyle}>Od</label>
            <input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Do</label>
            <input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              style={inputStyle}
            />
          </div>
          <button
            type="button"
            style={{ ...buttonStyle, alignSelf: "end", marginBottom: 10 }}
            onClick={() => loadBookings().catch((err) => setError(err.message))}
          >
            Primeni filter
          </button>
        </div>
      </div>

      {message ? <p style={{ color: "#9be39f" }}>{message}</p> : null}
      {error ? <p style={{ color: "#ff9f9f" }}>{error}</p> : null}

      <div style={{ ...cardStyle, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 950 }}>
          <thead>
            <tr>
              <th style={thStyle}>Početak</th>
              <th style={thStyle}>Kraj</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Napomena</th>
              <th style={thStyle}>Cena</th>
              <th style={thStyle}>Trajanje</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td style={tdStyle}>
                  {new Date(booking.startsAt).toLocaleString("sr-RS")}
                </td>
                <td style={tdStyle}>
                  {new Date(booking.endsAt).toLocaleString("sr-RS")}
                </td>
                <td style={tdStyle}>
                  <select
                    value={statusById[booking.id] || booking.status}
                    onChange={(event) =>
                      setStatusById((prev) => ({
                        ...prev,
                        [booking.id]: event.target.value,
                      }))
                    }
                    style={inputStyle}
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </td>
                <td style={tdStyle}>
                  <input
                    value={notesById[booking.id] || ""}
                    onChange={(event) =>
                      setNotesById((prev) => ({
                        ...prev,
                        [booking.id]: event.target.value,
                      }))
                    }
                    style={inputStyle}
                  />
                </td>
                <td style={tdStyle}>{booking.totalPriceRsd} RSD</td>
                <td style={tdStyle}>{booking.totalDurationMin} min</td>
                <td style={tdStyle}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      style={miniButtonStyle}
                      disabled={loading}
                      onClick={() => updateBooking(booking.id)}
                    >
                      Sačuvaj
                    </button>
                    <button
                      type="button"
                      style={buttonStyle}
                      disabled={loading}
                      onClick={() => completeBooking(booking.id)}
                    >
                      Završi
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const cardStyle = {
  background: "rgba(217,232,248,0.16)",
  border: "1px solid rgba(217,232,248,0.3)",
  borderRadius: 12,
  padding: 16,
  marginTop: 14,
};

const statsWrapStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))",
  gap: 8,
};

const statCardStyle = {
  border: "1px solid rgba(217,232,248,0.25)",
  borderRadius: 10,
  padding: "10px 12px",
  background: "rgba(217,232,248,0.08)",
};

const labelStyle = {
  display: "block",
  marginBottom: 6,
  fontWeight: 600,
};

const inputStyle = {
  borderRadius: 8,
  border: "1px solid rgba(217,232,248,0.35)",
  padding: "7px 9px",
  background: "rgba(10,12,0,0.5)",
  color: "#f2f5fb",
};

const buttonStyle = {
  borderRadius: 8,
  border: "1px solid rgba(217,232,248,0.6)",
  background: "#d9e8f8",
  color: "#102844",
  padding: "7px 9px",
  fontWeight: 700,
  cursor: "pointer",
};

const miniButtonStyle = {
  borderRadius: 8,
  border: "1px solid rgba(217,232,248,0.6)",
  background: "transparent",
  color: "#d9e8f8",
  padding: "7px 9px",
  cursor: "pointer",
};

const thStyle = {
  textAlign: "left",
  borderBottom: "1px solid rgba(217,232,248,0.2)",
  padding: "8px 6px",
};

const tdStyle = {
  borderBottom: "1px solid rgba(217,232,248,0.12)",
  padding: "8px 6px",
  verticalAlign: "top",
};

