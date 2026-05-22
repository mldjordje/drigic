"use client";
import { useEffect, useRef } from "react";

export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(hover: none)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    document.documentElement.classList.add("clinic-custom-cursor-active");

    let mouseX = -200;
    let mouseY = -200;
    let ringX = -200;
    let ringY = -200;
    let hovering = false;
    let clicking = false;
    let rafId = null;

    const lerp = (a, b, n) => a + (b - a) * n;

    const onMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const onEnterInteractive = () => { hovering = true; };
    const onLeaveInteractive = () => { hovering = false; };
    const onDown = () => { clicking = true; };
    const onUp = () => { clicking = false; };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousedown", onDown, { passive: true });
    window.addEventListener("mouseup", onUp, { passive: true });

    const interactiveSelector = "a, button, [role=button], input, label, select, textarea, .svc-card, .clinic-treatment-card";
    const bindInteractive = () => {
      document.querySelectorAll(interactiveSelector).forEach((el) => {
        el.addEventListener("mouseenter", onEnterInteractive);
        el.addEventListener("mouseleave", onLeaveInteractive);
      });
    };
    bindInteractive();

    const mutObs = new MutationObserver(bindInteractive);
    mutObs.observe(document.body, { childList: true, subtree: true });

    function tick() {
      ringX = lerp(ringX, mouseX, 0.1);
      ringY = lerp(ringY, mouseY, 0.1);

      const dotScale = clicking ? 0.5 : 1;
      const ringScale = hovering ? 1.9 : clicking ? 0.8 : 1;

      dot.style.transform = `translate(${mouseX - 4}px, ${mouseY - 4}px) scale(${dotScale})`;
      ring.style.transform = `translate(${ringX - 22}px, ${ringY - 22}px) scale(${ringScale})`;

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      mutObs.disconnect();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.documentElement.classList.remove("clinic-custom-cursor-active");
    };
  }, []);

  return (
    <>
      <div className="clinic-cursor-dot" ref={dotRef} aria-hidden="true" />
      <div className="clinic-cursor-ring" ref={ringRef} aria-hidden="true" />
    </>
  );
}
