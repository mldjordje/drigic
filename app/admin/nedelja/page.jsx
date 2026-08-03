"use client";

import { useCallback, useEffect, useState } from "react";
import AdminIcon from "@/components/admin/ui/AdminIcon";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminField from "@/components/admin/ui/AdminField";
import AdminEmptyState from "@/components/admin/ui/AdminEmptyState";
import AdminStatusMessage from "@/components/admin/ui/AdminStatusMessage";

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
        `/api/admin/sunday-availability?upcoming=${encodeURIComponent(String(weeksAhead))}`,
        { cache: "no-store" }
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

  async function saveWeek(sundayDate, overrideRow) {
    const row = overrideRow || forms[sundayDate];
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
              : Boolean(row.isActive),
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
  const activeWeeks = (payload?.weeks || []).filter((w) =>
    Boolean(forms[w.sundayDate]?.isActive ?? w.record?.isActive)
  );

  return (
    <section className="admin-page">
      <AdminPageHeader
        icon="weekend"
        title="Nedeljni termini"
        description="Podesite da li klinika radi nedeljom. Kada je nedelja aktivna, slobodni termini se prikazuju i klijentima na sajtu i u admin kalendaru."
      />

      <div className="admin-section">
        <div className="admin-toolbar">
          <AdminField
            icon="calendar"
            label="Prikaži nedelja unapred"
            hint="Koliko narednih nedelja se prikazuje u listi ispod."
            className="admin-toolbar-spacer"
          >
            <select
              className="admin-inline-input"
              value={weeksAhead}
              onChange={(e) => setWeeksAhead(Math.max(1, Math.min(24, Number(e.target.value) || 8)))}
              style={{ minWidth: 180, maxWidth: 240 }}
            >
              {[3, 6, 8, 12, 16, 24].map((n) => (
                <option key={n} value={n}>
                  {n} nedelja
                </option>
              ))}
            </select>
          </AdminField>
          <button type="button" className="admin-btn" onClick={() => load()} disabled={loading}>
            <AdminIcon name="refresh" size={16} />
            Osveži
          </button>
        </div>
        {!loading ? (
          <div
            style={{
              display: "grid",
              gap: 6,
              marginTop: 12,
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid rgba(155, 227, 159, 0.28)",
              background: activeWeeks.length
                ? "rgba(20, 83, 45, 0.18)"
                : "rgba(7, 18, 35, 0.38)",
            }}
          >
            <strong style={{ color: activeWeeks.length ? "#9be39f" : "#bed0e8" }}>
              Aktivne nedelje u prikazu: {activeWeeks.length}
            </strong>
            <small style={muted}>
              {activeWeeks.length
                ? activeWeeks.map((w) => formatSundayLabel(w.sundayDate)).join(" | ")
                : "Nema aktivnih nedelja u izabranom periodu."}
            </small>
          </div>
        ) : null}
        {message ? <AdminStatusMessage tone="success" toneLabel="Uspeh">{message}</AdminStatusMessage> : null}
        {error ? <AdminStatusMessage tone="error" toneLabel="Greška">{error}</AdminStatusMessage> : null}
      </div>

      <div className="admin-section" style={{ gap: 10 }}>
        {loading ? (
          <div style={{ display: "grid", gap: 8 }}>
            <div className="admin-skeleton admin-skeleton--card" />
            <div className="admin-skeleton admin-skeleton--card" />
          </div>
        ) : null}
        {!loading && !(payload?.weeks || []).length ? (
          <AdminEmptyState
            icon="weekend"
            title="Nema dostupnih nedelja za prikaz"
            description="Povećajte broj nedelja unapred u filteru iznad."
          />
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
                <AdminField icon="clock" label="Od" hint="Prvi termin te nedelje.">
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
                </AdminField>
                <AdminField icon="clock" label="Do" hint="Poslednji termin te nedelje.">
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
                </AdminField>
              </div>

              <label className={`admin-switch ${isActive ? "is-on" : ""}`}>
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
                <span className="admin-switch-text">
                  <strong>{isActive ? "Nedelja radi (otvoreno za klijente)" : "Nedelja ne radi"}</strong>
                  <span>Kada je otvoreno, termini se pojavljuju u booking formi i u admin kalendaru.</span>
                </span>
              </label>

              <div className="admin-btn-row" style={{ justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className={`admin-btn admin-btn--sm ${isActive ? "admin-btn--danger" : "admin-btn--success"}`}
                  disabled={busyKey === w.sundayDate}
                  onClick={() => saveWeek(w.sundayDate, { ...row, isActive: !isActive })}
                >
                  <AdminIcon name={isActive ? "close" : "check"} size={15} />
                  {busyKey === w.sundayDate ? "Čuvanje..." : isActive ? "Deaktiviraj" : "Aktiviraj"}
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--sm"
                  disabled={busyKey === w.sundayDate}
                  onClick={() => saveWeek(w.sundayDate)}
                >
                  <AdminIcon name="save" size={15} />
                  {busyKey === w.sundayDate ? "Čuvanje..." : "Sačuvaj vreme"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
