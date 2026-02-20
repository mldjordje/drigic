"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import OtpLoginPanel from "@/components/forms/OtpLoginPanel";

export default function PrijavaClient({ nextPath = "/", reason = "" }) {
  const router = useRouter();
  const [user, setUser] = useState(null);

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
        {reason === "admin-required" ? (
          <p style={{ color: "#e4efff" }}>
            Za pristup admin panelu potrebno je da se prijavite admin nalogom.
          </p>
        ) : null}
        {reason === "admin-forbidden" ? (
          <p style={{ color: "#ffb6b6" }}>
            Nalog je prijavljen, ali nema admin privilegije.
          </p>
        ) : null}

        <OtpLoginPanel
          title="Prijava OTP kodom"
          onAuthenticated={(loggedUser) => {
            setUser(loggedUser);
            if (loggedUser?.role === "admin" && nextPath.startsWith("/admin")) {
              router.push(nextPath);
            }
          }}
        />

        {user ? (
          <section style={{ maxWidth: 520, margin: "0 auto", padding: "0 4px" }}>
            <p>
              Prijavljeni ste kao <strong>{user.email}</strong> ({user.role}).
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/booking" style={linkButtonStyle}>
                Otvori booking formu
              </Link>
              <Link href="/admin" style={linkButtonStyle}>
                Otvori admin panel
              </Link>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

const linkButtonStyle = {
  borderRadius: 10,
  border: "1px solid rgba(217,232,248,0.6)",
  background: "#d9e8f8",
  color: "#102844",
  padding: "10px 14px",
  fontWeight: 700,
  textDecoration: "none",
};

