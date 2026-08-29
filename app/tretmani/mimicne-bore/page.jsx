import TreatmentLanding from "@/components/landing/TreatmentLanding";
import { getLandingCopy } from "@/lib/content/landing-copy";
import { CURATED_BEFORE_AFTER_CASES } from "@/data/before-after-cases";
import { getCachedServicesCatalog } from "@/lib/catalog/services";
import { publicServiceName, publicText } from "@/lib/services/public-names";
import { getConfiguredSiteUrl } from "@/lib/site";

/**
 * Odredišna stranica za oglase o tretmanu mimičnih bora.
 *
 * Postoji zato što je Google Ads odbio oglase koji vode na /tretmani/botox uz
 * obrazloženje "Restricted drug terms — Destination contains: BOTOX, Botoks
 * and botulinum toksin. Not allowed in Serbia."
 *
 * Ova stranica opisuje isti tretman preko regije koja se tretira i nigde ne
 * navodi naziv leka — ni u tekstu, ni u nazivima usluga, ni u URL-u, ni u
 * strukturiranim podacima. /tretmani/botox ostaje netaknut za organsku
 * pretragu, na koju se ova ograničenja ne odnose.
 */

export const revalidate = 300;

const copy = getLandingCopy("mimicne-bore");

export const metadata = {
  title: { absolute: copy.metaTitle },
  description: copy.metaDescription,
  keywords: [
    "mimične bore Niš",
    "bore na čelu Niš",
    "bore između obrva",
    "bore oko očiju",
    "tretman bora Niš",
    "estetska medicina Niš",
  ],
  alternates: { canonical: "/tretmani/mimicne-bore" },
  openGraph: {
    title: copy.metaTitle,
    description: copy.metaDescription,
    url: "/tretmani/mimicne-bore",
    type: "article",
    locale: "sr_RS",
  },
};

function buildJsonLd(prices) {
  const siteUrl = getConfiguredSiteUrl();
  const url = `${siteUrl}/tretmani/mimicne-bore`;
  const amounts = prices.map((item) => item.price).filter((value) => value > 0);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MedicalProcedure",
        "@id": `${url}#procedure`,
        name: "Tretman mimičnih bora",
        description:
          "Ublažavanje mimičnih bora na čelu, između obrva i oko očiju, u ordinaciji estetske medicine u Nišu.",
        procedureType: {
          "@type": "MedicalProcedureType",
          name: "Aesthetic medicine",
        },
        performedBy: {
          "@type": "Physician",
          "@id": `${siteUrl}/nikola-igic#physician`,
          name: "Dr Nikola Igić",
          jobTitle: "Lekar estetske i anti-age medicine",
        },
        url,
      },
      ...(amounts.length
        ? [
            {
              "@type": "Service",
              "@id": `${url}#service`,
              name: "Tretman mimičnih bora — Dr Igić Clinic",
              serviceType: "Tretman mimičnih bora",
              areaServed: { "@type": "City", name: "Niš" },
              url,
              offers: {
                "@type": "AggregateOffer",
                lowPrice: String(Math.min(...amounts)),
                highPrice: String(Math.max(...amounts)),
                priceCurrency: "EUR",
                offerCount: String(amounts.length),
              },
            },
          ]
        : []),
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: copy.faq.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ],
  };
}

export default async function MimicneBorePage() {
  const catalog = await getCachedServicesCatalog();
  const category = catalog.find((item) =>
    /^bot(oks|ox)$/i.test(String(item.name || "").trim())
  );

  const prices = (category?.services || [])
    .filter((service) => service.kind === "single" && service.priceRsd > 0)
    .map((service) => ({
      id: service.id,
      name: publicServiceName(service.name),
      price: service.promotion?.promoPriceRsd ?? service.priceRsd,
      durationMin: service.durationMin,
    }))
    .sort((a, b) => a.price - b.price);

  // Opisi slučajeva dolaze iz istog izvora kao i /rezultati, pa prolaze kroz
  // istu zamenu — inače bi naziv leka ušao na stranicu kroz alt atribut.
  const cases = CURATED_BEFORE_AFTER_CASES.filter(
    (item) => item.serviceCategory === "botox"
  ).map((item) => ({
    id: item.id,
    collageImageUrl: item.collageImageUrl,
    treatmentType: publicText(item.treatmentType),
    summary: publicText(item.summary),
    imageAlt: publicText(item.imageAlt),
  }));

  return (
    <>
      <TreatmentLanding copy={copy} cases={cases} prices={prices} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(prices)) }}
      />
    </>
  );
}
