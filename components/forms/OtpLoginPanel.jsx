"use client";

import { useState } from "react";

export default function OtpLoginPanel({ onAuthenticated, title = "Prijava" }) {
  const [identifier, setIdentifier] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState("request");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleRequestOtp(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });
      const data = await response.json();

      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Neuspešno slanje OTP koda.");
      }

      setStep("verify");
      setMessage(
        data?.devOtp
          ? `Kod poslat. DEV OTP: ${data.devOtp}`
          : "Kod je poslat na email."
      );
    } catch (err) {
      setError(err.message || "Greška pri slanju OTP koda.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, code: otpCode }),
      });
      const data = await response.json();

      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Neispravan OTP kod.");
      }

      const profileResponse = await fetch("/api/me/profile");
      const profileData = await profileResponse.json();
      if (!profileResponse.ok || !profileData?.ok) {
        throw new Error("Prijava je uspela, ali profil nije dostupan.");
      }

      setMessage("Uspešno ste prijavljeni.");
      onAuthenticated?.(profileData.user);
    } catch (err) {
      setError(err.message || "Greška pri verifikaciji OTP koda.");
    } finally {
      setLoading(false);
    }
  }

  return (
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
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      <p style={{ marginTop: 0, color: "#c7d8ef" }}>
        Unesite email ili telefon. Kod se šalje na email naloga.
      </p>

      {step === "request" ? (
        <form onSubmit={handleRequestOtp}>
          <label style={labelStyle}>Email ili telefon</label>
          <input
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            required
            style={inputStyle}
            placeholder="npr. admin@drigic.com"
          />
          <button disabled={loading} style={buttonStyle} type="submit">
            {loading ? "Slanje..." : "Pošalji OTP kod"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp}>
          <label style={labelStyle}>OTP kod</label>
          <input
            value={otpCode}
            onChange={(event) => setOtpCode(event.target.value)}
            required
            style={inputStyle}
            placeholder="Unesite 6 cifara"
          />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button disabled={loading} style={buttonStyle} type="submit">
              {loading ? "Provera..." : "Potvrdi kod"}
            </button>
            <button
              disabled={loading}
              style={{ ...buttonStyle, background: "transparent", color: "#d9e8f8" }}
              type="button"
              onClick={() => {
                setStep("request");
                setOtpCode("");
              }}
            >
              Promeni kontakt
            </button>
          </div>
        </form>
      )}

      {message ? <p style={{ color: "#9be39f", marginTop: 12 }}>{message}</p> : null}
      {error ? <p style={{ color: "#ff9f9f", marginTop: 12 }}>{error}</p> : null}
    </section>
  );
}

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
  marginBottom: 12,
};

const buttonStyle = {
  borderRadius: 10,
  border: "1px solid rgba(217,232,248,0.6)",
  background: "#d9e8f8",
  color: "#102844",
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
};

