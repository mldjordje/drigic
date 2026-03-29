"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ParallaxProvider } from "react-scroll-parallax";
import Context from "@/context/Context";
import LocaleProvider from "@/components/common/LocaleProvider";
import PWARegister from "@/components/common/PWARegister";
import ProfileSetupGate from "@/components/common/ProfileSetupGate";
import SessionProvider from "@/components/common/SessionProvider";
import ScrollTop from "@/components/common/ScrollTop";

export default function AppProviders({
  children,
  initialLocale = "sr",
  initialSession = null,
}) {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    let timeoutId = null;
    let idleId = null;
    let cancelled = false;
    const loadBootstrap = () => {
      if (cancelled) {
        return;
      }
      import("bootstrap/dist/js/bootstrap.esm").catch(() => {});
    };

    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(loadBootstrap, { timeout: 1500 });
    } else {
      timeoutId = window.setTimeout(loadBootstrap, 180);
    }

    return () => {
      cancelled = true;
      if (idleId !== null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined" || !document.querySelector(".wow")) {
      return undefined;
    }

    let active = true;
    let wowInstance = null;

    import("@/utils/wow")
      .then((WOW) => {
        if (!active) {
          return;
        }
        wowInstance = new WOW.default({
          live: false,
          mobile: false,
        });
        wowInstance.init();
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobileViewport = window.matchMedia("(max-width: 767px)").matches;
    const selector = ".clinic-reveal";
    const observedNodes = new WeakSet();

    let revealObserver = null;
    if (!reduceMotion) {
      revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.dataset.clinicRevealed = "1";
              entry.target.classList.add("is-visible");
              revealObserver.unobserve(entry.target);
            }
          });
        },
        {
          threshold: isMobileViewport ? 0.12 : 0.2,
          rootMargin: isMobileViewport ? "0px 0px -4% 0px" : "0px 0px -8% 0px",
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
      if (node.dataset.clinicRevealed === "1") {
        node.classList.add("is-visible");
        return;
      }
      if (node.classList.contains("is-visible")) {
        return;
      }

      if (reduceMotion) {
        node.dataset.clinicRevealed = "1";
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

    let cancelled = false;
    const clearAdminStartPreference = () => {
      try {
        window.localStorage.removeItem("drigic-pwa-admin-start");
      } catch {
        // localStorage is optional
      }
      if (typeof document !== "undefined") {
        document.cookie =
          "drigic-pwa-admin-start=; path=/; max-age=0; SameSite=Lax";
      }
    };

    const role = String(initialSession?.role || "");
    if (role === "admin") {
      window.location.replace("/admin/kalendar");
      return undefined;
    }

    clearAdminStartPreference();

    return () => {
      cancelled = true;
    };
  }, [initialSession?.role, pathname]);

  return (
    <LocaleProvider initialLocale={initialLocale}>
      <SessionProvider initialSession={initialSession}>
        <Context>
          <ParallaxProvider>{children}</ParallaxProvider>
          <PWARegister />
          <ProfileSetupGate />
          <ScrollTop />
        </Context>
      </SessionProvider>
    </LocaleProvider>
  );
}
