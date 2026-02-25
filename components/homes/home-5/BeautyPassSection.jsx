"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import GooglePopupButton from "@/components/auth/GooglePopupButton";

// ── Helpers ──────────────────────────────────────────────────────────────────

async function parseResponse(response) {
  const text = await response.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return null; }
}

function todayDateInput() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function parseIsoDate(isoDate) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatIsoDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function buildCalendarCells(monthDate) {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - ((first.getDay() + 6) % 7));
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return { iso: formatIsoDate(d), dayNumber: d.getDate(), inCurrentMonth: d.getMonth() === monthDate.getMonth() };
  });
}

function formatMonthLabel(date) {
  return new Intl.DateTimeFormat("sr-RS", { month: "long", year: "numeric" }).format(date);
}

function formatHistoryDate(isoString) {
  return new Date(isoString).toLocaleDateString("sr-RS", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatBookingDate(isoString) {
  return new Date(isoString).toLocaleString("sr-RS", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

async function getCroppedBlob(imageSrc, croppedAreaPixels) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => {
      const canvas = document.createElement("canvas");
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height, 0, 0, croppedAreaPixels.width, croppedAreaPixels.height);
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Canvas is empty")), "image/jpeg", 0.92);
    });
    img.addEventListener("error", reject);
    img.src = imageSrc;
  });
}

// ── Crop Modal ────────────────────────────────────────────────────────────────

