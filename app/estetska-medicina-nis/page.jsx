import TreatmentLanding from "@/components/landing/TreatmentLanding";
import { getLandingCopy } from "@/lib/content/landing-copy";
import { CURATED_BEFORE_AFTER_CASES } from "@/data/before-after-cases";
import { getCachedServicesCatalog } from "@/lib/catalog/services";
import { SERVICE_CATEGORY_SPECS } from "@/lib/services/category-map";

// ISR: stranica prima plaćeni saobraćaj, pa ne sme da čeka bazu na svaki klik.
export const revalidate = 300;

export const metadata = {
  // absolute: naslov već sadrži ime ordinacije, globalni template ga je dodavao drugi put
  title: { absolute: "Estetska medicina Niš — Dr Igić Clinic | Fileri, Botoks, PRP" },
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

export default async function EstetkaMedacinaNis() {
  const copy = getLandingCopy("estetska-medicina");

  /* Cene: stvarne stavke iz kataloga, ne procene. Prikazuje se po jedna
     reprezentativna usluga iz glavnih kategorija — ceo cenovnik je jedan klik
     dalje, a ovde je dovoljno da posetilac vidi red veličine i prestane da
     traži cenu po sajtu. */
  const catalog = await getCachedServicesCatalog();
  const prices = catalog
    .flatMap((category) =>
      (category.services || [])
        .filter((service) => service.kind === "single" && service.priceRsd > 0)
        .sort((a, b) => a.priceRsd - b.priceRsd)
        .slice(0, 1)
        .map((service) => ({
          id: service.id,
          name: `${category.name} — ${service.name}`,
          price: service.promotion?.promoPriceRsd ?? service.priceRsd,
          durationMin: service.durationMin,
        }))
    )
    .slice(0, 8);

  return (
    <>
      <TreatmentLanding
        copy={copy}
        cases={CURATED_BEFORE_AFTER_CASES.slice(0, 10)}
        prices={prices}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(LOCAL_JSON_LD) }}
      />
    </>
  );
}
