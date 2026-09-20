import "../public/assets/css/bootstrap.min.css";
import "../public/assets/css/all.min.css";
import "../public/assets/css/magnific-popup.min.css";
import "../public/assets/css/slick.min.css";
import "../public/assets/css/animate.min.css";
import "../public/assets/css/imageRevealHover.css";
import "../public/assets/sass/style.scss";
import "rc-slider/assets/index.css";
import { Cormorant_Infant, Fraunces, Noto_Sans, Source_Sans_3 } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { cookies } from "next/headers";
import GoogleTag from "@/components/analytics/GoogleTag";
import SitePageTracker from "@/components/analytics/SitePageTracker";
import AppProviders from "@/components/common/AppProviders";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";
import { LOCALE_COOKIE_KEY, resolveLocale } from "@/lib/i18n";
import { organizationGraph } from "@/lib/seo/organization";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE_TEMPLATE,
  getMetadataBase,
  getConfiguredSiteUrl,
} from "@/lib/site";

const cormorantInfantTitle = Cormorant_Infant({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--title-font",
});

/**
 * Display font za plaćene landing stranice.
 *
 * Fraunces je varijabilni serif sa SOFT i WONK osama — namerno nije
 * Playfair/Cormorant default koji nosi svaki drugi estetski sajt. Uzima se
 * jedan fajl (varijabilni), samo latin-ext subset, i koristi se isključivo na
 * landing stranicama. Tekstualni font se NE menja: Source Sans 3 je već u
 * bundle-u, pa nova tipografija ne košta nijedan dodatni bajt za telo teksta.
 */
const frauncesDisplay = Fraunces({
  subsets: ["latin", "latin-ext"],
  axes: ["SOFT", "WONK", "opsz"],
  variable: "--landing-display-font",
  display: "swap",
});

const sourceSansBody = Source_Sans_3({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--body-font-loaded",
  display: "swap",
});

/** Pouzdan fallback za srpsku latinicu (č ć ž š đ) ako primarni webfont nema glif */
const notoSansFallback = Noto_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-fallback",
  display: "swap",
});

export const metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: SITE_NAME,
    template: SITE_TITLE_TEMPLATE,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icons/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/icons/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    type: "website",
    locale: "sr_RS",
    images: [
      {
        url: "/icons/icon-512.png",
        width: 512,
        height: 512,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: ["/icons/icon-512.png"],
  },
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "default",
  },
  // NOTE: no site-wide `alternates.canonical` here. A hardcoded homepage
  // canonical leaks onto every page that doesn't override it, wrongly
  // canonicalizing them to "/". Each route sets its own canonical; pages
  // without one self-canonicalize to their real URL (correct). hreflang is
  // omitted because the site has no per-locale URLs (locale is cookie-based).
};

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_KEY)?.value);
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const initialSession = sessionToken ? await verifySessionToken(sessionToken) : null;

  const fontRootClass = `${cormorantInfantTitle.variable} ${sourceSansBody.variable} ${notoSansFallback.variable} ${frauncesDisplay.variable}`;

  return (
    <html
      lang={locale}
      className={fontRootClass}
      style={{ overflowX: "hidden", width: "100%" }}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationGraph()).replace(/</g, "\\u003c"),
          }}
        />
      </head>
      <body
        className="body clinic-theme-light clinic-app-shell"
        style={{
          overflowX: "hidden",
          width: "100%",
          fontFamily:
            'var(--body-font-loaded), var(--font-noto-fallback), "Segoe UI", system-ui, sans-serif',
        }}
      >
        <AppProviders initialLocale={locale} initialSession={initialSession}>
          <GoogleTag />
          <SitePageTracker />
          {children}
          <Analytics />
          <SpeedInsights />
        </AppProviders>
      </body>
    </html>
  );
}
