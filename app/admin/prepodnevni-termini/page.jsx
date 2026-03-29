"use client";

import { useEffect, useMemo, useState } from "react";

const emptyForm = {
  startDate: "",
  endDate: "",
  startTime: "08:00",
  endTime: "14:00",
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

export default function AdminMorningShiftsPage() {
  const [form, setForm] = useState(emptyForm);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadItems() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/morning-shifts");
      const data = await parseResponse(response);

      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Neuspešno učitavanje aktivacija.");
      }

      setItems(data.data || []);
    } catch (loadError) {
      setError(loadError.message || "Greška pri učitavanju aktivacija.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  const activeItems = useMemo(
    () => items.filter((item) => item.isActive),
    [items]
  );

  async function handleCreate(event) {
    event.preventDefault();
    setBusyKey("create");
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/morning-shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await parseResponse(response);

      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Neuspešno čuvanje aktivacije.");
      }

      setForm(emptyForm);
      setMessage("Prepodnevni termini su aktivirani.");
      await loadItems();
    } catch (saveError) {
      setError(saveError.message || "Greška pri čuvanju aktivacije.");
    } finally {
      setBusyKey("");
    }
  }

  async function toggleItem(item) {
    setBusyKey(`toggle-${item.id}`);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/morning-shifts", {
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

      setMessage(item.isActive ? "Aktivacija je isključena." : "Aktivacija je uključena.");
      await loadItems();
    } catch (toggleError) {
      setError(toggleError.message || "Greška pri promeni statusa.");
    } finally {
      setBusyKey("");
    }
  }

  async function deleteItem(item) {
    setBusyKey(`delete-${item.id}`);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/morning-shifts/${item.id}`, {
        method: "DELETE",
      });
      const data = await parseResponse(response);

      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Neuspešno brisanje aktivacije.");
      }

      setMessage("Aktivacija je obrisana.");
      await loadItems();
    } catch (deleteError) {
      setError(deleteError.message || "Greška pri brisanju aktivacije.");
    } finally {
      setBusyKey("");
    }
  }

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <div className="admin-card">
        <h2 style={{ marginTop: 0 }}>Prepodnevni termini</h2>
        <p style={{ color: "#bed0e8", marginBottom: 0 }}>
          Podrazumevano radno vreme je: radni dani 16-21h, subota 10-16h, nedelja ne radi.
          Ovde uključi dodatni prepodnevni raspon za izabrane datume. Nedelja ostaje zatvorena
          i ako upadne u opseg.
        </p>
        {message ? <p style={{ color: "#9be39f", marginBottom: 0 }}>{message}</p> : null}
        {error ? <p style={{ color: "#ffabab", marginBottom: 0 }}>{error}</p> : null}
      </div>

      <div style={statGridStyle}>
        <div className="admin-card">
          <strong>{activeItems.length}</strong>
          <div style={mutedTextStyle}>aktivnih perioda</div>
        </div>
        <div className="admin-card">
          <strong>{items.length}</strong>
          <div style={mutedTextStyle}>ukupno sačuvanih aktivacija</div>
        </div>
      </div>

      <div style={gridStyle}>
        <form onSubmit={handleCreate} className="admin-card" style={{ display: "grid", gap: 10 }}>
          <div>
            <h3 style={{ marginTop: 0, marginBottom: 6 }}>Nova aktivacija</h3>
            <p style={mutedTextStyle}>
              Unesi period i jutarnji raspon sati. Novi slobodni slotovi će se automatski pojaviti
              na booking formi i u dostupnosti termina.
            </p>
          </div>

          <div className="admin-services-split-grid">
            <label>
              Datum od
              <input
                type="date"
                className="admin-inline-input"
                value={form.startDate}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, startDate: event.target.value }))
                }
                required
              />
            </label>
            <label>
              Datum do
              <input
                type="date"
                className="admin-inline-input"
                value={form.endDate}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, endDate: event.target.value }))
                }
                required
              />
            </label>
          </div>

          <div className="admin-services-split-grid">
            <label>
              Prepodne od
              <input
                type="time"
                className="admin-inline-input"
                value={form.startTime}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, startTime: event.target.value }))
                }
                required
              />
            </label>
            <label>
              Prepodne do
              <input
                type="time"
                className="admin-inline-input"
                value={form.endTime}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, endTime: event.target.value }))
                }
                required
              />
            </label>
          </div>

          <label>
            Napomena
            <textarea
              className="admin-inline-textarea"
              rows={3}
              value={form.note}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, note: event.target.value }))
              }
              placeholder="npr. dodatni termini pred praznik"
            />
          </label>

          <button type="submit" className="admin-template-link-btn" disabled={busyKey === "create"}>
            {busyKey === "create" ? "Čuvanje..." : "Aktiviraj prepodnevne termine"}
          </button>
        </form>

        <div className="admin-card" style={{ display: "grid", gap: 10 }}>
          <div>
            <h3 style={{ marginTop: 0, marginBottom: 6 }}>Sačuvane aktivacije</h3>
            <p style={mutedTextStyle}>
              Aktivne stavke odmah utiču na prikaz slobodnih termina. Isključi ili obriši kada
              period više ne treba da bude otvoren.
            </p>
          </div>

          {loading ? <p style={mutedTextStyle}>Učitavanje aktivacija...</p> : null}
          {!loading && !items.length ? (
            <p style={mutedTextStyle}>Još nema sačuvanih prepodnevnih aktivacija.</p>
          ) : null}

          {items.map((item) => (
            <article key={item.id} style={listRowStyle}>
              <div style={{ display: "grid", gap: 4 }}>
                <strong>
                  {formatDateLabel(item.startDate)} - {formatDateLabel(item.endDate)}
                </strong>
                <small style={mutedTextStyle}>
                  {item.startTime} - {item.endTime} | {item.isActive ? "aktivno" : "isključeno"}
                </small>
                {item.note ? <small style={mutedTextStyle}>{item.note}</small> : null}
              </div>
              <div style={buttonRowStyle}>
                <button
                  type="button"
                  className="admin-template-link-btn"
                  disabled={busyKey === `toggle-${item.id}`}
                  onClick={() => toggleItem(item)}
                >
                  {item.isActive ? "Isključi" : "Uključi"}
                </button>
                <button
                  type="button"
                  className="admin-template-link-btn"
                  disabled={busyKey === `delete-${item.id}`}
                  onClick={() => deleteItem(item)}
                >
                  Obriši
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const gridStyle = {
  display: "grid",
  gap: 12,
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
};

const statGridStyle = {
  display: "grid",
  gap: 12,
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
};

const mutedTextStyle = {
  color: "#bed0e8",
};

const listRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid rgba(190, 208, 232, 0.18)",
  background: "rgba(7, 18, 35, 0.45)",
};

const buttonRowStyle = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  justifyContent: "flex-end",
};
