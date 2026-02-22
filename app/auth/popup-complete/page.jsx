"use client";

import { useEffect } from "react";

const AUTH_SUCCESS_TYPE = "drigic-google-auth-success";

export default function PopupCompletePage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextPath = params.get("next") || "/";

    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(
        {
          type: AUTH_SUCCESS_TYPE,
        },
        window.location.origin
      );
      window.close();
      return;
    }

    window.location.replace(nextPath);
  }, []);

  return (
    <main
      className="clinic-home5"
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "var(--clinic-page-bg, transparent)",
        color: "var(--clinic-text-strong)",
      }}
    >
      <p>Zatvaranje Google prijave...</p>
    </main>
  );
}
