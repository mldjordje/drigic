"use client";

import { useEffect, useMemo, useState } from "react";
import GooglePopupButton from "@/components/auth/GooglePopupButton";
import BookingSelfServiceCard from "@/components/contact/BookingSelfServiceCard";
import { useSession } from "@/components/common/SessionProvider";

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

export default function MyBookingsSection({ googleNextPath = "/moji-termini" }) {
  const { user, isLoading } = useSession();
  const [loading, setLoading] = useState(() => Boolean(isLoading));
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const upcoming = useMemo(() => data?.upcoming || [], [data]);
  const past = useMemo(() => data?.past || [], [data]);

  useEffect(() => {
    async function load() {
      if (!user) {
        setData(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/me/bookings", { cache: "no-store" });
        const json = await parseResponse(res);
        if (!res.ok || !json?.ok) {
          throw new Error(json?.message || "Greška pri učitavanju termina.");
        }
        setData(json);
      } catch (e) {
        setError(e.message || "Greška pri učitavanju termina.");
      } finally {
        setLoading(false);
      }
    }

    if (isLoading) {
      return;
    }
    load();
  }, [user, isLoading]);

  return (
    <section className="space" style={{ paddingTop: 24 }}>
      <div className="container">
        <div className="title-area text-center clinic-reveal is-visible">
          <h2 className="sec-title" style={{ color: "var(--clinic-text-strong)" }}>
            Moji termini
          </h2>
          <p className="sec-text" style={{ color: "var(--clinic-text-muted)", maxWidth: 760, margin: "0 auto" }}>
            Pregledajte predstojeće i prethodne termine. Predstojeći termin možete izmeniti ili otkazati.
          </p>
        </div>

        {!isLoading && !user ? (
          <div
            className="clinic-login-lock"
            style={{
              background: "var(--clinic-card-bg)",
              border: "1px solid var(--clinic-card-border)",
              borderRadius: 16,
              padding: 18,
              backdropFilter: "blur(var(--clinic-card-blur, 10px))",
              WebkitBackdropFilter: "blur(var(--clinic-card-blur, 10px))",
              maxWidth: 760,
              margin: "0 auto",
            }}
          >
            <p style={{ marginTop: 0, color: "var(--clinic-text-muted)" }}>
              Prijavite se da biste videli svoje termine.
            </p>
            <GooglePopupButton className="btn clinic-glow-btn" nextPath={googleNextPath}>
              Prijavi se
            </GooglePopupButton>
          </div>
        ) : null}

        {loading ? (
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <p style={{ margin: 0, color: "var(--clinic-text-muted)" }}>Učitavanje…</p>
          </div>
        ) : null}

        {!loading && user ? (
          <div style={{ display: "grid", gap: 16, maxWidth: 980, margin: "0 auto" }}>
            <BookingSelfServiceCard />

            <div
              style={{
                background: "var(--clinic-card-bg)",
                border: "1px solid var(--clinic-card-border)",
                borderRadius: 16,
                padding: 18,
                backdropFilter: "blur(var(--clinic-card-blur, 10px))",
                WebkitBackdropFilter: "blur(var(--clinic-card-blur, 10px))",
              }}
            >
              <h3 style={{ marginTop: 0, color: "var(--clinic-text-strong)" }}>Predstojeći termini</h3>
              {upcoming.length ? (
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {upcoming.map((b) => (
                    <li key={b.id} style={{ marginBottom: 8, color: "var(--clinic-text-strong)" }}>
                      {new Date(b.startsAt).toLocaleString("sr-RS")} — {b.totalDurationMin} min — {b.totalPriceRsd} EUR (
                      {formatBookingStatus(b.status)})
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: 0, color: "var(--clinic-text-muted)" }}>Nemate predstojeći termin.</p>
              )}
            </div>

            <div
              style={{
                background: "var(--clinic-card-bg)",
                border: "1px solid var(--clinic-card-border)",
                borderRadius: 16,
                padding: 18,
                backdropFilter: "blur(var(--clinic-card-blur, 10px))",
                WebkitBackdropFilter: "blur(var(--clinic-card-blur, 10px))",
              }}
            >
              <h3 style={{ marginTop: 0, color: "var(--clinic-text-strong)" }}>Prethodni termini</h3>
              {past.length ? (
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {past.slice(0, 20).map((b) => (
                    <li key={b.id} style={{ marginBottom: 8, color: "var(--clinic-text-strong)" }}>
                      {new Date(b.startsAt).toLocaleString("sr-RS")} — {b.totalDurationMin} min — {b.totalPriceRsd} EUR (
                      {formatBookingStatus(b.status)})
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: 0, color: "var(--clinic-text-muted)" }}>Još nema prethodnih termina.</p>
              )}
            </div>

            {error ? <p style={{ margin: 0, color: "var(--clinic-danger)" }}>{error}</p> : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

