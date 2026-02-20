"use client";

import { useEffect, useMemo, useState } from "react";

const STATUS_OPTIONS = [
  { value: "pending", label: "Na cekanju" },
  { value: "confirmed", label: "Potvrdjen" },
  { value: "completed", label: "Zavrsen" },
  { value: "cancelled", label: "Otkazan" },
  { value: "no_show", label: "No-show" },
];

const STATUS_CLASS = {
  pending: "is-pending",
  confirmed: "is-confirmed",
  completed: "is-completed",
  cancelled: "is-cancelled",
  no_show: "is-no-show",
};

function getMonday(date = new Date()) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  const day = (next.getDay() + 6) % 7;
  next.setDate(next.getDate() - day);
  return next;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toTimeLabel(value) {
  return value.toLocaleTimeString("sr-RS", { hour: "2-digit", minute: "2-digit" });
}

function fmtDateLabel(date) {
  return date.toLocaleDateString("sr-RS", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

function timeToMinutes(value) {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes) {
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return `${h}:${m}`;
}

function startOfDayIso(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value.toISOString();
}

function endOfDayIso(date) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value.toISOString();
}

export default function AdminKalendarPage() {
  const [settings, setSettings] = useState({
    workdayStart: "09:00",
    workdayEnd: "20:00",
    slotMinutes: 15,
  });
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [bookings, setBookings] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [statusDraft, setStatusDraft] = useState("pending");
  const [notesDraft, setNotesDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const slotTimes = useMemo(() => {
    const start = timeToMinutes(settings.workdayStart || "09:00");
    const end = timeToMinutes(settings.workdayEnd || "20:00");
    const step = Math.max(5, Number(settings.slotMinutes) || 15);
    const values = [];

    for (let cursor = start; cursor < end; cursor += step) {
      values.push(minutesToTime(cursor));
    }
    return values;
  }, [settings]);

  const selectedBooking = useMemo(
    () => bookings.find((item) => item.id === selectedId) || null,
    [bookings, selectedId]
  );

  const calendarItems = useMemo(() => {
    const openMinutes = timeToMinutes(settings.workdayStart || "09:00");
    const slotStep = Math.max(5, Number(settings.slotMinutes) || 15);

    return bookings
      .map((booking) => {
        const start = new Date(booking.startsAt);
        const dayIndex = (start.getDay() + 6) % 7;
        const startMinutes = start.getHours() * 60 + start.getMinutes();
        const startRow = Math.max(0, Math.floor((startMinutes - openMinutes) / slotStep));
        const span = Math.max(
          1,
          Math.ceil((Number(booking.totalDurationMin) || slotStep) / slotStep)
        );

        if (dayIndex < 0 || dayIndex > 6) {
          return null;
        }

        return {
          ...booking,
          dayIndex,
          startRow,
          span,
          startLabel: toTimeLabel(start),
          endLabel: toTimeLabel(new Date(booking.endsAt)),
        };
      })
      .filter(Boolean);
  }, [bookings, settings]);

  useEffect(() => {
    async function loadSettings() {
      const response = await fetch("/api/admin/clinic-settings");
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Neuspesno ucitavanje settings.");
      }
      setSettings({
        workdayStart: data.data.workdayStart || "09:00",
        workdayEnd: data.data.workdayEnd || "20:00",
        slotMinutes: data.data.slotMinutes || 15,
      });
    }

    loadSettings().catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    async function loadWeekBookings() {
      setLoading(true);
      setError("");
      try {
        const from = startOfDayIso(weekStart);
        const to = endOfDayIso(addDays(weekStart, 6));
        const params = new URLSearchParams({ from, to });
        const response = await fetch(`/api/admin/bookings?${params.toString()}`);
        const data = await response.json();
        if (!response.ok || !data?.ok) {
          throw new Error(data?.message || "Neuspesno ucitavanje termina.");
        }
        setBookings(data.data || []);
      } catch (err) {
        setError(err.message || "Greska pri ucitavanju termina.");
      } finally {
        setLoading(false);
      }
    }

    loadWeekBookings();
  }, [weekStart]);

  useEffect(() => {
    if (!selectedBooking) {
      setStatusDraft("pending");
      setNotesDraft("");
      return;
    }

    setStatusDraft(selectedBooking.status || "pending");
    setNotesDraft(selectedBooking.notes || "");
  }, [selectedBooking]);

  async function refreshWeek() {
    const from = startOfDayIso(weekStart);
    const to = endOfDayIso(addDays(weekStart, 6));
    const params = new URLSearchParams({ from, to });
    const response = await fetch(`/api/admin/bookings?${params.toString()}`);
    const data = await response.json();
    if (!response.ok || !data?.ok) {
      throw new Error(data?.message || "Neuspesno osvezavanje termina.");
    }
    setBookings(data.data || []);
  }

  async function saveBooking() {
    if (!selectedBooking) {
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedBooking.id,
          status: statusDraft,
          notes: notesDraft,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Neuspesno cuvanje.");
      }
      setMessage("Termin je azuriran.");
      await refreshWeek();
    } catch (err) {
      setError(err.message || "Greska pri cuvanju termina.");
    } finally {
      setSaving(false);
    }
  }

  async function completeBooking() {
    if (!selectedBooking) {
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(`/api/admin/bookings/${selectedBooking.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesDraft }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Neuspesno zavrsavanje termina.");
      }
      setMessage("Termin je oznacen kao zavrsen.");
      await refreshWeek();
    } catch (err) {
      setError(err.message || "Greska pri zavrsavanju termina.");
    } finally {
      setSaving(false);
    }
  }

  const bookingCount = bookings.length;
  const confirmedCount = bookings.filter((item) => item.status === "confirmed").length;
  const pendingCount = bookings.filter((item) => item.status === "pending").length;
  const weekLabel = `${fmtDateLabel(weekDays[0])} - ${fmtDateLabel(weekDays[6])}`;

  return (
    <section className="admin-calendar-page">
      <div className="admin-card admin-calendar-toolbar">
        <div>
          <h2 style={{ marginTop: 0, marginBottom: 4 }}>Admin kalendar</h2>
          <p style={{ margin: 0, color: "#bed0e8" }}>
            {weekLabel} | ukupno: {bookingCount} | potvrdjeni: {confirmedCount} | na cekanju:{" "}
            {pendingCount}
          </p>
        </div>
        <div className="admin-calendar-toolbar-actions">
          <button
            type="button"
            className="admin-template-link-btn"
            onClick={() => setWeekStart((prev) => addDays(prev, -7))}
          >
            Prethodna nedelja
          </button>
          <button
            type="button"
            className="admin-template-link-btn"
            onClick={() => setWeekStart(getMonday(new Date()))}
          >
            Tekuca nedelja
          </button>
          <button
            type="button"
            className="admin-template-link-btn"
            onClick={() => setWeekStart((prev) => addDays(prev, 7))}
          >
            Sledeca nedelja
          </button>
          <input
            type="date"
            value={toDateInput(weekStart)}
            onChange={(event) => setWeekStart(getMonday(new Date(`${event.target.value}T12:00:00`)))}
            className="admin-inline-input"
          />
        </div>
      </div>

      {message ? <p style={{ color: "#9be39f" }}>{message}</p> : null}
      {error ? <p style={{ color: "#ffabab" }}>{error}</p> : null}

      <div className="admin-calendar-layout">
        <div className="admin-card admin-calendar-grid-wrap">
          <div
            className="admin-calendar-grid"
            style={{ "--slot-count": slotTimes.length }}
            aria-busy={loading ? "true" : "false"}
          >
            <div className="admin-calendar-corner" />
            {weekDays.map((day, dayIndex) => (
              <div key={`head-${dayIndex}`} className="admin-calendar-day-head">
                <strong>{day.toLocaleDateString("sr-RS", { weekday: "short" })}</strong>
                <span>{day.toLocaleDateString("sr-RS", { day: "2-digit", month: "2-digit" })}</span>
              </div>
            ))}

            {slotTimes.map((slot, rowIndex) => (
              <div key={`time-${slot}`} className="admin-calendar-time">
                {slot}
              </div>
            ))}

            {slotTimes.map((slot, rowIndex) =>
              weekDays.map((day, dayIndex) => (
                <div
                  key={`cell-${rowIndex}-${dayIndex}`}
                  className={`admin-calendar-cell ${dayIndex >= 5 ? "is-weekend" : ""}`}
                />
              ))
            )}

            {calendarItems.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`admin-calendar-item ${STATUS_CLASS[item.status] || ""} ${
                  selectedId === item.id ? "is-selected" : ""
                }`}
                style={{
                  gridColumn: item.dayIndex + 2,
                  gridRow: `${item.startRow + 2} / span ${item.span}`,
                }}
                onClick={() => setSelectedId(item.id)}
                title={`${item.clientName || "Klijent"} | ${item.startLabel}-${item.endLabel}`}
              >
                <strong>{item.clientName || "Klijent"}</strong>
                <span>
                  {item.startLabel} - {item.endLabel}
                </span>
                <span>{item.serviceSummary || "Tretman"}</span>
              </button>
            ))}
          </div>
        </div>

        <aside className="admin-card admin-calendar-side">
          <h3 style={{ marginTop: 0 }}>Detalji termina</h3>

          {!selectedBooking ? (
            <p style={{ color: "#bed0e8" }}>Izaberite termin u kalendaru.</p>
          ) : (
            <div className="admin-calendar-details">
              <div>
                <span>Klijent</span>
                <strong>{selectedBooking.clientName || "Nepoznato"}</strong>
              </div>
              <div>
                <span>Email</span>
                <strong>{selectedBooking.clientEmail || "-"}</strong>
              </div>
              <div>
                <span>Telefon</span>
                <strong>{selectedBooking.clientPhone || "-"}</strong>
              </div>
              <div>
                <span>Termin</span>
                <strong>{new Date(selectedBooking.startsAt).toLocaleString("sr-RS")}</strong>
              </div>
              <div>
                <span>Trajanje</span>
                <strong>{selectedBooking.totalDurationMin} min</strong>
              </div>
              <div>
                <span>Cena</span>
                <strong>{selectedBooking.totalPriceRsd} RSD</strong>
              </div>
              <div>
                <span>Usluge</span>
                <strong>{selectedBooking.serviceSummary || "-"}</strong>
              </div>

              <label>
                Status
                <select
                  className="admin-inline-input"
                  value={statusDraft}
                  onChange={(event) => setStatusDraft(event.target.value)}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Napomena
                <textarea
                  className="admin-inline-textarea"
                  rows={4}
                  value={notesDraft}
                  onChange={(event) => setNotesDraft(event.target.value)}
                />
              </label>

              <div className="admin-calendar-detail-actions">
                <button
                  type="button"
                  className="admin-template-link-btn"
                  disabled={saving}
                  onClick={saveBooking}
                >
                  Sacuvaj izmenu
                </button>
                <button
                  type="button"
                  className="admin-template-link-btn"
                  disabled={saving}
                  onClick={completeBooking}
                >
                  Oznaci kao zavrsen
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
