import "../public/assets/css/bootstrap.min.css";
import "../public/assets/css/all.min.css";
import "../public/assets/css/magnific-popup.min.css";
import "../public/assets/css/slick.min.css";
import "../public/assets/css/animate.min.css";
import "../public/assets/css/imageRevealHover.css";
import "../public/assets/sass/style.scss";
import "rc-slider/assets/index.css";
import { Cormorant_Infant } from "next/font/google";
import { cookies } from "next/headers";
import AppProviders from "@/components/common/AppProviders";
import { LOCALE_COOKIE_KEY, resolveLocale } from "@/lib/i18n";

const cormorantInfantTitle = Cormorant_Infant({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--title-font",
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

  return (
    <html lang={locale} style={{ overflowX: "hidden", width: "100%" }}>
      <body
        className={`body clinic-theme-light clinic-app-shell ${cormorantInfantTitle.variable}`}
        style={{
          overflowX: "hidden",
          width: "100%",
          "--body-font": '"HelveticaNeueRoman", "Helvetica Neue", Helvetica, Arial, sans-serif',
        }}
      >
        <AppProviders initialLocale={locale}>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
