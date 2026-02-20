import BookingInlineForm from "@/components/booking/BookingInlineForm";

export default function BookingSection() {
  return (
    <section className="space" id="booking">
      <div className="container">
        <div className="title-area text-center clinic-reveal">
          <h2 className="sec-title text-smoke">Zakazite termin odmah</h2>
          <p className="sec-text text-smoke">
            Booking forma je dostupna direktno na pocetnoj stranici.
          </p>
        </div>
        <BookingInlineForm googleNextPath="/" showUpcoming={false} />
      </div>
    </section>
  );
}
