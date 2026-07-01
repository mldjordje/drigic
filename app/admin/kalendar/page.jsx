"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useLocale } from "@/components/common/LocaleProvider";

const RESCHEDULABLE_STATUSES = ["pending", "confirmed"];
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

function todayIsoDate() {
  return formatIsoDate(new Date());
}

function parseIsoDate(isoDate) {
  const [year, month, day] = String(isoDate || "").split("-").map(Number);
  return new Date(year, month - 1, day);
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

function buildCalendarCells(monthDate) {
  const firstDayOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const gridStart = new Date(firstDayOfMonth);
  const dayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;
  gridStart.setDate(firstDayOfMonth.getDate() - dayOfWeek);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return {
      iso: formatIsoDate(date),
      dayNumber: date.getDate(),
      inCurrentMonth: date.getMonth() === monthDate.getMonth(),
    };
  });
}

function availabilityClass(availableCount, maxCount, loading) {
  if ((loading && availableCount === undefined) || availableCount === undefined) {
    return "is-loading";
  }
  if (availableCount <= 0) {
    return "is-none";
  }
  if (!maxCount || maxCount <= 0) {
    return "is-medium";
  }
  return availableCount / maxCount >= 0.55 ? "is-high" : "is-medium";
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
  const { t, locale, intlLocale } = useLocale();
  const statusLabel = (status) => (status ? t(`admin.status.${status}`) : status);
  const fmtDateTime = (value) => new Date(value).toLocaleString(intlLocale);
  const formatMonthLabel = (date) =>
    new Intl.DateTimeFormat(intlLocale, { month: "long", year: "numeric" }).format(date);
  const formatSlotTime = (value) =>
    new Date(value).toLocaleTimeString(intlLocale, { hour: "2-digit", minute: "2-digit" });
  const calendarRef = useRef(null);
  const touchStartRef = useRef(null);
  const clientPanelRef = useRef(null);
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
  const [rescheduleDate, setRescheduleDate] = useState(todayIsoDate());
  const [rescheduleCalendarMonth, setRescheduleCalendarMonth] = useState(() => {
    const today = parseIsoDate(todayIsoDate());
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [rescheduleMonthAvailability, setRescheduleMonthAvailability] = useState({});
  const [rescheduleMonthLoading, setRescheduleMonthLoading] = useState(false);
  const [rescheduleCalendarError, setRescheduleCalendarError] = useState("");
  const [rescheduleSlots, setRescheduleSlots] = useState([]);
  const [rescheduleSlotsLoading, setRescheduleSlotsLoading] = useState(false);
  const [rescheduleSlotsError, setRescheduleSlotsError] = useState("");
  const [showReschedulePanel, setShowReschedulePanel] = useState(false);
  const [showClientDetails, setShowClientDetails] = useState(false);
  const [clientDetailsLoading, setClientDetailsLoading] = useState(false);
  const [clientDetailsError, setClientDetailsError] = useState("");
  const [clientDetailsPayload, setClientDetailsPayload] = useState(null);

  const [showNotePanel, setShowNotePanel] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteError, setNoteError] = useState("");
  const [noteMessage, setNoteMessage] = useState("");

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
      throw new Error(data?.message || t("admin.cal.msg.errServices"));
    }
    setServices(data.categories || []);
  }

  useEffect(() => {
    loadServices().catch((err) => setError(err.message || t("admin.cal.msg.errServicesGeneric")));
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
        throw new Error(bookingsData?.message || t("admin.cal.msg.errBookings"));
      }
      if (!blocksRes.ok || !blocksData?.ok) {
        throw new Error(blocksData?.message || t("admin.cal.msg.errBlocks"));
      }

      const bookingsList = (bookingsData.data || []).filter(
        (item) => item.status !== "cancelled"
      );
      const blocksList = blocksData.data || [];
      setBookings(bookingsList);
      setBlocks(blocksList);

      const bookingEvents = bookingsList.map((item) => ({
        id: `booking:${item.id}`,
        title: item.clientName || t("admin.cal.client"),
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
        title: t("admin.status.block"),
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
      setError(loadError.message || t("admin.cal.msg.errCalendar"));
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
    setShowReschedulePanel(false);
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
      setError(t("admin.cal.msg.invalidBookingDateTime"));
      return;
    }
    if (!bookingForm.serviceIds.length) {
      setError(t("admin.cal.msg.pickAtLeastOne"));
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
        throw new Error(data?.message || t("admin.cal.msg.errCreateBooking"));
      }

      setMessage(t("admin.cal.msg.bookingCreated"));
      setIsCreateModalOpen(false);
      await refreshData();
    } catch (saveError) {
      setError(saveError.message || t("admin.cal.msg.errCreateBookingGeneric"));
    } finally {
      setSaving(false);
    }
  }

  async function createBlock() {
    const startAt = toIsoFromLocalInput(blockForm.startAtLocal);
    if (!startAt) {
      setError(t("admin.cal.msg.invalidBlockDateTime"));
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
        throw new Error(data?.message || t("admin.cal.msg.errCreateBlock"));
      }

      setMessage(t("admin.cal.msg.blockCreated"));
      setIsCreateModalOpen(false);
      await refreshData();
    } catch (saveError) {
      setError(saveError.message || t("admin.cal.msg.errCreateBlockGeneric"));
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
        throw new Error(data?.message || t("admin.cal.msg.errSaveEdit"));
      }
      setMessage(t("admin.cal.msg.bookingUpdated"));
      await refreshData();
    } catch (saveError) {
      setError(saveError.message || t("admin.cal.msg.errSaveBooking"));
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
      setError(t("admin.cal.msg.invalidBookingDateTime"));
      return;
    }
    if (!pendingEditServiceIds.length) {
      setError(t("admin.cal.msg.pickAtLeastOne"));
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
        throw new Error(data?.message || t("admin.cal.msg.errReschedule"));
      }
      setMessage(t("admin.cal.msg.bookingRescheduled"));
      await refreshData();
    } catch (saveError) {
      setError(saveError.message || t("admin.cal.msg.errRescheduleGeneric"));
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
        throw new Error(data?.message || t("admin.cal.msg.errChangeStatus"));
      }
      setStatusDraft(nextStatus);
      setMessage(t("admin.cal.msg.statusUpdated"));
      await refreshData();
    } catch (saveError) {
      setError(saveError.message || t("admin.cal.msg.errChangeStatusGeneric"));
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
        throw new Error(data?.message || t("admin.cal.msg.errDeleteBlock"));
      }
      setMessage(t("admin.cal.msg.blockDeleted"));
      setActiveEvent(null);
      await refreshData();
    } catch (saveError) {
      setError(saveError.message || t("admin.cal.msg.errDeleteBlockGeneric"));
    } finally {
      setSaving(false);
    }
  }

  function closeActiveEvent() {
    setActiveEvent(null);
    setShowClientDetails(false);
    setShowReschedulePanel(false);
    setClientDetailsLoading(false);
    setClientDetailsError("");
    setClientDetailsPayload(null);
    setShowNotePanel(false);
    setNoteDraft("");
    setNoteError("");
    setNoteMessage("");
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
        throw new Error(clientData?.message || t("admin.cal.msg.errLoadClient"));
      }
      if (!beautyPassRes.ok || !beautyPassData?.ok) {
        throw new Error(beautyPassData?.message || t("admin.cal.msg.errLoadBeautyPass"));
      }

      setClientDetailsPayload({
        client: clientData.data || null,
        beautyPass: beautyPassData || null,
      });
    } catch (loadError) {
      setClientDetailsError(loadError.message || t("admin.cal.msg.errLoadClientGeneric"));
    } finally {
      setClientDetailsLoading(false);
    }
  }

  // Auto-scroll to client panel once data loads
  useEffect(() => {
    if (clientDetailsPayload && clientPanelRef.current) {
      clientPanelRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [clientDetailsPayload]);

  async function saveTreatmentNote() {
    if (!activeBooking?.userId || !noteDraft.trim()) return;
    setNoteSaving(true);
    setNoteError("");
    setNoteMessage("");
    try {
      const response = await fetch(`/api/admin/clients/${activeBooking.userId}/beauty-pass`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: activeBooking.id,
          notes: noteDraft.trim(),
          treatmentDate: activeBooking.startsAt,
        }),
      });
      const data = await parseResponse(response);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || t("admin.cal.msg.errSaveNote"));
      }
      setNoteMessage(t("admin.cal.passSaved"));
      setNoteDraft("");
      if (showClientDetails && activeBooking.userId) {
        openClientDetailsPanel(activeBooking.userId);
      }
    } catch (saveErr) {
      setNoteError(saveErr.message || t("admin.cal.msg.errSaveNoteGeneric"));
    } finally {
      setNoteSaving(false);
    }
  }

  const activeBooking =
    activeEvent?.kind === "booking" ? bookingById.get(activeEvent.refId) : null;
  const activeBlock = activeEvent?.kind === "block" ? blockById.get(activeEvent.refId) : null;

  const pendingBookingServerKey = useMemo(() => {
    if (!activeBooking || !RESCHEDULABLE_STATUSES.includes(activeBooking.status)) {
      return "";
    }
    return `${activeBooking.id}|${activeBooking.startsAt}|${(activeBooking.serviceIds || []).join(",")}`;
  }, [activeBooking]);

  useEffect(() => {
    if (
      activeEvent?.kind !== "booking" ||
      !activeBooking ||
      !RESCHEDULABLE_STATUSES.includes(activeBooking.status)
    ) {
      return;
    }
    const bookingStartLocal = toLocalInputValue(activeBooking.startsAt);
    const bookingDate = bookingStartLocal.slice(0, 10);
    const todayDate = todayIsoDate();
    const effectiveDate = bookingDate && bookingDate >= todayDate ? bookingDate : todayDate;
    setRescheduleDate(effectiveDate);
    setPendingEditStartLocal(effectiveDate === bookingDate ? bookingStartLocal : "");
    const parsedEffectiveDate = parseIsoDate(effectiveDate);
    setRescheduleCalendarMonth(
      new Date(parsedEffectiveDate.getFullYear(), parsedEffectiveDate.getMonth(), 1)
    );
    setPendingEditServiceIds(activeBooking.serviceIds || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync when server data changes (pendingBookingServerKey), not on every activeBooking ref
  }, [activeEvent?.kind, activeEvent?.refId, pendingBookingServerKey]);

  const pendingEditDurationMin = useMemo(() => {
    if (!pendingEditServiceIds.length) {
      return activeBooking?.totalDurationMin || 0;
    }
    const fromServices = pendingEditServiceIds.reduce((sum, id) => {
      const svc = allServices.find((s) => s.id === id);
      return sum + (svc?.durationMin || 0);
    }, 0);
    return fromServices || activeBooking?.totalDurationMin || 0;
  }, [pendingEditServiceIds, allServices, activeBooking]);
  const rescheduleMonthKey = useMemo(
    () => formatMonthKey(rescheduleCalendarMonth),
    [rescheduleCalendarMonth]
  );
  const rescheduleCalendarCells = useMemo(
    () => buildCalendarCells(rescheduleCalendarMonth),
    [rescheduleCalendarMonth]
  );
  const rescheduleWeekdayLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(intlLocale, { weekday: "short" });
    const monday = new Date(2024, 0, 1);
    return Array.from({ length: 7 }, (_, index) => {
      const item = new Date(monday);
      item.setDate(monday.getDate() + index);
      return formatter.format(item);
    });
  }, [intlLocale]);
  const rescheduleMaxSlotsInMonth = useMemo(() => {
    const values = Object.entries(rescheduleMonthAvailability)
      .filter(([date]) => date.startsWith(rescheduleMonthKey))
      .map(([, count]) => Number(count) || 0);
    return values.length ? Math.max(...values) : 0;
  }, [rescheduleMonthAvailability, rescheduleMonthKey]);
  const today = useMemo(() => todayIsoDate(), []);
  const canGoPrevRescheduleMonth = useMemo(
    () => rescheduleMonthKey > today.slice(0, 7),
    [rescheduleMonthKey, today]
  );

  useEffect(() => {
    if (!showReschedulePanel || !activeBooking || !pendingEditServiceIds.length || !pendingEditDurationMin) {
      setRescheduleMonthAvailability({});
      setRescheduleMonthLoading(false);
      setRescheduleCalendarError("");
      return undefined;
    }

    const controller = new AbortController();
    setRescheduleMonthLoading(true);
    setRescheduleCalendarError("");

    const params = new URLSearchParams({
      month: rescheduleMonthKey,
      durationMin: String(pendingEditDurationMin),
      excludeBookingId: activeBooking.id,
    });

    fetch(`/api/bookings/availability?${params.toString()}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await parseResponse(response);
        if (!response.ok || !data?.ok) {
          throw new Error(data?.message || t("admin.cal.msg.errLoadAvailability"));
        }
        const map = {};
        (data.days || []).forEach((day) => {
          map[day.date] = Number(day.availableSlots) || 0;
        });
        setRescheduleMonthAvailability(map);
      })
      .catch((loadError) => {
        if (loadError?.name === "AbortError") {
          return;
        }
        setRescheduleMonthAvailability({});
        setRescheduleCalendarError(loadError.message || t("admin.cal.msg.errLoadAvailability"));
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setRescheduleMonthLoading(false);
        }
      });

    return () => controller.abort();
  }, [
    activeBooking,
    pendingEditDurationMin,
    pendingEditServiceIds.length,
    rescheduleMonthKey,
    showReschedulePanel,
  ]);

  useEffect(() => {
    if (!showReschedulePanel || rescheduleMonthLoading || !pendingEditServiceIds.length) {
      return;
    }
    const availableDates = Object.entries(rescheduleMonthAvailability)
      .filter(([date, count]) => date >= today && date.startsWith(rescheduleMonthKey) && Number(count) > 0)
      .map(([date]) => date)
      .sort();

    if (!availableDates.length) {
      return;
    }

    if (!rescheduleDate.startsWith(rescheduleMonthKey) || Number(rescheduleMonthAvailability[rescheduleDate] || 0) <= 0) {
      setRescheduleDate(availableDates[0]);
      setPendingEditStartLocal("");
    }
  }, [
    pendingEditServiceIds.length,
    rescheduleDate,
    rescheduleMonthAvailability,
    rescheduleMonthKey,
    rescheduleMonthLoading,
    showReschedulePanel,
    today,
  ]);

  useEffect(() => {
    if (
      !showReschedulePanel ||
      !activeBooking ||
      !rescheduleDate ||
      !pendingEditServiceIds.length ||
      !pendingEditDurationMin
    ) {
      setRescheduleSlots([]);
      setRescheduleSlotsLoading(false);
      setRescheduleSlotsError("");
      return undefined;
    }

    const controller = new AbortController();
    setRescheduleSlotsLoading(true);
    setRescheduleSlotsError("");

    const params = new URLSearchParams({
      date: rescheduleDate,
      durationMin: String(pendingEditDurationMin),
      excludeBookingId: activeBooking.id,
    });

    fetch(`/api/bookings/availability?${params.toString()}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await parseResponse(response);
        if (!response.ok || !data?.ok) {
          throw new Error(data?.message || t("admin.cal.msg.errLoadSlots"));
        }
        setRescheduleSlots((data.slots || []).filter((slot) => slot.available));
      })
      .catch((loadError) => {
        if (loadError?.name === "AbortError") {
          return;
        }
        setRescheduleSlots([]);
        setRescheduleSlotsError(loadError.message || t("admin.cal.msg.errLoadSlots"));
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setRescheduleSlotsLoading(false);
        }
      });

    return () => controller.abort();
  }, [
    activeBooking,
    rescheduleDate,
    pendingEditDurationMin,
    pendingEditServiceIds.length,
    showReschedulePanel,
  ]);

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
      { value: "confirmed", label: t("admin.cal.confirmAction") },
      { value: "cancelled", label: t("admin.cal.cancelAction") },
      { value: "no_show", label: t("admin.status.no_show") },
    ],
    confirmed: [
      { value: "cancelled", label: t("admin.cal.cancelAction") },
      { value: "no_show", label: t("admin.status.no_show") },
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
          <h2 style={{ margin: 0 }}>{t("admin.cal.title")}</h2>
          <p style={{ margin: "4px 0 0", color: "#bed0e8" }}>
            {t("admin.cal.statsLine", {
              bookings: stats.totalBookings,
              blocks: stats.totalBlocks,
              confirmed: stats.confirmed,
              pending: stats.pending,
            })}
          </p>
        </div>
        <div className="admin-calendar-toolbar-actions">
          <button
            type="button"
            className="admin-template-link-btn"
            onClick={() => scrollCalendarToTime(MORNING_SCROLL_TIME)}
          >
            {t("admin.cal.morning")}
          </button>
          <button
            type="button"
            className="admin-template-link-btn"
            onClick={() => scrollCalendarToTime(DEFAULT_AFTERNOON_SCROLL_TIME)}
          >
            {t("admin.cal.afternoon")}
          </button>
          <button
            type="button"
            className="admin-template-link-btn"
            onClick={() => openCreateModal(new Date().toISOString())}
          >
            {t("admin.cal.newEntry")}
          </button>
          <button
            type="button"
            className="admin-template-link-btn"
            onClick={() => refreshData()}
            disabled={loading}
          >
            {t("admin.cal.refresh")}
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
          locale={locale}
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
            today: t("admin.cal.today"),
            month: t("admin.cal.month"),
            week: t("admin.cal.week"),
            day: t("admin.cal.day"),
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
              <h3 style={{ margin: 0 }}>{t("admin.cal.slotAction")}</h3>
              <button
                type="button"
                className="admin-template-link-btn"
                onClick={() => setIsCreateModalOpen(false)}
              >
                {t("admin.cal.close")}
              </button>
            </div>

            <div className="admin-calendar-tabs">
              <button
                type="button"
                className={`admin-template-link-btn ${createType === "booking" ? "is-active" : ""}`}
                onClick={() => setCreateType("booking")}
              >
                {t("admin.cal.bookTab")}
              </button>
              <button
                type="button"
                className={`admin-template-link-btn ${createType === "block" ? "is-active" : ""}`}
                onClick={() => setCreateType("block")}
              >
                {t("admin.cal.blockTab")}
              </button>
            </div>

            {createType === "booking" ? (
              <div className="admin-calendar-details" style={{ marginTop: 12 }}>
                <label>
                  {t("admin.cal.fullName")}
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
                  {t("admin.cal.emailOptional")}
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
                  {t("admin.cal.phoneOptional")}
                  <input
                    className="admin-inline-input"
                    value={bookingForm.phone}
                    onChange={(event) =>
                      setBookingForm((prev) => ({ ...prev, phone: event.target.value }))
                    }
                  />
                </label>
                <label>
                  {t("admin.cal.dateTime")}
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
                  {t("admin.cal.status")}
                  <select
                    className="admin-inline-input"
                    value={bookingForm.status}
                    onChange={(event) =>
                      setBookingForm((prev) => ({ ...prev, status: event.target.value }))
                    }
                  >
                    <option value="confirmed">{t("admin.status.confirmed")}</option>
                    <option value="pending">{t("admin.status.pending")}</option>
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
                  {t("admin.cal.note")}
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
                  {t("admin.cal.saveBooking")}
                </button>
              </div>
            ) : (
              <div className="admin-calendar-details" style={{ marginTop: 12 }}>
                <label>
                  {t("admin.cal.dateTime")}
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
                  {t("admin.cal.durationMin")}
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
                  {t("admin.cal.note")}
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
                  {t("admin.cal.saveBlock")}
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
              <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                <h3 style={{ margin: 0, fontSize: 16, color: "#e8f2ff" }}>
                  {activeEvent.kind === "booking"
                    ? (activeBooking?.clientName || t("admin.cal.bookingDetails"))
                    : t("admin.cal.block")}
                </h3>
                {activeBooking ? (
                  <span style={{ fontSize: 12, color: "#7a9bbd" }}>
                    {fmtDateTime(activeBooking.startsAt)}
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                className="admin-modal-btn is-close-btn"
                onClick={closeActiveEvent}
                aria-label={t("admin.cal.close")}
              >
                ✕
              </button>
            </div>

            {activeBooking ? (
              <div className="admin-modal-info">
                <div className="admin-modal-info-row">
                  <span className="admin-modal-info-label">{t("admin.cal.client")}</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <strong className="admin-modal-info-value">{activeBooking.clientName || "-"}</strong>
                    <div className="admin-modal-client-actions">
                    {activeBooking.userId ? (
                      <button
                        type="button"
                        className={`admin-modal-btn is-gold${showClientDetails ? " is-active" : ""}`}
                        style={{ fontSize: 12, minHeight: 38 }}
                        disabled={clientDetailsLoading && !showClientDetails}
                        onClick={() => {
                          if (showClientDetails) {
                            setShowClientDetails(false);
                            setClientDetailsPayload(null);
                          } else {
                            openClientDetailsPanel(activeBooking.userId);
                          }
                        }}
                      >
                        {clientDetailsLoading ? t("admin.cal.loading") : showClientDetails ? t("admin.cal.hideProfile") : t("admin.cal.profileBeautyPass")}
                      </button>
                    ) : null}
                    {activeBooking.clientPhone ? (
                      <a
                        className="admin-modal-btn"
                        style={{ fontSize: 12, minHeight: 38, flex: "none" }}
                        href={`tel:${String(activeBooking.clientPhone).replace(/\s/g, "")}`}
                      >
                        📞 {t("admin.cal.call")}
                      </a>
                    ) : null}
                    </div>
                  </div>
                </div>
                <div className="admin-modal-info-row">
                  <span className="admin-modal-info-label">{t("admin.cal.time")}</span>
                  <span className="admin-modal-info-value">
                    {fmtDateTime(activeBooking.startsAt)} – {fmtDateTime(activeBooking.endsAt)}
                  </span>
                </div>
                <div className="admin-modal-info-row">
                  <span className="admin-modal-info-label">{t("admin.cal.services")}</span>
                  <span className="admin-modal-info-value">{activeBooking.serviceSummary || "-"}</span>
                </div>
                <div className="admin-modal-info-row">
                  <span className="admin-modal-info-label">{t("admin.cal.price")}</span>
                  <span className="admin-modal-info-value">{activeBooking.totalPriceRsd} EUR</span>
                </div>
                <div className="admin-modal-info-row">
                  <span className="admin-modal-info-label">{t("admin.cal.status")}</span>
                  <span className={`admin-status-badge is-${statusDraft}`}>
                    {statusLabel(statusDraft) || statusDraft || "-"}
                  </span>
                </div>
                <div className="admin-modal-info-row" style={{ borderBottom: "none" }}>
                  <span className="admin-modal-info-label">{t("admin.cal.note")}</span>
                  <textarea
                    className="admin-inline-textarea"
                    rows={3}
                    value={notesDraft}
                    onChange={(event) => setNotesDraft(event.target.value)}
                    style={{ margin: 0 }}
                  />
                </div>

                {RESCHEDULABLE_STATUSES.includes(statusDraft) && showReschedulePanel ? (
                  <div
                    className="admin-calendar-details"
                    style={{
                      marginTop: 12,
                      paddingTop: 12,
                      borderTop: "1px solid rgba(217,232,248,0.15)",
                    }}
                  >
                    <p style={{ margin: "0 0 8px", color: "#bed0e8", fontSize: 14 }}>
                      {t("admin.cal.reschedHint")}
                    </p>
                    <div>
                      <span style={{ display: "block", marginBottom: 6 }}>{t("admin.cal.services")}</span>
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
                    <div className="admin-reschedule-calendar-panel">
                      <div className="admin-reschedule-calendar-head">
                        <button
                          type="button"
                          className="admin-template-link-btn"
                          disabled={!canGoPrevRescheduleMonth}
                          onClick={() => setRescheduleCalendarMonth((prev) => addMonths(prev, -1))}
                        >
                          {t("admin.cal.prevMonth")}
                        </button>
                        <strong>{formatMonthLabel(rescheduleCalendarMonth)}</strong>
                        <button
                          type="button"
                          className="admin-template-link-btn"
                          onClick={() => setRescheduleCalendarMonth((prev) => addMonths(prev, 1))}
                        >
                          {t("admin.cal.nextMonth")}
                        </button>
                      </div>

                      <div className="admin-reschedule-calendar-legend">
                        <span><span className="admin-calendar-indicator is-high" />{t("admin.cal.moreSlots")}</span>
                        <span><span className="admin-calendar-indicator is-medium" />{t("admin.cal.limited")}</span>
                        <span><span className="admin-calendar-indicator is-none" />{t("admin.cal.full")}</span>
                      </div>

                      <div className="admin-reschedule-weekdays">
                        {rescheduleWeekdayLabels.map((label) => (
                          <span key={label}>{label}</span>
                        ))}
                      </div>

                      <div className="admin-reschedule-calendar-grid">
                        {rescheduleCalendarCells.map((cell) => {
                          const availableCount = rescheduleMonthAvailability[cell.iso];
                          const isPast = cell.iso < today;
                          const isActive = cell.iso === rescheduleDate;
                          const isDisabled =
                            !pendingEditServiceIds.length ||
                            !cell.inCurrentMonth ||
                            isPast ||
                            (availableCount !== undefined && Number(availableCount) <= 0);
                          return (
                            <button
                              key={cell.iso}
                              type="button"
                              className={`admin-reschedule-day ${isActive ? "is-active" : ""} ${
                                !cell.inCurrentMonth ? "is-out" : ""
                              }`}
                              disabled={isDisabled}
                              onClick={() => {
                                setRescheduleDate(cell.iso);
                                setPendingEditStartLocal("");
                              }}
                            >
                              <span>{cell.dayNumber}</span>
                              {cell.inCurrentMonth ? (
                                <span
                                  className={`admin-calendar-indicator ${availabilityClass(
                                    availableCount,
                                    rescheduleMaxSlotsInMonth,
                                    rescheduleMonthLoading
                                  )}`}
                                />
                              ) : null}
                            </button>
                          );
                        })}
                      </div>

                      {!pendingEditServiceIds.length ? (
                        <p>{t("admin.cal.pickServiceForAvailability")}</p>
                      ) : rescheduleCalendarError ? (
                        <p className="is-error">{rescheduleCalendarError}</p>
                      ) : null}
                    </div>
                    <div className="admin-calendar-slot-picker">
                      <div className="admin-calendar-slot-picker-head">
                        <strong>{t("admin.cal.freeSlots")}</strong>
                        <span>{rescheduleDate ? t("admin.cal.forDate", { date: rescheduleDate }) : t("admin.cal.pickDate")}</span>
                      </div>

                      {!pendingEditServiceIds.length ? (
                        <p>{t("admin.cal.pickServiceForSlots")}</p>
                      ) : rescheduleSlotsLoading ? (
                        <p>{t("admin.cal.loadingSlots")}</p>
                      ) : rescheduleSlotsError ? (
                        <p className="is-error">{rescheduleSlotsError}</p>
                      ) : rescheduleSlots.length ? (
                        <div className="admin-calendar-slot-grid">
                          {rescheduleSlots.map((slot) => {
                            const localSlotValue = toLocalInputValue(slot.startAt);
                            const isSelected = pendingEditStartLocal === localSlotValue;
                            return (
                              <button
                                key={slot.startAt}
                                type="button"
                                className={`admin-calendar-slot-btn ${
                                  isSelected ? "is-selected" : ""
                                }`}
                                onClick={() => setPendingEditStartLocal(localSlotValue)}
                              >
                                {formatSlotTime(slot.startAt)}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <p>{t("admin.cal.noFreeSlots")}</p>
                      )}
                    </div>
                    {pendingEditStartLocal ? (
                      <p style={{ margin: "8px 0 0", color: "#d9e8f8", fontSize: 13 }}>
                        {t("admin.cal.chosenNewSlot")}{" "}
                        <strong>{fmtDateTime(toIsoFromLocalInput(pendingEditStartLocal))}</strong>
                      </p>
                    ) : null}
                    <p style={{ margin: "8px 0 0", color: "#9fb8d8", fontSize: 13 }}>
                      {t("admin.cal.estDuration")}{" "}
                      <strong>{pendingEditDurationMin} min</strong>
                    </p>
                    <div className="admin-calendar-quick-actions" style={{ marginTop: 10 }}>
                      <button
                        type="button"
                        className="admin-modal-btn is-save"
                        disabled={saving || !pendingEditServiceIds.length || !pendingEditStartLocal}
                        onClick={savePendingBookingReschedule}
                      >
                        {t("admin.cal.confirmReschedule")}
                      </button>
                      <button
                        type="button"
                        className="admin-modal-btn"
                        onClick={() => setShowReschedulePanel(false)}
                      >
                        {t("admin.cal.discard")}
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="admin-calendar-detail-actions" style={{ borderTop: "1px solid rgba(217,232,248,0.1)", paddingTop: 14, marginTop: 6 }}>
                  {(quickStatusActionsByStatus[statusDraft] || []).length ? (
                    <div className="admin-modal-btn-row" style={{ marginBottom: 8 }}>
                      {(quickStatusActionsByStatus[statusDraft] || []).map((action) => (
                        <button
                          key={action.value}
                          type="button"
                          className="admin-modal-btn"
                          disabled={saving}
                          onClick={() => changeActiveBookingStatus(action.value)}
                        >
                          {action.label}
                        </button>
                      ))}
                      {RESCHEDULABLE_STATUSES.includes(statusDraft) ? (
                        <button
                          type="button"
                          className="admin-modal-btn"
                          disabled={saving}
                          onClick={() => setShowReschedulePanel((prev) => !prev)}
                        >
                          {showReschedulePanel ? t("admin.cal.closeReschedule") : t("admin.cal.reschedule")}
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="admin-modal-btn-row">
                    <button
                      type="button"
                      className="admin-modal-btn is-save"
                      disabled={saving}
                      onClick={saveBookingDetails}
                    >
                      {saving ? t("admin.cal.saving") : t("admin.cal.saveNote")}
                    </button>
                    {activeBooking?.userId ? (
                      <button
                        type="button"
                        className={`admin-modal-btn is-gold${showNotePanel ? " is-active" : ""}`}
                        onClick={() => {
                          setShowNotePanel((prev) => !prev);
                          setNoteError("");
                          setNoteMessage("");
                        }}
                      >
                        {showNotePanel ? t("admin.cal.closePass") : t("admin.cal.writePass")}
                      </button>
                    ) : null}
                  </div>
                </div>

                {showNotePanel && activeBooking?.userId ? (
                  <div className="admin-calendar-note-panel">
                    <p style={{ margin: "0 0 12px", color: "#C4A55A", fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                      {t("admin.cal.writeBeautyPass")}
                    </p>
                    <label style={{ display: "block" }}>
                      <span style={{ display: "block", marginBottom: 8, color: "#9fb8d8", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        {t("admin.cal.interventionNote")}
                      </span>
                      <textarea
                        className="admin-inline-textarea"
                        rows={5}
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        placeholder={t("admin.cal.interventionPlaceholder")}
                        style={{ width: "100%", boxSizing: "border-box" }}
                      />
                    </label>
                    {noteError ? (
                      <p style={{ color: "#ffabab", margin: "8px 0 0", fontSize: 13 }}>{noteError}</p>
                    ) : null}
                    {noteMessage ? (
                      <p style={{ color: "#a8f0a0", margin: "8px 0 0", fontSize: 13, fontWeight: 600 }}>{noteMessage}</p>
                    ) : null}
                    <div className="admin-modal-btn-row" style={{ marginTop: 12 }}>
                      <button
                        type="button"
                        className="admin-modal-btn is-save"
                        disabled={noteSaving || !noteDraft.trim()}
                        onClick={saveTreatmentNote}
                      >
                        {noteSaving ? t("admin.cal.saving") : t("admin.cal.savePass")}
                      </button>
                      <button
                        type="button"
                        className="admin-modal-btn"
                        onClick={() => {
                          setShowNotePanel(false);
                          setNoteDraft("");
                          setNoteError("");
                          setNoteMessage("");
                        }}
                      >
                        {t("admin.cal.discard")}
                      </button>
                    </div>
                  </div>
                ) : null}

                {showClientDetails ? (
                  <div className="admin-calendar-client-panel" ref={clientPanelRef}>
                    {clientDetailsLoading ? (
                      <div className="admin-loading-dots">
                        <div className="admin-loading-dot" />
                        <div className="admin-loading-dot" />
                        <div className="admin-loading-dot" />
                      </div>
                    ) : null}
                    {clientDetailsError ? (
                      <p style={{ color: "#ffabab", margin: 0 }}>{clientDetailsError}</p>
                    ) : null}

                    {!clientDetailsLoading && !clientDetailsError && clientDetailsPayload ? (
                      <div className="admin-calendar-details">
                        <div>
                          <span>{t("admin.cal.emailPhone")}</span>
                          <strong>
                            {clientDetailsPayload.client?.email || "-"} /{" "}
                            {clientDetailsPayload.client?.phone || "-"}
                          </strong>
                        </div>
                        <div>
                          <span>{t("admin.cal.genderBirth")}</span>
                          <strong>
                            {clientDetailsPayload.client?.profile?.gender || "-"} /{" "}
                            {clientDetailsPayload.client?.profile?.birthDate || "-"}
                          </strong>
                        </div>
                        <div>
                          <span>{t("admin.cal.upcomingAppts")}</span>
                          <strong>
                            {clientDetailsPayload.beautyPass?.upcomingBookings?.length || 0}
                          </strong>
                        </div>
                        <div>
                          <span>{t("admin.cal.bpRecords")}</span>
                          <strong>
                            {clientDetailsPayload.beautyPass?.treatmentHistory?.length || 0}
                          </strong>
                        </div>

                        <div>
                          <span>{t("admin.cal.lastThreeBp")}</span>
                          <div style={{ display: "grid", gap: 6, marginTop: 4 }}>
                            {(clientDetailsPayload.beautyPass?.treatmentHistory || [])
                              .slice(0, 3)
                              .map((record) => (
                                <div key={record.id} className="admin-bp-record-card">
                                  <strong>{fmtDateTime(record.treatmentDate)}</strong>
                                  <span>{record.notes || t("admin.cal.noNote")}</span>
                                </div>
                              ))}
                            {!clientDetailsPayload.beautyPass?.treatmentHistory?.length ? (
                              <span style={{ color: "#9fb8d8" }}>{t("admin.cal.noEntries")}</span>
                            ) : null}
                          </div>
                        </div>

                        {activeBooking.userId ? (
                          <a
                            href={`/admin/klijenti/${activeBooking.userId}`}
                            className="admin-template-link-btn"
                          >
                            {t("admin.cal.openFullClient")}
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
                  <span>{t("admin.cal.start")}</span>
                  <strong>{fmtDateTime(activeBlock.startsAt)}</strong>
                </div>
                <div>
                  <span>{t("admin.cal.end")}</span>
                  <strong>{fmtDateTime(activeBlock.endsAt)}</strong>
                </div>
                <div>
                  <span>{t("admin.cal.duration")}</span>
                  <strong>{activeBlock.durationMin} min</strong>
                </div>
                <div>
                  <span>{t("admin.cal.note")}</span>
                  <strong>{activeBlock.note || "-"}</strong>
                </div>
                <button
                  type="button"
                  className="admin-template-link-btn"
                  disabled={saving}
                  onClick={deleteBlock}
                >
                  {t("admin.cal.deleteBlock")}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

