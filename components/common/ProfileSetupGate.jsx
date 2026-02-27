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
  const normalized = String(value).slice(0, 10);
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return "";
  }
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function normalizeBirthDateInput(value) {
  const digitsOnly = String(value || "").replace(/\D/g, "").slice(0, 8);
  if (!digitsOnly) {
    return "";
  }
  if (digitsOnly.length <= 2) {
    return digitsOnly;
  }
  if (digitsOnly.length <= 4) {
    return `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2)}`;
  }
  return `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2, 4)}/${digitsOnly.slice(4)}`;
}

function toIsoBirthDate(value) {
  const match = String(value || "")
    .trim()
    .match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (year < 1900 || year > 2100) {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return `${match[3]}-${match[2]}-${match[1]}`;
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

  useEffect(() => {
    if (!visible || typeof document === "undefined") {
      return undefined;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyOverscrollX = document.body.style.overscrollBehaviorX;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehaviorX = "none";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.overscrollBehaviorX = previousBodyOverscrollX;
    };
  }, [visible]);

  async function saveProfile(event) {
    event.preventDefault();
    const normalizedBirthDate = normalizeBirthDateInput(form.birthDate);
    if (!form.fullName.trim() || !form.gender || !normalizedBirthDate) {
      setError("Popunite ime, pol i datum rodjenja.");
      return;
    }
    const isoBirthDate = toIsoBirthDate(normalizedBirthDate);
    if (!isoBirthDate) {
      setError("Datum rodjenja mora biti validan (DDMMYYYY ili DD/MM/YYYY).");
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
          birthDate: isoBirthDate,
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
      <form style={cardStyle} onSubmit={saveProfile} noValidate>
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
            type="text"
            style={inputStyle}
            value={form.birthDate}
            inputMode="numeric"
            placeholder="DD/MM/YYYY"
            maxLength={10}
            title="Unesi datum kao DDMMYYYY ili DD/MM/YYYY"
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                birthDate: normalizeBirthDateInput(event.target.value),
              }))
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
  boxSizing: "border-box",
  overflowX: "hidden",
  overflowY: "auto",
  WebkitOverflowScrolling: "touch",
};

const backdropStyle = {
  position: "absolute",
  inset: 0,
  background: "rgba(2,8,14,0.68)",
};

const cardStyle = {
  position: "relative",
  zIndex: 1,
  width: "100%",
  maxWidth: 520,
  borderRadius: 16,
  border: "1px solid rgba(217,232,248,0.42)",
  background: "linear-gradient(180deg, #132238 0%, #0f1827 100%)",
  padding: 16,
  boxSizing: "border-box",
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
