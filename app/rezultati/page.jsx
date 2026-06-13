import Header4 from "@/components/headers/Header4";
import Footer5 from "@/components/footers/Footer5";
import BeforeAfterShowcase from "@/components/homes/home-5/BeforeAfterShowcase";

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
  return (
    <div className="clinic-home5">
      <Header4 />
      <main style={{ paddingTop: 130, paddingBottom: 90 }}>
        <BeforeAfterShowcase withFilter showCta={false} sectionId="" />
      </main>
      <Footer5 />
    </div>
  );
}
