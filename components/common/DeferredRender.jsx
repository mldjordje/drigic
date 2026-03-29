"use client";

import { useEffect, useRef, useState } from "react";

export default function DeferredRender({
  children,
  minHeight = 0,
  rootMargin = "220px 0px",
  className = "",
  placeholder = null,
}) {
  const [shouldRender, setShouldRender] = useState(false);
  const markerRef = useRef(null);

  useEffect(() => {
    if (shouldRender) {
      return undefined;
    }

    const node = markerRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setShouldRender(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldRender(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin,
        threshold: 0.01,
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin, shouldRender]);

  if (shouldRender) {
    return children;
  }

  return (
    <div
      ref={markerRef}
      className={className}
      style={minHeight ? { minHeight } : undefined}
      aria-hidden="true"
    >
      {placeholder}
    </div>
  );
}
