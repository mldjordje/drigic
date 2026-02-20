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

function makeIso(dateValue, timeValue) {
  return new Date(`${dateValue}T${timeValue}:00`).toISOString();
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

export default function AdminKalendarPage() {
  const [settings, setSettings] = useState({
    workdayStart: "09:00",
    workdayEnd: "20:00",
    slotMinutes: 15,
  });
  const [services, setServices] = useState([]);
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [bookings, setBookings] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activePanel, setActivePanel] = useState("details");
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [slotSelection, setSlotSelection] = useState(null);

  const [statusDraft, setStatusDraft] = useState("pending");
  const [notesDraft, setNotesDraft] = useState("");

  const [manualForm, setManualForm] = useState({
    clientName: "",
    email: "",
    phone: "",
    date: toDateInput(new Date()),
    time: "10:00",
    notes: "",
    status: "confirmed",
    serviceIds: [],
  });

  const [blockForm, setBlockForm] = useState({
    date: toDateInput(new Date()),
    time: "10:00",
    durationMin: 60,
    note: "",
  });

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

  const selectedBooking = useMemo(() => {
    if (!selectedItem || selectedItem.type !== "booking") {
      return null;
    }
    return bookings.find((item) => item.id === selectedItem.id) || null;
  }, [bookings, selectedItem]);

  const selectedBlock = useMemo(() => {
    if (!selectedItem || selectedItem.type !== "block") {
      return null;
    }
    return blocks.find((item) => item.id === selectedItem.id) || null;
  }, [blocks, selectedItem]);

  const calendarItems = useMemo(() => {
    const openMinutes = timeToMinutes(settings.workdayStart || "09:00");
    const slotStep = Math.max(5, Number(settings.slotMinutes) || 15);

    const bookingItems = bookings
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
          id: booking.id,
          type: "booking",
          status: booking.status,
          title: booking.clientName || "Klijent",
          subtitle: booking.serviceSummary || "Tretman",
          dayIndex,
          startRow,
          span,
          startLabel: toTimeLabel(start),
          endLabel: toTimeLabel(new Date(booking.endsAt)),
        };
      })
      .filter(Boolean);

    const blockItems = blocks
      .map((block) => {
        const start = new Date(block.startsAt);
        const dayIndex = (start.getDay() + 6) % 7;
        const startMinutes = start.getHours() * 60 + start.getMinutes();
        const startRow = Math.max(0, Math.floor((startMinutes - openMinutes) / slotStep));
        const duration = Number(block.durationMin) || slotStep;
        const span = Math.max(1, Math.ceil(duration / slotStep));

        if (dayIndex < 0 || dayIndex > 6) {
          return null;
        }

        return {
          id: block.id,
          type: "block",
          title: "Blokiran termin",
          subtitle: block.note || "Nedostupno",
          dayIndex,
          startRow,
          span,
          startLabel: toTimeLabel(start),
          endLabel: toTimeLabel(new Date(block.endsAt)),
        };
      })
      .filter(Boolean);

    return [...bookingItems, ...blockItems];
  }, [bookings, blocks, settings]);

  useEffect(() => {
    async function loadInitialData() {
      const [settingsRes, servicesRes] = await Promise.all([
        fetch("/api/admin/clinic-settings"),
        fetch("/api/services"),
      ]);

      const settingsData = await parseResponse(settingsRes);
      const servicesData = await parseResponse(servicesRes);

      if (!settingsRes.ok || !settingsData?.ok) {
        throw new Error(settingsData?.message || "Neuspesno ucitavanje settings.");
      }
      if (!servicesRes.ok || !servicesData?.ok) {
        throw new Error(servicesData?.message || "Neuspesno ucitavanje usluga.");
      }

      setSettings({
        workdayStart: settingsData.data.workdayStart || "09:00",
        workdayEnd: settingsData.data.workdayEnd || "20:00",
        slotMinutes: settingsData.data.slotMinutes || 15,
      });
      setServices(servicesData.categories || []);
    }

    loadInitialData().catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    setManualForm((prev) => ({
      ...prev,
      date: prev.date || toDateInput(weekStart),
      time: prev.time || settings.workdayStart,
    }));
    setBlockForm((prev) => ({
      ...prev,
      date: prev.date || toDateInput(weekStart),
      time: prev.time || settings.workdayStart,
    }));
  }, [weekStart, settings.workdayStart]);

  useEffect(() => {
    async function loadWeekData() {
      setLoading(true);
      setError("");
      try {
        const from = startOfDayIso(weekStart);
        const to = endOfDayIso(addDays(weekStart, 6));
        const params = new URLSearchParams({ from, to });

        const [bookingRes, blockRes] = await Promise.all([
          fetch(`/api/admin/bookings?${params.toString()}`),
          fetch(`/api/admin/blocks?${params.toString()}`),
        ]);

        const bookingData = await parseResponse(bookingRes);
        const blockData = await parseResponse(blockRes);

        if (!bookingRes.ok || !bookingData?.ok) {
          throw new Error(bookingData?.message || "Neuspesno ucitavanje termina.");
        }
        if (!blockRes.ok || !blockData?.ok) {
          throw new Error(blockData?.message || "Neuspesno ucitavanje blokada.");
        }

        setBookings(bookingData.data || []);
        setBlocks(blockData.data || []);
      } catch (err) {
        setError(err.message || "Greska pri ucitavanju kalendara.");
      } finally {
        setLoading(false);
      }
    }

    loadWeekData();
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
    const [bookingRes, blockRes] = await Promise.all([
      fetch(`/api/admin/bookings?${params.toString()}`),
      fetch(`/api/admin/blocks?${params.toString()}`),
    ]);

    const bookingData = await parseResponse(bookingRes);
    const blockData = await parseResponse(blockRes);

    if (!bookingRes.ok || !bookingData?.ok) {
      throw new Error(bookingData?.message || "Neuspesno osvezavanje termina.");
    }
    if (!blockRes.ok || !blockData?.ok) {
      throw new Error(blockData?.message || "Neuspesno osvezavanje blokada.");
    }

    setBookings(bookingData.data || []);
    setBlocks(blockData.data || []);
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
      const data = await parseResponse(response);
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
      const data = await parseResponse(response);
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

  async function createManualBooking(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: manualForm.clientName,
          email: manualForm.email || undefined,
          phone: manualForm.phone || undefined,
          serviceIds: manualForm.serviceIds,
          startAt: makeIso(manualForm.date, manualForm.time),
          notes: manualForm.notes || undefined,
          status: manualForm.status,
        }),
      });

      const data = await parseResponse(response);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Neuspesno kreiranje termina.");
      }

      setMessage("Termin je uspesno dodat iz admin kalendara.");
      setActivePanel("details");
      setSelectedItem({ type: "booking", id: data.data.id });
      await refreshWeek();
    } catch (err) {
      setError(err.message || "Greska pri kreiranju termina.");
    } finally {
      setSaving(false);
    }
  }

  async function createBlock(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startsAt: makeIso(blockForm.date, blockForm.time),
          durationMin: Number(blockForm.durationMin),
          note: blockForm.note || undefined,
        }),
      });

      const data = await parseResponse(response);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Neuspesno kreiranje blokade.");
      }

      setMessage("Blokada je uspesno dodata.");
      setActivePanel("details");
      setSelectedItem({ type: "block", id: data.data.id });
      await refreshWeek();
    } catch (err) {
      setError(err.message || "Greska pri kreiranju blokade.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteBlock() {
    if (!selectedBlock) {
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`/api/admin/blocks/${selectedBlock.id}`, {
        method: "DELETE",
      });
      const data = await parseResponse(response);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Neuspesno brisanje blokade.");
      }

      setSelectedItem(null);
      setMessage("Blokada je obrisana.");
      await refreshWeek();
    } catch (err) {
      setError(err.message || "Greska pri brisanju blokade.");
    } finally {
      setSaving(false);
    }
  }

  const bookingCount = bookings.length;
  const blockCount = blocks.length;
  const confirmedCount = bookings.filter((item) => item.status === "confirmed").length;
  const pendingCount = bookings.filter((item) => item.status === "pending").length;
  const weekLabel = `${fmtDateLabel(weekDays[0])} - ${fmtDateLabel(weekDays[6])}`;

  function handleSlotSelect(dateValue, timeValue, existingItem = null) {
    setSlotSelection({ date: dateValue, time: timeValue });
    setManualForm((prev) => ({ ...prev, date: dateValue, time: timeValue }));
    setBlockForm((prev) => ({ ...prev, date: dateValue, time: timeValue }));
    setMessage("");
    setError("");

    if (existingItem) {
      setSelectedItem({ type: existingItem.type, id: existingItem.id });
      setActivePanel("details");
    } else {
      setSelectedItem(null);
      setActivePanel("new");
    }

    setIsSlotModalOpen(true);
  }

  return (
    <section className="admin-calendar-page">
      <div className="admin-card admin-calendar-toolbar">
        <div>
          <h2 style={{ marginTop: 0, marginBottom: 4 }}>Admin kalendar</h2>
          <p style={{ margin: 0, color: "#bed0e8" }}>
            {weekLabel} | termini: {bookingCount} | blokade: {blockCount} | potvrdjeni: {confirmedCount} | na cekanju: {pendingCount}
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

      <div className="admin-calendar-layout admin-calendar-layout--single">
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

            {slotTimes.map((slot) => (
              <div key={`time-${slot}`} className="admin-calendar-time">
                {slot}
              </div>
            ))}

            {slotTimes.map((slot, rowIndex) =>
              weekDays.map((day, dayIndex) => {
                const dateValue = toDateInput(day);
                const existingItem = calendarItems.find(
                  (item) =>
                    item.dayIndex === dayIndex &&
                    rowIndex >= item.startRow &&
                    rowIndex < item.startRow + item.span
                );

                return (
                  <button
                    type="button"
                    key={`cell-${rowIndex}-${dayIndex}`}
                    className={`admin-calendar-cell admin-calendar-cell-btn ${
                      dayIndex >= 5 ? "is-weekend" : ""
                    }`}
                    onClick={() => handleSlotSelect(dateValue, slot, existingItem)}
                    title={`${dateValue} ${slot}`}
                  />
                );
              })
            )}

            {calendarItems.map((item) => (
              <button
                type="button"
                key={`${item.type}-${item.id}`}
                className={`admin-calendar-item ${
                  item.type === "booking" ? STATUS_CLASS[item.status] || "" : "is-block"
                } ${
                  selectedItem && selectedItem.id === item.id && selectedItem.type === item.type
                    ? "is-selected"
                    : ""
                }`}
                style={{
                  gridColumn: item.dayIndex + 2,
                  gridRow: `${item.startRow + 2} / span ${item.span}`,
                }}
                onClick={() => {
                  setSelectedItem({ type: item.type, id: item.id });
                  setActivePanel("details");
                  setIsSlotModalOpen(true);
                }}
                title={`${item.title} | ${item.startLabel}-${item.endLabel}`}
              >
                <strong>{item.title}</strong>
                <span>
                  {item.startLabel} - {item.endLabel}
                </span>
                <span>{item.subtitle}</span>
              </button>
            ))}
          </div>
        </div>

        {isSlotModalOpen ? (
          <div className="admin-calendar-modal" role="dialog" aria-modal="true">
            <div className="admin-calendar-modal-backdrop" onClick={() => setIsSlotModalOpen(false)} />
            <div className="admin-card admin-calendar-modal-card">
              <div className="admin-calendar-modal-head">
                <div>
                  <h3 style={{ margin: 0 }}>Akcije termina</h3>
                  {slotSelection ? (
                    <p style={{ margin: "4px 0 0", color: "#bed0e8" }}>
                      {slotSelection.date} {slotSelection.time}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="admin-template-link-btn"
                  onClick={() => setIsSlotModalOpen(false)}
                >
                  Zatvori
                </button>
              </div>

              <div className="admin-calendar-tabs">
                <button
                  type="button"
                  className={`admin-template-link-btn ${activePanel === "details" ? "is-active" : ""}`}
                  onClick={() => setActivePanel("details")}
                >
                  Detalji
                </button>
                <button
                  type="button"
                  className={`admin-template-link-btn ${activePanel === "new" ? "is-active" : ""}`}
                  onClick={() => setActivePanel("new")}
                >
                  Novi termin
                </button>
                <button
                  type="button"
                  className={`admin-template-link-btn ${activePanel === "block" ? "is-active" : ""}`}
                  onClick={() => setActivePanel("block")}
                >
                  Blokiraj
                </button>
              </div>

              {activePanel === "details" ? (
                <>
                  {!selectedBooking && !selectedBlock ? (
                    <p style={{ color: "#bed0e8", marginTop: 12 }}>
                      Izaberite postojeci termin/blokadu ili kreirajte novi.
                    </p>
                  ) : null}

                  {selectedBooking ? (
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
                  ) : null}

                  {selectedBlock ? (
                    <div className="admin-calendar-details">
                      <div>
                        <span>Blokada</span>
                        <strong>{new Date(selectedBlock.startsAt).toLocaleString("sr-RS")}</strong>
                      </div>
                      <div>
                        <span>Trajanje</span>
                        <strong>{selectedBlock.durationMin} min</strong>
                      </div>
                      <div>
                        <span>Napomena</span>
                        <strong>{selectedBlock.note || "-"}</strong>
                      </div>
                      <div className="admin-calendar-detail-actions">
                        <button
                          type="button"
                          className="admin-template-link-btn"
                          disabled={saving}
                          onClick={deleteBlock}
                        >
                          Obrisi blokadu
                        </button>
                      </div>
                    </div>
                  ) : null}
                </>
              ) : null}

              {activePanel === "new" ? (
                <>
                  <h3 style={{ marginTop: 12 }}>Novi termin</h3>
                  <form onSubmit={createManualBooking} style={{ display: "grid", gap: 8 }}>
                    <input
                      className="admin-inline-input"
                      placeholder="Ime i prezime"
                      value={manualForm.clientName}
                      onChange={(event) =>
                        setManualForm((prev) => ({ ...prev, clientName: event.target.value }))
                      }
                      required
                    />
                    <input
                      className="admin-inline-input"
                      placeholder="Email (opciono)"
                      value={manualForm.email}
                      onChange={(event) => setManualForm((prev) => ({ ...prev, email: event.target.value }))}
                    />
                    <input
                      className="admin-inline-input"
                      placeholder="Telefon (opciono)"
                      value={manualForm.phone}
                      onChange={(event) => setManualForm((prev) => ({ ...prev, phone: event.target.value }))}
                    />
                    <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr" }}>
                      <input
                        type="date"
                        className="admin-inline-input"
                        value={manualForm.date}
                        onChange={(event) => setManualForm((prev) => ({ ...prev, date: event.target.value }))}
                        required
                      />
                      <input
                        type="time"
                        className="admin-inline-input"
                        value={manualForm.time}
                        onChange={(event) => setManualForm((prev) => ({ ...prev, time: event.target.value }))}
                        required
                      />
                    </div>
                    <select
                      className="admin-inline-input"
                      value={manualForm.status}
                      onChange={(event) => setManualForm((prev) => ({ ...prev, status: event.target.value }))}
                    >
                      <option value="confirmed">Potvrdjen</option>
                      <option value="pending">Na cekanju</option>
                    </select>

                    <div className="admin-calendar-service-list">
                      {services.map((category) => (
                        <div key={category.id} className="admin-calendar-service-group">
                          <strong>{category.name}</strong>
                          <div>
                            {(category.services || []).map((service) => (
                              <label key={service.id} className="admin-calendar-service-option">
                                <input
                                  type="checkbox"
                                  checked={manualForm.serviceIds.includes(service.id)}
                                  onChange={(event) => {
                                    if (event.target.checked) {
                                      setManualForm((prev) => ({
                                        ...prev,
                                        serviceIds: prev.serviceIds.includes(service.id)
                                          ? prev.serviceIds
                                          : [...prev.serviceIds, service.id],
                                      }));
                                    } else {
                                      setManualForm((prev) => ({
                                        ...prev,
                                        serviceIds: prev.serviceIds.filter((id) => id !== service.id),
                                      }));
                                    }
                                  }}
                                />
                                <span>
                                  {service.name} ({service.durationMin}m)
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <textarea
                      className="admin-inline-textarea"
                      rows={3}
                      placeholder="Napomena"
                      value={manualForm.notes}
                      onChange={(event) => setManualForm((prev) => ({ ...prev, notes: event.target.value }))}
                    />

                    <button type="submit" className="admin-template-link-btn" disabled={saving}>
                      Kreiraj termin
                    </button>
                  </form>
                </>
              ) : null}

              {activePanel === "block" ? (
                <>
                  <h3 style={{ marginTop: 12 }}>Blokiraj termin</h3>
                  <form onSubmit={createBlock} style={{ display: "grid", gap: 8 }}>
                    <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr" }}>
                      <input
                        type="date"
                        className="admin-inline-input"
                        value={blockForm.date}
                        onChange={(event) => setBlockForm((prev) => ({ ...prev, date: event.target.value }))}
                        required
                      />
                      <input
                        type="time"
                        className="admin-inline-input"
                        value={blockForm.time}
                        onChange={(event) => setBlockForm((prev) => ({ ...prev, time: event.target.value }))}
                        required
                      />
                    </div>
                    <input
                      type="number"
                      min={5}
                      max={720}
                      className="admin-inline-input"
                      value={blockForm.durationMin}
                      onChange={(event) =>
                        setBlockForm((prev) => ({ ...prev, durationMin: event.target.value }))
                      }
                      placeholder="Trajanje (min)"
                      required
                    />
                    <textarea
                      className="admin-inline-textarea"
                      rows={3}
                      placeholder="Napomena"
                      value={blockForm.note}
                      onChange={(event) => setBlockForm((prev) => ({ ...prev, note: event.target.value }))}
                    />
                    <button type="submit" className="admin-template-link-btn" disabled={saving}>
                      Sacuvaj blokadu
                    </button>
                  </form>
                </>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
