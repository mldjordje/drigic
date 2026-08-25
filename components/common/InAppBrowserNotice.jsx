"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/common/LocaleProvider";

const IN_APP_BROWSER_PATTERN =
  /FBAN|FBAV|FB_IAB|Instagram|Line\/|Snapchat|TikTok|Twitter|Pinterest|MicroMessenger|; wv\)/i;

export default function InAppBrowserNotice() {
  const { t } = useLocale();
  const [isInApp, setIsInApp] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setIsInApp(IN_APP_BROWSER_PATTERN.test(window.navigator.userAgent || ""));
  }, []);

  if (!isInApp) {
    return null;
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="clinic-inapp-notice" role="note">
      <strong>{t("booking.inAppTitle")}</strong>
      <p>{t("booking.inAppBody")}</p>
      <button type="button" className="clinic-inapp-notice__btn" onClick={copyLink}>
        {copied ? t("booking.inAppCopied") : t("booking.inAppCopy")}
      </button>
    </div>
  );
}
