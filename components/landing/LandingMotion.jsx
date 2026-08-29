"use client";

import { useEffect } from "react";

/**
 * Dve stvari koje CSS ne može sam:
 *
 * 1. Fallback za scroll-driven reveal. Gde `animation-timeline: view()`
 *    postoji, CSS radi sve i ovaj observer se nikad ne pokreće. Gde ne
 *    postoji (stariji Firefox, Safari < 26), IntersectionObserver dodaje
 *    klasu i dobija se isti rezultat.
 * 2. Pozicija kursora za sjaj na dugmetu — upisuje se u custom property,
 *    pa animaciju i dalje radi CSS, bez layout-a i bez re-rendera.
 *
 * Oba se gase pod prefers-reduced-motion.
 */
export default function LandingMotion({ revealClass }) {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const supportsScrollDriven =
      typeof CSS !== "undefined" && CSS.supports?.("animation-timeline: view()");

    const cleanups = [];

    /* Sticky CTA traka i globalni telefonski FAB dele isti ugao ekrana na
       mobilnom. Poziv postoji u traci, pa se FAB gasi dok je landing otvoren. */
    document.body.classList.add("clinic-hide-call-fab");
    cleanups.push(() => document.body.classList.remove("clinic-hide-call-fab"));

    if (!supportsScrollDriven && revealClass) {
      const nodes = Array.from(document.querySelectorAll("[data-reveal]"));
      if (reduced) {
        nodes.forEach((node) => node.classList.add(revealClass));
      } else {
        const observer = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (!entry.isIntersecting) continue;
              entry.target.classList.add(revealClass);
              observer.unobserve(entry.target);
            }
          },
          { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
        );
        nodes.forEach((node) => observer.observe(node));
        cleanups.push(() => observer.disconnect());
      }
    }

    if (!reduced) {
      const onMove = (event) => {
        const target = event.target instanceof Element ? event.target.closest("[data-sheen]") : null;
        if (!target) return;
        const rect = target.getBoundingClientRect();
        target.style.setProperty("--mx", `${event.clientX - rect.left}px`);
        target.style.setProperty("--my", `${event.clientY - rect.top}px`);
      };
      document.addEventListener("pointermove", onMove, { passive: true });
      cleanups.push(() => document.removeEventListener("pointermove", onMove));
    }

    return () => cleanups.forEach((fn) => fn());
  }, [revealClass]);

  return null;
}
