import Breadcumb from "@/components/faq/Breadcumb";
import ContactInfo from "@/components/faq/ContactInfo";
import Faq from "@/components/faq/Faq";

import Footer5 from "@/components/footers/Footer5";
import Header4 from "@/components/headers/Header4";
import React from "react";
import { clinicFaqs } from "@/data/clinic-faq";
import { getConfiguredSiteUrl } from "@/lib/site";

export const metadata = {
  title: { absolute: "Česta pitanja o tretmanima | Dr Igić Clinic Niš" },
  description:
    "Odgovori na najčešća pitanja o estetskim tretmanima u ordinaciji Dr Igić u Nišu — fileri, botoks, PRP, oporavak, cene.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  const siteUrl = getConfiguredSiteUrl();
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${siteUrl}/faq#faqpage`,
    inLanguage: "sr",
    mainEntity: clinicFaqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Header4 />
      <Breadcumb />
      <Faq />
      <ContactInfo />
      <Footer5 />
    </>
  );
}
