"use client";

import { useEffect, useMemo, useState } from "react";
import GooglePopupButton from "@/components/auth/GooglePopupButton";

async function parseResponse(response) {
  const text = await response.text();
  if (!text) return null;
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

function formatMonthLabel(date) {
  return new Intl.DateTimeFormat("sr-RS", { month: "long", year: "numeric" }).format(date);
}

function formatBookingDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleString("sr-RS", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatHistoryDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString("sr-RS", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function BeautyPassSection({ googleNextPath = "/" }) {
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
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return formatter.format(d);
    });
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const profileRes = await fetch("/api/me/profile");
      if (!profileRes.ok) {
        setUser(null); setBeautyPass(null); setBookings(null);
        return;
      }
      const profileData = await parseResponse(profileRes);
      const sessionUser = profileData?.user || null;
      setUser(sessionUser);
      if (!sessionUser) {
        setBeautyPass(null); setBookings(null);
        return;
      }
      const [passRes, bookingsRes] = await Promise.all([
        fetch("/api/me/beauty-pass"),
        fetch("/api/me/bookings"),
      ]);
      const passData = await parseResponse(passRes);
      const bookingsData = await parseResponse(bookingsRes);
      if (!passRes.ok || !passData?.ok) throw new Error(passData?.message || "Greška pri učitavanju beauty pass podataka.");
      if (!bookingsRes.ok || !bookingsData?.ok) throw new Error(bookingsData?.message || "Greška pri učitavanju termina.");
      setBeautyPass(passData);
      setBookings(bookingsData);
    } catch (e) {
      setError(e.message || "Greška pri učitavanju.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setError(""); setMessage("");
    try {
      const res = await fetch("/api/me/beauty-pass/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ treatmentDate: form.treatmentDate, notes: form.notes, productId: form.productId || null }),
      });
      const data = await parseResponse(res);
      if (!res.ok || !data?.ok) throw new Error(data?.message || "Neuspešno čuvanje unosa.");
      setMessage("Unos je sačuvan u Beauty Pass istoriji.");
      setForm((prev) => ({ ...prev, notes: "" }));
      await loadData();
    } catch (e) {
      setError(e.message || "Greška pri čuvanju.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="clinic-bp" id="beauty-pass">
      <div className="container">

        {/* Header */}
        <div className="clinic-bp__header">
          <span className="clinic-bp__tag">Moj nalog</span>
          <h2 className="clinic-bp__title">Beauty Pass</h2>
          <p className="clinic-bp__subtitle">Istorija tretmana i lični unos na jednom mestu.</p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="clinic-bp__loader">
            <span className="clinic-bp__loader-dot" />
            <span className="clinic-bp__loader-dot" />
            <span className="clinic-bp__loader-dot" />
          </div>
        )}

        {/* Not logged in */}
        {!loading && !user && (
          <div className="clinic-bp__lock">
            <p className="clinic-bp__lock-text">Beauty Pass je dostupan nakon prijave.</p>
            <GooglePopupButton className="clinic-bp__login-btn" nextPath={googleNextPath}>
              Prijavi se
            </GooglePopupButton>
          </div>
        )}

        {/* Main content */}
        {!loading && user && (
          <div className="clinic-bp__grid">

            {/* LEFT — Previous bookings */}
            <div className="clinic-bp__card">
              <div className="clinic-bp__card-label">Prethodni termini</div>
              {pastBookings.length ? (
                <ul className="clinic-bp__booking-list">
                  {pastBookings.slice(0, 10).map((b) => (
                    <li key={b.id} className="clinic-bp__booking-item">
                      <span className="clinic-bp__booking-dot" />
                      <div className="clinic-bp__booking-info">
                        <span className="clinic-bp__booking-date">{formatBookingDate(b.startsAt)}</span>
                        <span className="clinic-bp__booking-meta">{b.totalDurationMin} min &middot; {b.totalPriceRsd} EUR</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="clinic-bp__empty">Nemate prethodnih termina.</p>
              )}

              {/* Treatment history */}
              {beautyPass?.treatmentHistory?.length ? (
                <>
                  <div className="clinic-bp__card-label" style={{ marginTop: 28 }}>Istorija unosa</div>
                  <ul className="clinic-bp__booking-list">
                    {beautyPass.treatmentHistory.slice(0, 10).map((item) => (
                      <li key={item.id} className="clinic-bp__booking-item">
                        <span className="clinic-bp__booking-dot" />
                        <div className="clinic-bp__booking-info">
                          <span className="clinic-bp__booking-date">{formatHistoryDate(item.treatmentDate)}</span>
                          <span className="clinic-bp__booking-meta">
                            {item.notes || "Bez napomene"}
                            {item.product?.name ? ` · ${item.product.name}` : ""}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </div>

            {/* RIGHT — Add entry form */}
            <div className="clinic-bp__card clinic-bp__card--form">
              <div className="clinic-bp__card-label">Dodaj tretman</div>

              <form onSubmit={handleSubmit}>
                {/* Calendar */}
                <div className="clinic-bp__cal-wrap">
                  <div className="clinic-bp__cal-header">
                    <button
                      type="button"
                      className="clinic-bp__cal-nav"
                      onClick={() => setCalendarMonth((prev) => addMonths(prev, -1))}
                      aria-label="Prethodni mesec"
                    >
                      ←
                    </button>
                    <span className="clinic-bp__cal-title">{formatMonthLabel(calendarMonth)}</span>
                    <button
                      type="button"
                      className="clinic-bp__cal-nav"
                      onClick={() => setCalendarMonth((prev) => addMonths(prev, 1))}
                      aria-label="Sledeći mesec"
                    >
                      →
                    </button>
                  </div>

                  <div className="clinic-bp__cal-weekdays">
                    {weekdayLabels.map((label) => (
                      <span key={label}>{label}</span>
                    ))}
                  </div>

                  <div className="clinic-bp__cal-grid">
                    {calendarCells.map((cell) => (
                      <button
                        key={cell.iso}
                        type="button"
                        className={`clinic-bp__cal-day${form.treatmentDate === cell.iso ? " is-selected" : ""}${!cell.inCurrentMonth ? " is-out" : ""}`}
                        onClick={() => setForm((prev) => ({ ...prev, treatmentDate: cell.iso }))}
                      >
                        {cell.dayNumber}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Products */}
                {beautyPass?.products?.length ? (
                  <div className="clinic-bp__field-group">
                    <label className="clinic-bp__field-label">Brend preparata</label>
                    <div className="clinic-bp__products">
                      {beautyPass.products.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          className={`clinic-bp__product${form.productId === product.id ? " is-selected" : ""}`}
                          onClick={() => setForm((prev) => ({
                            ...prev,
                            productId: prev.productId === product.id ? "" : product.id,
                          }))}
                        >
                          <img src={product.logoUrl} alt={product.name} />
                          <span>{product.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Notes */}
                <div className="clinic-bp__field-group">
                  <label className="clinic-bp__field-label">Šta je rađeno</label>
                  <textarea
                    className="clinic-bp__textarea"
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Npr. Botoks čelo + korekcija usana..."
                    required
                  />
                </div>

                {message && <p className="clinic-bp__msg clinic-bp__msg--ok">{message}</p>}
                {error && <p className="clinic-bp__msg clinic-bp__msg--err">{error}</p>}

                <button type="submit" className="clinic-bp__submit" disabled={saving}>
                  {saving ? "Čuvanje..." : "Sačuvaj u Beauty Pass"}
                </button>
              </form>
            </div>

          </div>
        )}

      </div>
    </section>
  );
}
