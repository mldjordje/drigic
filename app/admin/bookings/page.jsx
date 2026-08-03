"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "@/components/common/LocaleProvider";
import AdminStatusMessage from "@/components/admin/ui/AdminStatusMessage";
import AdminIcon from "@/components/admin/ui/AdminIcon";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminSection from "@/components/admin/ui/AdminSection";
import AdminEmptyState from "@/components/admin/ui/AdminEmptyState";

const STATUSES = ["pending", "confirmed", "cancelled", "no_show"];

const STATUS_ICON = {
  pending: "clock",
  confirmed: "check",
  cancelled: "close",
  no_show: "warning",
  completed: "check",
};

const STATUS_TONE = {
  pending: "amber",
  confirmed: "green",
  cancelled: "rose",
  no_show: "violet",
};

const ACTION_VARIANT = {
  confirmed: "admin-btn--success",
  cancelled: "admin-btn--danger",
  no_show: "admin-btn--danger",
};

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

export default function AdminBookingsPage() {
  const { t, intlLocale } = useLocale();
  const tRef = useRef(t);
  tRef.current = t;
  const statusLabel = (status) =>
    status ? t(`admin.status.${status}`) : status;
  const formatDateTime = (value) => {
    try {
      return new Date(value).toLocaleString(intlLocale);
    } catch {
      return value;
    }
  };
  const [bookings, setBookings] = useState([]);
  const [notesById, setNotesById] = useState({});
  const [statusById, setStatusById] = useState({});
  const [pageError, setPageError] = useState("");
  const [pendingById, setPendingById] = useState({});
  const [feedbackById, setFeedbackById] = useState({});
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const pendingBookingIdsRef = useRef(new Set());
  const pendingStatusesRef = useRef(new Map());
  const dirtyNoteIdsRef = useRef(new Set());
  const persistedUpdatesRef = useRef(new Map());
  const loadGenerationRef = useRef(0);
  const isMountedRef = useRef(false);
  const appliedFiltersRef = useRef({ from: "", to: "" });

  const loadBookings = useCallback(async ({ from: filterFrom = "", to: filterTo = "" } = {}) => {
    const generation = ++loadGenerationRef.current;
    const query = new URLSearchParams();
    if (filterFrom) {
      query.set("from", `${filterFrom}T00:00:00.000Z`);
    }
    if (filterTo) {
      query.set("to", `${filterTo}T23:59:59.999Z`);
    }

    try {
      const response = await fetch(
        `/api/admin/bookings${query.toString() ? `?${query.toString()}` : ""}`
      );
      const data = await parseResponse(response);
      if (!isMountedRef.current || generation !== loadGenerationRef.current) {
        return { stale: true };
      }
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || tRef.current("admin.book.loadFailed"));
      }

      const rows = (data.data || []).map((item) => {
        const persisted = persistedUpdatesRef.current.get(item.id);
        let row = item;
        if (persisted) {
          const serverMatchesPersisted =
            item.status === persisted.status && (item.notes || "") === persisted.notes;
          if (serverMatchesPersisted) {
            persistedUpdatesRef.current.delete(item.id);
          } else {
            row = { ...item, status: persisted.status, notes: persisted.notes };
          }
        }

        const pendingStatus = pendingStatusesRef.current.get(item.id);
        return pendingStatus ? { ...row, status: pendingStatus } : row;
      });
      if (!isMountedRef.current || generation !== loadGenerationRef.current) {
        return { stale: true };
      }

      setBookings(rows);
      const nextStatus = {};
      rows.forEach((item) => {
        nextStatus[item.id] = item.status;
      });
      setStatusById(nextStatus);
      setNotesById((previous) => {
        const nextNotes = {};
        dirtyNoteIdsRef.current.forEach((bookingId) => {
          if (previous[bookingId] !== undefined) {
            nextNotes[bookingId] = previous[bookingId];
          }
        });
        rows.forEach((item) => {
          nextNotes[item.id] = dirtyNoteIdsRef.current.has(item.id)
            ? previous[item.id] ?? item.notes ?? ""
            : item.notes || "";
        });
        return nextNotes;
      });
      return { stale: false };
    } catch (err) {
      if (!isMountedRef.current || generation !== loadGenerationRef.current) {
        return { stale: true };
      }
      throw err;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    loadBookings(appliedFiltersRef.current)
      .then((result) => {
        if (!result.stale && isMountedRef.current) {
          setPageError("");
        }
      })
      .catch((err) => {
        if (isMountedRef.current) {
          setPageError(err.message);
        }
      });

    return () => {
      isMountedRef.current = false;
      loadGenerationRef.current += 1;
    };
  }, [loadBookings]);

  async function updateBooking(bookingId, nextStatus, actionLabel) {
    if (pendingBookingIdsRef.current.has(bookingId)) {
      return;
    }

    const booking = bookings.find((item) => item.id === bookingId);
    const clientName = booking?.clientName || "-";
    const previousStatus = statusById[bookingId] || booking?.status;
    const statusToPersist = nextStatus || previousStatus;
    const notesToPersist = notesById[bookingId] ?? booking?.notes ?? "";

    pendingBookingIdsRef.current.add(bookingId);
    setPendingById((previous) => ({ ...previous, [bookingId]: { actionLabel } }));
    setFeedbackById((previous) => {
      const next = { ...previous };
      delete next[bookingId];
      return next;
    });
    if (nextStatus) {
      pendingStatusesRef.current.set(bookingId, nextStatus);
      setStatusById((previous) => ({ ...previous, [bookingId]: nextStatus }));
    }

    try {
      const response = await fetch("/api/admin/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: bookingId,
          status: statusToPersist,
          notes: notesToPersist,
        }),
      });
      const data = await parseResponse(response);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || t("admin.book.updateFailed"));
      }
      if (!isMountedRef.current) {
        return;
      }
      const persistedStatus = data.data?.status || statusToPersist;
      persistedUpdatesRef.current.set(bookingId, {
        status: persistedStatus,
        notes: notesToPersist,
      });
      pendingStatusesRef.current.delete(bookingId);
      dirtyNoteIdsRef.current.delete(bookingId);
      setBookings((previous) =>
        previous.map((item) =>
          item.id === bookingId
            ? { ...item, status: persistedStatus, notes: notesToPersist }
            : item
        )
      );
      setStatusById((prev) => ({
        ...prev,
        [bookingId]: persistedStatus,
      }));
      setFeedbackById((previous) => ({
        ...previous,
        [bookingId]: {
          tone: "success",
          title: t("admin.book.bookingFor", { client: clientName }),
          message: t("admin.book.actionSucceeded", {
            action: actionLabel,
            client: clientName,
          }),
        },
      }));

      try {
        const result = await loadBookings(appliedFiltersRef.current);
        if (!result.stale && isMountedRef.current) {
          setPageError("");
        }
      } catch (err) {
        if (isMountedRef.current) {
          setPageError(err.message || t("admin.book.loadFailed"));
        }
      }
    } catch (err) {
      if (!isMountedRef.current) {
        return;
      }
      if (nextStatus) {
        setBookings((previous) =>
          previous.map((item) =>
            item.id === bookingId ? { ...item, status: previousStatus } : item
          )
        );
        setStatusById((previous) => ({ ...previous, [bookingId]: previousStatus }));
      }
      setFeedbackById((previous) => ({
        ...previous,
        [bookingId]: {
          tone: "error",
          title: t("admin.book.bookingFor", { client: clientName }),
          message: t("admin.book.actionFailed", {
            action: actionLabel,
            client: clientName,
          }),
          detail: err.message || t("admin.book.genericError"),
        },
      }));
    } finally {
      pendingBookingIdsRef.current.delete(bookingId);
      pendingStatusesRef.current.delete(bookingId);
      if (isMountedRef.current) {
        setPendingById((previous) => {
          const next = { ...previous };
          delete next[bookingId];
          return next;
        });
      }
    }
  }

  const totals = useMemo(() => {
    const map = { pending: 0, confirmed: 0, completed: 0, cancelled: 0, no_show: 0 };
    bookings.forEach((booking) => {
      map[booking.status] = (map[booking.status] || 0) + 1;
    });
    return map;
  }, [bookings]);

  function getQuickActions(status) {
    if (status === "pending") {
      return [
        { value: "confirmed", label: t("admin.book.confirm") },
        { value: "cancelled", label: t("admin.book.cancel") },
        { value: "no_show", label: t("admin.book.noShow") },
      ];
    }
    if (status === "confirmed") {
      return [
        { value: "cancelled", label: t("admin.book.cancel") },
        { value: "no_show", label: t("admin.book.noShow") },
      ];
    }
    return [];
  }

  return (
    <section className="admin-page">
      <AdminPageHeader
        icon="bookings"
        title={t("admin.book.title")}
        description={t("admin.desc.bookings")}
      />

      <div className="admin-stat-grid">
        {STATUSES.map((status) => (
          <div key={status} className={`admin-stat-card admin-stat-card--${STATUS_TONE[status]}`}>
            <span className="admin-stat-card-icon" aria-hidden="true">
              <AdminIcon name={STATUS_ICON[status]} size={18} />
            </span>
            <strong className="admin-stat-card-label">{statusLabel(status) || status}</strong>
            <div className="admin-stat-card-value">{totals[status]}</div>
          </div>
        ))}
      </div>

      <AdminSection
        icon="filter"
        title={t("admin.book.periodFilter")}
        description={t("admin.book.filterHint")}
      >
        <div style={filterWrapStyle}>
          <div>
            <label htmlFor="booking-filter-from" style={labelStyle}>{t("admin.book.from")}</label>
            <input
              id="booking-filter-from"
              type="date"
              className="admin-inline-input"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              style={{ marginTop: 0 }}
            />
          </div>
          <div>
            <label htmlFor="booking-filter-to" style={labelStyle}>{t("admin.book.to")}</label>
            <input
              id="booking-filter-to"
              type="date"
              className="admin-inline-input"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              style={{ marginTop: 0 }}
            />
          </div>
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            style={{ alignSelf: "end" }}
            onClick={() => {
              const filters = { from, to };
              appliedFiltersRef.current = filters;
              loadBookings(filters)
                .then((result) => {
                  if (!result.stale && isMountedRef.current) {
                    setPageError("");
                  }
                })
                .catch((err) => {
                  if (isMountedRef.current) {
                    setPageError(err.message);
                  }
                });
            }}
          >
            {t("admin.book.applyFilter")}
          </button>
        </div>
      </AdminSection>

      {pageError ? <AdminStatusMessage tone="error" toneLabel={t("admin.tone.error")}>{pageError}</AdminStatusMessage> : null}

      <div style={cardsWrapStyle}>
        {bookings.map((booking) => {
          const isPending = Boolean(pendingById[booking.id]);
          const feedback = feedbackById[booking.id];
          const clientName = booking.clientName || "-";

          return (
          <article
            key={booking.id}
            className="admin-card"
            style={{ display: "grid", gap: 10 }}
            aria-busy={isPending ? "true" : "false"}
            aria-label={t("admin.book.bookingFor", { client: clientName })}
          >
            <div style={metaGridStyle}>
              <div>
                <small style={smallStyle}>
                  <AdminIcon name="user" size={13} /> {t("admin.book.client")}
                </small>
                <div>{booking.clientName || "-"}</div>
              </div>
              <div>
                <small style={smallStyle}>
                  <AdminIcon name="clock" size={13} /> {t("admin.book.start")}
                </small>
                <div>{formatDateTime(booking.startsAt)}</div>
              </div>
              <div>
                <small style={smallStyle}>
                  <AdminIcon name="clock" size={13} /> {t("admin.book.end")}
                </small>
                <div>{formatDateTime(booking.endsAt)}</div>
              </div>
              <div>
                <small style={smallStyle}>
                  <AdminIcon name="money" size={13} /> {t("admin.book.priceDuration")}
                </small>
                <div>
                  {booking.totalPriceRsd} EUR / {booking.totalDurationMin} min
                </div>
              </div>
            </div>

            <div>
              <small style={smallStyle}>
                <AdminIcon name="services" size={13} /> {t("admin.book.services")}
              </small>
              <div>{booking.serviceSummary || "-"}</div>
            </div>

            <div style={controlGridStyle}>
              <div>
                <small style={smallStyle}>{t("admin.book.status")}</small>
                <div style={{ marginTop: 6 }}>
                  <span className={`admin-status-badge is-${statusById[booking.id] || booking.status}`}>
                    {statusLabel(statusById[booking.id] || booking.status) ||
                      statusById[booking.id] ||
                      booking.status}
                  </span>
                </div>
              </div>

              <label className="admin-field">
                <span className="admin-field-label">
                  <AdminIcon name="edit" size={15} />
                  {t("admin.book.note")}
                </span>
                <input
                  className="admin-inline-input"
                  aria-label={t("admin.book.note")}
                  value={notesById[booking.id] || ""}
                  disabled={isPending}
                  onChange={(event) =>
                    {
                      dirtyNoteIdsRef.current.add(booking.id);
                      setNotesById((prev) => ({
                        ...prev,
                        [booking.id]: event.target.value,
                      }));
                    }
                  }
                />
                <span className="admin-field-hint">{t("admin.book.noteHint")}</span>
              </label>
            </div>

            {isPending ? (
              <p role="status" aria-live="polite" style={{ margin: 0 }}>
                {t("admin.book.actionInProgress", {
                  action: pendingById[booking.id].actionLabel,
                  client: clientName,
                })}
              </p>
            ) : null}

            {feedback ? (
              <AdminStatusMessage tone={feedback.tone} toneLabel={t(`admin.tone.${feedback.tone}`)} title={feedback.title}>
                {feedback.message}
                {feedback.detail ? ` ${feedback.detail}` : ""}
              </AdminStatusMessage>
            ) : null}

            <div className="admin-btn-row">
              {getQuickActions(statusById[booking.id] || booking.status).map((action) => (
                <button
                  key={`${booking.id}-${action.value}`}
                  type="button"
                  className={`admin-btn admin-btn--sm ${ACTION_VARIANT[action.value] || ""}`.trim()}
                  disabled={isPending}
                  onClick={() => updateBooking(booking.id, action.value, action.label)}
                >
                  <AdminIcon name={STATUS_ICON[action.value] || "check"} size={15} />
                  {action.label}
                </button>
              ))}
              <button
                type="button"
                className="admin-btn admin-btn--sm"
                disabled={isPending}
                onClick={() => updateBooking(booking.id, undefined, t("admin.book.saveNote"))}
              >
                <AdminIcon name="save" size={15} />
                {t("admin.book.saveNote")}
              </button>
            </div>
          </article>
          );
        })}
      </div>

      {!bookings.length ? (
        <AdminEmptyState
          icon="bookings"
          title={t("admin.book.noBookings")}
          description={t("admin.desc.bookings")}
        />
      ) : null}
    </section>
  );
}

const filterWrapStyle = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "flex-end",
};

const cardsWrapStyle = {
  display: "grid",
  gap: 10,
};

const metaGridStyle = {
  display: "grid",
  gap: 8,
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
};

const controlGridStyle = {
  display: "grid",
  gap: 8,
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
};

const labelStyle = {
  display: "block",
  marginBottom: 6,
  fontWeight: 700,
  fontSize: 13,
};

const smallStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  color: "var(--admin-text-faint)",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};
