import Header4 from "@/components/headers/Header4";
import Footer5 from "@/components/footers/Footer5";
import BeautyPassSection from "@/components/homes/home-5/BeautyPassSection";

export const metadata = {
  title: "Beauty Pass | Dr Igic",
};

export default function BeautyPassPage() {
  return (
    <div className="clinic-home5">
      <Header4 />
      <main style={{ paddingTop: 130, paddingBottom: 90 }}>
        <BeautyPassSection googleNextPath="/beauty-pass" />
      </main>
      <Footer5 />
    </div>
  );
}
