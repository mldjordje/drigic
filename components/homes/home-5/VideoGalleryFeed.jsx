"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/components/common/LocaleProvider";
import styles from "./VideoGalleryFeed.module.css";

const FALLBACK_SHORTS = [
  {
    title: "Dr Igic Shorts 1",
    youtubeUrl: "https://youtube.com/shorts/mL_8n1JYxb0?si=3p8HSIVdPHZ379tt",
  },
  {
    title: "Dr Igic Shorts 2",
    youtubeUrl: "https://youtube.com/shorts/cn9ymegksNc?si=BG9upj_bVNlPsCx3",
  },
  {
    title: "Dr Igic Shorts 3",
    youtubeUrl: "https://youtube.com/shorts/ZFXF16v4F_g?si=Blf4-jUatPsPoGkT",
  },
  {
    title: "Dr Igic Shorts 4",
    youtubeUrl: "https://youtube.com/shorts/1Khh-ZH9a3Y?si=cELDtq2G1RtdRws4",
  },
];

function parseResponseSafe(rawText) {
  if (!rawText) {
    return null;
  }
  try {
    return JSON.parse(rawText);
  } catch {
    return null;
  }
}

function normalizeYoutubeId(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }

  const directId = raw.match(/^[A-Za-z0-9_-]{11}$/);
  if (directId) {
    return directId[0];
  }

  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    const parts = parsed.pathname.split("/").filter(Boolean);

    if (host === "youtu.be") {
      const id = parts[0] || "";
      const match = id.match(/[A-Za-z0-9_-]{11}/);
      return match ? match[0] : "";
    }

    if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      if (parts[0] === "shorts" || parts[0] === "embed" || parts[0] === "live") {
        const id = parts[1] || "";
        const match = id.match(/[A-Za-z0-9_-]{11}/);
        return match ? match[0] : "";
      }

      if (parts[0] === "watch") {
        const id = parsed.searchParams.get("v") || "";
        const match = id.match(/[A-Za-z0-9_-]{11}/);
        return match ? match[0] : "";
      }
    }
  } catch {
    const fallbackMatch = raw.match(/[A-Za-z0-9_-]{11}/);
    return fallbackMatch ? fallbackMatch[0] : "";
  }

  return "";
}

function normalizeVideoItem(item, index) {
  const youtubeId = normalizeYoutubeId(item?.youtubeUrl);
  if (!youtubeId) {
    return null;
  }

  return {
    id: String(item?.id || `fallback-${index}-${youtubeId}`),
    title: String(item?.title || `Video ${index + 1}`),
    youtubeUrl: String(item?.youtubeUrl || ""),
    youtubeId,
  };
}

function buildEmbedUrl(youtubeId, autoplay) {
  const params = new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    mute: "1",
    controls: "0",
    rel: "0",
    playsinline: "1",
    modestbranding: "1",
    loop: "1",
    playlist: youtubeId,
  });
  return `https://www.youtube-nocookie.com/embed/${youtubeId}?${params.toString()}`;
}

export default function VideoGalleryFeed() {
  const { locale } = useLocale();
  const [apiVideos, setApiVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const slideRefs = useRef([]);

  useEffect(() => {
    let mounted = true;

    async function loadVideos() {
      try {
        const response = await fetch("/api/media/videos");
        const text = await response.text();
        const parsed = parseResponseSafe(text);
        const rows = Array.isArray(parsed?.data) ? parsed.data : [];
        if (mounted) {
          setApiVideos(rows);
        }
      } catch {
        if (mounted) {
          setApiVideos([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadVideos();
    return () => {
      mounted = false;
    };
  }, []);

  const videos = useMemo(() => {
    const merged = [];
    const seen = new Set();

    [...apiVideos, ...FALLBACK_SHORTS].forEach((entry, index) => {
      const normalized = normalizeVideoItem(entry, index);
      if (!normalized || seen.has(normalized.youtubeId)) {
        return;
      }
      seen.add(normalized.youtubeId);
      merged.push(normalized);
    });

    return merged;
  }, [apiVideos]);

  const copy =
    {
      sr: {
        loading: "Ucitavanje video galerije...",
        empty: "Trenutno nema dostupnih videa.",
        back: "Nazad",
        title: "Video galerija",
      },
      en: {
        loading: "Loading video gallery...",
        empty: "There are currently no available videos.",
        back: "Back",
        title: "Video gallery",
      },
      de: {
        loading: "Videogalerie wird geladen...",
        empty: "Derzeit sind keine Videos verfuegbar.",
        back: "Zurueck",
        title: "Videogalerie",
      },
      it: {
        loading: "Caricamento galleria video...",
        empty: "Al momento non ci sono video disponibili.",
        back: "Indietro",
        title: "Galleria video",
      },
    }[locale] ||
    {
      loading: "Ucitavanje video galerije...",
      empty: "Trenutno nema dostupnih videa.",
      back: "Nazad",
      title: "Video galerija",
    };

  useEffect(() => {
    slideRefs.current = slideRefs.current.slice(0, videos.length);
  }, [videos.length]);

  useEffect(() => {
    if (!videos.length || typeof IntersectionObserver === "undefined") {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.65) {
            return;
          }
          const rawIndex = Number(entry.target.getAttribute("data-index"));
          if (Number.isFinite(rawIndex)) {
            setActiveIndex((prev) => (prev === rawIndex ? prev : rawIndex));
          }
        });
      },
      {
        threshold: [0.65, 0.8, 1],
      }
    );

    slideRefs.current.forEach((slideNode) => {
      if (slideNode) {
        observer.observe(slideNode);
      }
    });

    return () => observer.disconnect();
  }, [videos.length]);

  if (loading && !videos.length) {
    return (
      <main className={styles.loadingRoot}>
        <p>{copy.loading}</p>
      </main>
    );
  }

  if (!videos.length) {
    return (
      <main className={styles.loadingRoot}>
        <p>{copy.empty}</p>
      </main>
    );
  }

  return (
    <main className={styles.root}>
      <div className={styles.topBar}>
        <Link href="/" className={styles.topAction}>
          {copy.back}
        </Link>
        <span className={styles.topTitle}>{copy.title}</span>
      </div>

      <section className={styles.feed} aria-label={copy.title}>
        {videos.map((video, index) => (
          <article
            key={video.id}
            data-index={index}
            ref={(node) => {
              slideRefs.current[index] = node;
            }}
            className={styles.slide}
          >
            <div className={styles.playerWrap}>
              <iframe
                title={video.title}
                src={buildEmbedUrl(video.youtubeId, index === activeIndex)}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading={index === 0 ? "eager" : "lazy"}
              />
            </div>

            <div className={styles.meta}>
              <h2>{video.title}</h2>
              <p>@drigic</p>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
