"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { SERVICE_CATEGORY_SPECS } from "@/lib/services/category-map";

const CATEGORY_META = SERVICE_CATEGORY_SPECS.map((category) => ({
  slug: category.slug,
  label: category.name,
}));

const CATEGORY_LABEL_BY_SLUG = new Map(
  CATEGORY_META.map((category) => [category.slug, category.label])
);

const CATEGORY_ALIAS_MAP = [
  { slug: "hijaluronski-fileri", keywords: ["hijaluron", "filer"] },
  { slug: "botox", keywords: ["botox", "botoks"] },
  { slug: "skinbusteri", keywords: ["skinbooster", "skinbuster", "skin booster"] },
  { slug: "kolagen-stimulatori", keywords: ["kolagen", "stimulator"] },
  { slug: "polinukleotidi-i-egzozomi", keywords: ["polinukleotid", "egzozom", "exosome"] },
  { slug: "lipoliza", keywords: ["lipoliza"] },
  { slug: "hemijski-piling", keywords: ["hemijski piling", "chemical peel"] },
  { slug: "dermapen", keywords: ["dermapen", "microneedling"] },
  { slug: "prp", keywords: ["prp"] },
  { slug: "mezoterapija", keywords: ["mezoterapija", "mesotherapy"] },
];

const FALLBACK_CATEGORY = {
  slug: "ostalo",
  label: "Ostalo",
};

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .trim();
}

