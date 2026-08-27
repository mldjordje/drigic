"use client";

const SESSION_STORAGE_KEY = "drigic-pageview-session";
const SENT_STEPS_KEY = "drigic-booking-funnel-sent";

function getSessionId() {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) {
      return existing;
    }

    const nextId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, nextId);
    return nextId;
  } catch {
    return "";
  }
}

function readSentSteps() {
  try {
    const raw = window.sessionStorage.getItem(SENT_STEPS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function markStepSent(step, sent) {
  try {
    window.sessionStorage.setItem(SENT_STEPS_KEY, JSON.stringify([...sent, step]));
  } catch {
    // Storage is optional; tracking must never block the flow.
  }
}

/**
 * Records one booking funnel step per browser session so the admin
 * analytics can show where users drop off. Fire-and-forget by design.
 */
export function trackBookingFunnel(step) {
  if (typeof window === "undefined" || !step) {
    return;
  }

  const sessionId = getSessionId();
  if (!sessionId) {
    return;
  }

  const sent = readSentSteps();
  if (sent.includes(step)) {
    return;
  }
  markStepSent(step, sent);

  const payload = JSON.stringify({
    step,
    locale: document.documentElement.lang || "",
    sessionId,
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon(
      "/api/analytics/booking-funnel",
      new Blob([payload], { type: "application/json" })
    );
    return;
  }

  fetch("/api/analytics/booking-funnel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {
    // Analytics must never block the user flow.
  });
}
