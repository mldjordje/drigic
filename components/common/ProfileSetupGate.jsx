"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

function parseResponse(response) {
  return response
    .text()
    .then((text) => {
      if (!text) {
        return null;
      }
      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    })
    .catch(() => null);
}

function normalizeBirthDate(value) {
  if (!value) {
    return "";
  }
  return String(value).slice(0, 10);
}

export default function ProfileSetupGate() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    gender: "",
    birthDate: "",
  });

  useEffect(() => {
    const skip =
      pathname?.startsWith("/admin") ||
      pathname?.startsWith("/auth") ||
      pathname?.startsWith("/api");
    if (skip) {
      setVisible(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    fetch("/api/me/profile")
      .then(async (response) => ({
        ok: response.ok,
        data: await parseResponse(response),
      }))
      .then(({ ok, data }) => {
        if (!ok || !data?.ok || !data?.user) {
          setVisible(false);
          return;
        }

        setForm({
          fullName: String(data.profile?.fullName || "").trim(),
          gender: String(data.profile?.gender || "").trim(),
          birthDate: normalizeBirthDate(data.profile?.birthDate),
        });
        setVisible(Boolean(data.needsProfileSetup));
      })
      .catch(() => {
        setVisible(false);
      })
      .finally(() => setLoading(false));
  }, [pathname]);

  async function saveProfile(event) {
    event.preventDefault();
    if (!form.fullName.trim() || !form.gender || !form.birthDate) {
      setError("Popunite ime, pol i datum rodjenja.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          gender: form.gender,
          birthDate: form.birthDate,
        }),
      });
      const data = await parseResponse(response);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Neuspesno cuvanje profila.");
      }
      setVisible(false);
    } catch (saveError) {
      setError(saveError.message || "Greska pri cuvanju profila.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !visible) {
    return null;
  }

  return (
    <div style={wrapStyle}>
      <div style={backdropStyle} />
      <form style={cardStyle} onSubmit={saveProfile}>
        <h3 style={{ marginTop: 0, marginBottom: 6 }}>Dovrsi profil</h3>
        <p style={{ marginTop: 0, color: "#c6d8ee" }}>
          Unesi podatke jednom kako bi admin video tvoje ime u kalendaru.
        </p>

        <label style={labelStyle}>
          Ime i prezime
          <input
            style={inputStyle}
            value={form.fullName}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, fullName: event.target.value }))
            }
            required
          />
        </label>

        <label style={labelStyle}>
          Pol
          <select
            style={inputStyle}
            value={form.gender}
            onChange={(event) => setForm((prev) => ({ ...prev, gender: event.target.value }))}
            required
          >
            <option value="">Izaberi</option>
            <option value="musko">Musko</option>
            <option value="zensko">Zensko</option>
            <option value="drugo">Drugo</option>
          </select>
        </label>

        <label style={labelStyle}>
          Datum rodjenja
          <input
            type="date"
            style={inputStyle}
            value={form.birthDate}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, birthDate: event.target.value }))
            }
            required
          />
        </label>

        {error ? <p style={{ color: "#ffabab", margin: 0 }}>{error}</p> : null}

        <button type="submit" style={buttonStyle} disabled={saving}>
          {saving ? "Cuvanje..." : "Sacuvaj podatke"}
        </button>
      </form>
    </div>
  );
}

const wrapStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 10050,
  display: "grid",
  placeItems: "center",
  padding: 16,
};

const backdropStyle = {
  position: "absolute",
  inset: 0,
  background: "rgba(2,8,14,0.68)",
};

const cardStyle = {
  position: "relative",
  zIndex: 1,
  width: "min(520px, calc(100vw - 22px))",
  borderRadius: 16,
  border: "1px solid rgba(217,232,248,0.42)",
  background: "linear-gradient(180deg, #132238 0%, #0f1827 100%)",
  padding: 16,
  color: "#f4f8ff",
  display: "grid",
  gap: 8,
};

const labelStyle = {
  display: "grid",
  gap: 4,
  color: "#dce9f7",
  fontWeight: 600,
};

const inputStyle = {
  width: "100%",
  borderRadius: 10,
  border: "1px solid rgba(217,232,248,0.3)",
  background: "rgba(10,12,0,0.45)",
  color: "#f4f8ff",
  padding: "9px 10px",
  marginTop: 4,
};

const buttonStyle = {
  borderRadius: 999,
  border: "1px solid rgba(217,232,248,0.5)",
  background: "rgba(217,232,248,0.14)",
  color: "#eef5ff",
  padding: "9px 14px",
  fontWeight: 700,
  cursor: "pointer",
};
