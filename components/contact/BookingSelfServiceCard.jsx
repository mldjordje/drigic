"use client";

import { useEffect, useMemo, useState } from "react";
import GooglePopupButton from "@/components/auth/GooglePopupButton";
import { useLocale } from "@/components/common/LocaleProvider";
import { useSession } from "@/components/common/SessionProvider";

function formatBookingStatus(status) {
  const normalized = String(status || "").toLowerCase();
  const labels = {
    pending: "Na čekanju",
    confirmed: "Potvrđen",
    completed: "Završen",
    cancelled: "Otkazan",
    "no-show": "Niste se pojavili",
    no_show: "Niste se pojavili",
  };
  return labels[normalized] || status || "Nepoznato";
}

function statusBadgeStyle(status) {
  const normalized = String(status || "").toLowerCase();
  const base = {
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.3,
  };
  if (normalized === "confirmed") {
    return { ...base, background: "rgba(74,222,128,0.15)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.3)" };
  }
  if (normalized === "pending") {
    return { ...base, background: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" };
  }
  return { ...base, background: "rgba(148,163,184,0.15)", color: "#94a3b8", border: "1px solid rgba(148,163,184,0.3)" };
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return null; }
}

function todayIsoDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function parseIsoDate(isoDate) {
  const [year, month, day] = String(isoDate || "").split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function formatIsoDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatMonthKey(date) {
  return formatIsoDate(new Date(date.getFullYear(), date.getMonth(), 1)).slice(0, 7);
}

function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function formatMonthLabel(date, locale = "sr-RS") {
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(date);
}

function buildCalendarCells(monthDate) {
  const firstDayOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const gridStart = new Date(firstDayOfMonth);
  gridStart.setDate(firstDayOfMonth.getDate() - ((firstDayOfMonth.getDay() + 6) % 7));
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return { iso: formatIsoDate(date), dayNumber: date.getDate(), inCurrentMonth: date.getMonth() === monthDate.getMonth() };
  });
}

function availabilityClass(availableCount, maxCount, loading) {
  if (loading && availableCount === undefined) return "is-loading";
  if (availableCount === undefined) return "is-loading";
  if (availableCount <= 0) return "is-none";
  if (!maxCount || maxCount <= 0) return "is-medium";
  return availableCount / maxCount >= 0.55 ? "is-high" : "is-medium";
}

