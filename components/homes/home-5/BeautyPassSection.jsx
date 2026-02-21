"use client";

import { useEffect, useMemo, useState } from "react";
import GooglePopupButton from "@/components/auth/GooglePopupButton";

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

function todayDateInput() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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

function formatMonthLabel(date, locale = "sr-RS") {
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function BeautyPassSection() {
  const [user, setUser] = useState(null);
  const [beautyPass, setBeautyPass] = useState(null);
  const [bookings, setBookings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    treatmentDate: todayDateInput(),
    productId: "",
    notes: "",
  });
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = parseIsoDate(todayDateInput());
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const pastBookings = useMemo(() => bookings?.past || [], [bookings]);
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

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const profileRes = await fetch("/api/me/profile");
      if (!profileRes.ok) {
        setUser(null);
        setBeautyPass(null);
        setBookings(null);
        return;
      }

      const profileData = await parseResponse(profileRes);
      const sessionUser = profileData?.user || null;
      setUser(sessionUser);

      if (!sessionUser) {
        setBeautyPass(null);
        setBookings(null);
        return;
      }

      const [passRes, bookingsRes] = await Promise.all([
        fetch("/api/me/beauty-pass"),
        fetch("/api/me/bookings"),
      ]);

      const passData = await parseResponse(passRes);
      const bookingsData = await parseResponse(bookingsRes);

      if (!passRes.ok || !passData?.ok) {
        throw new Error(passData?.message || "Neuspesno ucitavanje beauty pass podataka.");
      }

      if (!bookingsRes.ok || !bookingsData?.ok) {
        throw new Error(bookingsData?.message || "Neuspesno ucitavanje termina.");
      }

      setBeautyPass(passData);
      setBookings(bookingsData);
    } catch (loadError) {
      setError(loadError.message || "Greska pri ucitavanju beauty pass sekcije.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/me/beauty-pass/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          treatmentDate: form.treatmentDate,
          notes: form.notes,
          productId: form.productId || null,
        }),
      });
      const data = await parseResponse(response);

      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Neuspesno cuvanje unosa.");
      }

      setMessage("Unos je sacuvan u Beauty Pass istoriji.");
      setForm((prev) => ({ ...prev, notes: "" }));
      await loadData();
    } catch (submitError) {
      setError(submitError.message || "Greska pri cuvanju.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space" id="beauty-pass">
      <div className="container">
        <div className="title-area text-center clinic-reveal">
          <h2 className="sec-title text-smoke">Beauty Pass</h2>
          <p className="sec-text text-smoke">Istorija tretmana i licni unos tretmana na jednom mestu.</p>
        </div>

        {loading ? (
          <div style={{ ...glassCardStyle, maxWidth: 960, margin: "0 auto" }}>
            <p style={{ ...mutedTextStyle, margin: 0 }}>Ucitavanje...</p>
          </div>
        ) : null}

        {!loading && !user ? (
          <div className="clinic-login-lock" style={{ ...glassCardStyle, maxWidth: 760, margin: "0 auto" }}>
            <p style={{ ...mutedTextStyle, marginTop: 0 }}>
              Beauty Pass je dostupan nakon prijave.
            </p>
            <GooglePopupButton className="btn clinic-glow-btn" nextPath="/">
              LOGIN WITH GOOGLE
            </GooglePopupButton>
          </div>
        ) : null}

        {!loading && user ? (
          <div className="row g-4">
            <div className="col-lg-6">
              <div style={glassCardStyle}>
                <h3 style={{ ...titleTextStyle, marginTop: 0 }}>Prethodni termini</h3>
                {pastBookings.length ? (
                  <ul style={{ margin: 0, paddingLeft: 18, color: "#edf3ff" }}>
                    {pastBookings.slice(0, 12).map((booking) => (
                      <li key={booking.id} style={{ marginBottom: 8, color: "#edf3ff" }}>
                        {new Date(booking.startsAt).toLocaleString("sr-RS")} - {booking.totalDurationMin} min - {booking.totalPriceRsd} RSD
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ ...mutedTextStyle, marginBottom: 0 }}>Nemate prethodnih termina.</p>
                )}
              </div>
            </div>

            <div className="col-lg-6">
              <div style={glassCardStyle}>
                <h3 style={{ ...titleTextStyle, marginTop: 0 }}>Dodaj sta je radjeno i kada</h3>
                <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10 }}>
                  <label style={{ color: "#edf3ff" }}>Datum</label>
                  <div className="clinic-booking-calendar" style={{ marginBottom: 4 }}>
                    <div className="clinic-cal-header">
                      <button
                        type="button"
                        className="clinic-cal-nav"
                        onClick={() => setCalendarMonth((prev) => addMonths(prev, -1))}
                      >
                        Prethodni
                      </button>
                      <div className="clinic-cal-title">{formatMonthLabel(calendarMonth, "sr-RS")}</div>
                      <button
                        type="button"
                        className="clinic-cal-nav"
                        onClick={() => setCalendarMonth((prev) => addMonths(prev, 1))}
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
                      {calendarCells.map((cell) => (
                        <button
                          key={cell.iso}
                          type="button"
                          className={`clinic-cal-day ${
                            form.treatmentDate === cell.iso ? "is-active" : ""
                          } ${!cell.inCurrentMonth ? "is-out" : ""}`}
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              treatmentDate: cell.iso,
                            }))
                          }
                        >
                          <span>{cell.dayNumber}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <label style={{ color: "#edf3ff", marginTop: 2 }}>
                    Brend preparata
                  </label>
                  <div className="clinic-product-grid">
                    {(beautyPass?.products || []).map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        className={`clinic-product-btn ${
                          form.productId === product.id ? "is-active" : ""
                        }`}
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            productId: prev.productId === product.id ? "" : product.id,
                          }))
                        }
                      >
                        <img src={product.logoUrl} alt={product.name} />
                        <span>{product.name}</span>
                      </button>
                    ))}
                    {!beautyPass?.products?.length ? (
                      <p style={{ ...mutedTextStyle, margin: 0 }}>
                        Trenutno nema dodatih preparata.
                      </p>
                    ) : null}
                  </div>
                  <label style={{ color: "#edf3ff" }}>
                    Sta je radjeno
                    <textarea
                      className="clinic-beauty-notes clinic-glow-field"
                      rows={4}
                      value={form.notes}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, notes: event.target.value }))
                      }
                      placeholder="Npr. Botox celo + korekcija usana..."
                      required
                    />
                  </label>

                  <button type="submit" className="btn clinic-glow-btn" disabled={saving}>
                    {saving ? "Cuvanje..." : "Sacuvaj u Beauty Pass"}
                  </button>
                </form>

                <h4 style={{ ...titleTextStyle, marginTop: 18 }}>Istorija unosa</h4>
                {beautyPass?.treatmentHistory?.length ? (
                  <ul style={{ margin: 0, paddingLeft: 18, color: "#edf3ff" }}>
                    {beautyPass.treatmentHistory.slice(0, 12).map((item) => (
                      <li key={item.id} style={{ marginBottom: 8, color: "#edf3ff" }}>
                        {new Date(item.treatmentDate).toLocaleDateString("sr-RS")}:{" "}
                        {item.notes || "Bez napomene"}
                        {item.product?.name ? ` (${item.product.name})` : ""}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ ...mutedTextStyle, marginBottom: 0 }}>Jos nema unosa.</p>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {message ? <p style={{ color: "#9be39f" }}>{message}</p> : null}
        {error ? <p style={{ color: "#ffabab" }}>{error}</p> : null}
      </div>
    </section>
  );
}

const glassCardStyle = {
  background: "rgba(20, 29, 42, 0.58)",
  border: "1px solid rgba(217, 232, 248, 0.32)",
  borderRadius: 16,
  padding: 18,
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  color: "#edf3ff",
};

const titleTextStyle = {
  color: "#f4f8ff",
};

const mutedTextStyle = {
  color: "#dfe9f8",
};
