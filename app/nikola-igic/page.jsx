import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Dr Nikola Igic | Portfolio",
};

export default function NikolaIgicPage() {
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
          <h1 style={{ margin: 0 }}>Dr Nikola Igic</h1>
          <p style={{ margin: 0, color: "#d3deee" }}>
            Sertifikovani doktor estetske i anti-age medicine i specijalizant
            plasticne hirurgije. Fokus je na prirodnim rezultatima, sigurnosti
            i precizno planiranim tretmanima.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 14,
            }}
          >
            <Image
              src="/assets/img/slika1.png"
              alt="Dr Nikola Igic"
              width={680}
              height={860}
              style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 14 }}
            />
            <Image
              src="/assets/img/before-after1.png"
              alt="Pre i posle tretmana"
              width={680}
              height={860}
              style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 14 }}
            />
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/#booking" className="btn clinic-glow-btn clinic-hero-cta-btn">
              Zakazi termin
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
