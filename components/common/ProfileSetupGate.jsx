"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/common/LocaleProvider";
import { useSession } from "@/components/common/SessionProvider";

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

function getProfileSaveError(data, fallbackMessage, t) {
  if (data?.details?.code === "PHONE_ALREADY_IN_USE") {
    return t("profile.phoneTakenError");
  }
  return data?.message || fallbackMessage;
}

export default function ProfileSetupGate() {
  const pathname = usePathname();
  const { t } = useLocale();
  const { user, isLoading: sessionLoading } = useSession();
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [invalidFields, setInvalidFields] = useState({});
  const [form, setForm] = useState({
    fullName: "",
    gender: "",
    birthDate: "",
    phone: "",
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

    if (sessionLoading) {
      setLoading(true);
      return;
    }

    if (!user) {
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
          phone: String(data.user?.phone || "").trim(),
        });
        setVisible(Boolean(data.needsProfileSetup));
      })
      .catch(() => {
        setVisible(false);
      })
      .finally(() => setLoading(false));
  }, [pathname, sessionLoading, user]);

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

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setInvalidFields((prev) => {
      if (!prev[field]) {
        return prev;
      }
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function saveProfile(event) {
    event.preventDefault();
    const normalizedBirthDate = normalizeBirthDateInput(form.birthDate);
    const normalizedPhone = String(form.phone || "").replace(/[^\d+]/g, "");

    const missing = {
      fullName: !form.fullName.trim(),
      gender: !form.gender,
      birthDate: !normalizedBirthDate,
      phone: !normalizedPhone,
    };
    if (Object.values(missing).some(Boolean)) {
      setInvalidFields(missing);
      setError(t("profile.requiredError"));
      return;
    }
    if (normalizedPhone.replace(/\D/g, "").length < 6) {
      setInvalidFields({ phone: true });
      setError(t("profile.phoneError"));
      return;
    }
    const isoBirthDate = toIsoBirthDate(normalizedBirthDate);
    if (!isoBirthDate) {
      setInvalidFields({ birthDate: true });
      setError(t("profile.birthDateError"));
      return;
    }

    setSaving(true);
    setError("");
    setInvalidFields({});
    try {
      const response = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          gender: form.gender,
          birthDate: isoBirthDate,
          phone: normalizedPhone,
        }),
      });
      const data = await parseResponse(response);
      if (!response.ok || !data?.ok) {
        throw new Error(
          getProfileSaveError(data, "Neuspešno čuvanje profila.", t)
        );
      }
      setVisible(false);
    } catch (saveError) {
      setError(saveError.message || "Greška pri čuvanju profila.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !visible) {
    return null;
  }

  return (
    <div className="clinic-profile-gate" style={wrapStyle}>
      <div style={backdropStyle} />
      <form
        className="clinic-profile-gate__card"
        style={cardStyle}
        onSubmit={saveProfile}
        noValidate
        aria-labelledby="clinic-profile-gate-title"
      >
        <header style={headerStyle}>
          <span className="clinic-profile-gate__badge" style={badgeStyle}>
            {t("profile.badge")}
          </span>
          <h3 id="clinic-profile-gate-title" style={titleStyle}>
            {t("profile.title")}
          </h3>
          <p style={subtitleStyle}>{t("profile.body")}</p>
        </header>

        <div style={fieldGridStyle}>
          <label style={labelStyle}>
            <span style={labelTextStyle}>{t("profile.fullName")}*</span>
            <input
              style={invalidFields.fullName ? invalidInputStyle : inputStyle}
              value={form.fullName}
              autoComplete="name"
              aria-invalid={invalidFields.fullName ? "true" : undefined}
              onChange={(event) => updateField("fullName", event.target.value)}
            />
            <small style={hintStyle}>{t("profile.hintFullName")}</small>
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle}>{t("profile.phone")}*</span>
            <input
              type="tel"
              style={invalidFields.phone ? invalidInputStyle : inputStyle}
              value={form.phone}
              inputMode="tel"
              autoComplete="tel"
              placeholder="06x xxx xxxx"
              aria-invalid={invalidFields.phone ? "true" : undefined}
              onChange={(event) => updateField("phone", event.target.value)}
            />
            <small style={hintStyle}>{t("profile.hintPhone")}</small>
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle}>{t("profile.birthDate")}*</span>
            <input
              type="text"
              style={invalidFields.birthDate ? invalidInputStyle : inputStyle}
              value={form.birthDate}
              inputMode="numeric"
              placeholder="DD/MM/YYYY"
              maxLength={10}
              aria-invalid={invalidFields.birthDate ? "true" : undefined}
              onChange={(event) =>
                updateField("birthDate", normalizeBirthDateInput(event.target.value))
              }
            />
            <small style={hintStyle}>{t("profile.hintBirthDate")}</small>
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle}>{t("profile.gender")}*</span>
            <select
              style={invalidFields.gender ? invalidInputStyle : inputStyle}
              value={form.gender}
              aria-invalid={invalidFields.gender ? "true" : undefined}
              onChange={(event) => updateField("gender", event.target.value)}
            >
              <option value="">{t("profile.choose")}</option>
              <option value="muško">{t("profile.male")}</option>
              <option value="žensko">{t("profile.female")}</option>
              <option value="drugo">{t("profile.other")}</option>
            </select>
            <small style={hintStyle}>{t("profile.hintGender")}</small>
          </label>
        </div>

        {error ? (
          <p role="alert" style={errorStyle}>
            {error}
          </p>
        ) : null}

        <button type="submit" style={buttonStyle} disabled={saving}>
          {saving ? t("profile.saving") : t("profile.save")}
        </button>

        <p style={secureNoteStyle}>{t("profile.secureNote")}</p>
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
  background: "rgba(4, 8, 14, 0.72)",
  backdropFilter: "blur(6px)",
  WebkitBackdropFilter: "blur(6px)",
};

