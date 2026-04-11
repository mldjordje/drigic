"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";

function formatUpdatedAt(value) {
  const date = new Date(value);
  return date.toLocaleString("sr-RS", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function AdminAnalyticsRefresh({
  updatedAt,
  autoRefreshMs = 60000,
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const timerId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        startTransition(() => {
          router.refresh();
        });
      }
    }, autoRefreshMs);

    return () => {
      window.clearInterval(timerId);
    };
  }, [autoRefreshMs, router, startTransition]);

  return (
    <div style={styles.wrap}>
      <div style={styles.meta}>
        <span style={styles.kicker}>Poslednje osvezenje</span>
        <strong style={styles.value}>{formatUpdatedAt(updatedAt)}</strong>
        <span style={styles.note}>Auto refresh na 60s dok je ekran otvoren</span>
      </div>
      <button
        type="button"
        onClick={() => {
          startTransition(() => {
            router.refresh();
          });
        }}
        disabled={isPending}
        style={{
          ...styles.button,
          ...(isPending ? styles.buttonPending : null),
        }}
      >
        {isPending ? "Osvezavam..." : "Osvezi"}
      </button>
    </div>
  );
}

const styles = {
  wrap: {
    display: "grid",
    gap: 10,
    alignItems: "center",
  },
  meta: {
    display: "grid",
    gap: 4,
  },
  kicker: {
    fontSize: 11,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#8aa9c8",
  },
  value: {
    color: "#f5f8fd",
    fontSize: 14,
    lineHeight: 1.35,
  },
  note: {
    color: "#a7bdd2",
    fontSize: 12,
    lineHeight: 1.35,
  },
  button: {
    minHeight: 44,
    padding: "0 16px",
    borderRadius: 14,
    border: "1px solid rgba(167, 198, 230, 0.18)",
    background: "linear-gradient(180deg, rgba(111,163,218,0.22) 0%, rgba(62,110,164,0.22) 100%)",
    color: "#f4f8ff",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
  buttonPending: {
    opacity: 0.72,
    cursor: "wait",
  },
};
