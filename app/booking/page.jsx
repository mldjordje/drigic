import Header4 from "@/components/headers/Header4";
import Footer5 from "@/components/footers/Footer5";
import BookingSection from "@/components/homes/home-5/BookingSection";
import { SITE_NAME } from "@/lib/site";

export const metadata = {
  title: `Zakazivanje termina Niš | ${SITE_NAME}`,
  description:
    "Online zakazivanje termina za estetske tretmane u ordinaciji Dr Igić u Nišu. Pregled slobodnih termina u realnom vremenu — fileri, botoks, PRP, mezoterapija i druge procedure.",
  alternates: { canonical: "/booking" },
};

export default function BookingPage() {
  return (
    <div className="clinic-home5">
      <Header4 />
      <main style={{ paddingTop: 130, paddingBottom: 90 }}>
        <BookingSection googleNextPath="/booking" />
      </main>
      <Footer5 />
    </div>
  );
}