const cardStyle = {
  position: "relative",
  zIndex: 1,
  width: "100%",
  maxWidth: 560,
  borderRadius: 20,
  border: "1px solid var(--clinic-gate-border, rgba(17, 24, 39, 0.16))",
  background: "var(--clinic-gate-bg, #ffffff)",
  padding: "22px 20px",
  boxSizing: "border-box",
  color: "var(--clinic-gate-text, #0f172a)",
  display: "grid",
  gap: 16,
  boxShadow: "0 28px 70px rgba(3, 10, 22, 0.34)",
};

const headerStyle = {
  display: "grid",
  gap: 8,
};

const badgeStyle = {
  justifySelf: "start",
  borderRadius: 999,
  padding: "4px 12px",
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  background: "var(--clinic-gate-badge-bg, rgba(15, 23, 42, 0.06))",
  border: "1px solid var(--clinic-gate-border-soft, rgba(17, 24, 39, 0.12))",
  color: "var(--clinic-gate-text-2, #253040)",
};

const titleStyle = {
  margin: 0,
  fontSize: 22,
  lineHeight: 1.25,
  fontWeight: 800,
  color: "var(--clinic-gate-text, #0f172a)",
};

const subtitleStyle = {
  margin: 0,
  fontSize: 14,
  lineHeight: 1.5,
  color: "var(--clinic-gate-text-2, #253040)",
};

const fieldGridStyle = {
  display: "grid",
  gap: 14,
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
};

const labelStyle = {
  display: "grid",
  gap: 4,
  minWidth: 0,
};

const labelTextStyle = {
  fontWeight: 700,
  fontSize: 13,
  color: "var(--clinic-gate-text, #0f172a)",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 12,
  border: "1px solid var(--clinic-gate-border, rgba(17, 24, 39, 0.2))",
  background: "var(--clinic-gate-field-bg, #ffffff)",
  color: "var(--clinic-gate-text, #0f172a)",
  padding: "12px 12px",
  fontSize: 15,
  minHeight: 46,
};

const invalidInputStyle = {
  ...inputStyle,
  borderColor: "var(--clinic-gate-danger, #c53030)",
  boxShadow: "0 0 0 3px rgba(197, 48, 48, 0.14)",
};

const hintStyle = {
  fontSize: 12,
  lineHeight: 1.4,
  color: "var(--clinic-gate-muted, #5b6677)",
};

const errorStyle = {
  margin: 0,
  padding: "10px 12px",
  borderRadius: 12,
  fontWeight: 600,
  fontSize: 13,
  color: "var(--clinic-gate-danger, #c53030)",
  border: "1px solid var(--clinic-gate-danger, #c53030)",
  background: "rgba(197, 48, 48, 0.08)",
};

const buttonStyle = {
  width: "100%",
  borderRadius: 999,
  border: "1px solid var(--clinic-gate-btn-bg, #111827)",
  background: "var(--clinic-gate-btn-bg, #111827)",
  color: "var(--clinic-gate-btn-text, #ffffff)",
  padding: "14px 18px",
  fontWeight: 800,
  fontSize: 15,
  letterSpacing: "0.02em",
  cursor: "pointer",
  minHeight: 50,
};

const secureNoteStyle = {
  margin: 0,
  textAlign: "center",
  fontSize: 12,
  lineHeight: 1.45,
  color: "var(--clinic-gate-muted, #5b6677)",
};
