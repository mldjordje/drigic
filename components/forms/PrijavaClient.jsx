"use client";

import Link from "next/link";
import GoogleSignInButton from "@/components/forms/GoogleSignInButton";

const reasonMessages = {
  "admin-required": "Za pristup admin panelu potrebno je da se prijavite admin nalogom.",
  "admin-forbidden": "Nalog je prijavljen, ali nema admin privilegije.",
  "google-config-missing":
    "Google prijava nije konfigurisana. Dodajte GOOGLE_CLIENT_ID i GOOGLE_CLIENT_SECRET u .env.local i na Vercel.",
  "google-denied": "Google prijava je otkazana.",
  "google-state-invalid": "Bezbednosna provera nije prošla. Pokušajte ponovo.",
  "google-token-failed": "Google token nije dobijen. Pokušajte ponovo.",
  "google-userinfo-failed": "Ne mogu da preuzmem Google profil. Pokušajte ponovo.",
  "google-email-missing": "Google nalog nema email adresu.",
  "google-auth-failed": "Google prijava nije uspela. Pokušajte ponovo.",
};

export default function PrijavaClient({ nextPath = "/", reason = "" }) {
  const message = reasonMessages[reason] || "";
  const isError =
    reason &&
    reason !== "admin-required" &&
    !["", "admin-required"].includes(reason);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0A0C00",
        color: "#f2f5fb",
        padding: "36px 16px",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ marginTop: 0 }}>Prijava</h1>

        {message ? (
          <p style={{ color: isError ? "#ffb6b6" : "#e4efff" }}>{message}</p>
        ) : null}

        <section
          style={{
            maxWidth: 520,
            margin: "20px auto",
            background: "rgba(217,232,248,0.14)",
            border: "1px solid rgba(217,232,248,0.28)",
            borderRadius: 16,
            padding: 20,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Sign in with Google</h2>
          <p style={{ marginTop: 0, color: "#c7d8ef" }}>
            Prijava je sada preko Google naloga.
          </p>
          <GoogleSignInButton nextPath={nextPath} label="Nastavi sa Google" fullWidth />
        </section>

        <section style={{ maxWidth: 520, margin: "0 auto", padding: "0 4px" }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/booking" style={linkButtonStyle}>
              Otvori booking formu
            </Link>
            <Link href="/admin" style={linkButtonStyle}>
              Otvori admin panel
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

const linkButtonStyle = {
  borderRadius: 10,
  border: "1px solid rgba(217,232,248,0.6)",
  background: "transparent",
  color: "#d9e8f8",
  padding: "10px 14px",
  fontWeight: 700,
  textDecoration: "none",
};

