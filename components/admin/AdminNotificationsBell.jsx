"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function formatNotifDate(iso) {
  if (!iso) {
    return "";
  }
  try {
    return new Date(iso).toLocaleString("sr-RS", { timeZone: "Europe/Belgrade" });
  } catch {
    return "";
  }
}

export default function AdminNotificationsBell() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/me/notifications");
    const data = await res.json().catch(() => null);
    if (res.ok && data?.ok) {
      setItems(Array.isArray(data.data) ? data.data : []);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onDocClick(event) {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        type="button"
        className="admin-template-link-btn"
        onClick={() => {
          setOpen((prev) => !prev);
          load();
        }}
        aria-expanded={open}
      >
        Obaveštenja{items.length ? ` (${items.length})` : ""}
      </button>
      {open ? (
        <div
          className="admin-notif-dropdown"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            width: "min(360px, 92vw)",
            maxHeight: 360,
            overflowY: "auto",
            padding: 12,
            background: "#0f141c",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 10,
            boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
            zIndex: 50,
          }}
        >
          {!items.length ? (
            <p style={{ margin: 0, color: "#bed0e8", fontSize: 14 }}>Nema obaveštenja.</p>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 12 }}>
              {items.map((n) => (
                <li
                  key={n.id}
                  style={{
                    paddingBottom: 10,
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <strong style={{ display: "block", color: "#f4f6fb", fontSize: 14 }}>
                    {n.title}
                  </strong>
                  <span style={{ fontSize: 12, color: "#8fa3bf" }}>{formatNotifDate(n.sentAt)}</span>
                  <p style={{ margin: "6px 0 0", color: "#d6deea", fontSize: 13, lineHeight: 1.45 }}>
                    {n.message}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
