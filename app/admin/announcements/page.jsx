"use client";

import { useEffect, useMemo, useState } from "react";

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
      <div className="admin-card">
        <div className="admin-announcements-head">
          <div>
            <h2 style={{ margin: 0 }}>Obaveštenja na početnoj strani</h2>
            <p className="admin-announcements-subtitle">
              Ovde kreiraš poruke koje klijenti vide na landing strani. Stranica sada prikazuje
              status, prozor objave i detalje svake poruke na jednom mestu.
            </p>
          </div>
          <div className="admin-announcements-status">
            <span className="admin-announcement-badge is-live">{stats.live} aktivno</span>
            <span className="admin-announcement-badge is-scheduled">
              {stats.scheduled} zakazano
            </span>
            <span className="admin-announcement-badge is-muted">{stats.total} ukupno</span>
          </div>
        </div>

        <div className="admin-announcements-summary">
          <article className="admin-announcement-stat-card">
            <span>Ukupno obaveštenja</span>
            <strong>{stats.total}</strong>
            <small>Sve poruke sačuvane u sistemu.</small>
          </article>
          <article className="admin-announcement-stat-card">
            <span>Trenutno aktivna</span>
            <strong>{stats.live}</strong>
            <small>Vidljiva klijentima na sajtu.</small>
          </article>
          <article className="admin-announcement-stat-card">
            <span>Zakazana</span>
            <strong>{stats.scheduled}</strong>
            <small>Čekaju svoj početak prikaza.</small>
          </article>
          <article className="admin-announcement-stat-card">
            <span>Pauzirana ili istekla</span>
            <strong>{stats.inactive + stats.expired}</strong>
            <small>Spremna za reviziju ili novo objavljivanje.</small>
          </article>
        </div>
      </div>

      <div className="admin-announcements-layout">
        <div className="admin-card">
          <div className="admin-announcements-section-head">
            <div>
              <h3 style={{ margin: 0 }}>Novo obaveštenje</h3>
              <p className="admin-announcements-subtitle">
                Unesi naslov, poruku i opcioni vremenski prozor prikaza.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="admin-announcement-form">
            <label className="admin-announcement-field">
              <span>Naslov</span>
              <input
                required
                value={form.title}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, title: event.target.value }))
                }
                className="admin-inline-input"
                placeholder="Kratak naslov koji će odmah privući pažnju"
              />
            </label>

            <label className="admin-announcement-field">
              <span>Poruka</span>
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
              <small>{form.message.length} / 5000 karaktera</small>
            </label>

            <div className="admin-announcement-grid">
              <label className="admin-announcement-field">
                <span>Početak prikaza</span>
                <input
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, startsAt: event.target.value }))
                  }
                  className="admin-inline-input"
                />
              </label>

              <label className="admin-announcement-field">
                <span>Kraj prikaza</span>
                <input
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, endsAt: event.target.value }))
                  }
                  className="admin-inline-input"
                />
              </label>
            </div>

            <label className="admin-announcement-toggle">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, isActive: event.target.checked }))
                }
              />
              <span>
                <strong>Aktivno odmah nakon čuvanja</strong>
                <small>
                  Ako je isključeno, poruka ostaje sačuvana ali nije vidljiva klijentima.
                </small>
              </span>
            </label>

            <div className="admin-announcement-actions">
              <button type="submit" disabled={loading} className="admin-template-link-btn">
                {loading ? "Čuvanje..." : "Sačuvaj obaveštenje"}
              </button>
              <button
                type="button"
                className="admin-template-link-btn"
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
                Resetuj formu
              </button>
            </div>
          </form>

          {message ? <p className="admin-announcement-feedback is-success">{message}</p> : null}
          {error ? <p className="admin-announcement-feedback is-error">{error}</p> : null}
        </div>

        <div className="admin-card">
          <div className="admin-announcements-section-head">
            <div>
              <h3 style={{ margin: 0 }}>Pregled pre objave</h3>
              <p className="admin-announcements-subtitle">
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

      <div className="admin-card">
        <div className="admin-announcements-section-head">
          <div>
            <h3 style={{ margin: 0 }}>Lista obaveštenja</h3>
            <p className="admin-announcements-subtitle">
              Detaljan pregled svih poruka, njihovog statusa i trajanja prikaza.
            </p>
          </div>
        </div>

        {booting ? (
          <p className="admin-announcements-empty">Učitavanje obaveštenja...</p>
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
          <p className="admin-announcements-empty">
            Nema sačuvanih obaveštenja. Napravi prvo obaveštenje iz forme iznad.
          </p>
        )}
      </div>
    </section>
  );
}
