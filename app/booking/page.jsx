import Header4 from "@/components/headers/Header4";
import Footer5 from "@/components/footers/Footer5";
import BookingSection from "@/components/homes/home-5/BookingSection";
import { CLINIC_ADDRESS, CLINIC_PHONE_DISPLAY, CLINIC_PHONE_TEL } from "@/lib/clinicContact";
import { PATIENT_REVIEWS } from "@/lib/content/patient-reviews";
import styles from "@/components/landing/landing.module.css";
import { SITE_NAME } from "@/lib/site";

export const metadata = {
  title: { absolute: `Zakazivanje termina Niš | ${SITE_NAME}` },
  description:
    "Online zakazivanje termina za estetske tretmane u ordinaciji Dr Igić u Nišu. Pregled slobodnih termina u realnom vremenu — fileri, tretman mimičnih bora, PRP, mezoterapija i druge procedure.",
  alternates: { canonical: "/booking" },
};

/**
 * Deo oglasa vodi direktno ovde. Ranije je stranica bila samo forma — bez
 * ijednog reda konteksta, što od posetioca traži da popuni formu pre nego što
 * je dobio ijedan razlog. Sada forma ima kratak uvod: ko izvodi tretman, da
 * konsultacija ne obavezuje, i tri stvarne recenzije ispod.
 */
const REASSURANCE = [
  {
    title: "Konsultacija je besplatna",
    text: "I ne obavezuje na tretman. Deo pregleda završi se preporukom da se sačeka.",
  },
  {
    title: "Tretman radi lekar",
    text: "Dr Nikola Igić. Pregled, tretman i kontrolu radi isti lekar.",
  },
  {
    title: "Termini su stvarno slobodni",
    text: "Lista se povlači iz kalendara ordinacije. Potvrdu dobijate od nas.",
  },
];

export default function BookingPage() {
  return (
    <>
      <div className="clinic-home5">
        <Header4 />
      </div>

      <main className={styles.page}>
        <section className={styles.section} style={{ paddingTop: "8.5rem" }}>
          <div className={styles.shell}>
            <div className={styles.head}>
              <span className={styles.eyebrow}>Zakazivanje · Niš</span>
              <h1 className={styles.h2}>Izaberite termin koji vam odgovara</h1>
              <p className={styles.lead}>
                {CLINIC_ADDRESS}, Niš. Radnim danima od 16 do 21 čas. Ako vam je lakše
                telefonom —{" "}
                <a href={`tel:${CLINIC_PHONE_TEL}`} style={{ color: "inherit" }}>
                  {CLINIC_PHONE_DISPLAY}
                </a>
                .
              </p>
            </div>

            <div className={`${styles.deriskGrid} ${styles.trio}`} style={{ background: "var(--line)", border: "1px solid var(--line)" }}>
              {REASSURANCE.map((item) => (
                <div
                  className={styles.deriskItem}
                  style={{ background: "var(--paper)" }}
                  key={item.title}
                >
                  <h2 className={styles.indicationTitle}>{item.title}</h2>
                  <p className={styles.indicationText}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className={styles.bookingWrap} id="lp-booking">
          <div className="clinic-home5">
            <BookingSection googleNextPath="/booking" />
          </div>
        </div>

        <section className={styles.section}>
          <div className={styles.shell}>
            <div className={styles.reviews}>
              {PATIENT_REVIEWS.slice(0, 2).map((review) => (
                <figure className={styles.review} key={review.id}>
                  <blockquote className={styles.reviewQuote}>„{review.quote}“</blockquote>
                  <figcaption className={styles.reviewMeta}>
                    <span className={styles.reviewName}>{review.name}</span>
                    <span className={styles.reviewSource}>{review.meta}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      </main>

      <div className="clinic-home5">
        <Footer5 />
      </div>
    </>
  );
}
