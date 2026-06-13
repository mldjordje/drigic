import React from "react";
import Footer5 from "@/components/footers/Footer5";
import Header4 from "@/components/headers/Header4";
import AnnouncementBar from "@/components/homes/home-5/AnnouncementBar";
import ClinicPreloader from "@/components/homes/home-5/ClinicPreloader";
import DeferredHomeSections from "@/components/homes/home-5/DeferredHomeSections";
import Hero from "@/components/homes/home-5/Hero";
import { SITE_NAME } from "@/lib/site";

export const metadata = {
  title: SITE_NAME,
};

const HOME_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "FAQPage",
      "@id": "https://drigic.rs/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Gde se nalazi ordinacija Dr Igić Clinic u Nišu?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Dr Igić Clinic se nalazi na adresi Cvijićeva 31/3, Niš 18000. Ordinacija je dostupna za pregled i tretmane radnim danima od 16:00 do 21:00. Termin možete zakazati online putem sajta ili pozivom na 062 238 888.",
          },
        },
        {
          "@type": "Question",
          "name": "Koje estetske tretmane nudi Dr Igić Clinic u Nišu?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Dr Igić Clinic u Nišu nudi: hijaluronske filere (usne, konture, podočnjaci), botoks tretmane, skinbustere za hidrataciju kože, kolagen stimulatore, polinukleotide i egzosome, lipolizu, hemijski piling, dermapen, PRP terapiju i mezoterapiju. Svi tretmani se izvode bez operacije.",
          },
        },
        {
          "@type": "Question",
          "name": "Koliko košta konsultacija kod Dr Igića u Nišu?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Konsultacija u ordinaciji Dr Igić u Nišu je besplatna. Tokom konsultacije lekar procenjuje individualne potrebe, preporučuje tretman i sastavlja personalizovani plan. Cene tretmana možete pogledati na stranici cenovnika.",
          },
        },
        {
          "@type": "Question",
          "name": "Da li hijaluronski fileri bole?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Većina preparata za hijaluronske filere sadrži lokalni anestetik (lidokain) koji smanjuje nelagodnost tokom procedure. Osećaj je minimalan i kratkotrajan. Pre tretmana lekar može naneti i topikalnu anestetičku kremu po potrebi.",
          },
        },
        {
          "@type": "Question",
          "name": "Koliko traje efekat botoksa?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Efekat botoksa u ordinaciji Dr Igić počinje da se vidi nakon 3–5 dana, puni rezultat je vidljiv za 10–14 dana, a traje prosečno 3–6 meseci u zavisnosti od regije, doze i individualnih karakteristika pacijenta.",
          },
        },
        {
          "@type": "Question",
          "name": "Da li je potreban oporavak nakon estetskih tretmana?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Većina tretmana u Dr Igić Clinic ne zahteva period oporavka — pacijenti se odmah vraćaju svakodnevnim aktivnostima. Moguća je blaga crvenila ili oticanje na mestu aplikacije koja prolazi u roku od 24–48 sati. Tačna uputstva se daju na dan tretmana.",
          },
        },
        {
          "@type": "Question",
          "name": "Kako zakazati termin u Dr Igić Clinic Niš?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Termin u Dr Igić Clinic u Nišu možete zakazati online putem booking forme na sajtu drigic.rs, pozivom na broj 062 238 888 ili putem e-maila drigicclinic@gmail.com. Ordinacija je na adresi Cvijićeva 31/3, Niš.",
          },
        },
      ],
    },
    {
      "@type": "WebPage",
      "@id": "https://drigic.rs/#webpage",
      "url": "https://drigic.rs",
      "name": "Dr Igić Clinic — Estetska medicina Niš",
      "isPartOf": { "@id": "https://drigic.rs/#website" },
      "about": { "@id": "https://drigic.rs/#organization" },
      "speakable": {
        "@type": "SpeakableSpecification",
        "cssSelector": [
          ".clinic-hero__title",
          ".clinic-hero__subtitle",
          ".sec-title",
          ".hero-text",
        ],
      },
    },
  ],
};

export default async function HomePage5() {
  return (
    <div className="clinic-home5">
      <ClinicPreloader />
      <Header4 />
      <AnnouncementBar />
      <Hero />
      <DeferredHomeSections />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(HOME_JSON_LD) }}
      />
      <Footer5 />
    </div>
  );
}
