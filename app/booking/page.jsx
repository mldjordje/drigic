import Header4 from "@/components/headers/Header4";
import Footer5 from "@/components/footers/Footer5";
import BookingSection from "@/components/homes/home-5/BookingSection";

export const metadata = {
  title: "Booking | Dr Igic",
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
