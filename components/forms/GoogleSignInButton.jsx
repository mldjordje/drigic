import React from "react";

export default function GoogleSignInButton({
  nextPath = "/",
  label = "Nastavi sa Google",
  fullWidth = false,
}) {
  const href = `/api/auth/google?next=${encodeURIComponent(nextPath)}`;

  return (
    <a
      href={href}
      style={{
        borderRadius: 10,
        border: "1px solid rgba(217,232,248,0.6)",
        background: "#d9e8f8",
        color: "#102844",
        padding: "10px 14px",
        fontWeight: 700,
        textDecoration: "none",
        display: "inline-flex",
        justifyContent: "center",
        alignItems: "center",
        width: fullWidth ? "100%" : "auto",
      }}
    >
      {label}
    </a>
  );
}

