import "../public/assets/css/bootstrap.min.css";
import "../public/assets/css/all.min.css";
import "../public/assets/css/magnific-popup.min.css";
import "../public/assets/css/slick.min.css";
import "../public/assets/css/animate.min.css";
import "../public/assets/css/imageRevealHover.css";
import "../public/assets/sass/style.scss";
import "rc-slider/assets/index.css";
import { Montserrat } from "next/font/google";
import { cookies } from "next/headers";
import AppProviders from "@/components/common/AppProviders";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";
import { LOCALE_COOKIE_KEY, resolveLocale } from "@/lib/i18n";

const montserratTitle = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--title-font",
});

const montserratBody = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--body-font",
});

export const metadata = {
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Dr Igic",
    statusBarStyle: "default",
  },
};

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_KEY)?.value);
  const initialSession = await verifySessionToken(
    cookieStore.get(SESSION_COOKIE_NAME)?.value
  );

  return (
    <html lang={locale} style={{ overflowX: "hidden", width: "100%" }}>
      <body
        className={`body clinic-theme-light clinic-app-shell ${montserratBody.variable} ${montserratTitle.variable}`}
        style={{ overflowX: "hidden", width: "100%" }}
      >
        <AppProviders initialLocale={locale} initialSession={initialSession}>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
