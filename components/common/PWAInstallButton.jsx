"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/common/LocaleProvider";
import { useSession } from "@/components/common/SessionProvider";

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
  const { locale } = useLocale();
  const { user } = useSession();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const ios = useMemo(() => isIosDevice(), []);
  const webPushPublicKey = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY || "";
  const copy =
    {
      sr: {
        appInstalled: "Aplikacija je vec instalirana.",
        installStarted: "Instalacija je pokrenuta.",
        installCancelled: "Instalacija je otkazana.",
        iosInstall: "Na iOS otvorite Share pa Add to Home Screen.",
        promptUnavailable: "Install prompt trenutno nije dostupan.",
        loginForPush: "Prijavite se da biste ukljucili push notifikacije.",
        pushUnsupported: "Push notifikacije nisu podrzane na ovom uredjaju.",
        pushKeysMissing: "Push kljucevi nisu podeseni.",
        pushDenied: "Dozvola za notifikacije nije odobrena.",
        pushEnabled: "Push notifikacije su ukljucene.",
        pushEnableFailed: "Neuspesna aktivacija push notifikacija.",
        pushGenericError: "Greska pri ukljucivanju push notifikacija.",
        installApp: "Instaliraj app",
        enablePush: "Ukljuci notifikacije",
        enabling: "Aktivacija...",
      },
      en: {
        appInstalled: "The app is already installed.",
        installStarted: "Installation started.",
        installCancelled: "Installation cancelled.",
        iosInstall: "On iOS open Share and then Add to Home Screen.",
        promptUnavailable: "The install prompt is currently unavailable.",
        loginForPush: "Sign in to enable push notifications.",
        pushUnsupported: "Push notifications are not supported on this device.",
        pushKeysMissing: "Push keys are not configured.",
        pushDenied: "Notification permission was not granted.",
        pushEnabled: "Push notifications are enabled.",
        pushEnableFailed: "Failed to enable push notifications.",
        pushGenericError: "There was an error enabling push notifications.",
        installApp: "Install app",
        enablePush: "Enable notifications",
        enabling: "Enabling...",
      },
      de: {
        appInstalled: "Die App ist bereits installiert.",
        installStarted: "Installation gestartet.",
        installCancelled: "Installation abgebrochen.",
        iosInstall: "Auf iOS: Teilen und dann Zum Home-Bildschirm.",
        promptUnavailable: "Der Installationsdialog ist derzeit nicht verfuegbar.",
        loginForPush: "Melden Sie sich an, um Push-Benachrichtigungen zu aktivieren.",
        pushUnsupported: "Push-Benachrichtigungen werden auf diesem Geraet nicht unterstuetzt.",
        pushKeysMissing: "Push-Schluessel sind nicht eingerichtet.",
        pushDenied: "Die Benachrichtigungsfreigabe wurde nicht erteilt.",
        pushEnabled: "Push-Benachrichtigungen sind aktiviert.",
        pushEnableFailed: "Push-Benachrichtigungen konnten nicht aktiviert werden.",
        pushGenericError: "Fehler beim Aktivieren der Push-Benachrichtigungen.",
        installApp: "App installieren",
        enablePush: "Benachrichtigungen aktivieren",
        enabling: "Aktivierung...",
      },
      it: {
        appInstalled: "L'app e gia installata.",
        installStarted: "Installazione avviata.",
        installCancelled: "Installazione annullata.",
        iosInstall: "Su iOS apri Condividi e poi Aggiungi alla Home.",
        promptUnavailable: "Il prompt di installazione non e disponibile al momento.",
        loginForPush: "Accedi per attivare le notifiche push.",
        pushUnsupported: "Le notifiche push non sono supportate su questo dispositivo.",
        pushKeysMissing: "Le chiavi push non sono configurate.",
        pushDenied: "Il permesso per le notifiche non e stato concesso.",
        pushEnabled: "Le notifiche push sono attive.",
        pushEnableFailed: "Impossibile attivare le notifiche push.",
        pushGenericError: "Errore durante l'attivazione delle notifiche push.",
        installApp: "Installa app",
        enablePush: "Attiva notifiche",
        enabling: "Attivazione...",
      },
    }[locale] ||
    {
      appInstalled: "Aplikacija je vec instalirana.",
      installStarted: "Instalacija je pokrenuta.",
      installCancelled: "Instalacija je otkazana.",
      iosInstall: "Na iOS otvorite Share pa Add to Home Screen.",
      promptUnavailable: "Install prompt trenutno nije dostupan.",
      loginForPush: "Prijavite se da biste ukljucili push notifikacije.",
      pushUnsupported: "Push notifikacije nisu podrzane na ovom uredjaju.",
      pushKeysMissing: "Push kljucevi nisu podeseni.",
      pushDenied: "Dozvola za notifikacije nije odobrena.",
      pushEnabled: "Push notifikacije su ukljucene.",
      pushEnableFailed: "Neuspesna aktivacija push notifikacija.",
      pushGenericError: "Greska pri ukljucivanju push notifikacija.",
      installApp: "Instaliraj app",
      enablePush: "Ukljuci notifikacije",
      enabling: "Aktivacija...",
    };

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
      setMessage(copy.appInstalled);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice?.outcome === "accepted") {
        setMessage(copy.installStarted);
      } else {
        setMessage(copy.installCancelled);
      }
      setDeferredPrompt(null);
      return;
    }

    if (ios) {
      setMessage(copy.iosInstall);
      return;
    }

    setMessage(copy.promptUnavailable);
  }

  async function handleEnablePush() {
    if (busy) {
      return;
    }

    if (!user) {
      setMessage(copy.loginForPush);
      return;
    }

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setMessage(copy.pushUnsupported);
      return;
    }

    if (!webPushPublicKey) {
      setMessage(copy.pushKeysMissing);
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMessage(copy.pushDenied);
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
        throw new Error(data?.message || copy.pushEnableFailed);
      }

      setPushEnabled(true);
      setMessage(copy.pushEnabled);
    } catch (error) {
      setMessage(error?.message || copy.pushGenericError);
    } finally {
      setBusy(false);
    }
  }

  const showInstall = !installed;
  const showPush = Boolean(user) && !pushEnabled;
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
              {copy.installApp}
            </button>
          ) : null}
          {showPush ? (
            <button
              type="button"
              style={{ ...mobileStickyStyle, opacity: busy ? 0.6 : 1 }}
              onClick={handleEnablePush}
              disabled={busy}
            >
              {busy ? copy.enabling : copy.enablePush}
            </button>
          ) : null}
        </div>
      ) : (
        <div style={desktopWrapStyle}>
          {showInstall ? (
            <button type="button" style={buttonStyle} onClick={handleInstall}>
              {copy.installApp}
            </button>
          ) : null}
          {showPush ? (
            <button
              type="button"
              style={{ ...buttonStyle, opacity: busy ? 0.6 : 1 }}
              onClick={handleEnablePush}
              disabled={busy}
            >
              {busy ? copy.enabling : copy.enablePush}
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
