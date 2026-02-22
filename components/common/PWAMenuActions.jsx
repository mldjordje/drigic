"use client";

import { useEffect, useMemo, useState } from "react";

function isIosDevice() {
  if (typeof navigator === "undefined") {
    return false;
  }
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandaloneMode() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    window.navigator?.standalone === true
  );
}

function toUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

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

export default function PWAMenuActions() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);

  const ios = useMemo(() => isIosDevice(), []);
  const webPushPublicKey = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY || "";

  useEffect(() => {
    setInstalled(isStandaloneMode());

    const installListener = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };

    const installedListener = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", installListener);
    window.addEventListener("appinstalled", installedListener);

    return () => {
      window.removeEventListener("beforeinstallprompt", installListener);
      window.removeEventListener("appinstalled", installedListener);
    };
  }, []);

  useEffect(() => {
    fetch("/api/me/profile")
      .then(async (res) => {
        if (!res.ok) {
          return null;
        }
        const data = await parseResponse(res);
        return data?.user || null;
      })
      .then((user) => setIsLoggedIn(Boolean(user)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return;
    }

    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => {
        if (subscription) {
          setPushEnabled(true);
        }
      })
      .catch(() => {});
  }, []);

  async function handleInstall() {
    setMessage("");
    if (installed) {
      setMessage("Aplikacija je vec instalirana.");
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice?.outcome === "accepted") {
        setMessage("Instalacija je pokrenuta.");
      } else {
        setMessage("Instalacija je otkazana.");
      }
      setDeferredPrompt(null);
      return;
    }

    if (ios) {
      setMessage("Na iOS: Share > Add to Home Screen.");
      return;
    }

    setMessage("Install prompt trenutno nije dostupan.");
  }

  async function handleEnablePush() {
    if (busy) {
      return;
    }

    if (!isLoggedIn) {
      setMessage("Prijavite se da biste ukljucili notifikacije.");
      return;
    }

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setMessage("Push notifikacije nisu podrzane na ovom uredjaju.");
      return;
    }

    if (!webPushPublicKey) {
      setMessage("Push kljucevi nisu podeseni.");
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMessage("Dozvola za notifikacije nije odobrena.");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: toUint8Array(webPushPublicKey),
        }));

      const response = await fetch("/api/me/push-subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: subscription.toJSON().keys,
          userAgent: navigator.userAgent,
        }),
      });
      const data = await parseResponse(response);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Neuspesna aktivacija push notifikacija.");
      }

      setPushEnabled(true);
      setMessage("Push notifikacije su ukljucene.");
    } catch (error) {
      setMessage(error?.message || "Greska pri ukljucivanju notifikacija.");
    } finally {
      setBusy(false);
    }
  }

  const showInstall = !installed;
  const showPush = isLoggedIn && !pushEnabled;

  if (!showInstall && !showPush) {
    return null;
  }

  return (
    <div className="mobile-menu-pwa-actions">
      <div className="mobile-cta-buttons mobile-cta-buttons-full">
        {showInstall ? (
          <button type="button" className="mobile-cta-link clinic-glow-btn" onClick={handleInstall}>
            <span className="mobile-cta-link-text">Install App</span>
          </button>
        ) : null}
        {showPush ? (
          <button
            type="button"
            className="mobile-cta-link clinic-glow-btn"
            onClick={handleEnablePush}
            disabled={busy}
          >
            <span className="mobile-cta-link-text">
              {busy ? "Aktivacija..." : "Ukljuci notifikacije"}
            </span>
          </button>
        ) : null}
      </div>
      {message ? <p className="mobile-pwa-message">{message}</p> : null}
    </div>
  );
}
