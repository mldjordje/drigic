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

async function parseResponse(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function todayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseIsoDate(isoDate) {
  const [year, month, day] = String(isoDate || "")
    .split("-")
    .map((part) => Number(part));
  return new Date(year, (month || 1) - 1, day || 1);
}

function formatIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMonthKey(date) {
  return formatIsoDate(new Date(date.getFullYear(), date.getMonth(), 1)).slice(0, 7);
}

function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function formatMonthLabel(date, locale = "sr-RS") {
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(date);
}

function buildCalendarCells(monthDate) {
  const firstDayOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const gridStart = new Date(firstDayOfMonth);
  const dayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;
  gridStart.setDate(firstDayOfMonth.getDate() - dayOfWeek);

  const cells = [];
  for (let index = 0; index < 42; index += 1) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    cells.push({
      iso: formatIsoDate(date),
      dayNumber: date.getDate(),
      inCurrentMonth: date.getMonth() === monthDate.getMonth(),
    });
  }
  return cells;
}

function availabilityClass(availableCount, maxCount, loading) {
  if (loading && availableCount === undefined) {
    return "is-loading";
  }
  if (availableCount === undefined) {
    return "is-loading";
  }
  if (availableCount <= 0) {
    return "is-none";
  }
  if (!maxCount || maxCount <= 0) {
    return "is-medium";
  }
  const ratio = availableCount / maxCount;
  return ratio >= 0.55 ? "is-high" : "is-medium";
}

