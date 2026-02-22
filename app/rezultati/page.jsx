import Header4 from "@/components/headers/Header4";
import Footer5 from "@/components/footers/Footer5";
import BeforeAfterShowcase from "@/components/homes/home-5/BeforeAfterShowcase";

export const metadata = {
  title: "Rezultati tretmana | Dr Igic",
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
