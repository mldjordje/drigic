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

  const [rescheduleDate, setRescheduleDate] = useState(() => todayIsoDate());
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedStartAt, setSelectedStartAt] = useState("");
  const [reason, setReason] = useState("");

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
          durationMin: String(Math.max(5, Number(activeBooking.totalDurationMin || 15))),
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
  }, [activeBooking, activeBookingId, rescheduleDate]);

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
              <label style={{ display: "grid", gap: 6, marginBottom: 12 }}>
                <span style={{ fontWeight: 700, color: "var(--clinic-text-strong)" }}>
                  Izaberite novi datum
                </span>
                <input
                  type="date"
                  value={rescheduleDate}
                  min={todayIsoDate()}
                  onChange={(e) => setRescheduleDate(e.target.value)}
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

              <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
                <span style={{ fontWeight: 700, color: "var(--clinic-text-strong)" }}>
                  Slobodni slotovi
                </span>
                {slotsLoading ? (
                  <p style={{ margin: 0, color: "var(--clinic-text-muted)" }}>{t("common.loading")}</p>
                ) : slots.length ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {slots.map((slot) => (
                      <button
                        key={slot.startAt}
                        type="button"
                        onClick={() => setSelectedStartAt(slot.startAt)}
                        className="clinic-slot-button"
                        style={{
                          borderRadius: 10,
                          border: "1px solid var(--clinic-card-border)",
                          padding: "8px 10px",
                          background:
                            selectedStartAt === slot.startAt ? "var(--clinic-button-bg)" : "transparent",
                          color:
                            selectedStartAt === slot.startAt
                              ? "var(--clinic-button-text)"
                              : "var(--clinic-text-strong)",
                          fontWeight: 800,
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
                  Izmeni termin
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

