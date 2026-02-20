"use client";

import { useEffect, useMemo, useState } from "react";
import OtpLoginPanel from "@/components/forms/OtpLoginPanel";

function todayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function BookingPage() {
  const [user, setUser] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [date, setDate] = useState(todayIsoDate());
  const [availability, setAvailability] = useState([]);
  const [selectedStartAt, setSelectedStartAt] = useState("");
  const [quote, setQuote] = useState(null);
  const [notes, setNotes] = useState("");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const flatServices = useMemo(
    () => services.flatMap((category) => category.services || []),
    [services]
  );

  async function loadSession() {
    const response = await fetch("/api/me/profile");
    if (!response.ok) {
      setUser(null);
      return;
    }
    const data = await response.json();
    setUser(data.user || null);
  }

  async function loadServices() {
    const response = await fetch("/api/services");
    const data = await response.json();
    if (!response.ok || !data?.ok) {
      throw new Error(data?.message || "Neuspešno učitavanje usluga.");
    }
    setServices(data.categories || []);
  }

  async function loadMyBookings() {
    const response = await fetch("/api/me/bookings");
    if (!response.ok) {
      return;
    }
    const data = await response.json();
    setBookings(data.upcoming || []);
  }

  useEffect(() => {
    loadSession().catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }
    loadServices().catch((err) => setError(err.message));
    loadMyBookings().catch(() => {});
  }, [user]);

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
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok || !data?.ok) {
          throw new Error(data?.message || "Neuspešan izračun ponude.");
        }
        setQuote(data);
      })
      .catch((err) => setError(err.message));
  }, [selectedServices]);

  useEffect(() => {
    if (!selectedServices.length || !date) {
      setAvailability([]);
      return;
    }

    const params = new URLSearchParams({
      date,
      serviceIds: selectedServices.join(","),
    });

    fetch(`/api/bookings/availability?${params.toString()}`)
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok || !data?.ok) {
          throw new Error(data?.message || "Neuspešno učitavanje termina.");
        }
        setAvailability(data.slots || []);
      })
      .catch((err) => setError(err.message));
  }, [selectedServices, date]);

  async function handleBook(event) {
    event.preventDefault();
    setError("");
    setMessage("");

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
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Zakazivanje nije uspelo.");
      }

      setMessage("Termin je uspešno zakazan.");
      setSelectedStartAt("");
      setNotes("");
      await loadMyBookings();
    } catch (err) {
      setError(err.message || "Greška pri zakazivanju.");
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <main style={pageStyle}>
        <div style={containerStyle}>
          <h1 style={{ marginTop: 0 }}>Online booking</h1>
          <OtpLoginPanel
            title="Prijavite se da zakažete termin"
            onAuthenticated={(loggedUser) => setUser(loggedUser)}
          />
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <h1 style={{ marginTop: 0 }}>Zakazivanje termina</h1>
        <p style={{ color: "#d2dced" }}>
          Prijavljeni ste kao <strong>{user.email}</strong>.
        </p>

        <form onSubmit={handleBook} style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>1) Izaberite tretmane</h2>
          {services.map((category) => (
            <div key={category.id} style={{ marginBottom: 14 }}>
              <h3 style={{ marginBottom: 8 }}>{category.name}</h3>
              <div style={{ display: "grid", gap: 8 }}>
                {(category.services || []).map((service) => (
                  <label key={service.id} style={checkboxRowStyle}>
                    <input
                      type="checkbox"
                      checked={selectedServices.includes(service.id)}
                      onChange={(event) => {
                        setSelectedStartAt("");
                        if (event.target.checked) {
                          setSelectedServices((prev) => [...prev, service.id]);
                        } else {
                          setSelectedServices((prev) =>
                            prev.filter((id) => id !== service.id)
                          );
                        }
                      }}
                    />
                    <span>
                      {service.name} - {service.durationMin} min -{" "}
                      {service.promotion?.promoPriceRsd || service.priceRsd} RSD
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <h2>2) Datum i vreme</h2>
          <label style={labelStyle}>Datum</label>
          <input
            type="date"
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              setSelectedStartAt("");
            }}
            min={todayIsoDate()}
            style={inputStyle}
          />

          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {availability.filter((slot) => slot.available).length ? (
              availability
                .filter((slot) => slot.available)
                .map((slot) => (
                  <button
                    type="button"
                    key={slot.startAt}
                    onClick={() => setSelectedStartAt(slot.startAt)}
                    style={{
                      ...slotButtonStyle,
                      ...(selectedStartAt === slot.startAt
                        ? selectedSlotButtonStyle
                        : null),
                    }}
                  >
                    {new Date(slot.startAt).toLocaleTimeString("sr-RS", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </button>
                ))
            ) : (
              <p style={{ color: "#c7d8ef" }}>
                Nema slobodnih termina za izabrani datum/usluge.
              </p>
            )}
          </div>

          <h2 style={{ marginTop: 20 }}>3) Napomena</h2>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            style={{ ...inputStyle, resize: "vertical" }}
            placeholder="Opciona napomena za doktora..."
          />

          {quote ? (
            <div style={summaryStyle}>
              <strong>Ukupno:</strong> {quote.totalDurationMin} min /{" "}
              {quote.totalPriceRsd} RSD
            </div>
          ) : null}

          <button type="submit" style={primaryButtonStyle} disabled={loading}>
            {loading ? "Zakazivanje..." : "Potvrdi zakazivanje"}
          </button>

          {message ? <p style={{ color: "#9be39f" }}>{message}</p> : null}
          {error ? <p style={{ color: "#ff9f9f" }}>{error}</p> : null}
        </form>

        <section style={{ ...cardStyle, marginTop: 16 }}>
          <h2 style={{ marginTop: 0 }}>Moji naredni termini</h2>
          {bookings.length ? (
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              {bookings.map((booking) => (
                <li key={booking.id} style={{ marginBottom: 8 }}>
                  {new Date(booking.startsAt).toLocaleString("sr-RS")} -{" "}
                  {booking.totalDurationMin} min - {booking.totalPriceRsd} RSD (
                  {booking.status})
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ marginBottom: 0, color: "#d2dced" }}>Nema zakazanih termina.</p>
          )}
        </section>
      </div>
    </main>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#0A0C00",
  color: "#f2f5fb",
  padding: "32px 14px",
};

const containerStyle = {
  maxWidth: 960,
  margin: "0 auto",
};

const cardStyle = {
  background: "rgba(217,232,248,0.14)",
  border: "1px solid rgba(217,232,248,0.28)",
  borderRadius: 16,
  padding: 18,
};

const labelStyle = {
  display: "block",
  marginBottom: 6,
  fontWeight: 600,
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
};

const slotButtonStyle = {
  borderRadius: 8,
  border: "1px solid rgba(217,232,248,0.4)",
  background: "transparent",
  color: "#d9e8f8",
  padding: "8px 10px",
  cursor: "pointer",
};

const selectedSlotButtonStyle = {
  background: "#d9e8f8",
  color: "#102844",
  borderColor: "#d9e8f8",
};

const primaryButtonStyle = {
  borderRadius: 10,
  border: "1px solid rgba(217,232,248,0.6)",
  background: "#d9e8f8",
  color: "#102844",
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
};

