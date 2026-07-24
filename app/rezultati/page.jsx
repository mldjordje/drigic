import Header4 from "@/components/headers/Header4";
import Footer5 from "@/components/footers/Footer5";
import BeforeAfterShowcase from "@/components/homes/home-5/BeforeAfterShowcase";
import { CURATED_BEFORE_AFTER_CASES } from "@/data/before-after-cases";
import { getConfiguredSiteUrl } from "@/lib/site";

export const metadata = {
  title: "Rezultati tretmana — Pre i Posle | Dr Igić Clinic Niš",
  description:
    "Pogledajte stvarne rezultate pacijenata — fotografije pre i posle tretmana u ordinaciji Dr Igić u Nišu. Hijaluronski fileri, botoks, PRP, mezoterapija, lipoliza.",
  keywords: [
    "rezultati tretmana",
    "pre i posle",
    "estetska medicina Niš",
    "fileri rezultati",
    "botoks pre posle",
    "dr igić clinic",
  ],
  alternates: { canonical: "/rezultati" },
  openGraph: {
    title: "Rezultati tretmana — Pre i Posle | Dr Igić Clinic Niš",
    description:
      "Stvarni rezultati pacijenata ordinacije Dr Igić u Nišu — fotografije pre i posle estetskih tretmana.",
    type: "website",
    locale: "sr_RS",
  },
};

export default function ResultsPage() {
  const siteUrl = getConfiguredSiteUrl();
  const resultsJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${siteUrl}/rezultati#collection`,
    name: "Rezultati estetskih tretmana pre i posle",
    description:
      "Stvarni primeri rezultata estetskih tretmana iz ordinacije Dr Igić u Nišu.",
    isPartOf: { "@id": `${siteUrl}/#website` },
    about: { "@id": `${siteUrl}/#organization` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: CURATED_BEFORE_AFTER_CASES.length,
      itemListElement: CURATED_BEFORE_AFTER_CASES.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "ImageObject",
          name: item.treatmentType,
          description: item.summary,
          contentUrl: `${siteUrl}${item.collageImageUrl}`,
          caption: item.imageAlt,
          representativeOfPage: index === 0,
        },
      })),
    },
  };

  return (
    <div className="clinic-home5">
      <Header4 />
      <main style={{ paddingTop: 130, paddingBottom: 90 }}>
        <section className="container" style={{ marginBottom: 12 }}>
          <div className="row justify-content-center">
            <div className="col-xl-8 col-lg-10 text-center">
              <p className="sec-text text-smoke">
                Fotografije prikazuju stvarne rezultate iz ordinacijske prakse.
                Svaki plan tretmana određuje se nakon pregleda, a rezultat zavisi
                od anatomije, indikacije i individualne reakcije pacijenta.
              </p>
            </div>
          </div>
        </section>
        <BeforeAfterShowcase
          withFilter
          showCta={false}
          sectionId=""
          initialCases={CURATED_BEFORE_AFTER_CASES}
        />
      </main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(resultsJsonLd) }}
      />
      <Footer5 />
    </div>
  );
}
