"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ParallaxProvider } from "react-scroll-parallax";
import Context from "@/context/Context";
import PWARegister from "@/components/common/PWARegister";
import ProfileSetupGate from "@/components/common/ProfileSetupGate";
import ScrollTop from "@/components/common/ScrollTop";
import ScrollTopBehaviour from "@/components/common/ScrollTopBehavier";

export default function AppProviders({ children }) {
  const pathname = usePathname();

  useEffect(() => {
    import("bootstrap/dist/js/bootstrap.esm").catch(() => {});
  }, []);

  useEffect(() => {
    const WOW = require("@/utils/wow");
    const wow = new WOW.default({
      live: false,
      mobile: false,
    });
    wow.init();
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      window.navigator?.standalone === true;

    if (!isStandalone || pathname !== "/") {
      return;
    }

    let preferAdminStart = false;
    try {
      const hasLocalPreference =
        window.localStorage.getItem("drigic-pwa-admin-start") === "1";
      const hasCookiePreference =
        typeof document !== "undefined" &&
        document.cookie.split("; ").includes("drigic-pwa-admin-start=1");
      preferAdminStart = hasLocalPreference || hasCookiePreference;
    } catch {
      preferAdminStart = false;
    }

    if (!preferAdminStart) {
      return;
    }

    window.location.replace("/admin/kalendar");
  }, [pathname]);

  return (
    <Context>
      <ParallaxProvider>{children}</ParallaxProvider>
      <PWARegister />
      <ProfileSetupGate />
      <ScrollTop />
      <ScrollTopBehaviour />
    </Context>
  );
}
