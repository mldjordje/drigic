"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let lenis = null;
    let gsapRef = null;
    let ticker = null;
    let cancelled = false;

    Promise.all([
      import("lenis"),
      import("gsap"),
      import("gsap/ScrollTrigger"),
    ])
      .then(([{ default: Lenis }, { default: gsap }, { ScrollTrigger }]) => {
        if (cancelled) return;

        gsap.registerPlugin(ScrollTrigger);
        gsapRef = gsap;

        lenis = new Lenis({
          duration: 1.15,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
          wheelMultiplier: 0.9,
          touchMultiplier: 1.8,
          infinite: false,
        });

        lenis.on("scroll", ScrollTrigger.update);

        ticker = (time) => lenis.raf(time * 1000);
        gsap.ticker.add(ticker);
        gsap.ticker.lagSmoothing(0);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (lenis) lenis.destroy();
      if (gsapRef && ticker) gsapRef.ticker.remove(ticker);
    };
  }, [pathname]);

  return null;
}
