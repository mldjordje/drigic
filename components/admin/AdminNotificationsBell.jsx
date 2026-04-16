"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function formatNotifDate(iso) {
  if (!iso) {
    return "";
  }
  try {
    return new Date(iso).toLocaleString("sr-RS", {
      timeZone: "Europe/Belgrade",
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "";
  }
}

function getTypeLabel(type) {
  const labels = {
    admin_new_booking: "Novi zahtev",
    booking_rescheduled: "Termin izmenjen",
    booking_submitted: "Zahtev poslat",
    booking_confirmed: "Potvrđen termin",
    booking_pending: "Termin na čekanju",
    booking_cancelled: "Otkazan termin",
    client_booking_cancelled: "Klijent otkazao",
    admin_booking_cancelled: "Admin otkazao",
    reminder: "Podsetnik",
    post_treatment_care: "Nega nakon tretmana",
  };

  return labels[String(type || "").toLowerCase()] || "Obaveštenje";
}

function summarizeMessage(message) {
  const normalized = String(message || "").replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "Bez dodatnog opisa.";
  }

  const firstSentence = normalized.split(/(?<=[.!?])\s+/)[0] || normalized;
  const compact = firstSentence.length > 140 ? `${firstSentence.slice(0, 137).trim()}...` : firstSentence;

  if (compact.length >= 72) {
    return compact;
  }

  if (normalized.length <= 140) {
    return normalized;
  }

  return `${normalized.slice(0, 137).trim()}...`;
}

export default function AdminNotificationsBell() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
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
    if (typeof window === "undefined") {
      return undefined;
    }

    const media = window.matchMedia("(max-width: 760px)");
    const sync = () => setMobile(media.matches);
    sync();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", sync);
      return () => media.removeEventListener("change", sync);
    }

    media.addListener(sync);
    return () => media.removeListener(sync);
  }, []);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function onDocClick(event) {
      if (!mobile && wrapRef.current && !wrapRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function onEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEscape);

    if (mobile) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("mousedown", onDocClick);
        document.removeEventListener("keydown", onEscape);
        document.body.style.overflow = previousOverflow;
      };
    }

    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEscape);
    };
  }, [mobile, open]);

  const list = (
    <div className={`admin-notif-surface ${mobile ? "is-mobile" : "is-desktop"}`}>
      <div className="admin-notif-head">
        <div>
          <strong>Obaveštenja</strong>
          <span>{items.length ? `${items.length} poslednjih stavki` : "Nema novih stavki"}</span>
        </div>
        <div className="admin-notif-head-actions">
          <button
            type="button"
            className="admin-template-link-btn"
            onClick={() => load()}
          >
            Osveži
          </button>
          <button
            type="button"
            className="admin-template-link-btn"
            onClick={() => setOpen(false)}
          >
            Zatvori
          </button>
        </div>
      </div>

      <div className="admin-notif-body">
        {!items.length ? (
          <div className="admin-notif-empty">
            <strong>Nema obaveštenja.</strong>
            <span>Kada stignu novi booking ili statusi, videćeš ih ovde.</span>
          </div>
        ) : (
          <ul className="admin-notif-list">
            {items.map((item) => (
              <li key={item.id} className="admin-notif-card">
                <div className="admin-notif-card-head">
                  <span className="admin-announcement-badge is-muted">
                    {getTypeLabel(item.type)}
                  </span>
                  <span className="admin-notif-date">{formatNotifDate(item.sentAt)}</span>
                </div>
                <strong>{item.title}</strong>
                <p title={item.message}>{summarizeMessage(item.message)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        type="button"
        className="admin-template-link-btn admin-notif-trigger"
        onClick={() => {
          setOpen((prev) => !prev);
          load();
        }}
        aria-expanded={open}
      >
        <span>Obaveštenja</span>
        {items.length ? <span className="admin-notif-count">{items.length}</span> : null}
      </button>

      {open && mobile ? (
        <div className="admin-notif-mobile-layer" role="dialog" aria-modal="true">
          <button
            type="button"
            className="admin-notif-mobile-backdrop"
            aria-label="Zatvori obaveštenja"
            onClick={() => setOpen(false)}
          />
          {list}
        </div>
      ) : null}

      {open && !mobile ? <div className="admin-notif-desktop-layer">{list}</div> : null}
    </div>
  );
}