function CropModal({ imageSrc, onConfirm, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [applying, setApplying] = useState(false);

  const onCropComplete = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function handleConfirm() {
    if (!croppedAreaPixels) return;
    setApplying(true);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
      onConfirm(blob);
    } catch {
      setApplying(false);
    }
  }

  return (
    <div className="clinic-bp-crop-overlay" role="dialog" aria-modal="true" aria-label="Iseci fotografiju nalepnice">
      <div className="clinic-bp-crop-modal">
        <div className="clinic-bp-crop-header">
          <span className="clinic-bp-crop-title">Kadriraj nalepnicu</span>
          <p className="clinic-bp-crop-hint">Pomeri i zumuj dok nalepnica ne ispuni okvir</p>
        </div>

        <div className="clinic-bp-crop-area">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={undefined}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{
              containerStyle: { borderRadius: "12px" },
              cropAreaStyle: { border: "2px solid rgba(255,255,255,0.9)", boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)" },
            }}
          />
        </div>

        <div className="clinic-bp-crop-controls">
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="clinic-bp-crop-zoom"
            aria-label="Zum"
          />
        </div>

        <div className="clinic-bp-crop-actions">
          <button type="button" className="clinic-bp-crop-cancel" onClick={onCancel} disabled={applying}>
            Otkaži
          </button>
          <button type="button" className="clinic-bp-crop-confirm" onClick={handleConfirm} disabled={applying}>
            {applying ? "Primenjujem..." : "Iseci i potvrdi"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Lightbox ──────────────────────────────────────────────────────────────────

function Lightbox({ src, onClose }) {
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="clinic-bp-lightbox" onClick={onClose} role="dialog" aria-modal="true">
      <button className="clinic-bp-lightbox-close" onClick={onClose} aria-label="Zatvori">✕</button>
      <img src={src} alt="Nalepnica" className="clinic-bp-lightbox-img" onClick={(e) => e.stopPropagation()} />
    </div>
  );
}

// ── Upload Zone ───────────────────────────────────────────────────────────────

function UploadZone({ onFileSelected }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  function handleFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => onFileSelected(e.target.result);
    reader.readAsDataURL(file);
  }

  function handleChange(e) { handleFile(e.target.files?.[0]); }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  }

  return (
    <div
      className={`clinic-bp-upload-zone${dragging ? " is-dragging" : ""}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      aria-label="Otpremi fotografiju nalepnice"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="clinic-bp-upload-input"
        onChange={handleChange}
      />
      <div className="clinic-bp-upload-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 16V8M12 8L9 11M12 8L15 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M20 16.5C20 18.43 18.43 20 16.5 20H7.5C5.57 20 4 18.43 4 16.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          <rect x="3" y="3" width="8" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
        </svg>
      </div>
      <p className="clinic-bp-upload-label">Fotografišite nalepnicu i otpremite je ovde</p>
      <p className="clinic-bp-upload-sub">Kliknite ili prevucite sliku &mdash; na mobilnom otvara kameru</p>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function BeautyPassSection({ googleNextPath = "/" }) {
  const [user, setUser] = useState(null);
  const [beautyPass, setBeautyPass] = useState(null);
  const [bookings, setBookings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Form state
  const [treatmentDate, setTreatmentDate] = useState(todayDateInput());
  const [notes, setNotes] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const t = parseIsoDate(todayDateInput());
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });

  // Image / crop state
  const [rawImageSrc, setRawImageSrc] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [croppedBlob, setCroppedBlob] = useState(null);
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState(null);

  // Lightbox
  const [lightboxSrc, setLightboxSrc] = useState(null);

  const pastBookings = useMemo(() => bookings?.past || [], [bookings]);
  const calendarCells = useMemo(() => buildCalendarCells(calendarMonth), [calendarMonth]);
  const weekdayLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat("sr-RS", { weekday: "short" });
    const monday = new Date(2024, 0, 1);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return formatter.format(d);
    });
  }, []);

  async function loadData() {
    setLoading(true); setError("");
    try {
      const profileRes = await fetch("/api/me/profile");
      if (!profileRes.ok) { setUser(null); setBeautyPass(null); setBookings(null); return; }
      const profileData = await parseResponse(profileRes);
      const sessionUser = profileData?.user || null;
      setUser(sessionUser);
      if (!sessionUser) { setBeautyPass(null); setBookings(null); return; }
      const [passRes, bookingsRes] = await Promise.all([fetch("/api/me/beauty-pass"), fetch("/api/me/bookings")]);
      const passData = await parseResponse(passRes);
      const bookingsData = await parseResponse(bookingsRes);
      if (!passRes.ok || !passData?.ok) throw new Error(passData?.message || "Greška pri učitavanju beauty pass podataka.");
      if (!bookingsRes.ok || !bookingsData?.ok) throw new Error(bookingsData?.message || "Greška pri učitavanju termina.");
      setBeautyPass(passData);
      setBookings(bookingsData);
    } catch (e) {
      setError(e.message || "Greška pri učitavanju.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => { if (croppedPreviewUrl) URL.revokeObjectURL(croppedPreviewUrl); };
  }, [croppedPreviewUrl]);

  function handleFileSelected(src) {
    setRawImageSrc(src);
    setShowCropModal(true);
  }

  function handleCropConfirm(blob) {
    if (croppedPreviewUrl) URL.revokeObjectURL(croppedPreviewUrl);
    setCroppedBlob(blob);
    setCroppedPreviewUrl(URL.createObjectURL(blob));
    setShowCropModal(false);
    setRawImageSrc(null);
  }

  function handleCropCancel() {
    setShowCropModal(false);
    setRawImageSrc(null);
  }

  function handleRemoveImage() {
    if (croppedPreviewUrl) URL.revokeObjectURL(croppedPreviewUrl);
    setCroppedBlob(null);
    setCroppedPreviewUrl(null);
    setRawImageSrc(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!croppedBlob) { setError("Otpremite fotografiju nalepnice pre čuvanja."); return; }
    setSaving(true); setError(""); setMessage("");
    try {
      const fd = new FormData();
      fd.append("treatmentDate", treatmentDate);
      if (notes.trim()) fd.append("notes", notes.trim());
      fd.append("file", croppedBlob, "sticker.jpg");

      const res = await fetch("/api/me/beauty-pass/records", { method: "POST", body: fd });
      const data = await parseResponse(res);
      if (!res.ok || !data?.ok) throw new Error(data?.message || "Neuspešno čuvanje unosa.");

      setMessage("Nalepnica je uspešno sačuvana u Beauty Pass istoriji.");
      handleRemoveImage();
      setNotes("");
      setTreatmentDate(todayDateInput());
      await loadData();
    } catch (e) {
      setError(e.message || "Greška pri čuvanju.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="clinic-bp" id="beauty-pass">
      {showCropModal && rawImageSrc && (
        <CropModal imageSrc={rawImageSrc} onConfirm={handleCropConfirm} onCancel={handleCropCancel} />
      )}
      {lightboxSrc && (
        <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}

      <div className="container">
        {/* Header */}
        <div className="clinic-bp__header">
          <span className="clinic-bp__tag">Moj nalog</span>
          <h2 className="clinic-bp__title">Beauty Pass</h2>
          <p className="clinic-bp__subtitle">Fotografišite nalepnicu nakon svakog tretmana i sačuvajte je ovde.</p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="clinic-bp__loader">
            <span className="clinic-bp__loader-dot" />
            <span className="clinic-bp__loader-dot" />
            <span className="clinic-bp__loader-dot" />
          </div>
        )}

        {/* Not logged in */}
        {!loading && !user && (
          <div className="clinic-bp__lock">
            <p className="clinic-bp__lock-text">Beauty Pass je dostupan nakon prijave.</p>
            <GooglePopupButton className="clinic-bp__login-btn" nextPath={googleNextPath}>
              Prijavi se
            </GooglePopupButton>
          </div>
        )}

        {/* Main content */}
        {!loading && user && (
          <div className="clinic-bp__grid">

            {/* LEFT — History */}
            <div className="clinic-bp__card">
              <div className="clinic-bp__card-label">Istorija nalepnica</div>

              {beautyPass?.treatmentHistory?.length ? (
                <div className="clinic-bp__history">
                  {beautyPass.treatmentHistory.slice(0, 20).map((item) => (
                    <div key={item.id} className="clinic-bp__history-item">
                      {/* Sticker thumbnails */}
                      {item.media?.length > 0 ? (
                        <div className="clinic-bp__thumb-row">
                          {item.media.map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              className="clinic-bp__thumb"
                              onClick={() => setLightboxSrc(m.mediaUrl)}
                              aria-label="Pogledaj nalepnicu u punoj veličini"
                            >
                              <img src={m.mediaUrl} alt="Nalepnica" />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="clinic-bp__thumb clinic-bp__thumb--empty">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.4"/><path d="M3 16l5-5 4 4 3-3 6 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                      )}

                      <div className="clinic-bp__history-meta">
                        <span className="clinic-bp__history-date">{formatHistoryDate(item.treatmentDate)}</span>
                        {item.notes && <span className="clinic-bp__history-notes">{item.notes}</span>}
                        {item.product?.name && <span className="clinic-bp__history-product">{item.product.name}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="clinic-bp__empty">Još nema sačuvanih nalepnica.</p>
              )}

              {/* Past bookings */}
              {pastBookings.length > 0 && (
                <>
                  <div className="clinic-bp__card-label" style={{ marginTop: 28 }}>Prethodni termini</div>
                  <ul className="clinic-bp__booking-list">
                    {pastBookings.slice(0, 8).map((b) => (
                      <li key={b.id} className="clinic-bp__booking-item">
                        <span className="clinic-bp__booking-dot" />
                        <div className="clinic-bp__booking-info">
                          <span className="clinic-bp__booking-date">{formatBookingDate(b.startsAt)}</span>
                          <span className="clinic-bp__booking-meta">{b.totalDurationMin} min &middot; {b.totalPriceRsd} EUR</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            {/* RIGHT — Upload form */}
            <div className="clinic-bp__card clinic-bp__card--form">
              <div className="clinic-bp__card-label">Dodaj nalepnicu</div>

              <form onSubmit={handleSubmit}>

                {/* Image upload / preview */}
                {croppedPreviewUrl ? (
                  <div className="clinic-bp__preview">
                    <img src={croppedPreviewUrl} alt="Isečena nalepnica" className="clinic-bp__preview-img" />
                    <div className="clinic-bp__preview-actions">
                      <span className="clinic-bp__preview-ok">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Nalepnica isečena
                      </span>
                      <button type="button" className="clinic-bp__preview-change" onClick={handleRemoveImage}>
                        Promeni sliku
                      </button>
                    </div>
                  </div>
                ) : (
                  <UploadZone onFileSelected={handleFileSelected} />
                )}

                {/* Calendar */}
                <div className="clinic-bp__field-group">
                  <label className="clinic-bp__field-label">Datum tretmana</label>
                  <div className="clinic-bp__cal-wrap">
                    <div className="clinic-bp__cal-header">
                      <button type="button" className="clinic-bp__cal-nav" onClick={() => setCalendarMonth((p) => addMonths(p, -1))} aria-label="Prethodni mesec">←</button>
                      <span className="clinic-bp__cal-title">{formatMonthLabel(calendarMonth)}</span>
                      <button type="button" className="clinic-bp__cal-nav" onClick={() => setCalendarMonth((p) => addMonths(p, 1))} aria-label="Sledeći mesec">→</button>
                    </div>
                    <div className="clinic-bp__cal-weekdays">
                      {weekdayLabels.map((l) => <span key={l}>{l}</span>)}
                    </div>
                    <div className="clinic-bp__cal-grid">
                      {calendarCells.map((cell) => (
                        <button
                          key={cell.iso}
                          type="button"
                          className={`clinic-bp__cal-day${treatmentDate === cell.iso ? " is-selected" : ""}${!cell.inCurrentMonth ? " is-out" : ""}`}
                          onClick={() => setTreatmentDate(cell.iso)}
                        >
                          {cell.dayNumber}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Optional notes */}
                <div className="clinic-bp__field-group">
                  <label className="clinic-bp__field-label">Napomena (opciono)</label>
                  <textarea
                    className="clinic-bp__textarea"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Npr. Botoks čelo, korekcija usana..."
                  />
                </div>

                {message && <p className="clinic-bp__msg clinic-bp__msg--ok">{message}</p>}
                {error && <p className="clinic-bp__msg clinic-bp__msg--err">{error}</p>}

                <button type="submit" className="clinic-bp__submit" disabled={saving || !croppedBlob}>
                  {saving ? "Čuvanje..." : "Sačuvaj nalepnicu"}
                </button>
              </form>
            </div>

          </div>
        )}
      </div>
    </section>
  );
}
