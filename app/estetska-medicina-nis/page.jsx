import Link from "next/link";
import Header4 from "@/components/headers/Header4";
import Footer5 from "@/components/footers/Footer5";
import { SERVICE_CATEGORY_SPECS } from "@/lib/services/category-map";
import { CLINIC_PHONE_TEL, CLINIC_PHONE_DISPLAY, CLINIC_ADDRESS, CLINIC_EMAIL } from "@/lib/clinicContact";
import { SITE_NAME, getConfiguredSiteUrl } from "@/lib/site";

export const metadata = {
  title: "Estetska medicina Niš — Dr Igić Clinic | Fileri, Botoks, PRP",
  description:
    "Ordinacija estetske i anti-age medicine u Nišu — Dr Nikola Igić. Hijaluronski fileri, botoks, PRP, mezoterapija, skinbusteri. Cvijićeva 31/3, Niš. Zakaži online.",
  keywords: [
    "estetska medicina Niš",
    "estetski tretmani Niš",
    "hijaluronski fileri Niš",
    "botoks Niš",
    "PRP Niš",
    "mezoterapija Niš",
    "anti-age medicina Niš",
    "estetska ordinacija Niš",
    "dr igić clinic Niš",
    "fileri usne Niš",
    "botox Niš cena",
    "estetika lica Niš",
  ],
  alternates: { canonical: "/estetska-medicina-nis" },
  openGraph: {
    title: "Estetska medicina Niš — Dr Igić Clinic",
    description:
      "Ordinacija estetske i anti-age medicine u Nišu. Hijaluronski fileri, botoks, PRP, mezoterapija. Zakažite konsultaciju.",
    type: "website",
    locale: "sr_RS",
  },
};

const LOCAL_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["MedicalClinic", "LocalBusiness"],
      "@id": "https://drigic.rs/estetska-medicina-nis#clinic",
      "name": "Dr Igić Clinic — Estetska medicina Niš",
      "url": "https://drigic.rs/estetska-medicina-nis",
      "image": "https://drigic.rs/assets/img/doctor-about.webp",
      "description":
        "Ordinacija estetske, anti-age i regenerativne medicine u Nišu. Dr Nikola Igić — sertifikovani lekar estetske medicine. Hijaluronski fileri, botoks, PRP, mezoterapija, skinbusteri i drugi tretmani bez operacije.",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Cvijićeva 31/3",
        "addressLocality": "Niš",
        "addressRegion": "Nišavski okrug",
        "postalCode": "18000",
        "addressCountry": "RS",
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "43.3209",
        "longitude": "21.8954",
      },
      "telephone": "+381062238888",
      "email": "drigicclinic@gmail.com",
      "openingHours": "Mo-Fr 16:00-21:00",
      "priceRange": "€€",
      "areaServed": [
        { "@type": "City", "name": "Niš" },
        { "@type": "City", "name": "Niška Banja" },
        { "@type": "City", "name": "Aleksinac" },
      ],
      "medicalSpecialty": ["Aesthetic Medicine", "Anti-Age Medicine", "Regenerative Medicine"],
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Estetski tretmani Niš",
        "url": "https://drigic.rs/tretmani",
        "itemListElement": SERVICE_CATEGORY_SPECS.map((cat, i) => ({
          "@type": "Offer",
          "position": i + 1,
          "name": cat.name,
          "description": cat.shortDescription,
          "url": `https://drigic.rs/tretmani/${cat.slug}`,
        })),
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "5.0",
        "bestRating": "5",
        "worstRating": "1",
        "reviewCount": "20",
      },
      "sameAs": [
        "https://drigic.rs",
        "https://www.instagram.com/drigic.clinic/",
        "https://maps.google.com/?cid=16708722205926497279",
      ],
    },
    {
      "@type": "FAQPage",
      "@id": "https://drigic.rs/estetska-medicina-nis#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Koja je adresa estetske ordinacije Dr Igić u Nišu?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Dr Igić Clinic se nalazi na adresi Cvijićeva 31/3, 18000 Niš, Srbija. Radno vreme je radnim danima od 16:00 do 21:00.",
          },
        },
        {
          "@type": "Question",
          "name": "Koji estetski tretmani su dostupni u Nišu kod Dr Igića?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "U Dr Igić Clinic u Nišu dostupni su: hijaluronski fileri, botoks, skinbusteri, kolagen stimulatori, polinukleotidi i egzozomi, lipoliza, hemijski piling, dermapen, PRP i mezoterapija — sve bez operacije.",
          },
        },
        {
          "@type": "Question",
          "name": "Kako zakazati pregled u estetskoj ordinaciji u Nišu?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Termin možete zakazati online na drigic.rs/booking, pozivom na 062 238 888 ili e-mailom na drigicclinic@gmail.com.",
          },
        },
      ],
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Početna", "item": "https://drigic.rs" },
        { "@type": "ListItem", "position": 2, "name": "Estetska medicina Niš", "item": "https://drigic.rs/estetska-medicina-nis" },
      ],
    },
  ],
};

