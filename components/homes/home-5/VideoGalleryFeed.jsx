"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/components/common/LocaleProvider";
import styles from "./VideoGalleryFeed.module.css";

const FALLBACK_SHORTS = [
  {
    title: "Dr Igić Shorts 1",
    youtubeUrl: "https://youtube.com/shorts/mL_8n1JYxb0?si=3p8HSIVdPHZ379tt",
  },
  {
    title: "Dr Igić Shorts 2",
    youtubeUrl: "https://youtube.com/shorts/cn9ymegksNc?si=BG9upj_bVNlPsCx3",
  },
  {
    title: "Dr Igić Shorts 3",
    youtubeUrl: "https://youtube.com/shorts/ZFXF16v4F_g?si=Blf4-jUatPsPoGkT",
  },
  {
    title: "Dr Igić Shorts 4",
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

function buildEmbedUrl(youtubeId, autoplay, controls = false) {
  const params = new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    mute: "1",
    controls: controls ? "1" : "0",
    rel: "0",
    playsinline: "1",
    modestbranding: "1",
    loop: "1",
    playlist: youtubeId,
  });
  return `https://www.youtube-nocookie.com/embed/${youtubeId}?${params.toString()}`;
}

function buildThumbnailUrl(youtubeId) {
  return `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
}

const COPY_BY_LOCALE = {
  sr: {
    loading: "Učitavanje video galerije...",
    empty: "Trenutno nema dostupnih videa.",
    back: "Nazad",
    title: "Video galerija",
    inlineTitle: "YouTube video galerija",
    inlineBody: "Najnoviji kratki video snimci i edukativni sadržaj direktno sa Dr Igić kanala.",
    viewAll: "Pogledaj sve videe",
    play: "Pusti video",
  },
  en: {
    loading: "Loading video gallery...",
    empty: "There are currently no available videos.",
    back: "Back",
    title: "Video gallery",
    inlineTitle: "YouTube video gallery",
    inlineBody: "Latest short videos and educational content from the Dr Igić channel.",
    viewAll: "View all videos",
    play: "Play video",
  },
  de: {
    loading: "Videogalerie wird geladen...",
    empty: "Derzeit sind keine Videos verfuegbar.",
    back: "Zurueck",
    title: "Videogalerie",
    inlineTitle: "YouTube Videogalerie",
    inlineBody: "Neueste Kurzvideos und edukative Inhalte vom Dr Igić Kanal.",
    viewAll: "Alle Videos ansehen",
    play: "Video abspielen",
  },
  it: {
    loading: "Caricamento galleria video...",
    empty: "Al momento non ci sono video disponibili.",
    back: "Indietro",
    title: "Galleria video",
    inlineTitle: "Galleria video YouTube",
    inlineBody: "Ultimi video brevi e contenuti educativi dal canale Dr Igić.",
    viewAll: "Vedi tutti i video",
    play: "Riproduci video",
  },
};

export default function VideoGalleryFeed({ inline = false, limit = null }) {
  const { locale } = useLocale();
  const [apiVideos, setApiVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeInlineVideoId, setActiveInlineVideoId] = useState(null);
  const slideRefs = useRef([]);

  useEffect(() => {
    let mounted = true;

    async function loadVideos() {
      try {
        const requestedLimit =
          inline && limit && Number.isFinite(Number(limit))
            ? Math.max(1, Math.min(12, Number(limit)))
            : null;
        const response = await fetch(
          requestedLimit
            ? `/api/media/videos?limit=${requestedLimit}`
            : "/api/media/videos"
        );
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
  }, [inline, limit]);

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

  const visibleVideos = useMemo(() => {
    if (!limit || limit <= 0) {
      return videos;
    }
    return videos.slice(0, limit);
  }, [limit, videos]);

  const copy = COPY_BY_LOCALE[locale] || COPY_BY_LOCALE.sr;

  useEffect(() => {
    slideRefs.current = slideRefs.current.slice(0, visibleVideos.length);
  }, [visibleVideos.length]);

  useEffect(() => {
    if (inline || !visibleVideos.length || typeof IntersectionObserver === "undefined") {
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
  }, [inline, visibleVideos.length]);

  if (loading && !visibleVideos.length) {
    return (
      <main className={styles.loadingRoot}>
        <p>{copy.loading}</p>
      </main>
    );
  }

  if (!visibleVideos.length) {
    return (
      <main className={styles.loadingRoot}>
        <p>{copy.empty}</p>
      </main>
    );
  }

  if (inline) {
    return (
      <section className={styles.inlineSection}>
        <div className="container">
          <div className={styles.inlineHeader}>
            <div className="title-area text-center clinic-reveal">
              <h2 className="sec-title text-smoke">{copy.inlineTitle}</h2>
              <p className="sec-text text-smoke">{copy.inlineBody}</p>
            </div>
          </div>

          <div className={styles.inlineGrid}>
            {visibleVideos.map((video, index) => (
              <article
                key={video.id}
                className={`${styles.inlineCard} glass-panel clinic-reveal`}
                style={{ "--clinic-reveal-delay": `${Math.min(index, 8) * 50}ms` }}
              >
                <div className={styles.inlinePlayerWrap}>
                  {activeInlineVideoId === video.id ? (
                    <iframe
                      title={video.title}
                      src={buildEmbedUrl(video.youtubeId, true, true)}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      loading="lazy"
                    />
                  ) : (
                    <button
                      type="button"
                      className={styles.inlinePreviewButton}
                      onClick={() => setActiveInlineVideoId(video.id)}
                      aria-label={`${copy.play}: ${video.title}`}
                    >
                      <img
                        src={buildThumbnailUrl(video.youtubeId)}
                        alt={video.title}
                        loading={index === 0 ? "eager" : "lazy"}
                        decoding="async"
                      />
                      <span className={styles.inlinePreviewShade} aria-hidden="true" />
                      <span className={styles.inlinePlayBadge}>
                        <span className={styles.inlinePlayIcon} aria-hidden="true" />
                        {copy.play}
                      </span>
                    </button>
                  )}
                </div>
                <div className={styles.inlineMeta}>
                  <h3>{video.title}</h3>
                  <p>@drigic</p>
                </div>
              </article>
            ))}
          </div>

          <div className="btn-wrap mt-40 justify-content-center">
            <Link scroll={false} href="/video-galerija" className="btn bg-theme text-title clinic-glow-btn">
              <span className="link-effect">
                <span className="effect-1">{copy.viewAll}</span>
                <span className="effect-1">{copy.viewAll}</span>
              </span>
            </Link>
          </div>
        </div>
      </section>
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
        {visibleVideos.map((video, index) => (
          <article
            key={video.id}
            data-index={index}
            ref={(node) => {
              slideRefs.current[index] = node;
            }}
            className={styles.slide}
          >
            <div className={styles.playerWrap}>
              {index === activeIndex ? (
                <iframe
                  title={video.title}
                  src={buildEmbedUrl(video.youtubeId, true)}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading={index === 0 ? "eager" : "lazy"}
                />
              ) : (
                <button
                  type="button"
                  className={styles.feedPreviewButton}
                  onClick={() => setActiveIndex(index)}
                  aria-label={`${copy.play}: ${video.title}`}
                >
                  <img
                    src={buildThumbnailUrl(video.youtubeId)}
                    alt={video.title}
                    loading="lazy"
                    decoding="async"
                  />
                  <span className={styles.inlinePreviewShade} aria-hidden="true" />
                  <span className={styles.feedPlayBadge}>
                    <span className={styles.inlinePlayIcon} aria-hidden="true" />
                    {copy.play}
                  </span>
                </button>
              )}
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
