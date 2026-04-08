"use client";

import { useCallback, useEffect, useState } from "react";

function parseResponse(response) {
  return response
    .text()
    .then((text) => {
      if (!text) {
        return null;
      }
      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    })
    .catch(() => null);
}

function formatSundayLabel(dateKey) {
  if (!dateKey) {
    return "—";
  }
  try {
    return new Date(`${dateKey}T12:00:00Z`).toLocaleDateString("sr-Latn-RS", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateKey;
  }
}

const defaultTimes = { startTime: "10:00", endTime: "16:00" };

export default function AdminSundayPage() {
  const [payload, setPayload] = useState(null);
  const [forms, setForms] = useState({});
  const [weeksAhead, setWeeksAhead] = useState(8);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/admin/sunday-availability?upcoming=${encodeURIComponent(String(weeksAhead))}`
      );
      const data = await parseResponse(response);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Neuspešno učitavanje.");
      }
      setPayload(data.data);
      const nextForms = {};
      (data.data?.weeks || []).forEach((w) => {
        const rec = w.record;
        nextForms[w.sundayDate] = {
          startTime: rec?.startTime || defaultTimes.startTime,
          endTime: rec?.endTime || defaultTimes.endTime,
          isActive: rec ? Boolean(rec.isActive) : false,
        };
      });
      setForms(nextForms);
    } catch (e) {
      setError(e.message || "Greška pri učitavanju.");
    } finally {
      setLoading(false);
    }
  }, [weeksAhead]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveWeek(sundayDate) {
    const row = forms[sundayDate];
    if (!row) {
      return;
    }
    setBusyKey(sundayDate);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/sunday-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sundayDate,
          startTime: row.startTime,
          endTime: row.endTime,
          isActive: row.isActive,
        }),
      });
      const data = await parseResponse(response);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Čuvanje nije uspelo.");
      }
      setMessage(`Sačuvano: ${formatSundayLabel(sundayDate)}`);
      // Optimistički potvrdi stanje da UI odmah bude konzistentan.
      setForms((prev) => ({
        ...prev,
        [sundayDate]: {
          ...prev[sundayDate],
          startTime: data?.data?.startTime || prev[sundayDate]?.startTime,
          endTime: data?.data?.endTime || prev[sundayDate]?.endTime,
          isActive:
            data?.data?.isActive !== undefined
              ? Boolean(data.data.isActive)
              : Boolean(prev[sundayDate]?.isActive),
        },
      }));
      await load();
    } catch (e) {
      setError(e.message || "Greška pri čuvanju.");
    } finally {
      setBusyKey("");
    }
  }

  const muted = { color: "#bed0e8" };
  const sectionGridStyle = { display: "grid", gap: 12 };
  const weekCardStyle = (active) => ({
    display: "grid",
    gap: 12,
    padding: "14px 16px",
    borderRadius: 14,
    border: `1px solid ${active ? "rgba(155, 227, 159, 0.35)" : "rgba(255, 171, 171, 0.22)"}`,
    background: active ? "rgba(20, 83, 45, 0.22)" : "rgba(7, 18, 35, 0.45)",
  });
  const weekTopRowStyle = {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: 10,
  };
  const badgeStyle = (active) => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    border: `1px solid ${active ? "rgba(155, 227, 159, 0.35)" : "rgba(255, 171, 171, 0.35)"}`,
    background: active ? "rgba(155, 227, 159, 0.12)" : "rgba(255, 171, 171, 0.12)",
    color: active ? "#9be39f" : "#ffabab",
  });

  return (
    <section style={sectionGridStyle}>
      <div className="admin-card">
        <h2 style={{ marginTop: 0 }}>Nedeljni termini</h2>
        <p style={{ ...muted, marginBottom: 0 }}>
          Ovde podešavaš da li klinika radi nedeljom. Kada je nedelja aktivna, slobodni termini se
          prikazuju i klijentima i u admin kalendaru.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginTop: 10 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <small style={muted}>Prikaži nedelja unapred</small>
            <select
              className="admin-inline-input"
              value={weeksAhead}
              onChange={(e) => setWeeksAhead(Math.max(1, Math.min(24, Number(e.target.value) || 8)))}
              style={{ minWidth: 180 }}
            >
              {[3, 6, 8, 12, 16, 24].map((n) => (
                <option key={n} value={n}>
                  {n} nedelja
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="admin-template-link-btn" onClick={() => load()} disabled={loading}>
            Osveži
          </button>
        </div>
        {message ? <p style={{ color: "#9be39f", marginBottom: 0 }}>{message}</p> : null}
        {error ? <p style={{ color: "#ffabab", marginBottom: 0 }}>{error}</p> : null}
      </div>

      <div className="admin-card" style={{ display: "grid", gap: 10 }}>
        {loading ? <p style={muted}>Učitavanje…</p> : null}
        {!loading && !(payload?.weeks || []).length ? (
          <p style={muted}>Nema dostupnih nedelja za prikaz.</p>
        ) : null}

        {(payload?.weeks || []).map((w) => {
          const recordActive = w?.record ? Boolean(w.record.isActive) : false;
          const row = forms[w.sundayDate] || {
            ...defaultTimes,
            isActive: recordActive,
          };
          const isActive = Boolean(row.isActive);

          return (
            <article key={w.sundayDate} style={weekCardStyle(isActive)}>
              <div style={weekTopRowStyle}>
                <strong>{formatSundayLabel(w.sundayDate)}</strong>
                <span style={badgeStyle(isActive)}>
                  {isActive ? "Radi" : "Zatvoreno"}
                </span>
              </div>

              <div className="admin-services-split-grid">
                <label>
                  Od
                  <input
                    type="time"
                    className="admin-inline-input"
                    value={row.startTime}
                    disabled={busyKey === w.sundayDate}
                    onChange={(e) =>
                      setForms((prev) => ({
                        ...prev,
                        [w.sundayDate]: { ...row, startTime: e.target.value },
                      }))
                    }
                  />
                </label>
                <label>
                  Do
                  <input
                    type="time"
                    className="admin-inline-input"
                    value={row.endTime}
                    disabled={busyKey === w.sundayDate}
                    onChange={(e) =>
                      setForms((prev) => ({
                        ...prev,
                        [w.sundayDate]: { ...row, endTime: e.target.value },
                      }))
                    }
                  />
                </label>
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <input
                  type="checkbox"
                  checked={isActive}
                  disabled={busyKey === w.sundayDate}
                  onChange={(e) =>
                    setForms((prev) => ({
                      ...prev,
                      [w.sundayDate]: { ...row, isActive: e.target.checked },
                    }))
                  }
                />
                <span style={{ fontWeight: 800 }}>
                  {isActive ? "Nedelja radi (otvoreno za klijente)" : "Nedelja ne radi"}
                </span>
                <small style={muted}>
                  Kada je otvoreno, termini se pojavljuju u booking formi i u admin kalendaru.
                </small>
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="admin-template-link-btn"
                  disabled={busyKey === w.sundayDate}
                  onClick={() => saveWeek(w.sundayDate)}
                >
                  {busyKey === w.sundayDate ? "Čuvanje..." : "Sačuvaj"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
