"use client";

import { useEffect, useRef, useState } from "react";
import BookingSection from "@/components/homes/home-5/BookingSection";
import BeautyPassSection from "@/components/homes/home-5/BeautyPassSection";

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
        {sublabel && (
          <span className="clinic-action-btn__sublabel">{sublabel}</span>
        )}
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
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(null);

  useEffect(() => {
    fetch("/api/me/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setCurrentUser(data?.user || null))
      .catch(() => setCurrentUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !currentUser) return null;

  const handleToggle = (section) => {
    setActiveSection((prev) => (prev === section ? null : section));
  };

  return (
    <section className="clinic-hero-actions">
      {/* Decorative top separator */}
      <div className="clinic-hero-actions__separator" aria-hidden="true" />
      {/* Third orb — center warmth */}
      <div className="clinic-hero-actions__orb3" aria-hidden="true" />

      <div className="container">
        <div className="clinic-hero-actions__header">
          <p className="clinic-hero-actions__eyebrow">Moj nalog</p>
        </div>
        <div className="clinic-hero-actions__ctas">
          <ActionButton
            label="Zakaži termin"
            sublabel="Odaberi tretman, datum i termin"
            isActive={activeSection === "booking"}
            onClick={() => handleToggle("booking")}
            icon={<CalendarIcon />}
          />
          <ActionButton
            label="Moj Beauty Pass"
            sublabel="Istorija tretmana i benefiti"
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

      {/* Bottom spacing when nothing is open */}
      {!activeSection && <div className="clinic-hero-actions__bottom-space" />}
    </section>
  );
}
