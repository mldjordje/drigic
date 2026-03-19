"use client";

import { useEffect, useState } from "react";
import BookingInlineForm from "@/components/booking/BookingInlineForm";
import GooglePopupButton from "@/components/auth/GooglePopupButton";
import { useLocale } from "@/components/common/LocaleProvider";

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

export default function BookingSection({ googleNextPath = "/" }) {
  const { t } = useLocale();
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
        <div className="title-area text-center clinic-reveal is-visible">
          <h2 className="sec-title" style={{ color: "var(--clinic-text-strong)" }}>
            {t("booking.sectionTitle")}
          </h2>
          <p className="sec-text" style={{ color: "var(--clinic-text-muted)" }}>
            {t("booking.sectionBody")}
          </p>
        </div>

        {loading ? (
          <div style={{ ...glassCardStyle, maxWidth: 760, margin: "0 auto" }}>
            <p style={{ margin: 0, color: "var(--clinic-text-muted)" }}>{t("common.loading")}</p>
          </div>
        ) : null}

        {!loading && !user ? (
          <div className="clinic-login-lock" style={{ ...glassCardStyle, maxWidth: 760, margin: "0 auto" }}>
            <p style={{ marginTop: 0, color: "var(--clinic-text-muted)" }}>
              {t("booking.loginRequired")}
            </p>
            <GooglePopupButton className="btn clinic-glow-btn" nextPath={googleNextPath}>
              {t("common.login").toUpperCase()} WITH GOOGLE
            </GooglePopupButton>
          </div>
        ) : null}

        {!loading && user ? (
          <BookingInlineForm googleNextPath={googleNextPath} showUpcoming />
        ) : null}
      </div>
    </section>
  );
}

const glassCardStyle = {
  background: "var(--clinic-card-bg)",
  border: "1px solid var(--clinic-card-border)",
  borderRadius: 16,
  padding: 18,
  backdropFilter: "blur(var(--clinic-card-blur, 10px))",
  WebkitBackdropFilter: "blur(var(--clinic-card-blur, 10px))",
  color: "var(--clinic-text-strong)",
};
