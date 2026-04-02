import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { getFounderCopy } from "@/lib/content/founder-copy";
import { LOCALE_COOKIE_KEY, resolveLocale } from "@/lib/i18n";

export const metadata = {
  title: "Dr Nikola Igić",
};

export default async function NikolaIgicPage() {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_KEY)?.value);
  const copy = getFounderCopy(locale);

  return (
    <main
      className="clinic-home5"
      style={{
        minHeight: "100vh",
        background: "#0a0c00",
        color: "#eef4ff",
        padding: "120px 16px 56px",
      }}
    >
      <div className="container" style={{ maxWidth: 1020 }}>
        <div
          className="glass-panel"
          style={{
            borderRadius: 18,
            padding: 24,
            display: "grid",
            gap: 18,
          }}
        >
          <span className="clinic-founder-eyebrow" style={{ width: "fit-content" }}>
            {copy.eyebrow}
          </span>
          <h1 style={{ margin: 0 }}>{copy.title}</h1>
          <p style={{ margin: 0, color: "var(--clinic-text-secondary)" }}>{copy.summary}</p>

          <div style={{ display: "grid", gap: 12 }}>
            {copy.paragraphs.map((paragraph) => (
              <p key={paragraph} style={{ margin: 0, color: "var(--clinic-text-secondary)" }}>
                {paragraph}
              </p>
            ))}
          </div>

          <div className="clinic-founder-highlights" style={{ marginTop: -4 }}>
            {copy.highlights.map((highlight) => (
              <span key={highlight} className="clinic-founder-highlight-chip">
                {highlight}
              </span>
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 14,
            }}
          >
            <Image
              src="/assets/img/doctor-about.webp"
              alt={copy.imageAlt}
              width={680}
              height={860}
              sizes="(max-width: 768px) 92vw, 48vw"
              style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 14 }}
            />
            <Image
              src="/assets/img/before-after1.webp"
              alt="Pre i posle tretmana"
              width={680}
              height={860}
              sizes="(max-width: 768px) 92vw, 48vw"
              style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 14 }}
            />
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/booking" className="btn clinic-glow-btn clinic-hero-cta-btn">
              {copy.primaryCta}
            </Link>
            <Link href="/#osnivac" className="btn clinic-glow-btn clinic-hero-cta-btn">
              Nazad na pocetnu
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
