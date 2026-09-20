import TreatmentLanding from "@/components/landing/TreatmentLanding";
import { getLandingCopy } from "@/lib/content/landing-copy";
import { CURATED_BEFORE_AFTER_CASES } from "@/data/before-after-cases";
import { getCachedServicesCatalog } from "@/lib/catalog/services";
import { publicCategoryName, publicServiceName, publicText } from "@/lib/services/public-names";
import { SERVICE_CATEGORY_SPECS } from "@/lib/services/category-map";

// ISR: stranica prima plaćeni saobraćaj, pa ne sme da čeka bazu na svaki klik.
export const revalidate = 300;

export const metadata = {
  // absolute: naslov već sadrži ime ordinacije, globalni template ga je dodavao drugi put
  title: { absolute: "Estetska medicina Niš — Dr Igić Clinic | Fileri, Mimične bore, PRP" },
  description:
    "Ordinacija estetske i anti-age medicine u Nišu — Dr Nikola Igić. Hijaluronski fileri, tretman mimičnih bora, PRP, mezoterapija, skinbusteri. Cvijićeva 31/3, Niš. Zakaži online.",
  keywords: [
    "estetska medicina Niš",
    "estetski tretmani Niš",
    "hijaluronski fileri Niš",
    "mimične bore Niš",
    "PRP Niš",
    "mezoterapija Niš",
    "anti-age medicina Niš",
    "estetska ordinacija Niš",
    "dr igić clinic Niš",
    "fileri usne Niš",
    "cena tretmana bora Niš",
    "estetika lica Niš",
  ],
  alternates: { canonical: "/estetska-medicina-nis" },
  openGraph: {
    title: "Estetska medicina Niš — Dr Igić Clinic",
    description:
      "Ordinacija estetske i anti-age medicine u Nišu. Hijaluronski fileri, tretman mimičnih bora, PRP, mezoterapija. Zakažite konsultaciju.",
    type: "website",
    locale: "sr_RS",
  },
};

const PAGE_URL = "https://drigic.rs/estetska-medicina-nis";

/**
 * This page does NOT declare a second business node. It used to publish its
 * own `MedicalClinic` with its own id, name and address — one clinic showing
 * up as two entities to anything that reads the graph. The clinic is declared
 * once, in the root layout, and every page references that id instead.
 */
const LOCAL_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${PAGE_URL}#webpage`,
      "url": PAGE_URL,
      "name": "Estetska medicina Niš — Dr Igić Clinic",
      "description":
        "Ordinacija estetske, anti-age i regenerativne medicine u Nišu. Dr Nikola Igić — hijaluronski fileri, tretman mimičnih bora, PRP, mezoterapija, skinbusteri i drugi tretmani bez operacije.",
      "inLanguage": "sr",
      "isPartOf": { "@id": "https://drigic.rs/#website" },
      "about": { "@id": "https://drigic.rs/#organization" },
      "primaryImageOfPage": "https://drigic.rs/assets/img/doctor-about.webp",
      "significantLink": SERVICE_CATEGORY_SPECS.map(
        (cat) => `https://drigic.rs/tretmani/${cat.slug === "botox" ? "mimicne-bore" : cat.slug}`
      ),
      "speakable": {
        "@type": "SpeakableSpecification",
        "cssSelector": ["[data-answer]"],
      },
    },
    {
      "@type": "FAQPage",
      "@id": `${PAGE_URL}#faq`,
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
            "text": "U Dr Igić Clinic u Nišu dostupni su: hijaluronski fileri, tretman mimičnih bora, skinbusteri, kolagen stimulatori, polinukleotidi i egzozomi, lipoliza, hemijski piling, dermapen, PRP i mezoterapija — sve bez operacije.",
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
      "@id": `${PAGE_URL}#breadcrumb`,
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
          // Naziv leka na recept ne sme na stranicu na koju vodi oglas.
          name: `${publicCategoryName(category.name)} — ${publicServiceName(service.name)}`,
          price: service.promotion?.promoPriceRsd ?? service.priceRsd,
          durationMin: service.durationMin,
        }))
    )
    .slice(0, 8);

  return (
    <>
      <TreatmentLanding
        copy={copy}
        cases={CURATED_BEFORE_AFTER_CASES.slice(0, 10).map((item) => ({
          id: item.id,
          collageImageUrl: item.collageImageUrl,
          treatmentType: publicText(item.treatmentType),
          summary: publicText(item.summary),
          imageAlt: publicText(item.imageAlt),
        }))}
        prices={prices}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(LOCAL_JSON_LD) }}
      />
    </>
  );
}
