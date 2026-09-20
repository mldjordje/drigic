import Header4 from "@/components/headers/Header4";
import Footer5 from "@/components/footers/Footer5";
import FounderPageContent from "@/components/homes/home-5/FounderPageContent";

export const metadata = {
  title: { absolute: "Dr Nikola Igić — Lekar estetske medicine, Niš | Dr Igić Clinic" },
  description:
    "Dr Nikola Igić, sertifikovani lekar estetske i anti-age medicine u Nišu. Individualni pristup, prirodni rezultati, savremene tehnike. Zakažite konsultaciju.",
  keywords: [
    "Dr Nikola Igić",
    "lekar estetske medicine Niš",
    "estetski hirurg Niš",
    "anti-age doktor Niš",
    "dr igić clinic",
  ],
  alternates: { canonical: "/nikola-igic" },
  openGraph: {
    title: "Dr Nikola Igić — Lekar estetske medicine, Niš",
    description:
      "Sertifikovani lekar estetske i anti-age medicine u Nišu. Prirodni, suptilni rezultati prilagođeni individualnoj anatomiji.",
    type: "profile",
    locale: "sr_RS",
  },
};

const PHYSICIAN_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Physician",
      "@id": "https://drigic.rs/nikola-igic#physician",
      "name": "Dr Nikola Igić",
      "givenName": "Nikola",
      "familyName": "Igić",
      "honorificPrefix": "Dr",
      "jobTitle": "Lekar estetske i anti-age medicine",
      "description":
        "Sertifikovani lekar estetske i anti-age medicine u Nišu. Osnivač ordinacije Dr Igić Clinic. Specijalizuje se za prirodne, suptilne rezultate prilagođene individualnoj anatomiji pacijenta.",
      "url": "https://drigic.rs/nikola-igic",
      "image": "https://drigic.rs/assets/img/team/dr-igic.webp",
      "worksFor": { "@id": "https://drigic.rs/#organization" },
      // Same clinic as the one declared in the root layout — referenced by id
      // so the doctor and the practice stay one pair of entities, not four.
      "workLocation": { "@id": "https://drigic.rs/#organization" },
      "medicalSpecialty": [
        "Aesthetic Medicine",
        "Anti-Age Medicine",
        "Regenerative Medicine",
      ],
      "knowsAbout": [
        "Hijaluronski fileri",
        "Botoks tretmani",
        "Skinbusteri",
        "Kolagen stimulatori",
        "PRP terapija",
        "Mezoterapija",
        "Lipoliza",
        "Dermapen",
        "Hemijski piling",
        "Polinukleotidi i egzozomi",
      ],
      "sameAs": [
        "https://www.instagram.com/drigic.clinic/",
      ],
    },
  ],
};

export default function NikolaIgicPage() {
  return (
    <div className="clinic-home5">
      <Header4 />
      <FounderPageContent />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(PHYSICIAN_JSON_LD) }}
      />
      <Footer5 />
    </div>
  );
}
