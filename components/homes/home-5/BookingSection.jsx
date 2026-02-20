"use client";

import { useEffect, useState } from "react";
import BookingInlineForm from "@/components/booking/BookingInlineForm";
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

export default function BookingSection() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me/profile")
      .then(async (res) => {
        if (!res.ok) {
          return null;
        }
        const data = await parseResponse(res);
        return data?.user || null;
      })
      .then((sessionUser) => setUser(sessionUser))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="space" id="booking">
      <div className="container">
        <div className="title-area text-center clinic-reveal">
          <h2 className="sec-title text-smoke">Zakazite termin</h2>
          <p className="sec-text text-smoke">
            Sve je na pocetnoj: prijava, booking i beauty pass.
          </p>
        </div>

        {loading ? (
          <div style={{ ...glassCardStyle, maxWidth: 760, margin: "0 auto" }}>
            <p style={{ margin: 0, color: "#e8f1ff" }}>Ucitavanje...</p>
          </div>
        ) : null}

        {!loading && !user ? (
          <div className="clinic-login-lock" style={{ ...glassCardStyle, maxWidth: 760, margin: "0 auto" }}>
            <p style={{ marginTop: 0, color: "#e8f1ff" }}>
              Da biste zakazali termin, prvo se prijavite preko Google naloga.
            </p>
            <GooglePopupButton className="btn clinic-glow-btn" nextPath="/">
              LOGIN WITH GOOGLE
            </GooglePopupButton>
          </div>
        ) : null}

        {!loading && user ? <BookingInlineForm googleNextPath="/" showUpcoming={false} /> : null}
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