function defaultIsoTimeLabel(iso) {
  try {
    return new Date(iso).toLocaleString("sr-RS", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function BookingSelfServiceCard() {
  const { t, intlLocale } = useLocale();
  const { user } = useSession();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [activeBookingId, setActiveBookingId] = useState("");
  const activeBooking = useMemo(
    () => bookings.find((b) => b.id === activeBookingId) || null,
    [bookings, activeBookingId]
  );

  const today = useMemo(() => todayIsoDate(), []);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const base = parseIsoDate(todayIsoDate());
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const monthKey = useMemo(() => formatMonthKey(calendarMonth), [calendarMonth]);
  const canGoPrevMonth = useMemo(() => {
    const todayMonth = today.slice(0, 7);
    return monthKey > todayMonth;
  }, [monthKey, today]);
  const calendarCells = useMemo(() => buildCalendarCells(calendarMonth), [calendarMonth]);
  const weekdayLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(intlLocale, { weekday: "short" });
    const monday = new Date(2024, 0, 1);
    return Array.from({ length: 7 }, (_, index) => {
      const item = new Date(monday);
      item.setDate(monday.getDate() + index);
      return formatter.format(item);
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
  const durationMin = useMemo(
    () => Math.max(5, Number(activeBooking?.totalDurationMin || 15)),
    [activeBooking?.totalDurationMin]
  );

  const maxSlotsInMonth = useMemo(() => {
    const monthEntries = Object.entries(monthAvailability)
      .filter(([day]) => day.startsWith(monthKey))
      .map(([, count]) => Number(count) || 0);
    if (!monthEntries.length) {
      return 0;
    }
    return Math.max(...monthEntries);
  }, [monthAvailability, monthKey]);

  const selectedDateLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(intlLocale, {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(parseIsoDate(rescheduleDate));
    } catch {
      return rescheduleDate;
    }
  }, [rescheduleDate, intlLocale]);

  async function loadBookings() {
    if (!user) {
      setBookings([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/me/bookings", { cache: "no-store" });
      const data = await parseResponse(response);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Ne mogu da učitam termine.");
      }
      setBookings(data.upcoming || []);
    } catch (err) {
      setError(err.message || "Ne mogu da učitam termine.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!activeBooking) {
      setMonthAvailability({});
      setCalendarError("");
      return;
    }

    const controller = new AbortController();
    setMonthLoading(true);
    setCalendarError("");

    const params = new URLSearchParams({
      month: monthKey,
      durationMin: String(durationMin),
    });

    fetch(`/api/bookings/availability?${params.toString()}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (res) => ({ ok: res.ok, data: await parseResponse(res) }))
      .then(({ ok, data }) => {
        if (!ok || !data?.ok) {
          throw new Error(data?.message || "Ne mogu da učitam dostupnost.");
        }
        const map = {};
        (data.days || []).forEach((day) => {
          map[day.date] = Number(day.availableSlots) || 0;
        });
        setMonthAvailability(map);
      })
      .catch((err) => {
        if (err?.name === "AbortError") {
          return;
        }
        setCalendarError(err?.message || "Ne mogu da učitam dostupnost.");
      })
      .finally(() => {
        setMonthLoading(false);
      });

    return () => controller.abort();
  }, [activeBookingId, activeBooking, monthKey, durationMin]);

  useEffect(() => {
    if (!activeBooking || monthLoading) {
      return;
    }

    const availableDates = Object.entries(monthAvailability)
      .filter(([day, count]) => day.startsWith(monthKey) && Number(count) > 0 && day >= today)
      .map(([day]) => day)
      .sort();

    if (!availableDates.length) {
      return;
    }

    const selectedDateCount = Number(monthAvailability[rescheduleDate] || 0);
    if (!rescheduleDate.startsWith(monthKey) || selectedDateCount <= 0) {
      setRescheduleDate(availableDates[0]);
      setSelectedStartAt("");
    }
  }, [activeBooking, monthAvailability, monthKey, rescheduleDate, monthLoading, today]);

  useEffect(() => {
    async function loadSlots() {
      if (!activeBooking || !rescheduleDate) {
        setSlots([]);
        return;
      }
      setSlotsLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({
          date: rescheduleDate,
          durationMin: String(durationMin),
        });
        const response = await fetch(`/api/bookings/availability?${params.toString()}`, {
          cache: "no-store",
        });
        const data = await parseResponse(response);
        if (!response.ok || !data?.ok) {
          throw new Error(data?.message || "Ne mogu da učitam slobodne slotove.");
        }
        const available = (data.slots || []).filter((slot) => slot.available);
        setSlots(available);
      } catch (err) {
        setSlots([]);
        setError(err.message || "Ne mogu da učitam slobodne slotove.");
      } finally {
        setSlotsLoading(false);
      }
    }

    setSelectedStartAt("");
    loadSlots().catch(() => {});
  }, [activeBooking, activeBookingId, rescheduleDate, durationMin]);

  async function handleCancel() {
    if (!activeBooking) {
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/bookings/${activeBooking.id}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason || undefined }),
      });
      const data = await parseResponse(response);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Otkazivanje nije uspelo.");
      }
      setMessage("Termin je otkazan.");
      setActiveBookingId("");
      setReason("");
      await loadBookings();
    } catch (err) {
      setError(err.message || "Otkazivanje nije uspelo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReschedule() {
    if (!activeBooking || !selectedStartAt) {
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/bookings/${activeBooking.id}/reschedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startAt: selectedStartAt,
          note: reason || undefined,
        }),
      });
      const data = await parseResponse(response);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Izmena termina nije uspela.");
      }
      setMessage("Termin je izmenjen. Klinika će potvrditi novi termin.");
      setActiveBookingId("");
      setReason("");
      await loadBookings();
    } catch (err) {
      setError(err.message || "Izmena termina nije uspela.");
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div
        className="clinic-login-lock"
        style={{
          background: "var(--clinic-card-bg)",
          border: "1px solid var(--clinic-card-border)",
          borderRadius: 16,
          padding: 16,
          backdropFilter: "blur(var(--clinic-card-blur, 10px))",
          WebkitBackdropFilter: "blur(var(--clinic-card-blur, 10px))",
        }}
      >
        <strong style={{ display: "block", color: "var(--clinic-text-strong)" }}>
          Izmeni ili otkaži svoj termin
        </strong>
        <p style={{ margin: "8px 0 12px", color: "var(--clinic-text-muted)" }}>
          Ulogujte se kako biste videli svoje termine i mogli da ih izmenite ili otkažete.
        </p>
        <GooglePopupButton className="btn clinic-glow-btn" nextPath="/contact">
          {(t?.("common.login") || "Uloguj se").toUpperCase()} WITH GOOGLE
        </GooglePopupButton>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "var(--clinic-card-bg)",
        border: "1px solid var(--clinic-card-border)",
        borderRadius: 16,
        padding: 16,
        backdropFilter: "blur(var(--clinic-card-blur, 10px))",
        WebkitBackdropFilter: "blur(var(--clinic-card-blur, 10px))",
      }}
    >
      <strong style={{ display: "block", color: "var(--clinic-text-strong)" }}>
        Izmeni ili otkaži svoj termin
      </strong>
      <p style={{ margin: "8px 0 12px", color: "var(--clinic-text-muted)" }}>
        Ako imate zakazan termin, ovde možete da ga otkažete ili izaberete novi slot.
      </p>

      {loading ? (
        <p style={{ margin: 0, color: "var(--clinic-text-muted)" }}>{t("common.loading")}</p>
      ) : null}

      {!loading && bookings.length ? (
        <>
          <label style={{ display: "grid", gap: 6, marginBottom: 12 }}>
            <span style={{ fontWeight: 700, color: "var(--clinic-text-strong)" }}>Vaši termini</span>
            <select
              value={activeBookingId}
              onChange={(e) => setActiveBookingId(e.target.value)}
              className="clinic-glow-field"
              style={{
                width: "100%",
                borderRadius: 10,
                border: "1px solid var(--clinic-field-border)",
                padding: "10px 12px",
                background: "var(--clinic-field-bg)",
                color: "var(--clinic-text-strong)",
              }}
            >
              <option value="">Izaberite termin…</option>
              {bookings.map((b) => (
                <option key={b.id} value={b.id}>
                  {defaultIsoTimeLabel(b.startsAt)} • {b.totalDurationMin} min • {b.totalPriceRsd} EUR •{" "}
                  {formatBookingStatus(b.status)}
                </option>
              ))}
            </select>
          </label>

          {activeBooking ? (
            <>
              <div className="clinic-booking-calendar" style={{ marginBottom: 14 }}>
                <div className="clinic-cal-header">
                  <button
                    type="button"
                    className="clinic-cal-nav"
                    disabled={!canGoPrevMonth}
                    onClick={() => setCalendarMonth((prev) => addMonths(prev, -1))}
                  >
                    {t?.("booking.previous") || "Prethodni"}
                  </button>
                  <div className="clinic-cal-title">{formatMonthLabel(calendarMonth, intlLocale)}</div>
                  <button
                    type="button"
                    className="clinic-cal-nav"
                    onClick={() => setCalendarMonth((prev) => addMonths(prev, 1))}
                  >
                    {t?.("booking.next") || "Sledeći"}
                  </button>
                </div>

                <div className="clinic-cal-weekdays">
                  {weekdayLabels.map((label) => (
                    <span key={label}>{label}</span>
                  ))}
                </div>

                <div className="clinic-cal-legend" aria-label="Legenda dostupnosti termina">
                  <span>
                    <span className="calendar-indicator is-high" />
                    Više slobodnih termina
                  </span>
                  <span>
                    <span className="calendar-indicator is-medium" />
                    Ograničena dostupnost
                  </span>
                  <span>
                    <span className="calendar-indicator is-none" />
                    Nema slobodnih termina
                  </span>
                </div>

                <div className="clinic-cal-grid">
                  {calendarCells.map((cell) => {
                    const availableCount = monthAvailability[cell.iso];
                    const isPast = cell.iso < today;
                    const isActive = cell.iso === rescheduleDate;
                    const isDisabled =
                      !cell.inCurrentMonth ||
                      isPast ||
                      (availableCount !== undefined && Number(availableCount) <= 0);

                    return (
                      <button
                        key={cell.iso}
                        type="button"
                        className={`clinic-cal-day ${isActive ? "is-active" : ""} ${
                          !cell.inCurrentMonth ? "is-out" : ""
                        }`}
                        disabled={isDisabled}
                        onClick={() => {
                          setError("");
                          setMessage("");
                          setSelectedStartAt("");
                          setRescheduleDate(cell.iso);
                        }}
                      >
                        <span>{cell.dayNumber}</span>
                        {cell.inCurrentMonth ? (
                          <span
                            className={`calendar-indicator ${availabilityClass(
                              availableCount,
                              maxSlotsInMonth,
                              monthLoading
                            )}`}
                          />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
                <span style={{ fontWeight: 700, color: "var(--clinic-text-strong)" }}>Slobodni slotovi</span>
                <small style={{ color: "var(--clinic-text-muted)" }}>
                  {calendarError ? calendarError : selectedDateLabel}
                </small>
                {slotsLoading ? (
                  <p style={{ margin: 0, color: "var(--clinic-text-muted)" }}>{t("common.loading")}</p>
                ) : slots.length ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {slots.map((slot) => (
                      <button
                        key={slot.startAt}
                        type="button"
                        onClick={() => setSelectedStartAt(slot.startAt)}
                        className={`clinic-slot-button ${selectedStartAt === slot.startAt ? "is-active" : ""}`}
                        style={{
                          borderRadius: 10,
                          border: "1px solid var(--clinic-card-border)",
                          padding: "8px 10px",
                          fontWeight: 900,
                        }}
                      >
                        {new Date(slot.startAt).toLocaleTimeString(intlLocale, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, color: "var(--clinic-text-muted)" }}>Nema slobodnih slotova za ovaj datum.</p>
                )}
              </div>

              <label style={{ display: "grid", gap: 6, marginBottom: 12 }}>
                <span style={{ fontWeight: 700, color: "var(--clinic-text-strong)" }}>
                  Napomena (opciono)
                </span>
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Npr. razlog otkazivanja ili napomena za izmenu"
                  className="clinic-glow-field"
                  style={{
                    width: "100%",
                    borderRadius: 10,
                    border: "1px solid var(--clinic-field-border)",
                    padding: "10px 12px",
                    background: "var(--clinic-field-bg)",
                    color: "var(--clinic-text-strong)",
                  }}
                />
              </label>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                <button
                  type="button"
                  onClick={handleReschedule}
                  disabled={loading || !selectedStartAt}
                  className="btn clinic-glow-btn"
                >
                  Sačuvaj izmenu termina
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="btn style2"
                >
                  Otkaži termin
                </button>
              </div>
            </>
          ) : null}
        </>
      ) : !loading ? (
        <p style={{ margin: 0, color: "var(--clinic-text-muted)" }}>Trenutno nemate predstojeći termin.</p>
      ) : null}

      {message ? <p style={{ marginTop: 12, color: "var(--clinic-success)" }}>{message}</p> : null}
      {error ? <p style={{ marginTop: 12, color: "var(--clinic-danger)" }}>{error}</p> : null}
    </div>
  );
}

