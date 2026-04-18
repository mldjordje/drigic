"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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
    <section style={{ display: "grid", gap: 12 }}>
      <div className="admin-card">
        <h2 style={{ marginTop: 0 }}>Popodnevni termini (subota i nedelja)</h2>
        <p style={{ ...mutedTextStyle, marginBottom: 0 }}>
          Ova stranica služi da otvori dodatne popodnevne termine. Subota ima podrazumevano 10–16h;
          ovde možeš dodati raspon (npr. 16–21h) za izabrani period. Za nedelju se popodnevni termini
          podešavaju po datumu (svaka nedelja posebno) jer je nedelja u osnovi zatvorena.
        </p>
        {message ? <p style={{ color: "#9be39f", marginBottom: 0 }}>{message}</p> : null}
        {error ? <p style={{ color: "#ffabab", marginBottom: 0 }}>{error}</p> : null}
      </div>

      <div className="admin-card">
        <h3 style={{ marginTop: 0 }}>Subota — dodatni popodnevni raspon</h3>
        <div style={statGridStyle}>
          <div className="admin-card">
            <strong>{activeSaturdayItems.length}</strong>
            <div style={mutedTextStyle}>aktivnih perioda</div>
          </div>
          <div className="admin-card">
            <strong>{saturdayItems.length}</strong>
            <div style={mutedTextStyle}>ukupno sačuvanih aktivacija</div>
          </div>
        </div>

        <div style={{ marginTop: 12, ...gridStyle }}>
          <form
            onSubmit={createSaturdayActivation}
            className="admin-card"
            style={{ display: "grid", gap: 10 }}
          >
            <div>
              <h4 style={{ marginTop: 0, marginBottom: 6 }}>Nova aktivacija (subota)</h4>
              <p style={mutedTextStyle}>
                Unesi period i popodnevni raspon sati. Aktivacija utiče samo na subote unutar opsega
                (nedelje se ignorišu ovde).
              </p>
            </div>

            <div className="admin-services-split-grid">
              <label>
                Datum od
                <input
                  type="date"
                  className="admin-inline-input"
                  value={saturdayForm.startDate}
                  onChange={(e) => setSaturdayForm((p) => ({ ...p, startDate: e.target.value }))}
                  required
                />
              </label>
              <label>
                Datum do
                <input
                  type="date"
                  className="admin-inline-input"
                  value={saturdayForm.endDate}
                  onChange={(e) => setSaturdayForm((p) => ({ ...p, endDate: e.target.value }))}
                  required
                />
              </label>
            </div>

            <div className="admin-services-split-grid">
              <label>
                Vreme od
                <input
                  type="time"
                  className="admin-inline-input"
                  value={saturdayForm.startTime}
                  onChange={(e) => setSaturdayForm((p) => ({ ...p, startTime: e.target.value }))}
                  required
                />
              </label>
              <label>
                Vreme do
                <input
                  type="time"
                  className="admin-inline-input"
                  value={saturdayForm.endTime}
                  onChange={(e) => setSaturdayForm((p) => ({ ...p, endTime: e.target.value }))}
                  required
                />
              </label>
            </div>

            <label>
              Napomena (opciono)
              <input
                className="admin-inline-input"
                value={saturdayForm.note}
                onChange={(e) => setSaturdayForm((p) => ({ ...p, note: e.target.value }))}
                placeholder="npr. produženo radno vreme"
              />
            </label>

            <button
              type="submit"
              className="admin-template-link-btn"
              disabled={busyKey === "saturday-create"}
            >
              {busyKey === "saturday-create" ? "Čuvanje…" : "Aktiviraj popodnevne termine za subotu"}
            </button>
          </form>

          <div className="admin-card" style={{ display: "grid", gap: 10 }}>
            <h4 style={{ marginTop: 0, marginBottom: 6 }}>Sačuvane aktivacije (subota)</h4>
            {loadingSaturday ? <p style={mutedTextStyle}>Učitavanje…</p> : null}
            {!loadingSaturday && !saturdayItems.length ? (
              <p style={mutedTextStyle}>Nema sačuvanih aktivacija.</p>
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
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="admin-template-link-btn"
                    onClick={() => toggleSaturdayItem(item)}
                    disabled={busyKey === `saturday-toggle-${item.id}`}
                  >
                    {busyKey === `saturday-toggle-${item.id}` ? "…" : item.isActive ? "Isključi" : "Uključi"}
                  </button>
                  <button
                    type="button"
                    className="admin-template-link-btn"
                    onClick={() => deleteSaturdayItem(item)}
                    disabled={busyKey === `saturday-delete-${item.id}`}
                    style={{ borderColor: "rgba(255, 171, 171, 0.35)", color: "#ffabab" }}
                  >
                    {busyKey === `saturday-delete-${item.id}` ? "…" : "Obriši"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="admin-card">
        <h3 style={{ marginTop: 0 }}>Nedelja — popodnevni termini po datumu</h3>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginTop: 10 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <small style={mutedTextStyle}>Prikaži nedelja unapred</small>
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
          <button
            type="button"
            className="admin-template-link-btn"
            onClick={() => loadSunday()}
            disabled={loadingSunday}
          >
            Osveži
          </button>
        </div>

        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          {loadingSunday ? <p style={mutedTextStyle}>Učitavanje…</p> : null}
          {!loadingSunday && !(sundayPayload?.weeks || []).length ? (
            <p style={mutedTextStyle}>Nema nedelja u prikazu.</p>
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
                  <label>
                    Vreme od
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
                  </label>
                  <label>
                    Vreme do
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
                  </label>
                </div>
                <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
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
                  Radi ove nedelje (popodnevni termini)
                </label>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="admin-template-link-btn"
                    onClick={() => saveSunday(w.sundayDate)}
                    disabled={saving}
                  >
                    {saving ? "Čuvanje…" : "Sačuvaj"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

