"use client";

import { useEffect, useMemo, useState } from "react";
import AdminIcon from "@/components/admin/ui/AdminIcon";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminSection from "@/components/admin/ui/AdminSection";
import AdminField from "@/components/admin/ui/AdminField";
import AdminEmptyState from "@/components/admin/ui/AdminEmptyState";
import AdminStatusMessage from "@/components/admin/ui/AdminStatusMessage";

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
    <section className="admin-page">
      <AdminPageHeader
        icon="sunrise"
        title="Prepodnevni termini"
        description="Podrazumevano radno vreme: radni dani 16–21h, subota 10–16h, nedelja ne radi (osim ako je uključena u Admin → Nedelja). Ovde otvarate dodatni prepodnevni raspon za izabrane datume — nedelja ostaje zatvorena i ako upadne u opseg."
      />

      {message ? <AdminStatusMessage tone="success" toneLabel="Uspeh">{message}</AdminStatusMessage> : null}
      {error ? <AdminStatusMessage tone="error" toneLabel="Greška">{error}</AdminStatusMessage> : null}

      <div className="admin-stat-grid">
        <div className="admin-stat-card admin-stat-card--green">
          <span className="admin-stat-card-icon" aria-hidden="true"><AdminIcon name="check" size={18} /></span>
          <span className="admin-stat-card-label">Aktivnih perioda</span>
          <strong className="admin-stat-card-value">{activeItems.length}</strong>
        </div>
        <div className="admin-stat-card admin-stat-card--gold">
          <span className="admin-stat-card-icon" aria-hidden="true"><AdminIcon name="list" size={18} /></span>
          <span className="admin-stat-card-label">Ukupno aktivacija</span>
          <strong className="admin-stat-card-value">{items.length}</strong>
        </div>
      </div>

      <div style={gridStyle}>
        <AdminSection
          icon="plus"
          title="Nova aktivacija"
          description="Unesite period i jutarnji raspon sati. Novi slobodni slotovi se automatski pojavljuju na booking formi i u dostupnosti termina."
        >
        <form onSubmit={handleCreate} style={{ display: "grid", gap: 12 }}>
          <div className="admin-services-split-grid">
            <AdminField icon="calendar" label="Datum od" hint="Prvi dan kada važi prepodnevni raspon." required>
              <input
                type="date"
                className="admin-inline-input"
                value={form.startDate}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, startDate: event.target.value }))
                }
                required
              />
            </AdminField>
            <AdminField icon="calendar" label="Datum do" hint="Poslednji dan (uključen) kada važi raspon." required>
              <input
                type="date"
                className="admin-inline-input"
                value={form.endDate}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, endDate: event.target.value }))
                }
                required
              />
            </AdminField>
          </div>

          <div className="admin-services-split-grid">
            <AdminField icon="clock" label="Prepodne od" hint="Prvi jutarnji termin, npr. 09:00." required>
              <input
                type="time"
                className="admin-inline-input"
                value={form.startTime}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, startTime: event.target.value }))
                }
                required
              />
            </AdminField>
            <AdminField icon="clock" label="Prepodne do" hint="Kraj jutarnjeg bloka, npr. 13:00." required>
              <input
                type="time"
                className="admin-inline-input"
                value={form.endTime}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, endTime: event.target.value }))
                }
                required
              />
            </AdminField>
          </div>

          <AdminField
            icon="edit"
            label="Napomena"
            hint="Interni podsetnik zašto je period otvoren. Klijent je ne vidi."
            optional
          >
            <textarea
              className="admin-inline-textarea"
              rows={3}
              value={form.note}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, note: event.target.value }))
              }
              placeholder="npr. dodatni termini pred praznik"
            />
          </AdminField>

          <button type="submit" className="admin-btn admin-btn--primary" disabled={busyKey === "create"}>
            <AdminIcon name="sunrise" size={16} />
            {busyKey === "create" ? "Čuvanje..." : "Aktiviraj prepodnevne termine"}
          </button>
        </form>
        </AdminSection>

        <AdminSection
          icon="list"
          title="Sačuvane aktivacije"
          description="Aktivne stavke odmah utiču na prikaz slobodnih termina. Isključite ili obrišite kada period više ne treba da bude otvoren."
        >
          {loading ? (
            <div style={{ display: "grid", gap: 8 }}>
              <div className="admin-skeleton admin-skeleton--card" />
              <div className="admin-skeleton admin-skeleton--card" />
            </div>
          ) : null}
          {!loading && !items.length ? (
            <AdminEmptyState
              icon="sunrise"
              title="Još nema prepodnevnih aktivacija"
              description="Popunite formu levo da otvorite prvi jutarnji period."
            />
          ) : null}

          {items.map((item) => (
            <article key={item.id} style={listRowStyle}>
              <div style={{ display: "grid", gap: 5 }}>
                <strong>
                  {formatDateLabel(item.startDate)} - {formatDateLabel(item.endDate)}
                </strong>
                <span className="admin-btn-row">
                  <span className="admin-chip">
                    <AdminIcon name="clock" size={14} />
                    {item.startTime} - {item.endTime}
                  </span>
                  <span className={`admin-chip ${item.isActive ? "is-green" : ""}`.trim()}>
                    <AdminIcon name={item.isActive ? "check" : "close"} size={14} />
                    {item.isActive ? "aktivno" : "isključeno"}
                  </span>
                </span>
                {item.note ? <small style={mutedTextStyle}>{item.note}</small> : null}
              </div>
              <div style={buttonRowStyle}>
                <button
                  type="button"
                  className="admin-btn admin-btn--sm"
                  disabled={busyKey === `toggle-${item.id}`}
                  onClick={() => toggleItem(item)}
                >
                  <AdminIcon name={item.isActive ? "close" : "check"} size={15} />
                  {item.isActive ? "Isključi" : "Uključi"}
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--sm admin-btn--danger"
                  disabled={busyKey === `delete-${item.id}`}
                  onClick={() => deleteItem(item)}
                >
                  <AdminIcon name="trash" size={15} />
                  Obriši
                </button>
              </div>
            </article>
          ))}
        </AdminSection>
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
