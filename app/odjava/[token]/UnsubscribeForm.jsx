"use client";

import Link from "next/link";
import { useState } from "react";

export default function UnsubscribeForm({ token }) {
  const [state, setState] = useState("idle");
  const [error, setError] = useState("");

  async function handleUnsubscribe() {
    setState("loading");
    setError("");

    try {
      const response = await fetch(`/api/unsubscribe/${token}`, { method: "POST" });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Odjava nije uspela.");
      }
      setState("done");
    } catch (err) {
      setError(err.message || "Odjava nije uspela. Pokušajte ponovo.");
      setState("idle");
    }
  }

  return (
    <div
      style={{
        maxWidth: 520,
        width: "100%",
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 20,
        padding: "32px 28px",
        textAlign: "center",
      }}
    >
      {state === "done" ? (
        <>
          <h1 style={{ fontSize: 24, marginBottom: 12 }}>Odjavljeni ste</h1>
          <p style={{ color: "#4b5563", lineHeight: 1.7 }}>
            Više nećete primati obaveštenja i ponude na mejl. Podsetnici za termine koje sami
            zakažete i dalje stižu.
          </p>
          <Link
            href="/"
            style={{
              display: "inline-block",
              marginTop: 20,
              padding: "12px 18px",
              borderRadius: 999,
              background: "#111827",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            Nazad na sajt
          </Link>
        </>
      ) : (
        <>
          <h1 style={{ fontSize: 24, marginBottom: 12 }}>Odjava sa liste obaveštenja</h1>
          <p style={{ color: "#4b5563", lineHeight: 1.7 }}>
            Potvrdite da više ne želite da primate mejlove sa ponudama i novostima klinike Dr
            Igic.
          </p>
          {error ? (
            <p style={{ color: "#b91c1c", marginTop: 12 }} role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            onClick={handleUnsubscribe}
            disabled={state === "loading"}
            style={{
              marginTop: 20,
              padding: "13px 20px",
              borderRadius: 999,
              border: "none",
              background: "#111827",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {state === "loading" ? "Odjava u toku..." : "Potvrdi odjavu"}
          </button>
        </>
      )}
    </div>
  );
}
