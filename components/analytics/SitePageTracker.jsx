"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const SESSION_STORAGE_KEY = "drigic-pageview-session";
const LAST_TRACKED_KEY = "drigic-pageview-last";

function getSessionId() {
  if (typeof window === "undefined") {
    return "";
  }

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
}

function shouldSkipPath(pathname) {
  return !pathname || pathname.startsWith("/admin") || pathname.startsWith("/api");
}

export default function SitePageTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined" || shouldSkipPath(pathname)) {
      return;
    }

    const query = searchParams?.toString();
    const path = query ? `${pathname}?${query}` : pathname;
    const now = Date.now();
    const lastTrackedRaw = window.sessionStorage.getItem(LAST_TRACKED_KEY);
    if (lastTrackedRaw) {
      try {
        const lastTracked = JSON.parse(lastTrackedRaw);
        if (lastTracked.path === path && now - Number(lastTracked.at || 0) < 1500) {
          return;
        }
      } catch {
        // Ignore malformed cached values.
      }
    }

    const payload = JSON.stringify({
      pathname,
      referrer: document.referrer || "",
      locale: document.documentElement.lang || "",
      sessionId: getSessionId(),
    });

    window.sessionStorage.setItem(
      LAST_TRACKED_KEY,
      JSON.stringify({
        path,
        at: now,
      })
    );

    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/analytics/page-view", blob);
      return;
    }

    fetch("/api/analytics/page-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {
      // Analytics must never block the user flow.
    });
  }, [pathname, searchParams]);

  return null;
}
