"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

const STATUS_LABEL = {
  pending: "Na čekanju",
  confirmed: "Potvrđen",
  cancelled: "Otkazan",
  no_show: "No-show",
  completed: "Završen",
};
const MORNING_SCROLL_TIME = "08:00:00";
const DEFAULT_AFTERNOON_SCROLL_TIME = "15:45:00";

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

function toLocalInputValue(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return adjusted.toISOString().slice(0, 16);
}

function toIsoFromLocalInput(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

function endFromStart(startIso, durationMin) {
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) {
    return null;
  }
  return new Date(start.getTime() + durationMin * 60000).toISOString();
}

function fmtDateTime(value) {
  return new Date(value).toLocaleString("sr-RS");
}

function normalizeSlotStart(value) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const day = new Date(`${value}T12:00:00Z`).getUTCDay();
    if (day === 6) {
      return `${value}T10:00`;
    }
    return `${value}T16:00`;
  }
  return value;
}

function getInitialCalendarDate() {
  const today = new Date();

  if (today.getDay() !== 0) {
    return today;
  }

  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + 1);
  nextMonday.setHours(12, 0, 0, 0);
  return nextMonday;
}

export default function AdminKalendarPage() {
  const calendarRef = useRef(null);
  const touchStartRef = useRef(null);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [range, setRange] = useState({ from: "", to: "" });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [bookings, setBookings] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [events, setEvents] = useState([]);
  const [services, setServices] = useState([]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createType, setCreateType] = useState("booking");
  const [bookingForm, setBookingForm] = useState({
    clientName: "",
    email: "",
    phone: "",
    startAtLocal: "",
    serviceIds: [],
    status: "confirmed",
    notes: "",
  });
  const [blockForm, setBlockForm] = useState({
    startAtLocal: "",
    durationMin: 60,
    note: "",
  });

  const [activeEvent, setActiveEvent] = useState(null);
  const [statusDraft, setStatusDraft] = useState("pending");
  const [notesDraft, setNotesDraft] = useState("");
  const [pendingEditStartLocal, setPendingEditStartLocal] = useState("");
  const [pendingEditServiceIds, setPendingEditServiceIds] = useState([]);
  const [showClientDetails, setShowClientDetails] = useState(false);
  const [clientDetailsLoading, setClientDetailsLoading] = useState(false);
  const [clientDetailsError, setClientDetailsError] = useState("");
  const [clientDetailsPayload, setClientDetailsPayload] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const media = window.matchMedia("(max-width: 960px)");
    const update = () => setIsMobileViewport(media.matches);
    update();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }

    media.addListener(update);
    return () => media.removeListener(update);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }
    const lockScroll = isCreateModalOpen || Boolean(activeEvent);
    if (!lockScroll) {
      return undefined;
    }
    const html = document.documentElement;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, [isCreateModalOpen, activeEvent]);

  const bookingById = useMemo(() => {
    const map = new Map();
    bookings.forEach((item) => map.set(item.id, item));
    return map;
  }, [bookings]);

  const blockById = useMemo(() => {
    const map = new Map();
    blocks.forEach((item) => map.set(item.id, item));
    return map;
  }, [blocks]);

  useEffect(() => {
    if (activeEvent?.kind === "booking" && !bookingById.has(activeEvent.refId)) {
      setActiveEvent(null);
    }
  }, [activeEvent, bookingById]);

  const allServices = useMemo(() => {
    return services.flatMap((category) => category.services || []);
  }, [services]);
  const initialCalendarDate = useMemo(() => getInitialCalendarDate(), []);

  async function loadServices() {
    const response = await fetch("/api/services");
    const data = await parseResponse(response);
    if (!response.ok || !data?.ok) {
      throw new Error(data?.message || "Neuspešno učitavanje usluga.");
    }
    setServices(data.categories || []);
  }

  useEffect(() => {
    loadServices().catch((err) => setError(err.message || "Greška pri učitavanju usluga."));
  }, []);

  async function loadCalendarData(fromIso, toIso) {
    if (!fromIso || !toIso) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ from: fromIso, to: toIso });
      const [bookingsRes, blocksRes] = await Promise.all([
        fetch(`/api/admin/bookings?${params.toString()}`),
        fetch(`/api/admin/blocks?${params.toString()}`),
      ]);

      const bookingsData = await parseResponse(bookingsRes);
      const blocksData = await parseResponse(blocksRes);

      if (!bookingsRes.ok || !bookingsData?.ok) {
        throw new Error(bookingsData?.message || "Neuspešno učitavanje termina.");
      }
      if (!blocksRes.ok || !blocksData?.ok) {
        throw new Error(blocksData?.message || "Neuspešno učitavanje blokada.");
      }

      const bookingsList = (bookingsData.data || []).filter(
        (item) => item.status !== "cancelled"
      );
      const blocksList = blocksData.data || [];
      setBookings(bookingsList);
      setBlocks(blocksList);

      const bookingEvents = bookingsList.map((item) => ({
        id: `booking:${item.id}`,
        title: item.clientName || "Klijent",
        start: item.startsAt,
        end: item.endsAt,
        classNames: ["clinic-fc-event", `is-${item.status || "pending"}`],
        extendedProps: {
          kind: "booking",
          refId: item.id,
          subtitle: item.serviceSummary || "",
          status: item.status || "pending",
          serviceColor: item.primaryServiceColor || null,
        },
      }));

      const blockEvents = blocksList.map((item) => ({
        id: `block:${item.id}`,
        title: "Blokiran termin",
        start: item.startsAt,
        end: item.endsAt,
        classNames: ["clinic-fc-event", "is-block"],
        extendedProps: {
          kind: "block",
          refId: item.id,
          subtitle: item.note || "",
        },
      }));

      setEvents([...bookingEvents, ...blockEvents]);
    } catch (loadError) {
      setError(loadError.message || "Greška pri učitavanju kalendara.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (range.from && range.to) {
      loadCalendarData(range.from, range.to);
    }
  }, [range.from, range.to]);

  function openCreateModal(startIso) {
    const localValue = toLocalInputValue(normalizeSlotStart(startIso));
    setCreateType("booking");
    setBookingForm((prev) => ({
      ...prev,
      startAtLocal: localValue,
    }));
    setBlockForm((prev) => ({
      ...prev,
      startAtLocal: localValue,
    }));
    setMessage("");
    setError("");
    setIsCreateModalOpen(true);
  }

  function handleDateClick(info) {
    openCreateModal(info.dateStr);
  }

  function handleSelect(info) {
    openCreateModal(info.startStr);
  }

  function handleEventClick(info) {
    const { kind, refId } = info.event.extendedProps || {};
    if (!kind || !refId) {
      return;
    }
    setMessage("");
    setError("");
    setShowClientDetails(false);
    setClientDetailsLoading(false);
    setClientDetailsError("");
    setClientDetailsPayload(null);
    setActiveEvent({ kind, refId });
    if (kind === "booking") {
      const booking = bookingById.get(refId);
      setStatusDraft(booking?.status || "pending");
      setNotesDraft(booking?.notes || "");
    }
  }

  async function refreshData() {
    if (range.from && range.to) {
      await loadCalendarData(range.from, range.to);
    }
  }

  async function createBooking() {
    const startAt = toIsoFromLocalInput(bookingForm.startAtLocal);
    if (!startAt) {
      setError("Datum i vreme termina nisu validni.");
      return;
    }
    if (!bookingForm.serviceIds.length) {
      setError("Izaberite barem jednu uslugu.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: bookingForm.clientName,
          email: bookingForm.email || undefined,
          phone: bookingForm.phone || undefined,
          serviceIds: bookingForm.serviceIds,
          startAt,
          notes: bookingForm.notes || undefined,
          status: bookingForm.status,
        }),
      });

      const data = await parseResponse(response);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Neuspešno kreiranje termina.");
      }

      setMessage("Termin je uspešno dodat.");
      setIsCreateModalOpen(false);
      await refreshData();
    } catch (saveError) {
      setError(saveError.message || "Greška pri kreiranju termina.");
    } finally {
      setSaving(false);
    }
  }

  async function createBlock() {
    const startAt = toIsoFromLocalInput(blockForm.startAtLocal);
    if (!startAt) {
      setError("Datum i vreme blokade nisu validni.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startsAt: startAt,
          durationMin: Number(blockForm.durationMin),
          note: blockForm.note || undefined,
        }),
      });

      const data = await parseResponse(response);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Neuspešno kreiranje blokade.");
      }

      setMessage("Blokada je uspešno dodata.");
      setIsCreateModalOpen(false);
      await refreshData();
    } catch (saveError) {
      setError(saveError.message || "Greška pri kreiranju blokade.");
    } finally {
      setSaving(false);
    }
  }

  async function saveBookingDetails() {
    if (!activeEvent || activeEvent.kind !== "booking") {
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeEvent.refId,
          notes: notesDraft,
        }),
      });
      const data = await parseResponse(response);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Neuspešno čuvanje izmene.");
      }
      setMessage("Termin je ažuriran.");
      await refreshData();
    } catch (saveError) {
      setError(saveError.message || "Greška pri čuvanju termina.");
    } finally {
      setSaving(false);
    }
  }

  async function savePendingBookingReschedule() {
    if (!activeEvent || activeEvent.kind !== "booking") {
      return;
    }
    const startAt = toIsoFromLocalInput(pendingEditStartLocal);
    if (!startAt) {
      setError("Datum i vreme termina nisu validni.");
      return;
    }
    if (!pendingEditServiceIds.length) {
      setError("Izaberite barem jednu uslugu.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeEvent.refId,
          startAt,
          serviceIds: pendingEditServiceIds,
          notes: notesDraft,
        }),
      });
      const data = await parseResponse(response);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Neuspešna izmena termina.");
      }
      setMessage("Termin je ažuriran. Klijent dobija mejl kada se promene datum, vreme ili usluge.");
      await refreshData();
    } catch (saveError) {
      setError(saveError.message || "Greška pri izmeni termina.");
    } finally {
      setSaving(false);
    }
  }

  async function changeActiveBookingStatus(nextStatus) {
    if (!activeEvent || activeEvent.kind !== "booking") {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeEvent.refId,
          status: nextStatus,
          notes: notesDraft,
        }),
      });
      const data = await parseResponse(response);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Neuspešna izmena statusa.");
      }
      setStatusDraft(nextStatus);
      setMessage("Status termina je ažuriran.");
      await refreshData();
    } catch (saveError) {
      setError(saveError.message || "Greška pri izmeni statusa.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteBlock() {
    if (!activeEvent || activeEvent.kind !== "block") {
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/admin/blocks/${activeEvent.refId}`, {
        method: "DELETE",
      });
      const data = await parseResponse(response);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Neuspešno brisanje blokade.");
      }
      setMessage("Blokada je obrisana.");
      setActiveEvent(null);
      await refreshData();
    } catch (saveError) {
      setError(saveError.message || "Greška pri brisanju blokade.");
    } finally {
      setSaving(false);
    }
  }

  function closeActiveEvent() {
    setActiveEvent(null);
    setShowClientDetails(false);
    setClientDetailsLoading(false);
    setClientDetailsError("");
    setClientDetailsPayload(null);
  }

  async function openClientDetailsPanel(userId) {
    if (!userId) {
      return;
    }

    setShowClientDetails(true);
    setClientDetailsLoading(true);
    setClientDetailsError("");
    setClientDetailsPayload(null);

    try {
      const [clientRes, beautyPassRes] = await Promise.all([
        fetch(`/api/admin/clients/${userId}`),
        fetch(`/api/admin/clients/${userId}/beauty-pass`),
      ]);
      const [clientData, beautyPassData] = await Promise.all([
        parseResponse(clientRes),
        parseResponse(beautyPassRes),
      ]);

      if (!clientRes.ok || !clientData?.ok) {
        throw new Error(clientData?.message || "Neuspešno učitavanje klijenta.");
      }
      if (!beautyPassRes.ok || !beautyPassData?.ok) {
        throw new Error(beautyPassData?.message || "Neuspešno učitavanje beauty pass-a.");
      }

      setClientDetailsPayload({
        client: clientData.data || null,
        beautyPass: beautyPassData || null,
      });
    } catch (loadError) {
      setClientDetailsError(loadError.message || "Greška pri učitavanju klijenta.");
    } finally {
      setClientDetailsLoading(false);
    }
  }

  const activeBooking =
    activeEvent?.kind === "booking" ? bookingById.get(activeEvent.refId) : null;
  const activeBlock = activeEvent?.kind === "block" ? blockById.get(activeEvent.refId) : null;

  const pendingBookingServerKey = useMemo(() => {
    if (!activeBooking || activeBooking.status !== "pending") {
      return "";
    }
    return `${activeBooking.id}|${activeBooking.startsAt}|${(activeBooking.serviceIds || []).join(",")}`;
  }, [activeBooking]);

  useEffect(() => {
    if (activeEvent?.kind !== "booking" || !activeBooking || activeBooking.status !== "pending") {
      return;
    }
    setPendingEditStartLocal(toLocalInputValue(activeBooking.startsAt));
    setPendingEditServiceIds(activeBooking.serviceIds || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync when server data changes (pendingBookingServerKey), not on every activeBooking ref
  }, [activeEvent?.kind, activeEvent?.refId, pendingBookingServerKey]);

  const pendingEditDurationMin = useMemo(() => {
    if (!pendingEditServiceIds.length) {
      return 0;
    }
    return pendingEditServiceIds.reduce((sum, id) => {
      const svc = allServices.find((s) => s.id === id);
      return sum + (svc?.durationMin || 0);
    }, 0);
  }, [pendingEditServiceIds, allServices]);

  const stats = useMemo(() => {
    const pending = bookings.filter((item) => item.status === "pending").length;
    const confirmed = bookings.filter((item) => item.status === "confirmed").length;
    return {
      totalBookings: bookings.length,
      totalBlocks: blocks.length,
      pending,
      confirmed,
    };
  }, [bookings, blocks]);

  const toolbarRight = isMobileViewport
    ? "dayGridMonth,timeGridWeek,timeGridDay"
    : "dayGridMonth,timeGridWeek,timeGridDay";
  const quickStatusActionsByStatus = {
    pending: [
      { value: "confirmed", label: "Potvrdi" },
      { value: "cancelled", label: "Otkazi" },
      { value: "no_show", label: "No-show" },
    ],
    confirmed: [
      { value: "cancelled", label: "Otkazi" },
      { value: "no_show", label: "No-show" },
    ],
    cancelled: [],
    no_show: [],
    completed: [],
  };

  function navigateCalendar(direction) {
    const api = calendarRef.current?.getApi?.();
    if (!api) {
      return;
    }
    if (direction === "next") {
      api.next();
      return;
    }
    api.prev();
  }

  function scrollCalendarToTime(timeValue) {
    const api = calendarRef.current?.getApi?.();
    if (!api?.scrollToTime) {
      return;
    }
    api.scrollToTime(timeValue);
  }

  function handleTouchStart(event) {
    if (!isMobileViewport) {
      return;
    }
    const touch = event.changedTouches?.[0];
    if (!touch) {
      return;
    }
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  }

  function handleTouchEnd(event) {
    if (!isMobileViewport) {
      return;
    }

    const start = touchStartRef.current;
    const touch = event.changedTouches?.[0];
    touchStartRef.current = null;
    if (!start || !touch) {
      return;
    }

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    const elapsed = Date.now() - start.time;
    const horizontalDistance = Math.abs(deltaX);
    const verticalDistance = Math.abs(deltaY);

    if (elapsed > 650 || horizontalDistance < 44 || horizontalDistance < verticalDistance) {
      return;
    }

    if (deltaX < 0) {
      navigateCalendar("next");
      return;
    }

    navigateCalendar("prev");
  }

  return (
    <section className={`admin-calendar-page ${isMobileViewport ? "is-mobile-full" : ""}`}>
      <div className="admin-card admin-calendar-toolbar">
        <div>
          <h2 style={{ margin: 0 }}>Admin kalendar</h2>
          <p style={{ margin: "4px 0 0", color: "#bed0e8" }}>
            Termini: {stats.totalBookings} | Blokade: {stats.totalBlocks} | Potvrđeni:{" "}
            {stats.confirmed} | Na čekanju: {stats.pending}
          </p>
        </div>
        <div className="admin-calendar-toolbar-actions">
          <button
            type="button"
            className="admin-template-link-btn"
            onClick={() => scrollCalendarToTime(MORNING_SCROLL_TIME)}
          >
            Jutro
          </button>
          <button
            type="button"
            className="admin-template-link-btn"
            onClick={() => scrollCalendarToTime(DEFAULT_AFTERNOON_SCROLL_TIME)}
          >
            16h
          </button>
          <button
            type="button"
            className="admin-template-link-btn"
            onClick={() => openCreateModal(new Date().toISOString())}
          >
            Novi termin / blokada
          </button>
          <button
            type="button"
            className="admin-template-link-btn"
            onClick={() => refreshData()}
            disabled={loading}
          >
            Osveži
          </button>
        </div>
      </div>

      {message ? <p style={{ color: "#9be39f", margin: 0 }}>{message}</p> : null}
      {error ? <p style={{ color: "#ffabab", margin: 0 }}>{error}</p> : null}

      <div
        className={`admin-card clinic-fc-wrap ${isMobileViewport ? "is-mobile-stage" : ""}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <FullCalendar
          ref={calendarRef}
          key={isMobileViewport ? "mobile" : "desktop"}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          initialDate={initialCalendarDate}
          locale="sr"
          firstDay={1}
          hiddenDays={[]}
          allDaySlot={false}
          slotDuration="00:15:00"
          slotLabelInterval="00:15:00"
          slotLabelFormat={{
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }}
          dayHeaderFormat={{
            weekday: isMobileViewport ? "short" : "long",
            day: "2-digit",
            month: isMobileViewport ? "2-digit" : "long",
          }}
          slotMinTime="07:00:00"
          slotMaxTime="21:00:00"
          scrollTime={DEFAULT_AFTERNOON_SCROLL_TIME}
          scrollTimeReset={false}
          nowIndicator
          editable={false}
          selectable
          selectMirror
          select={handleSelect}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          datesSet={(info) =>
            setRange((prev) => {
              const nextRange = {
                from: info.start.toISOString(),
                to: info.end.toISOString(),
              };
              return prev.from === nextRange.from && prev.to === nextRange.to
                ? prev
                : nextRange;
            })
          }
          events={events}
          height="100%"
          expandRows={isMobileViewport}
          headerToolbar={{
            left: isMobileViewport ? "prev,next" : "prev,next today",
            center: "title",
            right: toolbarRight,
          }}
          buttonText={{
            today: "Danas",
            month: "Mesec",
            week: "Nedelja",
            day: "Dan",
          }}
          eventDidMount={(arg) => {
            const serviceColor = arg.event.extendedProps?.serviceColor;
            if (serviceColor) {
              arg.el.style.setProperty("--clinic-event-service-edge", serviceColor);
            } else {
              arg.el.style.removeProperty("--clinic-event-service-edge");
            }
          }}
          eventContent={(arg) => (
            <div className="clinic-fc-event-inner">
              <strong>{arg.event.title}</strong>
              {arg.event.extendedProps.subtitle ? <span>{arg.event.extendedProps.subtitle}</span> : null}
            </div>
          )}
        />
      </div>

      {isCreateModalOpen ? (
        <div className="admin-calendar-modal" role="dialog" aria-modal="true">
          <div className="admin-calendar-modal-backdrop" onClick={() => setIsCreateModalOpen(false)} />
          <div className="admin-card admin-calendar-modal-card">
            <div className="admin-calendar-modal-head">
              <h3 style={{ margin: 0 }}>Akcija na slotu</h3>
              <button
                type="button"
                className="admin-template-link-btn"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Zatvori
              </button>
            </div>

            <div className="admin-calendar-tabs">
              <button
                type="button"
                className={`admin-template-link-btn ${createType === "booking" ? "is-active" : ""}`}
                onClick={() => setCreateType("booking")}
              >
                Zakaži termin
              </button>
              <button
                type="button"
                className={`admin-template-link-btn ${createType === "block" ? "is-active" : ""}`}
                onClick={() => setCreateType("block")}
              >
                Blokiraj
              </button>
            </div>

            {createType === "booking" ? (
              <div className="admin-calendar-details" style={{ marginTop: 12 }}>
                <label>
                  Ime i prezime
                  <input
                    className="admin-inline-input"
                    value={bookingForm.clientName}
                    onChange={(event) =>
                      setBookingForm((prev) => ({ ...prev, clientName: event.target.value }))
                    }
                    required
                  />
                </label>
                <label>
                  Email (opciono)
                  <input
                    className="admin-inline-input"
                    type="email"
                    value={bookingForm.email}
                    onChange={(event) =>
                      setBookingForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Telefon (opciono)
                  <input
                    className="admin-inline-input"
                    value={bookingForm.phone}
                    onChange={(event) =>
                      setBookingForm((prev) => ({ ...prev, phone: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Datum i vreme
                  <input
                    type="datetime-local"
                    className="admin-inline-input"
                    value={bookingForm.startAtLocal}
                    onChange={(event) =>
                      setBookingForm((prev) => ({ ...prev, startAtLocal: event.target.value }))
                    }
                    required
                  />
                </label>
                <label>
                  Status
                  <select
                    className="admin-inline-input"
                    value={bookingForm.status}
                    onChange={(event) =>
                      setBookingForm((prev) => ({ ...prev, status: event.target.value }))
                    }
                  >
                    <option value="confirmed">Potvrđen</option>
                    <option value="pending">Na čekanju</option>
                  </select>
                </label>

                <div className="admin-calendar-service-list">
                  {services.map((category) => (
                    <div key={category.id} className="admin-calendar-service-group">
                      <strong>{category.name}</strong>
                      {(category.services || []).map((service) => (
                        <label
                          key={service.id}
                          className={`admin-calendar-service-option ${
                            bookingForm.serviceIds.includes(service.id) ? "is-selected" : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={bookingForm.serviceIds.includes(service.id)}
                            onChange={(event) => {
                              if (event.target.checked) {
                                setBookingForm((prev) => ({
                                  ...prev,
                                  serviceIds: prev.serviceIds.includes(service.id)
                                    ? prev.serviceIds
                                    : [...prev.serviceIds, service.id],
                                }));
                              } else {
                                setBookingForm((prev) => ({
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
                  ))}
                </div>

                <label>
                  Napomena
                  <textarea
                    className="admin-inline-textarea"
                    rows={3}
                    value={bookingForm.notes}
                    onChange={(event) =>
                      setBookingForm((prev) => ({ ...prev, notes: event.target.value }))
                    }
                  />
                </label>
                <button
                  type="button"
                  className="admin-template-link-btn"
                  disabled={saving || !bookingForm.clientName || !bookingForm.serviceIds.length}
                  onClick={createBooking}
                >
                  Sačuvaj termin
                </button>
              </div>
            ) : (
              <div className="admin-calendar-details" style={{ marginTop: 12 }}>
                <label>
                  Datum i vreme
                  <input
                    type="datetime-local"
                    className="admin-inline-input"
                    value={blockForm.startAtLocal}
                    onChange={(event) =>
                      setBlockForm((prev) => ({ ...prev, startAtLocal: event.target.value }))
                    }
                    required
                  />
                </label>
                <label>
                  Trajanje (min)
                  <input
                    type="number"
                    min={5}
                    max={720}
                    className="admin-inline-input"
                    value={blockForm.durationMin}
                    onChange={(event) =>
                      setBlockForm((prev) => ({ ...prev, durationMin: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Napomena
                  <textarea
                    className="admin-inline-textarea"
                    rows={3}
                    value={blockForm.note}
                    onChange={(event) =>
                      setBlockForm((prev) => ({ ...prev, note: event.target.value }))
                    }
                  />
                </label>
                <button
                  type="button"
                  className="admin-template-link-btn"
                  disabled={saving}
                  onClick={createBlock}
                >
                  Sačuvaj blokadu
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {activeEvent ? (
        <div className="admin-calendar-modal" role="dialog" aria-modal="true">
          <div className="admin-calendar-modal-backdrop" onClick={closeActiveEvent} />
          <div className="admin-card admin-calendar-modal-card">
            <div className="admin-calendar-modal-head">
              <h3 style={{ margin: 0 }}>
                {activeEvent.kind === "booking" ? "Detalji termina" : "Detalji blokade"}
              </h3>
              <button
                type="button"
                className="admin-template-link-btn"
                onClick={closeActiveEvent}
              >
                Zatvori
              </button>
            </div>

            {activeBooking ? (
              <div className="admin-calendar-details" style={{ marginTop: 12 }}>
                <div>
                  <span>Klijent</span>
                  <div className="admin-calendar-client-row">
                    <strong>{activeBooking.clientName || "-"}</strong>
                    {activeBooking.userId ? (
                      <button
                        type="button"
                        className="admin-template-link-btn"
                        disabled={clientDetailsLoading}
                        onClick={() => openClientDetailsPanel(activeBooking.userId)}
                      >
                        {clientDetailsLoading && showClientDetails
                          ? "Učitavanje..."
                          : "Profil + Beauty Pass"}
                      </button>
                    ) : null}
                    {activeBooking.clientPhone ? (
                      <a
                        className="admin-template-link-btn"
                        href={`tel:${String(activeBooking.clientPhone).replace(/\s/g, "")}`}
                      >
                        Pozovi klijenta
                      </a>
                    ) : (
                      <span style={{ color: "#9fb8d8", fontSize: 13 }}>Bez telefona u profilu</span>
                    )}
                  </div>
                </div>
                <div>
                  <span>Termin</span>
                  <strong>
                    {fmtDateTime(activeBooking.startsAt)} - {fmtDateTime(activeBooking.endsAt)}
                  </strong>
                </div>
                <div>
                  <span>Usluge</span>
                  <strong>{activeBooking.serviceSummary || "-"}</strong>
                </div>
                <div>
                  <span>Cena</span>
                  <strong>{activeBooking.totalPriceRsd} EUR</strong>
                </div>
                <div>
                  <span>Status</span>
                  <strong>{STATUS_LABEL[statusDraft] || statusDraft || "-"}</strong>
                </div>
                <label>
                  Napomena
                  <textarea
                    className="admin-inline-textarea"
                    rows={3}
                    value={notesDraft}
                    onChange={(event) => setNotesDraft(event.target.value)}
                  />
                </label>

                {statusDraft === "pending" ? (
                  <div
                    className="admin-calendar-details"
                    style={{
                      marginTop: 12,
                      paddingTop: 12,
                      borderTop: "1px solid rgba(217,232,248,0.15)",
                    }}
                  >
                    <p style={{ margin: "0 0 8px", color: "#bed0e8", fontSize: 14 }}>
                      Izmena nepotvrđenog termina: datum, vreme, usluge (trajanje i cena se računaju iz
                      usluga). Posle izmene klijent dobija mejl ako su se promenili termin ili usluge.
                    </p>
                    <label>
                      Novi datum i vreme
                      <input
                        type="datetime-local"
                        className="admin-inline-input"
                        value={pendingEditStartLocal}
                        onChange={(event) => setPendingEditStartLocal(event.target.value)}
                      />
                    </label>
                    <div>
                      <span style={{ display: "block", marginBottom: 6 }}>Usluge</span>
                      <div className="admin-calendar-service-list">
                        {services.map((category) => (
                          <div key={category.id} className="admin-calendar-service-group">
                            <strong>{category.name}</strong>
                            {(category.services || []).map((service) => (
                              <label
                                key={service.id}
                                className={`admin-calendar-service-option ${
                                  pendingEditServiceIds.includes(service.id) ? "is-selected" : ""
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={pendingEditServiceIds.includes(service.id)}
                                  onChange={(event) => {
                                    if (event.target.checked) {
                                      setPendingEditServiceIds((prev) =>
                                        prev.includes(service.id) ? prev : [...prev, service.id]
                                      );
                                    } else {
                                      setPendingEditServiceIds((prev) =>
                                        prev.filter((id) => id !== service.id)
                                      );
                                    }
                                  }}
                                />
                                <span>
                                  {service.name} ({service.durationMin}m)
                                </span>
                              </label>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                    <p style={{ margin: "8px 0 0", color: "#9fb8d8", fontSize: 13 }}>
                      Procenjeno trajanje (iz usluga, max 60 min u sistemu):{" "}
                      <strong>{pendingEditDurationMin} min</strong>
                    </p>
                    <button
                      type="button"
                      className="admin-template-link-btn"
                      disabled={saving}
                      onClick={savePendingBookingReschedule}
                    >
                      Sačuvaj izmenu termina i usluga
                    </button>
                  </div>
                ) : null}

                <div className="admin-calendar-detail-actions">
                  {(quickStatusActionsByStatus[statusDraft] || []).length ? (
                    <div className="admin-calendar-quick-actions">
                      {(quickStatusActionsByStatus[statusDraft] || []).map((action) => (
                        <button
                          key={action.value}
                          type="button"
                          className="admin-template-link-btn"
                          disabled={saving}
                          onClick={() => changeActiveBookingStatus(action.value)}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <div className="admin-calendar-quick-actions">
                    <button
                      type="button"
                      className="admin-template-link-btn"
                      disabled={saving}
                      onClick={saveBookingDetails}
                    >
                      Sačuvaj napomenu
                    </button>
                    <button
                      type="button"
                      className="admin-template-link-btn"
                      disabled={saving}
                      onClick={closeActiveEvent}
                    >
                      Zatvori
                    </button>
                  </div>
                </div>

                {showClientDetails ? (
                  <div className="admin-calendar-client-panel">
                    {clientDetailsError ? (
                      <p style={{ color: "#ffabab", margin: 0 }}>{clientDetailsError}</p>
                    ) : null}

                    {!clientDetailsLoading && !clientDetailsError && clientDetailsPayload ? (
                      <div className="admin-calendar-details">
                        <div>
                          <span>Email / telefon</span>
                          <strong>
                            {clientDetailsPayload.client?.email || "-"} /{" "}
                            {clientDetailsPayload.client?.phone || "-"}
                          </strong>
                        </div>
                        <div>
                          <span>Pol / datum rođenja</span>
                          <strong>
                            {clientDetailsPayload.client?.profile?.gender || "-"} /{" "}
                            {clientDetailsPayload.client?.profile?.birthDate || "-"}
                          </strong>
                        </div>
                        <div>
                          <span>Sledeći termini</span>
                          <strong>
                            {clientDetailsPayload.beautyPass?.upcomingBookings?.length || 0}
                          </strong>
                        </div>
                        <div>
                          <span>Beauty pass zapisi</span>
                          <strong>
                            {clientDetailsPayload.beautyPass?.treatmentHistory?.length || 0}
                          </strong>
                        </div>

                        <div>
                          <span>Poslednja 3 Beauty Pass unosa</span>
                          <div style={{ display: "grid", gap: 6, marginTop: 4 }}>
                            {(clientDetailsPayload.beautyPass?.treatmentHistory || [])
                              .slice(0, 3)
                              .map((record) => (
                                <div key={record.id} style={clientMiniItemStyle}>
                                  <strong>{fmtDateTime(record.treatmentDate)}</strong>
                                  <span>{record.notes || "Bez napomene"}</span>
                                </div>
                              ))}
                            {!clientDetailsPayload.beautyPass?.treatmentHistory?.length ? (
                              <span style={{ color: "#9fb8d8" }}>Nema unosa.</span>
                            ) : null}
                          </div>
                        </div>

                        {activeBooking.userId ? (
                          <a
                            href={`/admin/klijenti/${activeBooking.userId}`}
                            className="admin-template-link-btn"
                          >
                            Otvori puni profil klijenta
                          </a>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            {activeBlock ? (
              <div className="admin-calendar-details" style={{ marginTop: 12 }}>
                <div>
                  <span>Pocetak</span>
                  <strong>{fmtDateTime(activeBlock.startsAt)}</strong>
                </div>
                <div>
                  <span>Kraj</span>
                  <strong>{fmtDateTime(activeBlock.endsAt)}</strong>
                </div>
                <div>
                  <span>Trajanje</span>
                  <strong>{activeBlock.durationMin} min</strong>
                </div>
                <div>
                  <span>Napomena</span>
                  <strong>{activeBlock.note || "-"}</strong>
                </div>
                <button
                  type="button"
                  className="admin-template-link-btn"
                  disabled={saving}
                  onClick={deleteBlock}
                >
                  Obrisi blokadu
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

const clientMiniItemStyle = {
  display: "grid",
  gap: 2,
  border: "1px solid rgba(217,232,248,0.2)",
  borderRadius: 10,
  padding: "7px 8px",
  background: "rgba(9,15,24,0.4)",
};
