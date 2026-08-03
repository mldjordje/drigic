"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AdminIcon from "@/components/admin/ui/AdminIcon";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminField from "@/components/admin/ui/AdminField";
import AdminEmptyState from "@/components/admin/ui/AdminEmptyState";
import AdminStatusMessage from "@/components/admin/ui/AdminStatusMessage";

const AUDIENCE_OPTIONS = [
  { value: "all", label: "Svi klijenti sa važećim mejlom" },
  { value: "with_bookings", label: "Klijenti koji su bar jednom zakazali" },
  { value: "without_bookings", label: "Registrovani bez ijedne rezervacije" },
  { value: "inactive_90d", label: "Bez termina u poslednjih 90 dana" },
];

const STATUS_LABELS = {
  draft: "Nacrt",
  sending: "Slanje u toku",
  sent: "Poslato",
  cancelled: "Zaustavljeno",
};

const EMPTY_FORM = {
  title: "",
  subject: "",
  previewText: "",
  heading: "",
  body: "",
  ctaLabel: "Zakaži termin",
  ctaUrl: "",
  audience: "all",
};

function formatDateTime(value) {
  if (!value) {
    return "-";
  }
  try {
    return new Date(value).toLocaleString("sr-RS", {
      timeZone: "Europe/Belgrade",
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "-";
  }
}

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [audience, setAudience] = useState({});
  const [delivery, setDelivery] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [booting, setBooting] = useState(true);
  const fileInputRef = useRef(null);

  async function loadCampaigns() {
    const response = await fetch("/api/admin/campaigns");
    const data = await response.json();
    if (!response.ok || !data?.ok) {
      throw new Error(data?.message || "Neuspešno učitavanje kampanja.");
    }
    setCampaigns(Array.isArray(data.data) ? data.data : []);
    setAudience(data.audience || {});
    setDelivery(data.delivery || null);
  }

  useEffect(() => {
    loadCampaigns()
      .catch((err) => setError(err.message || "Greška pri učitavanju kampanja."))
      .finally(() => setBooting(false));
  }, []);

  function handleImageChange(event) {
    const file = event.target.files?.[0] || null;
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : "");
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      if (imageFile) {
        payload.append("file", imageFile);
      }

      const response = await fetch("/api/admin/campaigns", {
        method: "POST",
        body: payload,
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Neuspešno čuvanje kampanje.");
      }

      resetForm();
      setMessage("Kampanja je sačuvana kao nacrt. Pošalji test pre pravog slanja.");
      await loadCampaigns();
    } catch (err) {
      setError(err.message || "Greška pri čuvanju kampanje.");
    } finally {
      setBusy(false);
    }
  }

  async function callCampaignAction(path, { method = "POST", body } = {}, successMessage) {
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(path, {
        method,
        ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Akcija nije uspela.");
      }
      setMessage(typeof successMessage === "function" ? successMessage(data) : successMessage);
      await loadCampaigns();
    } catch (err) {
      setError(err.message || "Akcija nije uspela.");
    } finally {
      setBusy(false);
    }
  }

  function handleSend(campaign) {
    const size = audience[campaign.audience] ?? 0;
    const confirmed = window.confirm(
      `Pokreni slanje kampanje "${campaign.title}" na ${size} primalaca?\n\n` +
        "Poslate mejlove nije moguće povući."
    );
    if (!confirmed) {
      return;
    }

    callCampaignAction(
      `/api/admin/campaigns/${campaign.id}/send`,
      {},
      (data) =>
        `Kampanja je pokrenuta. U redu za slanje: ${data.queued}, poslato odmah: ${
          data.dispatch?.sent ?? 0
        }.`
    );
  }

  const previewCta = form.ctaLabel || "Zakaži termin";
  const selectedAudienceSize = audience[form.audience] ?? 0;

  const stats = useMemo(
    () => ({
      total: campaigns.length,
      sending: campaigns.filter((item) => item.status === "sending").length,
      sent: campaigns.filter((item) => item.status === "sent").length,
      drafts: campaigns.filter((item) => item.status === "draft").length,
    }),
    [campaigns]
  );

  return (
    <section className="admin-announcements-page">
      <AdminPageHeader
        icon="campaigns"
        title="Mejl kampanje"
        description="Napišite poruku, dodajte sliku i pošaljite je klijentima. Svaki mejl nosi dugme za zakazivanje termina i obaveznu odjavu sa liste."
        actions={
          <>
            <span className="admin-chip is-green">{stats.sending} u slanju</span>
            <span className="admin-chip is-blue">{stats.drafts} nacrta</span>
            <span className="admin-chip">{stats.sent} poslato</span>
          </>
        }
      />

      <div className="admin-stat-grid">
        {AUDIENCE_OPTIONS.map((option) => (
          <div className="admin-stat-card admin-stat-card--blue" key={option.value}>
            <span className="admin-stat-card-icon" aria-hidden="true"><AdminIcon name="clients" size={18} /></span>
            <span className="admin-stat-card-label">{option.label}</span>
            <strong className="admin-stat-card-value">{audience[option.value] ?? "-"}</strong>
            <span className="admin-stat-card-hint">Primalaca u ovoj grupi.</span>
          </div>
        ))}
      </div>

      {delivery && !delivery.configured ? (
        <AdminStatusMessage tone="error" toneLabel="Greška" title="Slanje mejlova nije podešeno">
          Nedostaje: {delivery.missing.join(", ")}. Kampanje možete da pripremite, ali slanje neće
          raditi dok se ne doda API ključ.
        </AdminStatusMessage>
      ) : null}
      {delivery?.configured ? (
        <AdminStatusMessage tone="info" toneLabel="Informacija">
          Dnevni limit: {delivery.dailyLimit} mejlova. Preostalo danas:{" "}
          <strong>{delivery.quotaRemaining}</strong>. Ostatak se automatski šalje narednih dana.
        </AdminStatusMessage>
      ) : null}

      <div className="admin-announcements-layout">
        <div className="admin-section">
          <div className="admin-section-head">
            <div>
              <h3 className="admin-section-title">
                <AdminIcon name="plus" size={18} />
                Nova kampanja
              </h3>
              <p className="admin-section-desc">
                Kampanja se prvo čuva kao nacrt. Slanje se pokreće posebnim dugmetom.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="admin-announcement-form">
            <AdminField
              icon="edit"
              label="Interni naziv"
              hint="Vidi samo admin — služi da prepoznate kampanju u listi. Ne šalje se klijentima."
              required
            >
              <input
                required
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                className="admin-inline-input"
                placeholder="Npr. Avgustovska akcija na tretmane lica"
              />
            </AdminField>

            <AdminField
              icon="mail"
              label="Naslov mejla (subject)"
              hint="Ovo klijent vidi u inboxu — najviše utiče na to da li će mejl uopšte otvoriti."
              required
            >
              <input
                required
                value={form.subject}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, subject: event.target.value }))
                }
                className="admin-inline-input"
                placeholder="Ono što klijent vidi u inboxu"
              />
            </AdminField>

            <AdminField
              icon="info"
              label="Kratak opis ispod naslova"
              hint="Sivi tekst koji Gmail prikazuje pored naslova (preview text)."
              optional
            >
              <input
                value={form.previewText}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, previewText: event.target.value }))
                }
                className="admin-inline-input"
                placeholder="Sivi tekst koji Gmail prikazuje pored naslova"
              />
            </AdminField>

            <AdminField
              icon="announcements"
              label="Naslov u poruci"
              hint="Veliki naslov na vrhu samog mejla, unutar tela poruke."
              required
            >
              <input
                required
                value={form.heading}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, heading: event.target.value }))
                }
                className="admin-inline-input"
                placeholder="Veliki naslov na vrhu mejla"
              />
            </AdminField>

            <AdminField
              icon="blog"
              label="Tekst poruke"
              hint={`Svaki novi red postaje novi pasus u mejlu. ${form.body.length} / 8000 karaktera.`}
              required
            >
              <textarea
                required
                rows={8}
                value={form.body}
                onChange={(event) => setForm((prev) => ({ ...prev, body: event.target.value }))}
                className="admin-inline-textarea"
                placeholder="Svaki novi red postaje novi pasus u mejlu."
              />
            </AdminField>

            <AdminField
              icon="image"
              label="Slika"
              hint="Preporuka: široka slika (npr. 1200×600), najviše 2 MB."
              optional
            >
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="admin-inline-input"
              />
            </AdminField>

            <div className="admin-announcement-grid">
              <AdminField
                icon="link"
                label="Tekst dugmeta"
                hint="Poziv na akciju u mejlu, npr. „Zakaži termin“."
              >
                <input
                  value={form.ctaLabel}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, ctaLabel: event.target.value }))
                  }
                  className="admin-inline-input"
                />
              </AdminField>

              <AdminField
                icon="external"
                label="Link dugmeta"
                hint="Ostavite prazno da dugme vodi na stranu za zakazivanje."
                optional
              >
                <input
                  value={form.ctaUrl}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, ctaUrl: event.target.value }))
                  }
                  className="admin-inline-input"
                  placeholder="Prazno = strana za zakazivanje"
                />
              </AdminField>
            </div>

            <AdminField
              icon="clients"
              label="Kome se šalje"
              hint={`Grupa primalaca. Trenutno u ovoj grupi: ${selectedAudienceSize} primalaca.`}
              required
            >
              <select
                value={form.audience}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, audience: event.target.value }))
                }
                className="admin-inline-input"
              >
                {AUDIENCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </AdminField>

            <div className="admin-btn-row">
              <button type="submit" disabled={busy} className="admin-btn admin-btn--primary">
                <AdminIcon name="save" size={16} />
                {busy ? "Čuvanje..." : "Sačuvaj kao nacrt"}
              </button>
              <button
                type="button"
                className="admin-btn"
                onClick={resetForm}
                disabled={busy}
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
                Kako će mejl izgledati
              </h3>
              <p className="admin-section-desc">
                Približan prikaz poruke koja stiže klijentu.
              </p>
            </div>
          </div>

          <div
            style={{
              background: "#f4f1ec",
              padding: 18,
              borderRadius: 16,
            }}
          >
            <div
              style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 16,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "20px 20px 14px",
                  borderBottom: "1px solid #ece5dc",
                  background: "linear-gradient(180deg,#faf7f2 0%,#ffffff 100%)",
                }}
              >
                <div
                  style={{
                    color: "#8a6f4d",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                  }}
                >
                  Dr Igic Clinic
                </div>
                <h4 style={{ margin: "10px 0 0", fontSize: 22 }}>
                  {form.heading || "Naslov poruke"}
                </h4>
              </div>
              <div style={{ padding: "18px 20px 8px" }}>
                {imagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagePreview}
                    alt=""
                    style={{
                      display: "block",
                      width: "100%",
                      borderRadius: 12,
                      marginBottom: 16,
                    }}
                  />
                ) : null}
                {(form.body || "Ovde ide tekst poruke za klijente.")
                  .split("\n")
                  .filter((line) => line.trim())
                  .map((line, index) => (
                    <p
                      key={index}
                      style={{ margin: "0 0 12px", color: "#374151", lineHeight: 1.7 }}
                    >
                      {line}
                    </p>
                  ))}
                <span
                  style={{
                    display: "inline-block",
                    marginTop: 8,
                    padding: "11px 16px",
                    borderRadius: 999,
                    background: "#111827",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  {previewCta}
                </span>
              </div>
              <div style={{ padding: "12px 20px 20px" }}>
                <p style={{ margin: 0, color: "#6b7280", fontSize: 12 }}>Dr Igic Clinic - Niš</p>
                <p style={{ margin: "6px 0 0", color: "#9ca3af", fontSize: 11 }}>
                  Ne želite više ovakve poruke? Odjavite se jednim klikom.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-head">
          <div>
            <h3 className="admin-section-title">
              <AdminIcon name="list" size={18} />
              Sve kampanje
            </h3>
            <p className="admin-section-desc">
              Status slanja, broj primalaca i akcije nad svakom kampanjom.
            </p>
          </div>
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            disabled={busy || !stats.sending}
            onClick={() =>
              callCampaignAction(
                "/api/admin/campaigns/dispatch",
                {},
                (data) => `Poslato u ovoj turi: ${data.sent}. Preostala dnevna kvota: ${data.quotaRemaining}.`
              )
            }
          >
            <AdminIcon name="mail" size={16} />
            Pošalji sledeću turu odmah
          </button>
        </div>

        {booting ? (
          <div style={{ display: "grid", gap: 8 }}>
            <div className="admin-skeleton admin-skeleton--card" />
            <div className="admin-skeleton admin-skeleton--card" />
          </div>
        ) : campaigns.length ? (
          <div className="admin-announcement-list">
            {campaigns.map((campaign) => (
              <article key={campaign.id} className="admin-announcement-card">
                <div className="admin-announcement-card-head">
                  <div>
                    <div className="admin-announcement-card-topline">
                      <span className="admin-announcement-badge is-live">
                        {STATUS_LABELS[campaign.status] || campaign.status}
                      </span>
                      <span className="admin-announcement-created">
                        Kreirano: {formatDateTime(campaign.createdAt)}
                      </span>
                    </div>
                    <h4>{campaign.title}</h4>
                    <p>{campaign.subject}</p>
                  </div>
                </div>

                <div className="admin-announcement-meta">
                  <div>
                    <span>Publika</span>
                    <strong>
                      {AUDIENCE_OPTIONS.find((item) => item.value === campaign.audience)?.label ||
                        campaign.audience}
                    </strong>
                  </div>
                  <div>
                    <span>Poslato / ukupno</span>
                    <strong>
                      {campaign.sentCount} / {campaign.totalRecipients}
                    </strong>
                  </div>
                  <div>
                    <span>Neuspelo</span>
                    <strong>{campaign.failedCount}</strong>
                  </div>
                  <div>
                    <span>Završeno</span>
                    <strong>{formatDateTime(campaign.sentAt)}</strong>
                  </div>
                </div>

                {campaign.lastError ? (
                  <p className="admin-announcement-feedback is-error">{campaign.lastError}</p>
                ) : null}

                <div className="admin-btn-row">
                  <button
                    type="button"
                    className="admin-btn admin-btn--sm"
                    disabled={busy}
                    onClick={() =>
                      callCampaignAction(
                        `/api/admin/campaigns/${campaign.id}/test`,
                        {},
                        (data) => `Test poruka je poslata na ${data.to}.`
                      )
                    }
                  >
                    <AdminIcon name="mail" size={15} />
                    Pošalji test sebi
                  </button>

                  {campaign.status === "draft" ? (
                    <>
                      <button
                        type="button"
                        className="admin-btn admin-btn--sm admin-btn--success"
                        disabled={busy}
                        onClick={() => handleSend(campaign)}
                      >
                        <AdminIcon name="check" size={15} />
                        Pokreni slanje
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn--sm admin-btn--danger"
                        disabled={busy}
                        onClick={() => {
                          if (window.confirm("Obrisati ovu kampanju?")) {
                            callCampaignAction(
                              `/api/admin/campaigns/${campaign.id}`,
                              { method: "DELETE" },
                              "Kampanja je obrisana."
                            );
                          }
                        }}
                      >
                        <AdminIcon name="trash" size={15} />
                        Obriši
                      </button>
                    </>
                  ) : null}

                  {campaign.status === "sending" ? (
                    <button
                      type="button"
                      className="admin-btn admin-btn--sm admin-btn--danger"
                      disabled={busy}
                      onClick={() => {
                        if (window.confirm("Zaustaviti dalje slanje ove kampanje?")) {
                          callCampaignAction(
                            `/api/admin/campaigns/${campaign.id}/cancel`,
                            {},
                            "Slanje je zaustavljeno."
                          );
                        }
                      }}
                    >
                      <AdminIcon name="close" size={15} />
                      Zaustavi slanje
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <AdminEmptyState
            icon="campaigns"
            title="Još nema nijedne kampanje"
            description="Napravite prvu iz forme iznad — čuva se kao nacrt dok ručno ne pokrenete slanje."
          />
        )}
      </div>
    </section>
  );
}
