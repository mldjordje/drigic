"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminIcon from "@/components/admin/ui/AdminIcon";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminSection from "@/components/admin/ui/AdminSection";
import AdminField from "@/components/admin/ui/AdminField";
import AdminEmptyState from "@/components/admin/ui/AdminEmptyState";
import AdminStatusMessage from "@/components/admin/ui/AdminStatusMessage";

const emptySaturdayForm = {
  startDate: "",
  endDate: "",
  startTime: "16:00",
  endTime: "21:00",
  note: "",
};

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

function formatDateLabel(value) {
  if (!value) {
    return "-";
  }

  try {
    return new Date(`${value}T12:00:00Z`).toLocaleDateString("sr-RS", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return value;
  }
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

const defaultSundayTimes = { startTime: "16:00", endTime: "21:00" };

export default function AdminAfternoonShiftsPage() {
  const [saturdayForm, setSaturdayForm] = useState(emptySaturdayForm);
  const [saturdayItems, setSaturdayItems] = useState([]);
  const [loadingSaturday, setLoadingSaturday] = useState(true);

  const [sundayPayload, setSundayPayload] = useState(null);
  const [sundayForms, setSundayForms] = useState({});
  const [weeksAhead, setWeeksAhead] = useState(8);
  const [loadingSunday, setLoadingSunday] = useState(true);

  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadSaturday = useCallback(async () => {
    setLoadingSaturday(true);
    setError("");
    try {
      const response = await fetch("/api/admin/saturday-afternoons");
      const data = await parseResponse(response);

      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Neuspešno učitavanje aktivacija za subotu.");
      }

      setSaturdayItems(data.data || []);
    } catch (e) {
      setError(e.message || "Greška pri učitavanju aktivacija.");
    } finally {
      setLoadingSaturday(false);
    }
  }, []);

  const loadSunday = useCallback(async () => {
    setLoadingSunday(true);
    setError("");
    try {
      const response = await fetch(
        `/api/admin/sunday-availability?upcoming=${encodeURIComponent(String(weeksAhead))}`,
        { cache: "no-store" }
      );
      const data = await parseResponse(response);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Neuspešno učitavanje nedelja.");
      }
      setSundayPayload(data.data);
      const nextForms = {};
      (data.data?.weeks || []).forEach((w) => {
        const rec = w.record;
        nextForms[w.sundayDate] = {
          startTime: rec?.startTime || defaultSundayTimes.startTime,
          endTime: rec?.endTime || defaultSundayTimes.endTime,
          isActive: rec ? Boolean(rec.isActive) : false,
        };
      });
      setSundayForms(nextForms);
    } catch (e) {
      setError(e.message || "Greška pri učitavanju nedelja.");
    } finally {
      setLoadingSunday(false);
    }
  }, [weeksAhead]);

  useEffect(() => {
    loadSaturday();
  }, [loadSaturday]);

  useEffect(() => {
    loadSunday();
  }, [loadSunday]);

  const activeSaturdayItems = useMemo(
    () => saturdayItems.filter((item) => item.isActive),
    [saturdayItems]
  );

  async function createSaturdayActivation(event) {
    event.preventDefault();
    setBusyKey("saturday-create");
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/saturday-afternoons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saturdayForm),
      });
      const data = await parseResponse(response);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Neuspešno čuvanje aktivacije.");
      }
      setSaturdayForm(emptySaturdayForm);
      setMessage("Popodnevni termini za subotu su aktivirani (u izabranom periodu).");
      await loadSaturday();
    } catch (e) {
      setError(e.message || "Greška pri čuvanju aktivacije.");
    } finally {
      setBusyKey("");
    }
  }

  async function toggleSaturdayItem(item) {
    setBusyKey(`saturday-toggle-${item.id}`);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/saturday-afternoons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          isActive: !item.isActive,
        }),
      });
      const data = await parseResponse(response);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Neuspešna promena statusa.");
      }

      setMessage(item.isActive ? "Aktivacija (subota) je isključena." : "Aktivacija (subota) je uključena.");
      await loadSaturday();
    } catch (e) {
      setError(e.message || "Greška pri promeni statusa.");
    } finally {
      setBusyKey("");
    }
  }

  async function deleteSaturdayItem(item) {
    setBusyKey(`saturday-delete-${item.id}`);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/admin/saturday-afternoons/${item.id}`, {
        method: "DELETE",
      });
      const data = await parseResponse(response);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Neuspešno brisanje aktivacije.");
      }
      setMessage("Aktivacija (subota) je obrisana.");
      await loadSaturday();
    } catch (e) {
      setError(e.message || "Greška pri brisanju aktivacije.");
    } finally {
      setBusyKey("");
    }
  }

  async function saveSunday(sundayDate, overrideRow) {
    const row = overrideRow || sundayForms[sundayDate];
    if (!row) {
      return;
    }
    setBusyKey(`sunday-${sundayDate}`);
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
      setMessage(`Sačuvano (nedelja): ${formatSundayLabel(sundayDate)}`);
      await loadSunday();
    } catch (e) {
      setError(e.message || "Greška pri čuvanju.");
    } finally {
      setBusyKey("");
    }
  }

  const mutedTextStyle = { color: "#bed0e8" };
  const statGridStyle = {
    display: "grid",
    gap: 12,
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  };
  const gridStyle = {
    display: "grid",
    gap: 12,
    gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
    alignItems: "start",
  };

  return (
    <section className="admin-page">
      <AdminPageHeader
        icon="sun"
        title="Popodnevni termini (subota i nedelja)"
        description="Otvaranje dodatnih popodnevnih termina. Subota podrazumevano radi 10–16h — ovde dodajete raspon (npr. 16–21h) za izabrani period. Nedelja je u osnovi zatvorena, pa se za nju popodnevni termini podešavaju po datumu."
      />

      {message ? <AdminStatusMessage tone="success" toneLabel="Uspeh">{message}</AdminStatusMessage> : null}
      {error ? <AdminStatusMessage tone="error" toneLabel="Greška">{error}</AdminStatusMessage> : null}

      <AdminSection icon="sun" title="Subota — dodatni popodnevni raspon">
        <div className="admin-stat-grid">
          <div className="admin-stat-card admin-stat-card--green">
            <span className="admin-stat-card-icon" aria-hidden="true"><AdminIcon name="check" size={18} /></span>
            <span className="admin-stat-card-label">Aktivnih perioda</span>
            <strong className="admin-stat-card-value">{activeSaturdayItems.length}</strong>
          </div>
          <div className="admin-stat-card admin-stat-card--gold">
            <span className="admin-stat-card-icon" aria-hidden="true"><AdminIcon name="list" size={18} /></span>
            <span className="admin-stat-card-label">Ukupno aktivacija</span>
            <strong className="admin-stat-card-value">{saturdayItems.length}</strong>
          </div>
        </div>

        <div style={gridStyle}>
          <form
            onSubmit={createSaturdayActivation}
            className="admin-section"
            style={{ gap: 12 }}
          >
            <div>
              <h4 className="admin-section-title">
                <AdminIcon name="plus" size={18} />
                Nova aktivacija (subota)
              </h4>
              <p className="admin-section-desc">
                Unesite period i popodnevni raspon sati. Aktivacija utiče samo na subote unutar
                opsega — nedelje se ovde ignorišu.
              </p>
            </div>

            <div className="admin-services-split-grid">
              <AdminField icon="calendar" label="Datum od" hint="Prva subota od koje raspon važi." required>
                <input
                  type="date"
                  className="admin-inline-input"
                  value={saturdayForm.startDate}
                  onChange={(e) => setSaturdayForm((p) => ({ ...p, startDate: e.target.value }))}
                  required
                />
              </AdminField>
              <AdminField icon="calendar" label="Datum do" hint="Poslednji dan opsega (uključen)." required>
                <input
                  type="date"
                  className="admin-inline-input"
                  value={saturdayForm.endDate}
                  onChange={(e) => setSaturdayForm((p) => ({ ...p, endDate: e.target.value }))}
                  required
                />
              </AdminField>
            </div>

            <div className="admin-services-split-grid">
              <AdminField icon="clock" label="Vreme od" hint="Početak dodatnog popodnevnog bloka." required>
                <input
                  type="time"
                  className="admin-inline-input"
                  value={saturdayForm.startTime}
                  onChange={(e) => setSaturdayForm((p) => ({ ...p, startTime: e.target.value }))}
                  required
                />
              </AdminField>
              <AdminField icon="clock" label="Vreme do" hint="Kraj bloka — poslednji termin počinje pre ovog vremena." required>
                <input
                  type="time"
                  className="admin-inline-input"
                  value={saturdayForm.endTime}
                  onChange={(e) => setSaturdayForm((p) => ({ ...p, endTime: e.target.value }))}
                  required
                />
              </AdminField>
            </div>

            <AdminField
              icon="edit"
              label="Napomena"
              hint="Interni podsetnik. Klijent je ne vidi."
              optional
            >
              <input
                className="admin-inline-input"
                value={saturdayForm.note}
                onChange={(e) => setSaturdayForm((p) => ({ ...p, note: e.target.value }))}
                placeholder="npr. produženo radno vreme"
              />
            </AdminField>

            <button
              type="submit"
              className="admin-btn admin-btn--primary"
              disabled={busyKey === "saturday-create"}
            >
              <AdminIcon name="sun" size={16} />
              {busyKey === "saturday-create" ? "Čuvanje…" : "Aktiviraj popodnevne termine za subotu"}
            </button>
          </form>

          <div className="admin-section" style={{ gap: 10 }}>
            <h4 className="admin-section-title">
              <AdminIcon name="list" size={18} />
              Sačuvane aktivacije (subota)
            </h4>
            {loadingSaturday ? <div className="admin-skeleton admin-skeleton--card" /> : null}
            {!loadingSaturday && !saturdayItems.length ? (
              <AdminEmptyState
                icon="sun"
                title="Nema sačuvanih aktivacija"
                description="Popunite formu levo da otvorite prvi popodnevni blok za subotu."
              />
            ) : null}
            {saturdayItems.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "grid",
                  gap: 8,
                  padding: "12px 12px",
                  borderRadius: 12,
                  border: `1px solid ${
                    item.isActive ? "rgba(155, 227, 159, 0.35)" : "rgba(255, 171, 171, 0.22)"
                  }`,
                  background: item.isActive ? "rgba(20, 83, 45, 0.18)" : "rgba(7, 18, 35, 0.38)",
                }}
              >
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
                  <strong style={{ color: item.isActive ? "#9be39f" : "#ffabab" }}>
                    {item.isActive ? "Aktivno" : "Isključeno"}
                  </strong>
                  <small style={mutedTextStyle}>
                    {formatDateLabel(String(item.startDate).slice(0, 10))} →{" "}
                    {formatDateLabel(String(item.endDate).slice(0, 10))}
                  </small>
                </div>
                <div style={mutedTextStyle}>
                  {item.startTime}–{item.endTime}
                  {item.note ? ` • ${item.note}` : ""}
                </div>
                <div className="admin-btn-row">
                  <button
                    type="button"
                    className="admin-btn admin-btn--sm"
                    onClick={() => toggleSaturdayItem(item)}
                    disabled={busyKey === `saturday-toggle-${item.id}`}
                  >
                    <AdminIcon name={item.isActive ? "close" : "check"} size={15} />
                    {busyKey === `saturday-toggle-${item.id}` ? "…" : item.isActive ? "Isključi" : "Uključi"}
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--sm admin-btn--danger"
                    onClick={() => deleteSaturdayItem(item)}
                    disabled={busyKey === `saturday-delete-${item.id}`}
                  >
                    <AdminIcon name="trash" size={15} />
                    {busyKey === `saturday-delete-${item.id}` ? "…" : "Obriši"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </AdminSection>

      <AdminSection
        icon="weekend"
        title="Nedelja — popodnevni termini po datumu"
        description="Nedelja je podrazumevano zatvorena, pa se svaka nedelja otvara posebno."
      >
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
          <button
            type="button"
            className="admin-btn"
            onClick={() => loadSunday()}
            disabled={loadingSunday}
          >
            <AdminIcon name="refresh" size={16} />
            Osveži
          </button>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          {loadingSunday ? <div className="admin-skeleton admin-skeleton--card" /> : null}
          {!loadingSunday && !(sundayPayload?.weeks || []).length ? (
            <AdminEmptyState icon="weekend" title="Nema nedelja u prikazu" />
          ) : null}

          {(sundayPayload?.weeks || []).map((w) => {
            const row = sundayForms[w.sundayDate] || {
              ...defaultSundayTimes,
              isActive: false,
            };
            const saving = busyKey === `sunday-${w.sundayDate}`;
            const active = Boolean(row.isActive);
            return (
              <div
                key={w.sundayDate}
                style={{
                  display: "grid",
                  gap: 10,
                  padding: "14px 16px",
                  borderRadius: 14,
                  border: `1px solid ${active ? "rgba(155, 227, 159, 0.35)" : "rgba(255, 171, 171, 0.22)"}`,
                  background: active ? "rgba(20, 83, 45, 0.18)" : "rgba(7, 18, 35, 0.38)",
                }}
              >
                <div style={{ display: "flex", gap: 10, justifyContent: "space-between", flexWrap: "wrap" }}>
                  <strong>{formatSundayLabel(w.sundayDate)}</strong>
                  <span style={{ color: active ? "#9be39f" : "#ffabab", fontWeight: 800 }}>
                    {active ? "AKTIVNO" : "ZATVORENO"}
                  </span>
                </div>
                <div className="admin-services-split-grid">
                  <AdminField icon="clock" label="Vreme od" hint="Aktivno tek kada je nedelja uključena.">
                    <input
                      type="time"
                      className="admin-inline-input"
                      value={row.startTime}
                      onChange={(e) =>
                        setSundayForms((p) => ({
                          ...p,
                          [w.sundayDate]: { ...row, startTime: e.target.value },
                        }))
                      }
                      disabled={!active}
                    />
                  </AdminField>
                  <AdminField icon="clock" label="Vreme do" hint="Kraj popodnevnog bloka za tu nedelju.">
                    <input
                      type="time"
                      className="admin-inline-input"
                      value={row.endTime}
                      onChange={(e) =>
                        setSundayForms((p) => ({
                          ...p,
                          [w.sundayDate]: { ...row, endTime: e.target.value },
                        }))
                      }
                      disabled={!active}
                    />
                  </AdminField>
                </div>
                <label className={`admin-switch ${active ? "is-on" : ""}`}>
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) =>
                      setSundayForms((p) => ({
                        ...p,
                        [w.sundayDate]: { ...row, isActive: e.target.checked },
                      }))
                    }
                  />
                  <span className="admin-switch-text">
                    <strong>Radi ove nedelje (popodnevni termini)</strong>
                    <span>Uključivanje otvara termine u booking formi za taj tačan datum.</span>
                  </span>
                </label>
                <div className="admin-btn-row">
                  <button
                    type="button"
                    className="admin-btn admin-btn--sm admin-btn--primary"
                    onClick={() => saveSunday(w.sundayDate)}
                    disabled={saving}
                  >
                    <AdminIcon name="save" size={15} />
                    {saving ? "Čuvanje…" : "Sačuvaj"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </AdminSection>
    </section>
  );
}