function resolveCategorySlug(item) {
  const explicitCategory = normalizeText(item?.serviceCategory);
  if (explicitCategory && CATEGORY_LABEL_BY_SLUG.has(explicitCategory)) {
    return explicitCategory;
  }

  const combinedText = normalizeText(`${item?.treatmentType || ""} ${item?.productUsed || ""}`);
  const aliasMatch = CATEGORY_ALIAS_MAP.find((entry) =>
    entry.keywords.some((keyword) => combinedText.includes(keyword))
  );

  return aliasMatch?.slug || FALLBACK_CATEGORY.slug;
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export default function BeforeAfterShowcase({
  withFilter = false,
  showCta = true,
  sectionId = "rezultati",
  maxItems = null,
  compactFilter = false,
  viewMoreHref = "/rezultati",
  viewMoreLabel = "POGLEDAJ VISE",
}) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [lightboxImage, setLightboxImage] = useState(null);
  const lightboxRef = useRef(null);

  useEffect(() => {
    if (!lightboxImage) return;
    function handleKey(e) {
      if (e.key === "Escape") setLightboxImage(null);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxImage]);

  useEffect(() => {
    let mounted = true;

    fetch("/api/media/before-after")
      .then(async (response) => {
        const data = await parseResponse(response);
        if (!response.ok || !data?.ok) {
          throw new Error("Neuspesno ucitavanje rezultata.");
        }
        if (mounted) {
          setCases(Array.isArray(data.data) ? data.data : []);
        }
      })
      .catch(() => {
        if (mounted) {
          setCases([]);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const normalizedCases = useMemo(
    () =>
      cases.map((item) => {
        const categorySlug = resolveCategorySlug(item);
        return {
          ...item,
          categorySlug,
          categoryLabel:
            CATEGORY_LABEL_BY_SLUG.get(categorySlug) ||
            (categorySlug === FALLBACK_CATEGORY.slug ? FALLBACK_CATEGORY.label : categorySlug),
        };
      }),
    [cases]
  );

  const filterOptions = useMemo(() => {
    const counts = new Map();
    normalizedCases.forEach((item) => {
      counts.set(item.categorySlug, (counts.get(item.categorySlug) || 0) + 1);
    });

    const orderedOptions = CATEGORY_META.filter((category) => counts.has(category.slug)).map(
      (category) => ({
        ...category,
        count: counts.get(category.slug) || 0,
      })
    );

    if (counts.has(FALLBACK_CATEGORY.slug)) {
      orderedOptions.push({
        ...FALLBACK_CATEGORY,
        count: counts.get(FALLBACK_CATEGORY.slug) || 0,
      });
    }

    return [
      { slug: "all", label: "Sve", count: normalizedCases.length },
      ...orderedOptions,
    ];
  }, [normalizedCases]);

  useEffect(() => {
    if (!filterOptions.some((option) => option.slug === activeCategory)) {
      setActiveCategory("all");
    }
  }, [activeCategory, filterOptions]);

  const filteredCases = useMemo(() => {
    const baseCases =
      activeCategory === "all"
        ? normalizedCases
        : normalizedCases.filter((item) => item.categorySlug === activeCategory);

    if (!maxItems || maxItems <= 0) {
      return baseCases;
    }
    return baseCases.slice(0, maxItems);
  }, [activeCategory, maxItems, normalizedCases]);

  const shouldShowViewMore =
    !loading &&
    Boolean(maxItems && maxItems > 0 && normalizedCases.length > Number(maxItems || 0));

  if (!loading && !normalizedCases.length) {
    return null;
  }

  return (
    <section className="space overflow-hidden" id={sectionId || undefined}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-xl-8 col-lg-10">
            <div className="title-area text-center clinic-reveal">
              <h2 className="sec-title text-smoke">Rezultati tretmana</h2>
              <p className="sec-text text-smoke">
                Realni pre/posle prikazi tretmana iz klinicke prakse.
              </p>
            </div>
          </div>
        </div>

        {withFilter && !loading ? (
          <div
            className={`clinic-before-after-filter-wrap clinic-reveal ${
              compactFilter ? "is-compact" : ""
            }`}
          >
            {filterOptions.map((option) => (
              <button
                key={option.slug}
                type="button"
                className={`clinic-before-after-filter-chip ${
                  activeCategory === option.slug ? "is-active" : ""
                }`}
                onClick={() => setActiveCategory(option.slug)}
              >
                {option.label}
                <span>{option.count}</span>
              </button>
            ))}
          </div>
        ) : null}

        {loading ? (
          <p className="text-center" style={{ margin: 0 }}>
            Ucitavanje rezultata...
          </p>
        ) : (
          <>
            <div className="clinic-before-after-grid">
              {filteredCases.map((item) => (
                <article key={item.id} className="clinic-before-after-card glass-panel clinic-reveal">
                  <div className="clinic-before-after-head">
                    <h3>{item.treatmentType || "Tretman"}</h3>
                    <span className="clinic-before-after-category">{item.categoryLabel}</span>
                    {item.productUsed ? <span>{item.productUsed}</span> : null}
                  </div>
                  <div
                    className="clinic-before-after-collage"
                    style={{ cursor: "zoom-in" }}
                    role="button"
                    tabIndex={0}
                    aria-label="Pogledaj punu sliku"
                    onClick={() =>
                      setLightboxImage(item.collageImageUrl || item.beforeImageUrl)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        setLightboxImage(item.collageImageUrl || item.beforeImageUrl);
                    }}
                  >
                    <img
                      src={item.collageImageUrl || item.beforeImageUrl}
                      alt={`${item.treatmentType || "Tretman"} pre i posle`}
                    />
                    <span>Pre / Posle</span>
                  </div>
                </article>
              ))}
            </div>

            {shouldShowViewMore ? (
              <div className="btn-wrap mt-30 justify-content-center">
                <Link
                  scroll={false}
                  href={viewMoreHref}
                  className="btn bg-theme text-title clinic-glow-btn"
                >
                  <span className="link-effect">
                    <span className="effect-1">{viewMoreLabel}</span>
                    <span className="effect-1">{viewMoreLabel}</span>
                  </span>
                </Link>
              </div>
            ) : null}
          </>
        )}

        {showCta ? (
          <div className="btn-wrap mt-40 justify-content-center">
            <Link scroll={false} href="/booking" className="btn bg-theme text-title clinic-glow-btn">
              <span className="link-effect">
                <span className="effect-1">ZAKAZI TERMIN</span>
                <span className="effect-1">ZAKAZI TERMIN</span>
              </span>
            </Link>
          </div>
        ) : null}
      </div>

      {lightboxImage ? (
        <div
          ref={lightboxRef}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.88)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "zoom-out",
          }}
          onClick={() => setLightboxImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Pregled slike"
        >
          <img
            src={lightboxImage}
            alt="Pre i posle"
            style={{
              maxWidth: "92vw",
              maxHeight: "90vh",
              borderRadius: 8,
              boxShadow: "0 4px 40px rgba(0,0,0,0.8)",
              display: "block",
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            aria-label="Zatvori"
            onClick={() => setLightboxImage(null)}
            style={{
              position: "absolute",
              top: 16,
              right: 20,
              background: "none",
              border: "none",
              color: "#fff",
              fontSize: 32,
              lineHeight: 1,
              cursor: "pointer",
              padding: "4px 8px",
            }}
          >
            ×
          </button>
        </div>
      ) : null}
    </section>
  );
}
