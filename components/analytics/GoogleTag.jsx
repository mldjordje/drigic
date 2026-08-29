"use client";

import Script from "next/script";
import { GA_MEASUREMENT_ID, GOOGLE_ADS_ID, hasGoogleTag } from "@/lib/analytics/gtag";

/**
 * Loads gtag.js once and configures every id that is set.
 * Renders nothing when no id is configured, so local and preview builds
 * stay free of tracking.
 */
export default function GoogleTag() {
  if (!hasGoogleTag()) {
    return null;
  }

  // gtag.js is loaded under one id; the rest are attached with extra config calls.
  const primaryId = GA_MEASUREMENT_ID || GOOGLE_ADS_ID;

  const configLines = [
    GA_MEASUREMENT_ID ? `gtag('config', '${GA_MEASUREMENT_ID}');` : "",
    GOOGLE_ADS_ID ? `gtag('config', '${GOOGLE_ADS_ID}');` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <>
      <Script
        id="gtag-src"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${primaryId}`}
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          ${configLines}
        `}
      </Script>
    </>
  );
}
