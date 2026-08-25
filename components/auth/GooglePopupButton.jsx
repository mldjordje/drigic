"use client";

import { useCallback } from "react";

const AUTH_SUCCESS_TYPE = "drigic-google-auth-success";

const IN_APP_BROWSER_PATTERN =
  /FBAN|FBAV|FB_IAB|Instagram|Line\/|Snapchat|TikTok|Twitter|Pinterest|MicroMessenger|; wv\)/i;

function buildRedirectUrl(nextPath) {
  return `/api/auth/google?next=${encodeURIComponent(nextPath || "/")}`;
}

function buildPopupUrl(nextPath) {
  const popupDonePath = `/auth/popup-complete?next=${encodeURIComponent(nextPath || "/")}`;
  return buildRedirectUrl(popupDonePath);
}

// Popups are unreliable on phones (new-tab handling loses window.opener) and
// blocked outright inside in-app browsers, so those clients get a full-page redirect.
function shouldUseRedirect() {
  if (typeof window === "undefined") return true;
  if (IN_APP_BROWSER_PATTERN.test(window.navigator.userAgent || "")) return true;
  if (window.matchMedia?.("(pointer: coarse)").matches) return true;
  return window.innerWidth < 900;
}

function openCenteredPopup(url) {
  const width = 520;
  const height = 700;
  const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
  const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);

  return window.open(
    url,
    "drigic_google_auth_popup",
    `width=${width},height=${height},left=${Math.round(left)},top=${Math.round(top)},resizable=yes,scrollbars=yes,status=no,toolbar=no,menubar=no`
  );
}

export default function GooglePopupButton({
  className = "",
  children,
  nextPath = "/",
  onSuccess,
  onBeforeOpen,
  title = "Login with Google",
}) {
  const handleClick = useCallback(
    (event) => {
      event.preventDefault();
      if (onBeforeOpen) {
        onBeforeOpen();
      }

      if (shouldUseRedirect()) {
        window.location.href = buildRedirectUrl(nextPath);
        return;
      }

      const url = buildPopupUrl(nextPath);
      const popup = openCenteredPopup(url);

      if (!popup) {
        window.location.href = buildRedirectUrl(nextPath);
        return;
      }

      const listener = (msgEvent) => {
        if (msgEvent.origin !== window.location.origin) {
          return;
        }
        if (msgEvent.data?.type !== AUTH_SUCCESS_TYPE) {
          return;
        }

        window.removeEventListener("message", listener);
        window.clearInterval(closedTimer);
        if (onSuccess) {
          onSuccess();
          return;
        }
        window.location.reload();
      };

      window.addEventListener("message", listener);

      // If the popup is closed without a message (blocked page, manual close),
      // reload so a session created in the popup still takes effect.
      const closedTimer = window.setInterval(() => {
        if (!popup.closed) return;
        window.clearInterval(closedTimer);
        window.removeEventListener("message", listener);
        window.location.reload();
      }, 800);
    },
    [nextPath, onBeforeOpen, onSuccess]
  );

  return (
    <button type="button" className={className} onClick={handleClick} title={title}>
      <span className="clinic-btn-label">{children}</span>
    </button>
  );
}