export default function EstetkaMedacinaNis() {
  return (
    <div className="clinic-home5">
      <Header4 />

      <main style={{ paddingTop: 130, paddingBottom: 90 }}>
        <section className="container">

          {/* ── HERO ── */}
          <div className="title-area text-center clinic-reveal" style={{ marginBottom: 56 }}>
            <span className="sub-title" style={{ display: "block", marginBottom: 12 }}>
              Dr Igić Clinic · Cvijićeva 31/3 · Niš
            </span>
            <h1 className="sec-title text-smoke">
              Estetska medicina u Nišu
            </h1>
            <p className="sec-text text-smoke" style={{ maxWidth: 720, margin: "16px auto 0" }}>
              Ordinacija estetske, anti-age i regenerativne medicine. Dr Nikola Igić —
              sertifikovani lekar sa individualizovanim pristupom i prirodnim rezultatima.
              Bez operacije, bez dugog oporavka.
            </p>
            <div className="btn-wrap mt-35 justify-content-center" style={{ gap: 12 }}>
              <Link href="/booking" className="btn bg-theme text-title clinic-glow-btn">
                Zakaži konsultaciju
              </Link>
              <a href={`tel:${CLINIC_PHONE_TEL}`} className="btn style2">
                {CLINIC_PHONE_DISPLAY}
              </a>
            </div>
          </div>

          {/* ── KONTAKT INFO ── */}
          <div className="glass-panel clinic-reveal" style={{ padding: "28px 32px", marginBottom: 48, borderRadius: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
              <div>
                <strong style={{ display: "block", marginBottom: 4, fontSize: 13, opacity: 0.7 }}>Adresa</strong>
                <span>{CLINIC_ADDRESS}, Niš 18000</span>
              </div>
              <div>
                <strong style={{ display: "block", marginBottom: 4, fontSize: 13, opacity: 0.7 }}>Telefon</strong>
                <a href={`tel:${CLINIC_PHONE_TEL}`}>{CLINIC_PHONE_DISPLAY}</a>
              </div>
              <div>
                <strong style={{ display: "block", marginBottom: 4, fontSize: 13, opacity: 0.7 }}>E-mail</strong>
                <a href={`mailto:${CLINIC_EMAIL}`}>{CLINIC_EMAIL}</a>
              </div>
              <div>
                <strong style={{ display: "block", marginBottom: 4, fontSize: 13, opacity: 0.7 }}>Radno vreme</strong>
                <span>Pon–Pet: 16:00–21:00</span>
              </div>
            </div>
          </div>

          {/* ── TRETMANI ── */}
          <div style={{ marginBottom: 56 }}>
            <div className="title-area text-center clinic-reveal" style={{ marginBottom: 32 }}>
              <span className="sub-title" style={{ display: "block", marginBottom: 8 }}>Usluge</span>
              <h2 className="sec-title text-smoke" style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)" }}>
                Estetski tretmani dostupni u Nišu
              </h2>
            </div>
            <div className="clinic-treatment-grid">
              {SERVICE_CATEGORY_SPECS.map((cat, i) => (
                <Link
                  key={cat.slug}
                  href={`/tretmani/${cat.slug}`}
                  className="clinic-treatment-card glass-panel clinic-hover-raise clinic-reveal"
                  style={{ "--clinic-reveal-delay": `${Math.min(i, 10) * 45}ms` }}
                  aria-label={`${cat.name} u Nišu`}
                >
                  <span className="clinic-treatment-card__icon" aria-hidden="true">
                    <i className={cat.iconClass || "fas fa-spa"} />
                  </span>
                  <div className="clinic-treatment-card__body">
                    <h3>{cat.name}</h3>
                    <p>{cat.shortDescription}</p>
                    <span className="clinic-treatment-link">Pogledaj usluge</span>
                  </div>
                  <span className="clinic-treatment-card__arrow" aria-hidden="true">
                    <i className="fas fa-arrow-right" />
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* ── ZAŠTO DR IGIĆ ── */}
          <div className="glass-panel clinic-reveal" style={{ padding: "40px 36px", marginBottom: 48, borderRadius: 16 }}>
            <h2 className="sec-title text-smoke" style={{ fontSize: "clamp(1.4rem, 2.5vw, 2rem)", marginBottom: 20 }}>
              Zašto pacijenti u Nišu biraju Dr Igić Clinic
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
              {[
                { icon: "fas fa-user-md", title: "Sertifikovani lekar", desc: "Dr Nikola Igić — specijalizovana edukacija iz estetske i anti-age medicine." },
                { icon: "fas fa-leaf", title: "Prirodni rezultati", desc: "Svaki tretman je prilagođen individualnoj anatomiji — bez preterane promene izgleda." },
                { icon: "fas fa-map-marker-alt", title: "Centar Niša", desc: "Ordinacija na lokaciji Cvijićeva 31/3 — lako dostupna iz svih delova Niša." },
                { icon: "fas fa-calendar-check", title: "Online zakazivanje", desc: "Termin možete zakazati 24/7 putem sajta — bez čekanja na telefonu." },
              ].map((item) => (
                <div key={item.title} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 22, color: "var(--theme-color, #c9a96e)", flexShrink: 0, marginTop: 2 }}>
                    <i className={item.icon} aria-hidden="true" />
                  </span>
                  <div>
                    <strong style={{ display: "block", marginBottom: 4 }}>{item.title}</strong>
                    <p style={{ margin: 0, fontSize: 13, opacity: 0.8, lineHeight: 1.5 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── FAQ ── */}
          <div style={{ marginBottom: 48 }}>
            <div className="title-area text-center clinic-reveal" style={{ marginBottom: 24 }}>
              <h2 className="sec-title text-smoke" style={{ fontSize: "clamp(1.4rem, 2.5vw, 2rem)" }}>
                Često postavljana pitanja — estetska medicina Niš
              </h2>
            </div>
            <div className="cat-faq__list">
              {[
                {
                  q: "Koja je adresa estetske ordinacije Dr Igić u Nišu?",
                  a: "Dr Igić Clinic se nalazi na adresi Cvijićeva 31/3, 18000 Niš. Radno vreme: pon–pet 16:00–21:00. Termin se zakazuje online ili pozivom na 062 238 888.",
                },
                {
                  q: "Koji tretmani se rade u estetskoj ordinaciji u Nišu?",
                  a: "Dostupni tretmani: hijaluronski fileri (usne, konture, podočnjaci), botoks, skinbusteri, kolagen stimulatori, PRP, mezoterapija, dermapen, hemijski piling, lipoliza i polinukleotidi — sve bez operacije.",
                },
                {
                  q: "Da li je konsultacija u Dr Igić Clinic besplatna?",
                  a: "Da. Pre svakog tretmana obavlja se besplatna konsultacija tokom koje lekar procenjuje stanje kože, preporučuje tretman i sastavlja individualni plan.",
                },
                {
                  q: "Koliko košta botoks u Nišu?",
                  a: "Cena botoksa u Dr Igić Clinic zavisi od broja zona i doze. Precizna cena se utvrđuje na konsultaciji. Kompletan cenovnik možete pogledati na stranici /cenovnik.",
                },
                {
                  q: "Da li estetski tretmani bole?",
                  a: "Većina tretmana se izvodi uz minimalnu nelagodnost. Hijaluronski fileri sadrže lokalni anestetik, a botoks se aplikuje ultratankim iglama. Po potrebi se koristi i topikalna anestetička krema.",
                },
              ].map((item, i) => (
                <details
                  key={item.q}
                  className="cat-faq__item clinic-reveal"
                  style={{ "--clinic-reveal-delay": `${i * 50}ms` }}
                >
                  <summary className="cat-faq__q">
                    <span>{item.q}</span>
                    <span className="cat-faq__icon" aria-hidden="true" />
                  </summary>
                  <div className="cat-faq__a">
                    <p>{item.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>

          {/* ── CTA ── */}
          <section className="cat-cta">
            <div className="cat-cta__inner clinic-reveal">
              <div className="cat-cta__text">
                <span className="cat-eyebrow cat-eyebrow--light">Niš</span>
                <h2 className="cat-cta__title">Zakažite konsultaciju u Nišu</h2>
                <p className="cat-cta__sub">
                  Cvijićeva 31/3, Niš — zakažite online ili pozovite direktno.
                  Prva konsultacija je besplatna.
                </p>
              </div>
              <div className="cat-cta__actions">
                <Link href="/booking" className="cat-cta__btn cat-cta__btn--primary">
                  <i className="fas fa-calendar-check" aria-hidden="true" />
                  Zakaži online
                </Link>
                <a href={`tel:${CLINIC_PHONE_TEL}`} className="cat-cta__btn cat-cta__btn--outline">
                  <i className="fas fa-phone" aria-hidden="true" />
                  {CLINIC_PHONE_DISPLAY}
                </a>
              </div>
            </div>
          </section>

        </section>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(LOCAL_JSON_LD) }}
      />

      <Footer5 />
    </div>
  );
}
