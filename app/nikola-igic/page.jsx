import Header4 from "@/components/headers/Header4";
import Footer5 from "@/components/footers/Footer5";
import FounderPageContent from "@/components/homes/home-5/FounderPageContent";

export const metadata = {
  title: "Dr Nikola Igić | Estetska i anti-age medicina",
  description:
    "Sertifikovani lekar estetske i anti-age medicine. Prirodni, suptilni rezultati koji prate vašu individualnu anatomiju.",
};

export default function NikolaIgicPage() {
  return (
    <div className="clinic-home5">
      <Header4 />
      <FounderPageContent />
      <Footer5 />
    </div>
  );
}
