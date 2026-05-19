import "../public/assets/css/bootstrap.min.css";
import "../public/assets/css/all.min.css";
import "../public/assets/css/magnific-popup.min.css";
import "../public/assets/css/slick.min.css";
import "../public/assets/css/animate.min.css";
import "../public/assets/css/imageRevealHover.css";
import "../public/assets/sass/style.scss";
import "rc-slider/assets/index.css";
import { Cormorant_Infant, Noto_Sans, Source_Sans_3 } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { cookies } from "next/headers";
import SitePageTracker from "@/components/analytics/SitePageTracker";
import AppProviders from "@/components/common/AppProviders";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";
import { LOCALE_COOKIE_KEY, resolveLocale } from "@/lib/i18n";
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
};

const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["MedicalOrganization", "LocalBusiness"],
      "@id": "https://drigic.rs/#organization",
      "name": "Dr Igić Clinic",
      "alternateName": "Klinika Dr Igić",
      "url": "https://drigic.rs",
      "logo": {
        "@type": "ImageObject",
        "url": "https://drigic.rs/assets/img/logo.png",
        "width": 200,
        "height": 60,
      },
      "description":
        "Ordinacija estetske, anti-age i regenerativne medicine u Srbiji. Specijalizovani tretmani: hijaluronski fileri, botox, skinbusteri, PRP, mezoterapija i dr.",
      "medicalSpecialty": [
        "Aesthetic Medicine",
        "Anti-Age Medicine",
        "Regenerative Medicine",
      ],
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "RS",
        "addressLocality": "Srbija",
      },
      "sameAs": [
        "https://www.instagram.com/drigic.clinic/",
      ],
      "employee": {
        "@type": "Physician",
        "@id": "https://drigic.rs/nikola-igic#physician",
        "name": "Dr Nikola Igić",
        "jobTitle": "Osnivač i lekar",
        "url": "https://drigic.rs/nikola-igic",
        "knowsAbout": [
          "Aesthetic medicine",
          "Hyaluronic fillers",
          "Botox",
          "Skinboosters",
          "PRP",
          "Mesotherapy",
          "Anti-age treatments",
        ],
      },
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Tretmani i usluge",
        "url": "https://drigic.rs/tretmani",
      },
    },
    {
      "@type": "WebSite",
      "@id": "https://drigic.rs/#website",
      "name": "Dr Igić Clinic",
      "url": "https://drigic.rs",
      "publisher": { "@id": "https://drigic.rs/#organization" },
      "inLanguage": ["sr", "en", "de", "it"],
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://drigic.rs/tretmani?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_KEY)?.value);
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const initialSession = sessionToken ? await verifySessionToken(sessionToken) : null;

  const fontRootClass = `${cormorantInfantTitle.variable} ${sourceSansBody.variable} ${notoSansFallback.variable}`;

  return (
    <html
      lang={locale}
      className={fontRootClass}
      style={{ overflowX: "hidden", width: "100%" }}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSON_LD) }}
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
          <SitePageTracker />
          {children}
          <Analytics />
          <SpeedInsights />
        </AppProviders>
      </body>
    </html>
  );
}
