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
    notes: "",
  });

  const pastBookings = useMemo(() => bookings?.past || [], [bookings]);

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
        body: JSON.stringify(form),
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
          <div className="admin-card" style={{ maxWidth: 960, margin: "0 auto" }}>
            <p style={{ margin: 0 }}>Ucitavanje...</p>
          </div>
        ) : null}

        {!loading && !user ? (
          <div className="admin-card clinic-login-lock" style={{ maxWidth: 760, margin: "0 auto" }}>
            <p style={{ marginTop: 0 }}>
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
              <div className="admin-card">
                <h3 style={{ marginTop: 0 }}>Prethodni termini</h3>
                {pastBookings.length ? (
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {pastBookings.slice(0, 12).map((booking) => (
                      <li key={booking.id} style={{ marginBottom: 8 }}>
                        {new Date(booking.startsAt).toLocaleString("sr-RS")} - {booking.totalDurationMin} min - {booking.totalPriceRsd} RSD
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ marginBottom: 0 }}>Nemate prethodnih termina.</p>
                )}
              </div>
            </div>

            <div className="col-lg-6">
              <div className="admin-card">
                <h3 style={{ marginTop: 0 }}>Dodaj sta je radjeno i kada</h3>
                <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10 }}>
                  <label>
                    Datum
                    <input
                      type="date"
                      className="admin-inline-input"
                      value={form.treatmentDate}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, treatmentDate: event.target.value }))
                      }
                      required
                    />
                  </label>
                  <label>
                    Sta je radjeno
                    <textarea
                      className="admin-inline-textarea"
                      rows={4}
                      value={form.notes}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, notes: event.target.value }))
                      }
                      placeholder="Npr. Botox celo + korekcija usana..."
                      required
                    />
                  </label>

                  <button type="submit" className="admin-template-link-btn" disabled={saving}>
                    {saving ? "Cuvanje..." : "Sacuvaj u Beauty Pass"}
                  </button>
                </form>

                <h4 style={{ marginTop: 18 }}>Istorija unosa</h4>
                {beautyPass?.treatmentHistory?.length ? (
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {beautyPass.treatmentHistory.slice(0, 12).map((item) => (
                      <li key={item.id} style={{ marginBottom: 8 }}>
                        {new Date(item.treatmentDate).toLocaleDateString("sr-RS")}: {item.notes || "Bez napomene"}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ marginBottom: 0 }}>Jos nema unosa.</p>
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
