"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

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

export default function PWAInstallButton() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const ios = useMemo(() => isIosDevice(), []);
  const webPushPublicKey = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY || "";

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const media = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(media.matches);
    update();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }

    media.addListener(update);
    return () => media.removeListener(update);
  }, []);

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
      setMessage("Na iOS otvorite Share pa Add to Home Screen.");
      return;
    }

    setMessage("Install prompt trenutno nije dostupan.");
  }

  async function handleEnablePush() {
    if (busy) {
      return;
    }

    if (!isLoggedIn) {
      setMessage("Prijavite se da biste ukljucili push notifikacije.");
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
      setMessage(error?.message || "Greska pri ukljucivanju push notifikacija.");
    } finally {
      setBusy(false);
    }
  }

  const showInstall = !installed;
  const showPush = isLoggedIn && !pushEnabled;
  const isAdminRoute = pathname?.startsWith("/admin");

  if (isAdminRoute || (!showInstall && !showPush)) {
    return null;
  }

  return (
    <>
      {isMobile ? (
        <div style={mobileStickyWrapStyle}>
          {showInstall ? (
            <button type="button" style={mobileStickyStyle} onClick={handleInstall}>
              Install App
            </button>
          ) : null}
          {showPush ? (
            <button
              type="button"
              style={{ ...mobileStickyStyle, opacity: busy ? 0.6 : 1 }}
              onClick={handleEnablePush}
              disabled={busy}
            >
              {busy ? "Aktivacija..." : "Ukljuci notifikacije"}
            </button>
          ) : null}
        </div>
      ) : (
        <div style={desktopWrapStyle}>
          {showInstall ? (
            <button type="button" style={buttonStyle} onClick={handleInstall}>
              Install App
            </button>
          ) : null}
          {showPush ? (
            <button
              type="button"
              style={{ ...buttonStyle, opacity: busy ? 0.6 : 1 }}
              onClick={handleEnablePush}
              disabled={busy}
            >
              {busy ? "Aktivacija..." : "Ukljuci notifikacije"}
            </button>
          ) : null}
        </div>
      )}

      {message ? <p style={messageStyle}>{message}</p> : null}
    </>
  );
}

const desktopWrapStyle = {
  position: "fixed",
  right: 16,
  bottom: 16,
  display: "flex",
  gap: 8,
  zIndex: 1200,
};

const mobileStickyWrapStyle = {
  position: "fixed",
  left: 12,
  right: 12,
  bottom: 12,
  display: "grid",
  gap: 8,
  zIndex: 1200,
};

const mobileStickyStyle = {
  borderRadius: 14,
  border: "1px solid rgba(217,232,248,0.7)",
  background: "rgba(20, 38, 61, 0.96)",
  color: "#f4f8ff",
  padding: "11px 14px",
  fontWeight: 700,
  boxShadow: "0 12px 26px rgba(5,10,18,0.46)",
};

const buttonStyle = {
  borderRadius: 999,
  border: "1px solid rgba(217,232,248,0.55)",
  background: "rgba(20, 38, 61, 0.96)",
  color: "#f4f8ff",
  padding: "9px 14px",
  fontWeight: 700,
  cursor: "pointer",
};

const messageStyle = {
  position: "fixed",
  right: 16,
  bottom: 72,
  margin: 0,
  zIndex: 1200,
  borderRadius: 10,
  border: "1px solid rgba(217,232,248,0.4)",
  background: "rgba(8, 14, 24, 0.94)",
  color: "#dfefff",
  padding: "8px 10px",
  maxWidth: 320,
};
