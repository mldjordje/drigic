import Header4 from "@/components/headers/Header4";
import Footer5 from "@/components/footers/Footer5";
import BookingSection from "@/components/homes/home-5/BookingSection";
import { CLINIC_ADDRESS, CLINIC_PHONE_DISPLAY, CLINIC_PHONE_TEL } from "@/lib/clinicContact";
import { PATIENT_REVIEWS } from "@/lib/content/patient-reviews";
import styles from "@/components/landing/landing.module.css";
import { SITE_NAME } from "@/lib/site";

/**
 * Odredišna stranica za brend oglas.
 *
 * Zašto postoji odvojeno od /booking:
 * Google Ads odbija oglas ako odredišna stranica sadrži naziv leka na recept
 * ("Destination contains: BOTOX and Botoks"), a /booking prikazuje katalog
 * usluga sa pravim nazivima — što tamo i treba da ostane, jer pacijent tu
 * uslugu traži baš pod tim imenom.
 *
 * Ovde je isti tok zakazivanja, ali sa nazivima po regiji koja se tretira.
 * /booking ostaje netaknut za organski i direktan dolazak.
 *
 * noindex: sadržajno je duplikat /booking stranice i ne treba da se takmiči
 * s njom u pretrazi — postoji isključivo kao odredište oglasa.
 */

export const metadata = {
  title: { absolute: `Zakazivanje termina Niš | ${SITE_NAME}` },
  description:
    "Online zakazivanje termina u ordinaciji Dr Igić u Nišu. Pregled slobodnih termina u realnom vremenu — fileri, mimične bore, PRP, mezoterapija i druge procedure.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/booking" },
};

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

export default function ZakazivanjePage() {
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

            <div
              className={`${styles.deriskGrid} ${styles.trio}`}
              style={{ background: "var(--line)", border: "1px solid var(--line)" }}
            >
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
            <BookingSection googleNextPath="/zakazivanje" neutralServiceNames />
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
