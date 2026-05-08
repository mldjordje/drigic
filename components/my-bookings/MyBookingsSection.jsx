"use client";

import { useEffect, useMemo, useState } from "react";
import GooglePopupButton from "@/components/auth/GooglePopupButton";
import BookingSelfServiceCard from "@/components/contact/BookingSelfServiceCard";
import { useSession } from "@/components/common/SessionProvider";

async function parseResponse(response) {
  const text = await response.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return null; }
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

function statusColor(status) {
  const s = String(status || "").toLowerCase();
  if (s === "confirmed") return "#4ade80";
  if (s === "pending") return "#fbbf24";
  if (s === "completed") return "#60a5fa";
  if (s === "cancelled" || s === "no_show" || s === "no-show") return "#94a3b8";
  return "#94a3b8";
}

function formatDateTime(iso, locale = "sr-RS") {
  try {
    return new Date(iso).toLocaleString(locale, {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch { return iso; }
}

export default function MyBookingsSection({ googleNextPath = "/moji-termini" }) {
  const { user, isLoading } = useSession();
  const [loading, setLoading] = useState(() => Boolean(isLoading));
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const past = useMemo(() => data?.past || [], [data]);

  useEffect(() => {
    async function load() {
      if (!user) { setData(null); setLoading(false); return; }
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/me/bookings", { cache: "no-store" });
        const json = await parseResponse(res);
        if (!res.ok || !json?.ok) throw new Error(json?.message || "Greška pri učitavanju termina.");
        setData(json);
      } catch (e) {
        setError(e.message || "Greška pri učitavanju termina.");
      } finally {
        setLoading(false);
      }
    }

    if (isLoading) return;
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
            Pregledajte predstojeće i prethodne termine. Predstojeći termin možete prezakazati ili otkazati.
          </p>
        </div>

        {!isLoading && !user ? (
          <div style={loginCardStyle}>
            <p style={{ marginTop: 0, color: "var(--clinic-text-muted)" }}>
              Prijavite se da biste videli svoje termine.
            </p>
            <GooglePopupButton className="btn clinic-glow-btn" nextPath={googleNextPath}>
              Prijavi se
            </GooglePopupButton>
          </div>
        ) : null}

        {!isLoading && user ? (
          <div style={{ display: "grid", gap: 20, maxWidth: 980, margin: "0 auto" }}>

            {/* Predstojeći termini + akcije */}
            <BookingSelfServiceCard />

            {/* Prethodni termini */}
            <div style={sectionCardStyle}>
              <h3 style={{ margin: "0 0 14px", color: "var(--clinic-text-strong)", fontSize: 16 }}>
                Istorija termina
              </h3>

              {loading ? (
                <p style={{ margin: 0, color: "var(--clinic-text-muted)", fontSize: 14 }}>Učitavanje…</p>
              ) : past.length ? (
                <div style={{ display: "grid", gap: 8 }}>
                  {past.slice(0, 20).map((b) => (
                    <div key={b.id} style={pastItemStyle}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "block", color: "var(--clinic-text-strong)", fontSize: 14, fontWeight: 600 }}>
                          {formatDateTime(b.startsAt)}
                        </span>
                        <span style={{ color: "var(--clinic-text-muted)", fontSize: 12 }}>
                          {b.totalDurationMin} min · {b.totalPriceRsd} EUR
                        </span>
                      </div>
                      <span style={{
                        display: "inline-block",
                        padding: "2px 10px",
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 700,
                        color: statusColor(b.status),
                        background: `${statusColor(b.status)}18`,
                        border: `1px solid ${statusColor(b.status)}44`,
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}>
                        {formatBookingStatus(b.status)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, color: "var(--clinic-text-muted)", fontSize: 14 }}>
                  Još nema prethodnih termina.
                </p>
              )}
            </div>

            {error ? <p style={{ margin: 0, color: "var(--clinic-danger)", fontSize: 14 }}>{error}</p> : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

const loginCardStyle = {
  background: "var(--clinic-card-bg)",
  border: "1px solid var(--clinic-card-border)",
  borderRadius: 16,
  padding: 18,
  backdropFilter: "blur(var(--clinic-card-blur, 10px))",
  WebkitBackdropFilter: "blur(var(--clinic-card-blur, 10px))",
  maxWidth: 760,
  margin: "0 auto",
};

const sectionCardStyle = {
  background: "var(--clinic-card-bg)",
  border: "1px solid var(--clinic-card-border)",
  borderRadius: 16,
  padding: "18px 20px",
  backdropFilter: "blur(var(--clinic-card-blur, 10px))",
  WebkitBackdropFilter: "blur(var(--clinic-card-blur, 10px))",
};

const pastItemStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  padding: "10px 12px",
  borderRadius: 10,
  background: "rgba(255,255,255,0.02)",
  border: "1px solid var(--clinic-card-border)",
};
