import Header4 from "@/components/headers/Header4";
import Footer5 from "@/components/footers/Footer5";
import MyBookingsSection from "@/components/my-bookings/MyBookingsSection";

export const metadata = {
  title: "Moji termini | Dr Igić Clinic",
  description: "Pregled, izmena i otkazivanje termina.",
};

export default function MyBookingsPage() {
  return (
    <div className="clinic-home5">
      <Header4 />
      <main style={{ paddingTop: 130, paddingBottom: 90 }}>
        <MyBookingsSection googleNextPath="/moji-termini" />
      </main>
      <Footer5 />
    </div>
  );
}

