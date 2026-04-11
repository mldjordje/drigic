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
  const [messageTone, setMessageTone] = useState("info");
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
        iosInstall: "Auf iOS offnen Sie Teilen und dann Zum Home-Bildschirm.",
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

  function showFeedback(nextMessage, tone = "info") {
    setMessage(nextMessage);
    setMessageTone(tone);
  }

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
    if (!message) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setMessage(""), 4200);
    return () => window.clearTimeout(timeoutId);
  }, [message]);

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
    if (installed) {
      showFeedback(copy.appInstalled, "info");
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice?.outcome === "accepted") {
        showFeedback(copy.installStarted, "success");
      } else {
        showFeedback(copy.installCancelled, "error");
      }
      setDeferredPrompt(null);
      return;
    }

    if (ios) {
      showFeedback(copy.iosInstall, "info");
      return;
    }

    showFeedback(copy.promptUnavailable, "error");
  }

  async function handleEnablePush() {
    if (busy) {
      return;
    }

    if (!user) {
      showFeedback(copy.loginForPush, "error");
      return;
    }

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      showFeedback(copy.pushUnsupported, "error");
      return;
    }

    if (!webPushPublicKey) {
      showFeedback(copy.pushKeysMissing, "error");
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        showFeedback(copy.pushDenied, "error");
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
      showFeedback(copy.pushEnabled, "success");
    } catch (error) {
      showFeedback(error?.message || copy.pushGenericError, "error");
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

      {message ? (
        <p
          style={{
            ...messageStyle,
            ...(isMobile ? mobileMessageStyle : desktopMessageStyle),
            ...(messageTone === "success"
              ? successMessageStyle
              : messageTone === "error"
                ? errorMessageStyle
                : infoMessageStyle),
          }}
          role="status"
          aria-live="polite"
        >
          {message}
        </p>
      ) : null}
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
  bottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
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
  margin: 0,
  zIndex: 1200,
  borderRadius: 16,
  border: "1px solid rgba(217,232,248,0.4)",
  padding: "12px 14px",
  boxShadow: "0 18px 36px rgba(5, 10, 18, 0.42)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

const desktopMessageStyle = {
  right: 16,
  bottom: 72,
  maxWidth: 320,
};

const mobileMessageStyle = {
  left: 12,
  right: 12,
  bottom: "calc(env(safe-area-inset-bottom, 0px) + 124px)",
  maxWidth: "none",
};

const infoMessageStyle = {
  background: "rgba(8, 14, 24, 0.94)",
  color: "#dfefff",
};

const successMessageStyle = {
  background: "rgba(20, 61, 43, 0.96)",
  borderColor: "rgba(120, 227, 173, 0.5)",
  color: "#e8fff2",
};

const errorMessageStyle = {
  background: "rgba(70, 28, 28, 0.96)",
  borderColor: "rgba(255, 171, 171, 0.46)",
  color: "#ffe9e9",
};
