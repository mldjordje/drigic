"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/components/common/LocaleProvider";

const STATUSES = ["pending", "confirmed", "cancelled", "no_show"];

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

export default function AdminBookingsPage() {
  const { t, intlLocale } = useLocale();
  const statusLabel = (status) =>
    status ? t(`admin.status.${status}`) : status;
  const formatDateTime = (value) => {
    try {
      return new Date(value).toLocaleString(intlLocale);
    } catch {
      return value;
    }
  };
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
    const data = await parseResponse(response);
    if (!response.ok || !data?.ok) {
      throw new Error(data?.message || t("admin.book.loadFailed"));
    }

    const rows = data.data || [];
    setBookings(rows);
    const nextStatus = {};
    const nextNotes = {};
    rows.forEach((item) => {
      nextStatus[item.id] = item.status;
      nextNotes[item.id] = item.notes || "";
    });
    setStatusById(nextStatus);
    setNotesById(nextNotes);
  }

  useEffect(() => {
    loadBookings().catch((err) => setError(err.message));
  }, []);

  async function updateBooking(bookingId, nextStatus) {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const statusToPersist = nextStatus || statusById[bookingId];
      const response = await fetch("/api/admin/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: bookingId,
          status: statusToPersist,
          notes: notesById[bookingId],
        }),
      });
      const data = await parseResponse(response);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || t("admin.book.updateFailed"));
      }
      setMessage(t("admin.book.updated"));
      setStatusById((prev) => ({
        ...prev,
        [bookingId]: data.data?.status || statusToPersist,
      }));
      await loadBookings();
    } catch (err) {
      setError(err.message || t("admin.book.genericError"));
    } finally {
      setLoading(false);
    }
  }

  const totals = useMemo(() => {
    const map = { pending: 0, confirmed: 0, completed: 0, cancelled: 0, no_show: 0 };
    bookings.forEach((booking) => {
      map[booking.status] = (map[booking.status] || 0) + 1;
    });
    return map;
  }, [bookings]);

  function getQuickActions(status) {
    if (status === "pending") {
      return [
        { value: "confirmed", label: t("admin.book.confirm") },
        { value: "cancelled", label: t("admin.book.cancel") },
        { value: "no_show", label: t("admin.book.noShow") },
      ];
    }
    if (status === "confirmed") {
      return [
        { value: "cancelled", label: t("admin.book.cancel") },
        { value: "no_show", label: t("admin.book.noShow") },
      ];
    }
    return [];
  }

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <div className="admin-card">
        <h2 style={{ marginTop: 0 }}>{t("admin.book.title")}</h2>
        <p style={{ color: "#c6d7ef", marginBottom: 0 }}>
          {t("admin.book.subtitle")}
        </p>
      </div>

      <div style={statsWrapStyle}>
        {STATUSES.map((status) => (
          <div key={status} style={statCardStyle}>
            <strong>{statusLabel(status) || status}</strong>
            <div style={{ fontSize: 24 }}>{totals[status]}</div>
          </div>
        ))}
      </div>

      <div className="admin-card">
        <h3 style={{ marginTop: 0 }}>{t("admin.book.periodFilter")}</h3>
        <div style={filterWrapStyle}>
          <div>
            <label style={labelStyle}>{t("admin.book.from")}</label>
            <input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>{t("admin.book.to")}</label>
            <input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              style={inputStyle}
            />
          </div>
          <button
            type="button"
            className="admin-template-link-btn"
            style={{ alignSelf: "end" }}
            onClick={() => loadBookings().catch((err) => setError(err.message))}
          >
            {t("admin.book.applyFilter")}
          </button>
        </div>
      </div>

      {message ? <p style={{ color: "#9be39f", margin: 0 }}>{message}</p> : null}
      {error ? <p style={{ color: "#ff9f9f", margin: 0 }}>{error}</p> : null}

      <div style={cardsWrapStyle}>
        {bookings.map((booking) => (
          <article key={booking.id} className="admin-card" style={{ display: "grid", gap: 10 }}>
            <div style={metaGridStyle}>
              <div>
                <small style={smallStyle}>{t("admin.book.client")}</small>
                <div>{booking.clientName || "-"}</div>
              </div>
              <div>
                <small style={smallStyle}>{t("admin.book.start")}</small>
                <div>{formatDateTime(booking.startsAt)}</div>
              </div>
              <div>
                <small style={smallStyle}>{t("admin.book.end")}</small>
                <div>{formatDateTime(booking.endsAt)}</div>
              </div>
              <div>
                <small style={smallStyle}>{t("admin.book.priceDuration")}</small>
                <div>
                  {booking.totalPriceRsd} EUR / {booking.totalDurationMin} min
                </div>
              </div>
            </div>

            <div>
              <small style={smallStyle}>{t("admin.book.services")}</small>
              <div>{booking.serviceSummary || "-"}</div>
            </div>

            <div style={controlGridStyle}>
              <div>
                <small style={smallStyle}>{t("admin.book.status")}</small>
                <div style={{ marginTop: 4 }}>
                  {statusLabel(statusById[booking.id] || booking.status) ||
                    statusById[booking.id] ||
                    booking.status}
                </div>
              </div>

              <label>
                <small style={smallStyle}>{t("admin.book.note")}</small>
                <input
                  value={notesById[booking.id] || ""}
                  onChange={(event) =>
                    setNotesById((prev) => ({
                      ...prev,
                      [booking.id]: event.target.value,
                    }))
                  }
                  style={{ ...inputStyle, marginTop: 4 }}
                />
              </label>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {getQuickActions(statusById[booking.id] || booking.status).map((action) => (
                <button
                  key={`${booking.id}-${action.value}`}
                  type="button"
                  className="admin-template-link-btn"
                  disabled={loading}
                  onClick={() => {
                    setStatusById((prev) => ({ ...prev, [booking.id]: action.value }));
                    updateBooking(booking.id, action.value);
                  }}
                >
                  {action.label}
                </button>
              ))}
              <button
                type="button"
                className="admin-template-link-btn"
                disabled={loading}
                onClick={() => updateBooking(booking.id)}
              >
                {t("admin.book.saveNote")}
              </button>
            </div>
          </article>
        ))}
      </div>

      {!bookings.length ? (
        <div className="admin-card">
          <p style={{ margin: 0, color: "#d5e2f4" }}>{t("admin.book.noBookings")}</p>
        </div>
      ) : null}
    </section>
  );
}

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

const filterWrapStyle = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "flex-end",
};

const cardsWrapStyle = {
  display: "grid",
  gap: 10,
};

const metaGridStyle = {
  display: "grid",
  gap: 8,
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
};

const controlGridStyle = {
  display: "grid",
  gap: 8,
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
};

const labelStyle = {
  display: "block",
  marginBottom: 6,
  fontWeight: 600,
};

const smallStyle = {
  color: "#abc2dd",
  fontSize: 12,
};

const inputStyle = {
  borderRadius: 8,
  border: "1px solid rgba(217,232,248,0.35)",
  padding: "7px 9px",
  background: "rgba(10,12,0,0.5)",
  color: "#f2f5fb",
  width: "100%",
};
