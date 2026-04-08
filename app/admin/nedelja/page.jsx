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
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/sunday-availability?upcoming=3");
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
  }, []);

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
      await load();
    } catch (e) {
      setError(e.message || "Greška pri čuvanju.");
    } finally {
      setBusyKey("");
    }
  }

  const muted = { color: "rgba(15, 23, 42, 0.55)", fontSize: "0.9rem" };

  return (
    <div className="admin-template-stack" style={{ maxWidth: 720 }}>
      <header>
        <h2 style={{ marginBottom: 8 }}>Nedeljni termini</h2>
        <p style={muted}>
          Prikazuju se naredne tri nedelje (nedeljni dani). Za svaku nedelju posebno podesite
          radno vreme ili isključite prikaz termina klijentima. Kada je uključeno, termini se
          pojavljuju u formi za zakazivanje kao i za ostale dane.
        </p>
      </header>

      {error ? (
        <p style={{ color: "#b91c1c", marginTop: 12 }} role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p style={{ color: "#15803d", marginTop: 12 }} role="status">
          {message}
        </p>
      ) : null}

      {loading ? (
        <p style={{ ...muted, marginTop: 24 }}>Učitavanje…</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 24 }}>
          {(payload?.weeks || []).map((w) => {
            const row = forms[w.sundayDate] || {
              ...defaultTimes,
              isActive: false,
            };
            return (
              <section
                key={w.sundayDate}
                style={{
                  border: "1px solid rgba(15, 23, 42, 0.12)",
                  borderRadius: 12,
                  padding: "16px 18px",
                  background: "rgba(255,255,255,0.6)",
                }}
              >
                <h3 style={{ fontSize: "1.05rem", marginBottom: 12 }}>
                  {formatSundayLabel(w.sundayDate)}
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 12,
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={muted}>Od</span>
                    <input
                      type="time"
                      value={row.startTime}
                      onChange={(e) =>
                        setForms((prev) => ({
                          ...prev,
                          [w.sundayDate]: { ...row, startTime: e.target.value },
                        }))
                      }
                      className="admin-template-input"
                    />
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={muted}>Do</span>
                    <input
                      type="time"
                      value={row.endTime}
                      onChange={(e) =>
                        setForms((prev) => ({
                          ...prev,
                          [w.sundayDate]: { ...row, endTime: e.target.value },
                        }))
                      }
                      className="admin-template-input"
                    />
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginTop: 22,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={row.isActive}
                      onChange={(e) =>
                        setForms((prev) => ({
                          ...prev,
                          [w.sundayDate]: { ...row, isActive: e.target.checked },
                        }))
                      }
                    />
                    <span>Otvara klijentima (aktivno)</span>
                  </label>
                </div>
                <button
                  type="button"
                  className="admin-template-primary-btn"
                  disabled={busyKey === w.sundayDate}
                  onClick={() => saveWeek(w.sundayDate)}
                >
                  {busyKey === w.sundayDate ? "Čuvanje…" : "Sačuvaj"}
                </button>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
