"use client";

import { useEffect, useMemo, useState } from "react";
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

export default function PWAMenuActions() {
  const { locale } = useLocale();
  const { isLoggedIn } = useSession();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);

  const ios = useMemo(() => isIosDevice(), []);
  const webPushPublicKey = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY || "";
  const copy =
    {
      sr: {
        appInstalled: "Aplikacija je vec instalirana.",
        installStarted: "Instalacija je pokrenuta.",
        installCancelled: "Instalacija je otkazana.",
        iosInstall: "Na iOS: Share > Add to Home Screen.",
        promptUnavailable: "Install prompt trenutno nije dostupan.",
        loginForPush: "Prijavite se da biste ukljucili notifikacije.",
        pushUnsupported: "Push notifikacije nisu podrzane na ovom uredjaju.",
        pushKeysMissing: "Push kljucevi nisu podeseni.",
        pushDenied: "Dozvola za notifikacije nije odobrena.",
        pushEnabled: "Push notifikacije su ukljucene.",
        pushEnableFailed: "Neuspesna aktivacija push notifikacija.",
        pushGenericError: "Greska pri ukljucivanju notifikacija.",
        installApp: "Instaliraj app",
        enablePush: "Ukljuci notifikacije",
        enabling: "Aktivacija...",
      },
      en: {
        appInstalled: "The app is already installed.",
        installStarted: "Installation started.",
        installCancelled: "Installation cancelled.",
        iosInstall: "On iOS: Share > Add to Home Screen.",
        promptUnavailable: "The install prompt is currently unavailable.",
        loginForPush: "Sign in to enable notifications.",
        pushUnsupported: "Push notifications are not supported on this device.",
        pushKeysMissing: "Push keys are not configured.",
        pushDenied: "Notification permission was not granted.",
        pushEnabled: "Push notifications are enabled.",
        pushEnableFailed: "Failed to enable push notifications.",
        pushGenericError: "There was an error enabling notifications.",
        installApp: "Install app",
        enablePush: "Enable notifications",
        enabling: "Enabling...",
      },
      de: {
        appInstalled: "Die App ist bereits installiert.",
        installStarted: "Installation gestartet.",
        installCancelled: "Installation abgebrochen.",
        iosInstall: "Auf iOS: Teilen > Zum Home-Bildschirm.",
        promptUnavailable: "Der Installationsdialog ist derzeit nicht verfuegbar.",
        loginForPush: "Melden Sie sich an, um Benachrichtigungen zu aktivieren.",
        pushUnsupported: "Push-Benachrichtigungen werden auf diesem Geraet nicht unterstuetzt.",
        pushKeysMissing: "Push-Schluessel sind nicht eingerichtet.",
        pushDenied: "Die Benachrichtigungsfreigabe wurde nicht erteilt.",
        pushEnabled: "Push-Benachrichtigungen sind aktiviert.",
        pushEnableFailed: "Push-Benachrichtigungen konnten nicht aktiviert werden.",
        pushGenericError: "Fehler beim Aktivieren der Benachrichtigungen.",
        installApp: "App installieren",
        enablePush: "Benachrichtigungen aktivieren",
        enabling: "Aktivierung...",
      },
      it: {
        appInstalled: "L'app e gia installata.",
        installStarted: "Installazione avviata.",
        installCancelled: "Installazione annullata.",
        iosInstall: "Su iOS: Condividi > Aggiungi alla schermata Home.",
        promptUnavailable: "Il prompt di installazione non e disponibile al momento.",
        loginForPush: "Accedi per attivare le notifiche.",
        pushUnsupported: "Le notifiche push non sono supportate su questo dispositivo.",
        pushKeysMissing: "Le chiavi push non sono configurate.",
        pushDenied: "Il permesso per le notifiche non e stato concesso.",
        pushEnabled: "Le notifiche push sono attive.",
        pushEnableFailed: "Impossibile attivare le notifiche push.",
        pushGenericError: "Errore durante l'attivazione delle notifiche.",
        installApp: "Installa app",
        enablePush: "Attiva notifiche",
        enabling: "Attivazione...",
      },
    }[locale] ||
    {
      appInstalled: "Aplikacija je vec instalirana.",
      installStarted: "Instalacija je pokrenuta.",
      installCancelled: "Instalacija je otkazana.",
      iosInstall: "Na iOS: Share > Add to Home Screen.",
      promptUnavailable: "Install prompt trenutno nije dostupan.",
      loginForPush: "Prijavite se da biste ukljucili notifikacije.",
      pushUnsupported: "Push notifikacije nisu podrzane na ovom uredjaju.",
      pushKeysMissing: "Push kljucevi nisu podeseni.",
      pushDenied: "Dozvola za notifikacije nije odobrena.",
      pushEnabled: "Push notifikacije su ukljucene.",
      pushEnableFailed: "Neuspesna aktivacija push notifikacija.",
      pushGenericError: "Greska pri ukljucivanju notifikacija.",
      installApp: "Instaliraj app",
      enablePush: "Ukljuci notifikacije",
      enabling: "Aktivacija...",
    };

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

    if (!isLoggedIn) {
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
  const showPush = isLoggedIn && !pushEnabled;

  if (!showInstall && !showPush) {
    return null;
  }

  return (
    <div className="mobile-menu-pwa-actions">
      <div className="mobile-cta-buttons mobile-cta-buttons-full">
        {showInstall ? (
          <button type="button" className="mobile-cta-link clinic-glow-btn" onClick={handleInstall}>
            <span className="mobile-cta-link-text">{copy.installApp}</span>
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
              {busy ? copy.enabling : copy.enablePush}
            </span>
          </button>
        ) : null}
      </div>
      {message ? <p className="mobile-pwa-message">{message}</p> : null}
    </div>
  );
}