function formatFullDateTime(iso, locale = "sr-RS") {
  try {
    return new Date(iso).toLocaleString(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch { return iso; }
}

function formatShortDate(iso, locale = "sr-RS") {
  try {
    return new Date(iso).toLocaleString(locale, {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch { return iso; }
}

export default function BookingSelfServiceCard() {
  const { t, intlLocale } = useLocale();
  const { user } = useSession();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Which booking has the reschedule panel open
  const [activeBookingId, setActiveBookingId] = useState("");
  const activeBooking = useMemo(() => bookings.find((b) => b.id === activeBookingId) || null, [bookings, activeBookingId]);

  // Which booking is pending cancel confirmation
  const [confirmCancelId, setConfirmCancelId] = useState("");

  const today = useMemo(() => todayIsoDate(), []);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const base = parseIsoDate(todayIsoDate());
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const monthKey = useMemo(() => formatMonthKey(calendarMonth), [calendarMonth]);
  const canGoPrevMonth = useMemo(() => monthKey > today.slice(0, 7), [monthKey, today]);
  const calendarCells = useMemo(() => buildCalendarCells(calendarMonth), [calendarMonth]);

  const weekdayLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(intlLocale, { weekday: "short" });
    const monday = new Date(2024, 0, 1);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return formatter.format(d);
    });
  }, [intlLocale]);

  const [rescheduleDate, setRescheduleDate] = useState(() => todayIsoDate());
  const [monthAvailability, setMonthAvailability] = useState({});
  const [monthLoading, setMonthLoading] = useState(false);
  const [calendarError, setCalendarError] = useState("");
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedStartAt, setSelectedStartAt] = useState("");
  const [reason, setReason] = useState("");

  const durationMin = useMemo(() => Math.max(5, Number(activeBooking?.totalDurationMin || 15)), [activeBooking?.totalDurationMin]);

  const maxSlotsInMonth = useMemo(() => {
    const vals = Object.entries(monthAvailability)
      .filter(([day]) => day.startsWith(monthKey))
      .map(([, count]) => Number(count) || 0);
    return vals.length ? Math.max(...vals) : 0;
  }, [monthAvailability, monthKey]);

  const selectedDateLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(intlLocale, { weekday: "long", day: "numeric", month: "long" }).format(parseIsoDate(rescheduleDate));
    } catch { return rescheduleDate; }
  }, [rescheduleDate, intlLocale]);

  async function loadBookings() {
    if (!user) { setBookings([]); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/me/bookings", { cache: "no-store" });
      const data = await parseResponse(res);
      if (!res.ok || !data?.ok) throw new Error(data?.message || "Ne mogu da učitam termine.");
      setBookings(data.upcoming || []);
    } catch (err) {
      setError(err.message || "Ne mogu da učitam termine.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadBookings().catch(() => {}); }, [user?.id]);

  // Load month availability when a booking is selected
  useEffect(() => {
    if (!activeBooking) { setMonthAvailability({}); setCalendarError(""); return; }
    const controller = new AbortController();
    setMonthLoading(true);
    setCalendarError("");
    const params = new URLSearchParams({ month: monthKey, durationMin: String(durationMin) });
    fetch(`/api/bookings/availability?${params}`, { signal: controller.signal, cache: "no-store" })
      .then(async (res) => ({ ok: res.ok, data: await parseResponse(res) }))
      .then(({ ok, data }) => {
        if (!ok || !data?.ok) throw new Error(data?.message || "Ne mogu da učitam dostupnost.");
        const map = {};
        (data.days || []).forEach((day) => { map[day.date] = Number(day.availableSlots) || 0; });
        setMonthAvailability(map);
      })
      .catch((err) => { if (err?.name !== "AbortError") setCalendarError(err?.message || "Ne mogu da učitam dostupnost."); })
      .finally(() => setMonthLoading(false));
    return () => controller.abort();
  }, [activeBookingId, activeBooking, monthKey, durationMin]);

  // Auto-select first available date in month
  useEffect(() => {
    if (!activeBooking || monthLoading) return;
    const availableDates = Object.entries(monthAvailability)
      .filter(([day, count]) => day.startsWith(monthKey) && Number(count) > 0 && day >= today)
      .map(([day]) => day).sort();
    if (!availableDates.length) return;
    if (!rescheduleDate.startsWith(monthKey) || Number(monthAvailability[rescheduleDate] || 0) <= 0) {
      setRescheduleDate(availableDates[0]);
      setSelectedStartAt("");
    }
  }, [activeBooking, monthAvailability, monthKey, rescheduleDate, monthLoading, today]);

  // Load slots for selected date
  useEffect(() => {
    async function loadSlots() {
      if (!activeBooking || !rescheduleDate) { setSlots([]); return; }
      setSlotsLoading(true);
      try {
        const params = new URLSearchParams({ date: rescheduleDate, durationMin: String(durationMin) });
        const res = await fetch(`/api/bookings/availability?${params}`, { cache: "no-store" });
        const data = await parseResponse(res);
        if (!res.ok || !data?.ok) throw new Error(data?.message || "Ne mogu da učitam slotove.");
        setSlots((data.slots || []).filter((s) => s.available));
      } catch { setSlots([]); }
      finally { setSlotsLoading(false); }
    }
    setSelectedStartAt("");
    loadSlots().catch(() => {});
  }, [activeBooking, activeBookingId, rescheduleDate, durationMin]);

  async function handleReschedule() {
    if (!activeBooking || !selectedStartAt) return;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`/api/bookings/${activeBooking.id}/reschedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startAt: selectedStartAt, note: reason || undefined }),
      });
      const data = await parseResponse(res);
      if (!res.ok || !data?.ok) throw new Error(data?.message || "Izmena termina nije uspela.");
      setMessage("Termin je uspešno prezakazan. Klinika će potvrditi novi termin.");
      setActiveBookingId("");
      setReason("");
      await loadBookings();
    } catch (err) {
      setError(err.message || "Izmena termina nije uspela.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelById(bookingId) {
    if (!bookingId) return;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason || undefined }),
      });
      const data = await parseResponse(res);
      if (!res.ok || !data?.ok) throw new Error(data?.message || "Otkazivanje nije uspelo.");
      setMessage("Termin je otkazan.");
      setConfirmCancelId("");
      setActiveBookingId("");
      setReason("");
      await loadBookings();
    } catch (err) {
      setError(err.message || "Otkazivanje nije uspelo.");
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div style={cardStyle}>
        <strong style={{ display: "block", color: "var(--clinic-text-strong)", fontSize: 17, marginBottom: 6 }}>
          Upravljajte svojim terminima
        </strong>
        <p style={{ margin: "0 0 14px", color: "var(--clinic-text-muted)", fontSize: 14 }}>
          Prijavite se da biste videli, prezakazali ili otkazali svoje termine.
        </p>
        <GooglePopupButton className="btn clinic-glow-btn" nextPath="/contact">
          {(t?.("common.login") || "Uloguj se").toUpperCase()} WITH GOOGLE
        </GooglePopupButton>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <strong style={{ display: "block", color: "var(--clinic-text-strong)", fontSize: 17, marginBottom: 4 }}>
        Moji predstojeći termini
      </strong>
      <p style={{ margin: "0 0 16px", color: "var(--clinic-text-muted)", fontSize: 14 }}>
        Odaberite termin da ga prezakazujete ili otkažete.
      </p>

      {loading && !bookings.length ? (
        <p style={{ margin: 0, color: "var(--clinic-text-muted)" }}>Učitavanje…</p>
      ) : null}

      {!loading && !bookings.length ? (
        <p style={{ margin: 0, color: "var(--clinic-text-muted)" }}>Nemate predstojeći termin.</p>
      ) : null}

      {bookings.length ? (
        <div style={{ display: "grid", gap: 12 }}>
          {bookings.map((b) => {
            const isRescheduleOpen = activeBookingId === b.id;
            const isCancelConfirm = confirmCancelId === b.id;

            return (
              <div key={b.id} style={bookingCardStyle(isRescheduleOpen)}>
                {/* Booking info header */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                    <span style={statusBadgeStyle(b.status)}>{formatBookingStatus(b.status)}</span>
                  </div>
                  <strong style={{ display: "block", color: "var(--clinic-text-strong)", fontSize: 16, lineHeight: 1.3 }}>
                    {formatFullDateTime(b.startsAt, intlLocale)}
                  </strong>
                  <span style={{ color: "var(--clinic-text-muted)", fontSize: 13, marginTop: 2, display: "block" }}>
                    Trajanje: {b.totalDurationMin} min · Cena: {b.totalPriceRsd} EUR
                  </span>
                </div>

                {/* Action buttons - cancel confirm mode */}
                {isCancelConfirm ? (
                  <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, padding: "12px 14px" }}>
                    <p style={{ margin: "0 0 10px", color: "#f87171", fontWeight: 600, fontSize: 14 }}>
                      Sigurno želite da otkažete ovaj termin?
                    </p>
                    <label style={{ display: "grid", gap: 4, marginBottom: 10 }}>
                      <span style={{ fontSize: 13, color: "var(--clinic-text-muted)" }}>Razlog (opciono)</span>
                      <input
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Npr. promenio/la sam planove"
                        className="clinic-glow-field"
                        style={fieldStyle}
                      />
                    </label>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => handleCancelById(b.id)}
                        style={dangerBtnStyle}
                      >
                        {loading ? "Otkazujem…" : "Da, otkaži termin"}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setConfirmCancelId(""); setReason(""); }}
                        style={ghostBtnStyle}
                      >
                        Ne, zadrži termin
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Normal action buttons */
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setError("");
                        setMessage("");
                        setReason("");
                        setSelectedStartAt("");
                        setConfirmCancelId("");
                        setActiveBookingId(isRescheduleOpen ? "" : b.id);
                      }}
                      style={isRescheduleOpen ? ghostBtnStyle : primaryBtnStyle}
                    >
                      {isRescheduleOpen ? "Zatvori" : "Prezakazi termin"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setError("");
                        setMessage("");
                        setReason("");
                        setActiveBookingId("");
                        setConfirmCancelId(b.id);
                      }}
                      style={secondaryBtnStyle}
                    >
                      Otkaži termin
                    </button>
                  </div>
                )}

                {/* Reschedule panel */}
                {isRescheduleOpen && !isCancelConfirm ? (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--clinic-card-border)" }}>
                    <p style={{ margin: "0 0 12px", color: "var(--clinic-text-muted)", fontSize: 13 }}>
                      Izaberite novi datum i vreme. Stari termin će biti oslobođen.
                    </p>

                    <div className="clinic-booking-calendar" style={{ marginBottom: 14 }}>
                      <div className="clinic-cal-header">
                        <button type="button" className="clinic-cal-nav" disabled={!canGoPrevMonth}
                          onClick={() => setCalendarMonth((prev) => addMonths(prev, -1))}>
                          {t?.("booking.previous") || "Prethodni"}
                        </button>
                        <div className="clinic-cal-title">{formatMonthLabel(calendarMonth, intlLocale)}</div>
                        <button type="button" className="clinic-cal-nav"
                          onClick={() => setCalendarMonth((prev) => addMonths(prev, 1))}>
                          {t?.("booking.next") || "Sledeći"}
                        </button>
                      </div>

                      <div className="clinic-cal-weekdays">
                        {weekdayLabels.map((label) => <span key={label}>{label}</span>)}
                      </div>

                      <div className="clinic-cal-legend" aria-label="Legenda dostupnosti termina">
                        <span><span className="calendar-indicator is-high" />Slobodni termini</span>
                        <span><span className="calendar-indicator is-medium" />Ograničeno</span>
                        <span><span className="calendar-indicator is-none" />Popunjeno</span>
                      </div>

                      <div className="clinic-cal-grid">
                        {calendarCells.map((cell) => {
                          const availableCount = monthAvailability[cell.iso];
                          const isDisabled = !cell.inCurrentMonth || cell.iso < today || (availableCount !== undefined && Number(availableCount) <= 0);
                          const isActiveDay = cell.iso === rescheduleDate;
                          return (
                            <button
                              key={cell.iso}
                              type="button"
                              className={`clinic-cal-day ${isActiveDay ? "is-active" : ""} ${!cell.inCurrentMonth ? "is-out" : ""}`}
                              disabled={isDisabled}
                              onClick={() => { setError(""); setMessage(""); setSelectedStartAt(""); setRescheduleDate(cell.iso); }}
                            >
                              <span>{cell.dayNumber}</span>
                              {cell.inCurrentMonth ? (
                                <span className={`calendar-indicator ${availabilityClass(availableCount, maxSlotsInMonth, monthLoading)}`} />
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <p style={{ margin: "0 0 8px", fontWeight: 700, color: "var(--clinic-text-strong)", fontSize: 14 }}>
                        Slobodni termini — {selectedDateLabel}
                      </p>
                      {calendarError ? (
                        <p style={{ margin: 0, color: "var(--clinic-danger)", fontSize: 13 }}>{calendarError}</p>
                      ) : slotsLoading ? (
                        <p style={{ margin: 0, color: "var(--clinic-text-muted)", fontSize: 13 }}>Učitavanje…</p>
                      ) : slots.length ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {slots.map((slot) => (
                            <button
                              key={slot.startAt}
                              type="button"
                              onClick={() => setSelectedStartAt(slot.startAt)}
                              className={`clinic-slot-button ${selectedStartAt === slot.startAt ? "is-active" : ""}`}
                              style={{ borderRadius: 10, border: "1px solid var(--clinic-card-border)", padding: "8px 12px", fontWeight: 700, fontSize: 14 }}
                            >
                              {new Date(slot.startAt).toLocaleTimeString(intlLocale, { hour: "2-digit", minute: "2-digit" })}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p style={{ margin: 0, color: "var(--clinic-text-muted)", fontSize: 13 }}>Nema slobodnih termina za ovaj datum.</p>
                      )}
                    </div>

                    {selectedStartAt ? (
                      <div style={{ background: "rgba(108,126,225,0.1)", border: "1px solid rgba(108,126,225,0.3)", borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
                        <span style={{ color: "var(--clinic-text-strong)", fontSize: 13 }}>
                          Izabrani novi termin:{" "}
                          <strong>{new Date(selectedStartAt).toLocaleString(intlLocale, { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</strong>
                        </span>
                      </div>
                    ) : null}

                    <label style={{ display: "grid", gap: 4, marginBottom: 12 }}>
                      <span style={{ fontSize: 13, color: "var(--clinic-text-muted)" }}>Napomena (opciono)</span>
                      <input
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Npr. razlog promene termina"
                        className="clinic-glow-field"
                        style={fieldStyle}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={handleReschedule}
                      disabled={loading || !selectedStartAt}
                      style={loading || !selectedStartAt ? { ...primaryBtnStyle, opacity: 0.5, cursor: "not-allowed" } : primaryBtnStyle}
                    >
                      {loading ? "Čuvam…" : "Potvrdi prezakazivanje"}
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {message ? (
        <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 10 }}>
          <p style={{ margin: 0, color: "#4ade80", fontSize: 14, fontWeight: 600 }}>{message}</p>
        </div>
      ) : null}
      {error ? (
        <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10 }}>
          <p style={{ margin: 0, color: "#f87171", fontSize: 14 }}>{error}</p>
        </div>
      ) : null}
    </div>
  );
}

const cardStyle = {
  background: "var(--clinic-card-bg)",
  border: "1px solid var(--clinic-card-border)",
  borderRadius: 16,
  padding: 20,
  backdropFilter: "blur(var(--clinic-card-blur, 10px))",
  WebkitBackdropFilter: "blur(var(--clinic-card-blur, 10px))",
};

function bookingCardStyle(isActive) {
  return {
    border: `1px solid ${isActive ? "rgba(108,126,225,0.5)" : "var(--clinic-card-border)"}`,
    borderRadius: 12,
    padding: "14px 16px",
    background: isActive ? "rgba(108,126,225,0.06)" : "rgba(255,255,255,0.02)",
    transition: "border-color 0.15s, background 0.15s",
  };
}

const primaryBtnStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "9px 18px",
  borderRadius: 10,
  border: "none",
  background: "var(--clinic-accent, #6c7ee1)",
  color: "#fff",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  minWidth: 140,
  flexShrink: 0,
};

const secondaryBtnStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "9px 18px",
  borderRadius: 10,
  border: "1px solid rgba(239,68,68,0.4)",
  background: "rgba(239,68,68,0.07)",
  color: "#f87171",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  minWidth: 120,
  flexShrink: 0,
};

const dangerBtnStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "9px 18px",
  borderRadius: 10,
  border: "none",
  background: "#ef4444",
  color: "#fff",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
};

const ghostBtnStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "9px 18px",
  borderRadius: 10,
  border: "1px solid var(--clinic-card-border)",
  background: "transparent",
  color: "var(--clinic-text-muted)",
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
};

const fieldStyle = {
  width: "100%",
  borderRadius: 10,
  border: "1px solid var(--clinic-field-border)",
  padding: "9px 12px",
  background: "var(--clinic-field-bg)",
  color: "var(--clinic-text-strong)",
  fontSize: 14,
  boxSizing: "border-box",
};
