"use client";

import { useEffect, useRef, useState } from "react";
import BookingSection from "@/components/homes/home-5/BookingSection";
import { useLocale } from "@/components/common/LocaleProvider";
import { useSession } from "@/components/common/SessionProvider";
import BeautyPassSection from "@/components/homes/home-5/BeautyPassSection";
import { getIntlLocale } from "@/lib/i18n";

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

function formatBookingDateTime(isoString, locale) {
  try {
    return new Date(isoString).toLocaleString(getIntlLocale(locale), {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString || "";
  }
}

function ArrowIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M1 7.5H14M14 7.5L8 1.5M14 7.5L8 13.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const HERO_ACTIONS_COPY = {
  sr: {
    account: "Moj nalog",
    confirmed: "Termin je potvrđen",
    cancelled: "Termin je otkazan",
    closeNotice: "Zatvori obaveštenje",
    bookingLabel: "Zakaži termin",
    bookingSublabel: "Odaberi tretman, datum i termin",
    passLabel: "Moj Beauty Pass",
    passSublabel: "Istorija tretmana i benefiti",
  },
  en: {
    account: "My account",
    confirmed: "Appointment confirmed",
    cancelled: "Appointment cancelled",
    closeNotice: "Close notice",
    bookingLabel: "Book appointment",
    bookingSublabel: "Choose treatment, date and time",
    passLabel: "My Beauty Pass",
    passSublabel: "Treatment history and benefits",
  },
  de: {
    account: "Mein Konto",
    confirmed: "Termin bestaetigt",
    cancelled: "Termin storniert",
    closeNotice: "Hinweis schliessen",
    bookingLabel: "Termin buchen",
    bookingSublabel: "Behandlung, Datum und Uhrzeit waehlen",
    passLabel: "Mein Beauty Pass",
    passSublabel: "Behandlungshistorie und Vorteile",
  },
  it: {
    account: "Il mio account",
    confirmed: "Appuntamento confermato",
    cancelled: "Appuntamento annullato",
    closeNotice: "Chiudi avviso",
    bookingLabel: "Prenota appuntamento",
    bookingSublabel: "Scegli trattamento, data e orario",
    passLabel: "Il mio Beauty Pass",
    passSublabel: "Storico trattamenti e vantaggi",
  },
};

function CalendarIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 9H21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8 2V5M16 2V5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function PassIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M3 7C3 5.9 3.9 5 5 5H19C20.1 5 21 5.9 21 7V17C21 18.1 20.1 19 19 19H5C3.9 19 3 18.1 3 17V7Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="8" cy="12" r="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M13 10H18M13 14H16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function ConfirmedIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M8 12.4L10.7 15L16 9.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ActionButton({ label, sublabel, isActive, onClick, icon }) {
  const chars = label.split("");
  return (
    <button
      className={`clinic-action-btn${isActive ? " is-active" : ""}`}
      onClick={onClick}
      type="button"
      aria-expanded={isActive}
    >
      <span className="clinic-action-btn__icon">{icon}</span>
      <span className="clinic-action-btn__text">
        <span className="clinic-action-btn__label">
          {chars.map((char, i) => (
            <span
              key={i}
              className="clinic-action-char"
              style={{ "--char-i": i }}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
        </span>
        {sublabel ? (
          <span className="clinic-action-btn__sublabel">{sublabel}</span>
        ) : null}
      </span>
      <span className={`clinic-action-btn__arrow${isActive ? " is-rotated" : ""}`}>
        <ArrowIcon />
      </span>
    </button>
  );
}

function ExpandPanel({ isOpen, children }) {
  const innerRef = useRef(null);

  return (
    <div
      className={`clinic-action-panel${isOpen ? " is-open" : ""}`}
      aria-hidden={!isOpen}
    >
      <div className="clinic-action-panel__inner" ref={innerRef}>
        {children}
      </div>
    </div>
  );
}

export default function HeroActions() {
  const { locale } = useLocale();
  const { user: currentUser, isLoading: sessionLoading } = useSession();
  const [activeSection, setActiveSection] = useState(null);
  const [statusNotice, setStatusNotice] = useState(null);
  const [showStatusNotice, setShowStatusNotice] = useState(true);
  const copy = HERO_ACTIONS_COPY[locale] || HERO_ACTIONS_COPY.sr;

  useEffect(() => {
    let mounted = true;

    if (!currentUser) {
      setStatusNotice(null);
      setShowStatusNotice(false);
      return () => {
        mounted = false;
      };
    }

    async function loadBookings() {
      try {
        const bookingsRes = await fetch("/api/me/bookings");
        const bookingsData = await parseResponse(bookingsRes);
        if (!mounted) {
          return;
        }

        const nowTime = Date.now();
        const rows = Array.isArray(bookingsData?.all)
          ? bookingsData.all
          : [...(bookingsData?.upcoming || []), ...(bookingsData?.past || [])];

        const upcomingStatusRows = rows
          .filter((booking) => {
            const startsAtTime = new Date(booking?.startsAt || "").getTime();
            const normalized = String(booking?.status || "").toLowerCase();
            if (!Number.isFinite(startsAtTime) || startsAtTime < nowTime) {
              return false;
            }
            return normalized === "confirmed" || normalized === "cancelled" || normalized === "canceled";
          })
          .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

        const nextStatusBooking = upcomingStatusRows[0] || null;
        if (!nextStatusBooking) {
          setStatusNotice(null);
          setShowStatusNotice(false);
          return;
        }

        const normalizedStatus = String(nextStatusBooking.status || "").toLowerCase();
        const tone = normalizedStatus === "confirmed" ? "confirmed" : "cancelled";
        setStatusNotice({
          tone,
          label: tone === "confirmed" ? copy.confirmed : copy.cancelled,
          startsAt: nextStatusBooking.startsAt,
        });
        setShowStatusNotice(true);
      } catch {
        if (mounted) {
          setStatusNotice(null);
        }
      }
    }

    loadBookings();

    return () => {
      mounted = false;
    };
  }, [copy.cancelled, copy.confirmed, currentUser]);

  if (sessionLoading || !currentUser) return null;

  const handleToggle = (section) => {
    setActiveSection((prev) => (prev === section ? null : section));
  };

  const sectionStatusClass =
    showStatusNotice && statusNotice?.tone ? `has-status-${statusNotice.tone}` : "";

  return (
    <section className={`clinic-hero-actions ${sectionStatusClass}`.trim()}>
      <div className="clinic-hero-actions__separator" aria-hidden="true" />
      <div className="clinic-hero-actions__orb3" aria-hidden="true" />

      <div className="container">
        <div className="clinic-hero-actions__header">
          <p className="clinic-hero-actions__eyebrow">{copy.account}</p>
        </div>

        {statusNotice && showStatusNotice ? (
          <div className="clinic-hero-actions__notice-wrap">
            <div
              className={`clinic-action-btn clinic-action-btn--notice is-active ${
                statusNotice.tone === "cancelled" ? "is-cancelled" : "is-confirmed"
              }`}
              role="status"
              aria-live="polite"
            >
              <span className="clinic-action-btn__icon">
                <ConfirmedIcon />
              </span>
              <span className="clinic-action-btn__text">
                <span className="clinic-action-btn__label">{statusNotice.label}</span>
                <span className="clinic-action-btn__sublabel">
                  {formatBookingDateTime(statusNotice.startsAt, locale)}
                </span>
              </span>
              <button
                type="button"
                className="clinic-action-notice__close"
                onClick={() => setShowStatusNotice(false)}
                aria-label={copy.closeNotice}
              >
                x
              </button>
            </div>
          </div>
        ) : null}

        <div className="clinic-hero-actions__ctas">
          <ActionButton
            label={copy.bookingLabel}
            sublabel={copy.bookingSublabel}
            isActive={activeSection === "booking"}
            onClick={() => handleToggle("booking")}
            icon={<CalendarIcon />}
          />
          <ActionButton
            label={copy.passLabel}
            sublabel={copy.passSublabel}
            isActive={activeSection === "beautypass"}
            onClick={() => handleToggle("beautypass")}
            icon={<PassIcon />}
          />
        </div>
      </div>

      <ExpandPanel isOpen={activeSection === "booking"}>
        <BookingSection />
      </ExpandPanel>

      <ExpandPanel isOpen={activeSection === "beautypass"}>
        <BeautyPassSection />
      </ExpandPanel>

      {!activeSection ? <div className="clinic-hero-actions__bottom-space" /> : null}
    </section>
  );
}
