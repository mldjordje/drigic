"use client";

import { useEffect, useMemo, useState } from "react";

function todayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseIsoDate(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
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

export default function BookingInlineForm({
  googleNextPath = "/",
  cardClassName = "",
  showUpcoming = true,
}) {
  const [user, setUser] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [date, setDate] = useState(todayIsoDate());
  const [availability, setAvailability] = useState([]);
  const [monthAvailability, setMonthAvailability] = useState({});
  const [monthLoading, setMonthLoading] = useState(false);
  const [calendarError, setCalendarError] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = parseIsoDate(todayIsoDate());
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedStartAt, setSelectedStartAt] = useState("");
  const [quote, setQuote] = useState(null);
  const [notes, setNotes] = useState("");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const today = useMemo(() => todayIsoDate(), []);
  const monthKey = useMemo(() => formatMonthKey(calendarMonth), [calendarMonth]);
  const canGoPrevMonth = useMemo(() => {
    const todayMonth = today.slice(0, 7);
    return monthKey > todayMonth;
  }, [monthKey, today]);
  const calendarCells = useMemo(() => buildCalendarCells(calendarMonth), [calendarMonth]);
  const weekdayLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat("sr-RS", { weekday: "short" });
    const monday = new Date(2024, 0, 1);

    return Array.from({ length: 7 }, (_, index) => {
      const item = new Date(monday);
      item.setDate(monday.getDate() + index);
      return formatter.format(item);
    });
  }, []);

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
      return new Intl.DateTimeFormat("sr-RS", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(parseIsoDate(date));
    } catch {
      return date;
    }
  }, [date]);

  const availableSlotsForDay = useMemo(
    () => availability.filter((slot) => slot.available),
    [availability]
  );

  const sortedAvailableSlots = useMemo(
    () =>
      [...availableSlotsForDay].sort(
        (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
      ),
    [availableSlotsForDay]
  );

  const selectedServiceLabels = useMemo(() => {
    if (!selectedServices.length) {
      return [];
    }
    const map = new Map();
    services.forEach((category) => {
      (category.services || []).forEach((service) => {
        map.set(service.id, service);
      });
    });
    return selectedServices
      .map((id) => map.get(id))
      .filter(Boolean)
      .map((service) => `${service.name} (${service.durationMin} min)`);
  }, [services, selectedServices]);

  async function loadSession() {
    const response = await fetch("/api/me/profile");
    if (!response.ok) {
      setUser(null);
      return;
    }
    const data = await parseResponse(response);
    setUser(data.user || null);
  }

  async function loadServices() {
    const response = await fetch("/api/services");
    const data = await parseResponse(response);
    if (!response.ok || !data?.ok) {
      throw new Error(data?.message || "Neuspesno ucitavanje usluga.");
    }
    setServices(data.categories || []);
  }

  async function loadMyBookings() {
    const response = await fetch("/api/me/bookings");
    if (!response.ok) {
      return;
    }
    const data = await parseResponse(response);
    setBookings(data.upcoming || []);
  }

  useEffect(() => {
    let mounted = true;
    loadSession()
      .catch(() => {})
      .finally(() => {
        if (mounted) {
          setIsBootstrapping(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    loadServices().catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!user) {
      setBookings([]);
      return;
    }

    if (!showUpcoming) {
      return;
    }
    loadMyBookings().catch(() => {});
  }, [user, showUpcoming]);

  useEffect(() => {
    if (!selectedServices.length) {
      setQuote(null);
      return;
    }

    fetch("/api/bookings/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceIds: selectedServices }),
    })
      .then(async (res) => ({ ok: res.ok, data: await parseResponse(res) }))
      .then(({ ok, data }) => {
        if (!ok || !data?.ok) {
          throw new Error(data?.message || "Neuspesan izracun ponude.");
        }
        setError("");
        setQuote(data);
      })
      .catch((err) => setError(err.message));
  }, [selectedServices]);

  useEffect(() => {
    if (!selectedServices.length) {
      setMonthAvailability({});
      setCalendarError("");
      return;
    }

    let cancelled = false;
    setMonthLoading(true);
    setCalendarError("");

    const params = new URLSearchParams({
      month: monthKey,
      serviceIds: selectedServices.join(","),
    });

    fetch(`/api/bookings/availability?${params.toString()}`)
      .then(async (res) => ({ ok: res.ok, data: await parseResponse(res) }))
      .then(({ ok, data }) => {
        if (!ok || !data?.ok) {
          throw new Error(data?.message || "Neuspesno ucitavanje mesecnog kalendara.");
        }

        const map = {};
        (data.days || []).forEach((day) => {
          map[day.date] = Number(day.availableSlots) || 0;
        });

        if (!cancelled) {
          setMonthAvailability(map);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setCalendarError(err.message || "Neuspesno ucitavanje kalendara.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setMonthLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedServices, monthKey]);

  useEffect(() => {
    if (!selectedServices.length || monthLoading) {
      return;
    }

    const availableDates = Object.entries(monthAvailability)
      .filter(([day, count]) => day.startsWith(monthKey) && Number(count) > 0 && day >= today)
      .map(([day]) => day)
      .sort();

    if (!availableDates.length) {
      return;
    }

    const selectedDateCount = Number(monthAvailability[date] || 0);
    if (!date.startsWith(monthKey) || selectedDateCount <= 0) {
      setDate(availableDates[0]);
      setSelectedStartAt("");
    }
  }, [selectedServices, monthAvailability, monthKey, date, monthLoading, today]);

  useEffect(() => {
    if (!selectedServices.length || !date) {
      setAvailability([]);
      return;
    }

    let cancelled = false;
    const params = new URLSearchParams({
      date,
      serviceIds: selectedServices.join(","),
    });

    fetch(`/api/bookings/availability?${params.toString()}`)
      .then(async (res) => ({ ok: res.ok, data: await parseResponse(res) }))
      .then(({ ok, data }) => {
        if (!ok || !data?.ok) {
          throw new Error(data?.message || "Neuspesno ucitavanje termina.");
        }
        if (!cancelled) {
          setAvailability(data.slots || []);
          setCalendarError("");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setCalendarError(err.message || "Neuspesno ucitavanje termina.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedServices, date]);

  async function handleBook(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!user) {
      const nextPath = encodeURIComponent(googleNextPath || "/booking");
      window.location.href = `/api/auth/google?next=${nextPath}`;
      return;
    }

    if (!selectedServices.length) {
      setError("Izaberite barem jednu uslugu.");
      return;
    }

    if (!selectedStartAt) {
      setError("Izaberite slobodan termin.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceIds: selectedServices,
          startAt: selectedStartAt,
          notes,
        }),
      });
      const data = await parseResponse(response);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Zakazivanje nije uspelo.");
      }

      setError("");
      setMessage("Termin je uspesno zakazan.");
      setSelectedStartAt("");
      setNotes("");
      await loadMyBookings();
    } catch (err) {
      setError(err.message || "Greska pri zakazivanju.");
    } finally {
      setLoading(false);
    }
  }

  const sectionClassName = ["clinic-booking-form", cardClassName].filter(Boolean).join(" ");

  if (isBootstrapping) {
    return (
      <section className={sectionClassName} style={cardStyle}>
        <h2 style={{ marginTop: 0, color: "#f2f5fb" }}>Booking</h2>
        <p style={{ color: "#e6eefb", marginBottom: 0 }}>Ucitavanje...</p>
      </section>
    );
  }

  return (
    <section className={sectionClassName} style={cardStyle}>
      <h2 style={{ marginTop: 0, color: "#f2f5fb" }}>Zakazivanje termina</h2>
      {user ? (
        <p style={{ color: "#e6eefb" }}>
          Prijavljeni ste kao <strong>{user.email}</strong>.
        </p>
      ) : (
        <div style={guestNoticeStyle}>
          <span>Forma je otvorena svima. Za potvrdu termina potreban je login.</span>
          <a
            href={`/api/auth/google?next=${encodeURIComponent(googleNextPath)}`}
            style={authButtonStyle}
          >
            Login with Google
          </a>
        </div>
      )}

      <form onSubmit={handleBook}>
        <h3 style={{ color: "#f2f5fb" }}>1) Izaberite tretmane</h3>
        {selectedServiceLabels.length ? (
          <div className="clinic-selected-services">
            {selectedServiceLabels.map((label) => (
              <span key={label} className="clinic-selected-service-chip">
                {label}
              </span>
            ))}
          </div>
        ) : null}
        {services.map((category) => (
          <div key={category.id} className="clinic-service-category">
            <h4 style={{ marginBottom: 8, color: "#f2f5fb" }}>{category.name}</h4>
            <div style={{ display: "grid", gap: 8 }}>
              {(category.services || []).map((service) => (
                <label
                  key={service.id}
                  style={checkboxRowStyle}
                  className={`clinic-service-option ${
                    selectedServices.includes(service.id) ? "is-selected" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedServices.includes(service.id)}
                    onChange={(event) => {
                      setError("");
                      setMessage("");
                      setSelectedStartAt("");

                      if (event.target.checked) {
                        setSelectedServices((prev) =>
                          prev.includes(service.id) ? prev : [...prev, service.id]
                        );
                      } else {
                        setSelectedServices((prev) => prev.filter((id) => id !== service.id));
                      }
                    }}
                  />
                  <span style={{ color: "#f2f5fb" }}>
                    {service.name} - {service.durationMin} min -{" "}
                    {service.promotion?.promoPriceRsd || service.priceRsd} RSD
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}

        <h3 style={{ color: "#f2f5fb" }}>2) Datum i vreme</h3>

        {!selectedServices.length ? (
          <p style={{ color: "#e6eefb" }}>Prvo izaberite uslugu da biste videli slobodne datume.</p>
        ) : (
          <>
            <div className="clinic-booking-calendar">
              <div className="clinic-cal-header">
                <button
                  type="button"
                  className="clinic-cal-nav"
                  disabled={!canGoPrevMonth}
                  onClick={() => {
                    setCalendarMonth((prev) => addMonths(prev, -1));
                  }}
                >
                  Prethodni
                </button>
                <div className="clinic-cal-title">{formatMonthLabel(calendarMonth, "sr-RS")}</div>
                <button
                  type="button"
                  className="clinic-cal-nav"
                  onClick={() => {
                    setCalendarMonth((prev) => addMonths(prev, 1));
                  }}
                >
                  Sledeci
                </button>
              </div>

              <div className="clinic-cal-weekdays">
                {weekdayLabels.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>

              <div className="clinic-cal-grid">
                {calendarCells.map((cell) => {
                  const availableCount = monthAvailability[cell.iso];
                  const isPast = cell.iso < today;
                  const isActive = cell.iso === date;
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
                        setDate(cell.iso);
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

            <div className="clinic-slot-section">
              <div className="clinic-slot-header">
                <h4>{selectedDateLabel}</h4>
                {calendarError ? <span>{calendarError}</span> : null}
              </div>

              <div className="clinic-slot-items">
                {sortedAvailableSlots.length ? (
                  sortedAvailableSlots.map((slot) => (
                    <button
                      type="button"
                      key={slot.startAt}
                      onClick={() => setSelectedStartAt(slot.startAt)}
                      className={`clinic-slot-button ${
                        selectedStartAt === slot.startAt ? "is-active" : ""
                      }`}
                    >
                      {new Date(slot.startAt).toLocaleTimeString("sr-RS", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </button>
                  ))
                ) : (
                  <p style={{ color: "#e6eefb", marginBottom: 0 }}>
                    Nema slobodnih termina za izabrani datum/usluge.
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        <h3 style={{ marginTop: 20, color: "#f2f5fb" }}>3) Napomena</h3>
        <textarea
          className="clinic-booking-note-input clinic-glow-field"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={4}
          style={{ ...inputStyle, resize: "vertical" }}
          placeholder="Opciona napomena za doktora..."
        />

        {quote ? (
          <div style={summaryStyle}>
            <strong>Ukupno:</strong> {quote.totalDurationMin} min / {quote.totalPriceRsd} RSD
          </div>
        ) : null}

        <button type="submit" style={primaryButtonStyle} disabled={loading}>
          {loading ? "Zakazivanje..." : "Potvrdi zakazivanje"}
        </button>

        {message ? <p style={{ color: "#9be39f" }}>{message}</p> : null}
        {error ? <p style={{ color: "#ff9f9f" }}>{error}</p> : null}
      </form>

      {showUpcoming && user ? (
        <section style={{ ...cardStyle, marginTop: 16 }}>
          <h3 style={{ marginTop: 0, color: "#f2f5fb" }}>Moji naredni termini</h3>
          {bookings.length ? (
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              {bookings.map((booking) => (
                <li key={booking.id} style={{ marginBottom: 8, color: "#f2f5fb" }}>
                  {new Date(booking.startsAt).toLocaleString("sr-RS")} - {booking.totalDurationMin} min -{" "}
                  {booking.totalPriceRsd} RSD ({booking.status})
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ marginBottom: 0, color: "#e6eefb" }}>Nema zakazanih termina.</p>
          )}
        </section>
      ) : null}
    </section>
  );
}

const cardStyle = {
  background: "rgba(20, 29, 42, 0.48)",
  border: "1px solid rgba(217,232,248,0.28)",
  borderRadius: 16,
  padding: 18,
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

const inputStyle = {
  width: "100%",
  borderRadius: 10,
  border: "1px solid rgba(217,232,248,0.35)",
  padding: "10px 12px",
  background: "rgba(10,12,0,0.5)",
  color: "#f2f5fb",
};

const checkboxRowStyle = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  padding: "8px 10px",
  border: "1px solid rgba(217,232,248,0.2)",
  borderRadius: 8,
};

const summaryStyle = {
  marginTop: 14,
  marginBottom: 14,
  padding: "10px 12px",
  borderRadius: 10,
  background: "rgba(217,232,248,0.12)",
  border: "1px solid rgba(217,232,248,0.28)",
  color: "#f2f5fb",
};

const primaryButtonStyle = {
  borderRadius: 10,
  border: "1px solid rgba(217,232,248,0.6)",
  background: "rgba(20, 38, 61, 0.95)",
  color: "#f4f8ff",
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
};

const authButtonStyle = {
  borderRadius: 10,
  border: "1px solid rgba(217,232,248,0.55)",
  background: "rgba(20, 38, 61, 0.95)",
  color: "#f4f8ff",
  padding: "10px 14px",
  fontWeight: 700,
  textDecoration: "none",
  display: "inline-flex",
};

const guestNoticeStyle = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  padding: "10px 12px",
  marginBottom: 10,
  borderRadius: 10,
  border: "1px solid rgba(217,232,248,0.28)",
  background: "rgba(217,232,248,0.08)",
  color: "#e6eefb",
};
