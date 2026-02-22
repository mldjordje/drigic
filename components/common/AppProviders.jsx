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
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const selector = ".clinic-reveal";
    const observedNodes = new WeakSet();

    let revealObserver = null;
    if (!reduceMotion) {
      revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              revealObserver.unobserve(entry.target);
            }
          });
        },
        {
          threshold: 0.2,
          rootMargin: "0px 0px -8% 0px",
        }
      );
    }

    const observeNode = (node) => {
      if (!(node instanceof HTMLElement)) {
        return;
      }
      if (!node.classList.contains("clinic-reveal")) {
        return;
      }
      if (node.classList.contains("is-visible")) {
        return;
      }

      if (reduceMotion) {
        node.classList.add("is-visible");
        return;
      }

      if (!observedNodes.has(node)) {
        observedNodes.add(node);
        revealObserver.observe(node);
      }
    };

    const scanNodeTree = (rootNode) => {
      if (!(rootNode instanceof HTMLElement) && rootNode !== document) {
        return;
      }

      if (rootNode instanceof HTMLElement && rootNode.matches(selector)) {
        observeNode(rootNode);
      }

      const nodes = rootNode.querySelectorAll ? rootNode.querySelectorAll(selector) : [];
      nodes.forEach((node) => observeNode(node));
    };

    scanNodeTree(document);

    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((addedNode) => {
          if (addedNode instanceof HTMLElement) {
            scanNodeTree(addedNode);
          }
        });
      });
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      revealObserver?.disconnect();
    };
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
