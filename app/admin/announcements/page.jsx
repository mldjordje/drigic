"use client";

import { useEffect, useMemo, useState } from "react";
import AdminIcon from "@/components/admin/ui/AdminIcon";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminField from "@/components/admin/ui/AdminField";
import AdminEmptyState from "@/components/admin/ui/AdminEmptyState";
import AdminStatusMessage from "@/components/admin/ui/AdminStatusMessage";

function toIsoOrNull(value) {
  if (!value) {
    return null;
  }
  return new Date(value).toISOString();
}

function formatDateTime(value) {
  if (!value) {
    return "Nije zadato";
  }

  try {
    return new Date(value).toLocaleString("sr-RS", {
      timeZone: "Europe/Belgrade",
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "Nepoznat datum";
  }
}

function resolveAnnouncementState(item, now = new Date()) {
  const startsAt = item?.startsAt ? new Date(item.startsAt) : null;
  const endsAt = item?.endsAt ? new Date(item.endsAt) : null;

  if (!item?.isActive) {
    return {
      key: "inactive",
      label: "Pauzirano",
      description: "Obaveštenje je sačuvano, ali trenutno nije prikazano klijentima.",
    };
  }

  if (startsAt && startsAt > now) {
    return {
      key: "scheduled",
      label: "Zakazano",
      description: "Obaveštenje će postati vidljivo kada dođe vreme početka.",
    };
  }

  if (endsAt && endsAt < now) {
    return {
      key: "expired",
      label: "Isteklo",
      description: "Rok prikaza je prošao i poruka više nije aktivna.",
    };
  }

  return {
    key: "live",
    label: "Aktivno",
    description: "Obaveštenje je trenutno vidljivo klijentima na sajtu.",
  };
}

function getAnnouncementWindowLabel(item) {
  const startLabel = item?.startsAt ? formatDateTime(item.startsAt) : "odmah";
  const endLabel = item?.endsAt ? formatDateTime(item.endsAt) : "bez kraja";
  return `${startLabel} - ${endLabel}`;
}

function buildPreviewItem(form) {
  return {
    ...form,
    startsAt: toIsoOrNull(form.startsAt),
    endsAt: toIsoOrNull(form.endsAt),
  };
}

export default function AdminAnnouncementsPage() {
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
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
      throw new Error(data?.message || "Neuspešno učitavanje obaveštenja.");
    }
    setItems(Array.isArray(data.data) ? data.data : []);
  }

  useEffect(() => {
    loadAnnouncements()
      .catch((err) => setError(err.message || "Greška pri učitavanju obaveštenja."))
      .finally(() => setBooting(false));
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
        throw new Error(data?.message || "Neuspešno čuvanje obaveštenja.");
      }

      setForm({
        title: "",
        message: "",
        startsAt: "",
        endsAt: "",
        isActive: true,
      });
      setMessage("Obaveštenje je sačuvano i osveženo u listi.");
      await loadAnnouncements();
    } catch (err) {
      setError(err.message || "Greška pri čuvanju obaveštenja.");
    } finally {
      setLoading(false);
    }
  }

  const previewItem = useMemo(() => buildPreviewItem(form), [form]);
  const stats = useMemo(() => {
    const now = new Date();
    const result = {
      total: items.length,
      live: 0,
      scheduled: 0,
      inactive: 0,
      expired: 0,
    };

    items.forEach((item) => {
      const state = resolveAnnouncementState(item, now);
      result[state.key] += 1;
    });

    return result;
  }, [items]);

  return (
    <section className="admin-announcements-page">
      <AdminPageHeader
        icon="announcements"
        title="Obaveštenja na početnoj strani"
        description="Poruke koje klijenti vide na naslovnoj strani sajta. Ovde vidite status, prozor objave i detalje svake poruke na jednom mestu."
        actions={
          <>
            <span className="admin-chip is-green">{stats.live} aktivno</span>
            <span className="admin-chip is-blue">{stats.scheduled} zakazano</span>
            <span className="admin-chip">{stats.total} ukupno</span>
          </>
        }
      />

      <div className="admin-stat-grid">
        <div className="admin-stat-card admin-stat-card--gold">
          <span className="admin-stat-card-icon" aria-hidden="true"><AdminIcon name="list" size={18} /></span>
          <span className="admin-stat-card-label">Ukupno obaveštenja</span>
          <strong className="admin-stat-card-value">{stats.total}</strong>
          <span className="admin-stat-card-hint">Sve poruke sačuvane u sistemu.</span>
        </div>
        <div className="admin-stat-card admin-stat-card--green">
          <span className="admin-stat-card-icon" aria-hidden="true"><AdminIcon name="eye" size={18} /></span>
          <span className="admin-stat-card-label">Trenutno aktivna</span>
          <strong className="admin-stat-card-value">{stats.live}</strong>
          <span className="admin-stat-card-hint">Vidljiva klijentima na sajtu.</span>
        </div>
        <div className="admin-stat-card admin-stat-card--blue">
          <span className="admin-stat-card-icon" aria-hidden="true"><AdminIcon name="clock" size={18} /></span>
          <span className="admin-stat-card-label">Zakazana</span>
          <strong className="admin-stat-card-value">{stats.scheduled}</strong>
          <span className="admin-stat-card-hint">Čekaju svoj početak prikaza.</span>
        </div>
        <div className="admin-stat-card admin-stat-card--amber">
          <span className="admin-stat-card-icon" aria-hidden="true"><AdminIcon name="warning" size={18} /></span>
          <span className="admin-stat-card-label">Pauzirana ili istekla</span>
          <strong className="admin-stat-card-value">{stats.inactive + stats.expired}</strong>
          <span className="admin-stat-card-hint">Spremna za reviziju ili novo objavljivanje.</span>
        </div>
      </div>

      <div className="admin-announcements-layout">
        <div className="admin-section">
          <div className="admin-section-head">
            <div>
              <h3 className="admin-section-title">
                <AdminIcon name="plus" size={18} />
                Novo obaveštenje
              </h3>
              <p className="admin-section-desc">
                Unesite naslov, poruku i opcioni vremenski prozor prikaza.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="admin-announcement-form">
            <AdminField
              icon="edit"
              label="Naslov"
              hint="Prvi red poruke na naslovnoj strani — držite ga kratkim i jasnim."
              required
            >
              <input
                required
                value={form.title}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, title: event.target.value }))
                }
                className="admin-inline-input"
                placeholder="Kratak naslov koji će odmah privući pažnju"
              />
            </AdminField>

            <AdminField
              icon="announcements"
              label="Poruka"
              hint={`Tekst obaveštenja koji klijent čita. ${form.message.length} / 5000 karaktera.`}
              required
            >
              <textarea
                required
                value={form.message}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, message: event.target.value }))
                }
                rows={6}
                className="admin-inline-textarea"
                placeholder="Na primer: Novi termini za konsultacije su otvoreni od ponedeljka."
              />
            </AdminField>

            <div className="admin-announcement-grid">
              <AdminField
                icon="clock"
                label="Početak prikaza"
                hint="Ostavite prazno da poruka krene odmah po čuvanju."
                optional
              >
                <input
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, startsAt: event.target.value }))
                  }
                  className="admin-inline-input"
                />
              </AdminField>

              <AdminField
                icon="clock"
                label="Kraj prikaza"
                hint="Ostavite prazno da poruka ostane dok je ručno ne isključite."
                optional
              >
                <input
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, endsAt: event.target.value }))
                  }
                  className="admin-inline-input"
                />
              </AdminField>
            </div>

            <label className={`admin-switch ${form.isActive ? "is-on" : ""}`}>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, isActive: event.target.checked }))
                }
              />
              <span className="admin-switch-text">
                <strong>Aktivno odmah nakon čuvanja</strong>
                <span>Ako je isključeno, poruka ostaje sačuvana ali nije vidljiva klijentima.</span>
              </span>
            </label>

            <div className="admin-btn-row">
              <button type="submit" disabled={loading} className="admin-btn admin-btn--primary">
                <AdminIcon name="save" size={16} />
                {loading ? "Čuvanje..." : "Sačuvaj obaveštenje"}
              </button>
              <button
                type="button"
                className="admin-btn"
                onClick={() =>
                  setForm({
                    title: "",
                    message: "",
                    startsAt: "",
                    endsAt: "",
                    isActive: true,
                  })
                }
              >
                <AdminIcon name="refresh" size={16} />
                Resetuj formu
              </button>
            </div>
          </form>

          {message ? <AdminStatusMessage tone="success" toneLabel="Uspeh">{message}</AdminStatusMessage> : null}
          {error ? <AdminStatusMessage tone="error" toneLabel="Greška">{error}</AdminStatusMessage> : null}
        </div>

        <div className="admin-section">
          <div className="admin-section-head">
            <div>
              <h3 className="admin-section-title">
                <AdminIcon name="eye" size={18} />
                Pregled pre objave
              </h3>
              <p className="admin-section-desc">
                Ovako će poruka izgledati u administraciji i kroz status prikaza.
              </p>
            </div>
          </div>

          <article className="admin-announcement-card is-preview">
            <div className="admin-announcement-card-head">
              <div>
                <h4>{previewItem.title || "Naslov obaveštenja"}</h4>
                <p>{previewItem.message || "Ovde će se pojaviti tekst poruke za klijente."}</p>
              </div>
              <span
                className={`admin-announcement-badge is-${
                  resolveAnnouncementState(previewItem).key
                }`}
              >
                {resolveAnnouncementState(previewItem).label}
              </span>
            </div>

            <div className="admin-announcement-meta">
              <div>
                <span>Status</span>
                <strong>{resolveAnnouncementState(previewItem).description}</strong>
              </div>
              <div>
                <span>Prozor objave</span>
                <strong>{getAnnouncementWindowLabel(previewItem)}</strong>
              </div>
              <div>
                <span>Vidljivost</span>
                <strong>{previewItem.isActive ? "Objava uključena" : "Sačuvano kao pauzirano"}</strong>
              </div>
            </div>
          </article>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-head">
          <div>
            <h3 className="admin-section-title">
              <AdminIcon name="list" size={18} />
              Lista obaveštenja
            </h3>
            <p className="admin-section-desc">
              Detaljan pregled svih poruka, njihovog statusa i trajanja prikaza.
            </p>
          </div>
        </div>

        {booting ? (
          <div style={{ display: "grid", gap: 8 }}>
            <div className="admin-skeleton admin-skeleton--card" />
            <div className="admin-skeleton admin-skeleton--card" />
          </div>
        ) : items.length ? (
          <div className="admin-announcement-list">
            {items.map((item) => {
              const state = resolveAnnouncementState(item);
              return (
                <article key={item.id} className="admin-announcement-card">
                  <div className="admin-announcement-card-head">
                    <div>
                      <div className="admin-announcement-card-topline">
                        <span className={`admin-announcement-badge is-${state.key}`}>
                          {state.label}
                        </span>
                        <span className="admin-announcement-created">
                          Kreirano: {formatDateTime(item.createdAt)}
                        </span>
                      </div>
                      <h4>{item.title}</h4>
                      <p>{item.message}</p>
                    </div>
                  </div>

                  <div className="admin-announcement-meta">
                    <div>
                      <span>Opis statusa</span>
                      <strong>{state.description}</strong>
                    </div>
                    <div>
                      <span>Prozor prikaza</span>
                      <strong>{getAnnouncementWindowLabel(item)}</strong>
                    </div>
                    <div>
                      <span>Ručno uključenje</span>
                      <strong>{item.isActive ? "Uključeno" : "Isključeno"}</strong>
                    </div>
                    <div>
                      <span>ID zapisa</span>
                      <strong className="admin-announcement-id">{item.id}</strong>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <AdminEmptyState
            icon="announcements"
            title="Nema sačuvanih obaveštenja"
            description="Napravite prvo obaveštenje iz forme iznad — prikazaće se klijentima na naslovnoj strani."
          />
        )}
      </div>
    </section>
  );
}
