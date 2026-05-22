"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ParallaxProvider } from "react-scroll-parallax";
import Context from "@/context/Context";
import LocaleProvider from "@/components/common/LocaleProvider";
import PWARegister from "@/components/common/PWARegister";
import ProfileSetupGate from "@/components/common/ProfileSetupGate";
import SessionProvider from "@/components/common/SessionProvider";
import ClinicCallFab from "@/components/common/ClinicCallFab";
import ScrollTop from "@/components/common/ScrollTop";
import SmoothScroll from "@/components/common/SmoothScroll";
import CustomCursor from "@/components/common/CustomCursor";
import ScrollProgress from "@/components/common/ScrollProgress";

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

  // ── Text scramble on [data-scramble] elements ────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·—∙";

    function runScramble(el) {
      const text = el.dataset.scrambleText || el.textContent;
      if (!text.trim() || el.dataset.scrambleDone) return;
      el.dataset.scrambleText = text;
      el.dataset.scrambleDone = "1";

      let frame = 0;
      const FRAMES = 24;

      function tick() {
        const progress = frame / FRAMES;
        const resolved = Math.ceil(progress * text.length);
        el.textContent = [...text].map((ch, i) => {
          if (ch === " " || ch === "+" || ch === "%" || ch === "." || ch === ",") return ch;
          if (i < resolved) return text[i];
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        }).join("");
        frame++;
        if (frame <= FRAMES) requestAnimationFrame(tick);
        else el.textContent = text;
      }

      const delay = parseInt(el.dataset.scrambleDelay || "0", 10);
      setTimeout(() => requestAnimationFrame(tick), delay);
    }

    const scrambleObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          scrambleObs.unobserve(e.target);
          runScramble(e.target);
        }
      });
    }, { threshold: 0.4 });

    function scanScramble(root = document) {
      root.querySelectorAll("[data-scramble]").forEach((el) => {
        if (!el.dataset.scrambleDone && !el.dataset.scramblePending) {
          el.dataset.scramblePending = "1";
          scrambleObs.observe(el);
        }
      });
    }

    scanScramble();
    const scrambleMutObs = new MutationObserver(() => scanScramble());
    scrambleMutObs.observe(document.body, { childList: true, subtree: true });

    return () => { scrambleObs.disconnect(); scrambleMutObs.disconnect(); };
  }, [pathname]);

  // ── Magnetic effect on .clinic-magnetic elements ─────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(hover: none)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const STRENGTH = 0.32;
    const cleanups = [];

    function bindMagnetic(el) {
      if (el.dataset.magneticBound) return;
      el.dataset.magneticBound = "1";

      const onMove = (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * STRENGTH;
        const y = (e.clientY - r.top - r.height / 2) * STRENGTH;
        el.style.transform = `translate(${x}px, ${y}px)`;
        el.style.transition = "transform 0.2s cubic-bezier(0.22,1,0.36,1)";
      };

      const onLeave = () => {
        el.style.transform = "";
        el.style.transition = "transform 0.55s cubic-bezier(0.22,1,0.36,1)";
      };

      el.addEventListener("mousemove", onMove, { passive: true });
      el.addEventListener("mouseleave", onLeave);
      cleanups.push(() => {
        el.removeEventListener("mousemove", onMove);
        el.removeEventListener("mouseleave", onLeave);
      });
    }

    function scanMagnetic(root = document) {
      root.querySelectorAll(".clinic-magnetic").forEach(bindMagnetic);
    }

    scanMagnetic();
    const magMutObs = new MutationObserver(() => scanMagnetic());
    magMutObs.observe(document.body, { childList: true, subtree: true });

    return () => {
      magMutObs.disconnect();
      cleanups.forEach((fn) => fn());
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
          <ClinicCallFab />
          <SmoothScroll />
          <CustomCursor />
          <ScrollProgress />
        </Context>
      </SessionProvider>
    </LocaleProvider>
  );
}
