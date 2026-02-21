"use client";

import { useCallback } from "react";

const AUTH_SUCCESS_TYPE = "drigic-google-auth-success";

function buildPopupUrl(nextPath) {
  const popupDonePath = `/auth/popup-complete?next=${encodeURIComponent(nextPath || "/")}`;
  return `/api/auth/google?next=${encodeURIComponent(popupDonePath)}`;
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

      const url = buildPopupUrl(nextPath);
      const popup = openCenteredPopup(url);

      if (!popup) {
        window.location.href = url;
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
        if (onSuccess) {
          onSuccess();
          return;
        }
        window.location.reload();
      };

      window.addEventListener("message", listener);
    },
    [nextPath, onBeforeOpen, onSuccess]
  );

  return (
    <button type="button" className={className} onClick={handleClick} title={title}>
      <span className="clinic-btn-label">{children}</span>
    </button>
  );
}
