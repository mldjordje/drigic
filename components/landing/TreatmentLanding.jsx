import Link from "next/link";
import Header4 from "@/components/headers/Header4";
import Footer5 from "@/components/footers/Footer5";
import BookingSection from "@/components/homes/home-5/BookingSection";
import { CLINIC_ADDRESS, CLINIC_PHONE_DISPLAY, CLINIC_PHONE_TEL } from "@/lib/clinicContact";
import { GOOGLE_PROFILE_URL, PATIENT_REVIEWS } from "@/lib/content/patient-reviews";
import ResultsShowcase from "./ResultsShowcase";
import StickyCta from "./StickyCta";
import LandingMotion from "./LandingMotion";
import styles from "./landing.module.css";

/**
 * Landing stranica za plaćeni saobraćaj.
 *
 * Redosled blokova nije estetski izbor nego posledica onoga što koči odluku:
 *
 *  1. hero            — "jesam li na pravom mestu" (H1 = fraza iz oglasa)
 *  2. indikacije      — samoidentifikacija; 84% pacijenata ima jednu konkretnu
 *                       regiju koja im smeta (CIPEES, n=1269)
 *  3. rezultati       — vizuelni dokaz pre teksta o poverenju
 *  4. derisk          — strah od "prepravljenog" izgleda (56.5% brine)
 *  5. bol / oporavak  — druga najčešća prepreka
 *  6. lekar           — autoritet; poverenje u lekara je razlog #1 za povratak
 *  7. cena            — uklanja izlaz "ne znam koliko košta"
 *  8. recenzije       — društveni dokaz NA stranici, ne link koji odvodi
 *  9. FAQ             — preostale primedbe
 * 10. zakazivanje     — nedirnuta postojeća forma i gtag konverzija
 *
 * CTA se pojavljuje četiri puta (hero, posle rezultata, posle cene, forma) plus
 * sticky traka na mobilnom.
 */

const HERO_ID = "lp-hero";
const BOOKING_ID = "lp-booking";
const CTA_LABEL = "Proveri slobodne termine";
const BOOKING_HREF = "#lp-booking";

const DOCTOR_CREDS = [
  "Lekar, sertifikovan za estetsku i anti-age medicinu",
  "Na specijalizaciji iz plastične, rekonstruktivne i estetske hirurgije",
  "Redovne edukacije i kongresi u zemlji i inostranstvu",
  "Pregled, tretman i kontrolu radi isti lekar",
];

function CalendarIcon() {
  return (
    <svg className={styles.btnIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className={styles.btnIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24 11.4 11.4 0 0 0 3.6.58 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .58 3.6 1 1 0 0 1-.25 1z" />
    </svg>
  );
}

function formatPrice(value) {
  const price = Number(value || 0);
  return price > 0 ? `${price} €` : "na konsultaciji";
}

/**
 * H1 se lomi na dva reda, ne na reč po red. Maska koja otkriva red po red ima
 * smisla samo ako je red stvarna jedinica čitanja — po jedna reč u redu čita
 * se kao greška, ne kao animacija.
 */
function splitHeadline(text) {
  const words = String(text).split(" ");
  if (words.length < 3) return [words.join(" ")];
  const total = text.length;
  let taken = 0;
  let cut = 1;
  for (let i = 0; i < words.length - 1; i += 1) {
    taken += words[i].length + 1;
    cut = i + 1;
    if (taken >= total / 2) break;
  }
  return [words.slice(0, cut).join(" "), words.slice(cut).join(" ")];
}

function accentuate(line, accent) {
  if (!accent) return line;
  return line.split(" ").map((word, index) => {
    const bare = word.toLowerCase().replace(/[^\p{L}]/gu, "");
    const node = bare === accent ? <em key={`${word}-${index}`}>{word}</em> : word;
    return (
      <span key={`${word}-${index}`}>
        {node}
        {index === line.split(" ").length - 1 ? "" : " "}
      </span>
    );
  });
}

export default function TreatmentLanding({ copy, cases = [], prices = [], children }) {
  const headlineLines = splitHeadline(copy.h1);
  const accent = copy.h1Accent ? String(copy.h1Accent).toLowerCase() : "";

  return (
    <>
      <div className="clinic-home5">
        <Header4 />
      </div>

      <main className={styles.page}>
        <LandingMotion revealClass={styles.isIn} />

        {/* ── 1. HERO ─────────────────────────────────────────────────── */}
        <section className={styles.hero} id={HERO_ID}>
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <span className={`${styles.eyebrow} ${styles.heroEyebrow} ${styles.fadeUp}`}>
                {copy.eyebrow}
              </span>

              <h1 className={styles.h1}>
                {headlineLines.map((line, index) => (
                  <span className={styles.lineMask} key={line}>
                    <span style={{ "--d": `${120 + index * 90}ms` }}>{accentuate(line, accent)}</span>
                  </span>
                ))}
              </h1>

              <p className={`${styles.heroLead} ${styles.fadeUp}`} style={{ "--d": "420ms" }}>
                {copy.lead}
              </p>

              <div className={`${styles.heroActions} ${styles.fadeUp}`} style={{ "--d": "520ms" }}>
                <a href={BOOKING_HREF} className={`${styles.btn} ${styles.btnPrimary}`} data-sheen>
                  <CalendarIcon />
                  {CTA_LABEL}
                </a>
                <a href={`tel:${CLINIC_PHONE_TEL}`} className={`${styles.btn} ${styles.btnGhost}`}>
                  <PhoneIcon />
                  {CLINIC_PHONE_DISPLAY}
                </a>
              </div>

              <div className={`${styles.heroFacts} ${styles.fadeUp}`} style={{ "--d": "620ms" }}>
                {copy.heroFacts.map((fact) => (
                  <div className={styles.heroFact} key={fact.label}>
                    <span className={styles.heroFactValue}>{fact.value}</span>
                    <span className={styles.heroFactLabel}>{fact.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <figure className={styles.heroPortrait}>
              <div className={styles.heroPortraitFrame}>
                {/* LCP kandidat na desktopu — bez lazy, sa fetchPriority. */}
                <img
                  src={copy.heroImage}
                  alt={copy.heroImageAlt}
                  width={1080}
                  height={1350}
                  fetchPriority="high"
                  decoding="async"
                />
              </div>
              <figcaption className={styles.heroPortraitCap}>
                <span className={styles.heroPortraitName}>dr Nikola Igić</span>
                <span className={styles.heroPortraitRole}>
                  Lekar — estetska i anti-age medicina
                </span>
              </figcaption>
            </figure>
          </div>
        </section>

        {/* ── 2. INDIKACIJE ───────────────────────────────────────────── */}
        <section className={styles.section}>
          <div className={styles.shell}>
            <div className={`${styles.head} ${styles.reveal}`} data-reveal>
              <span className={styles.eyebrow}>Za koga</span>
              <h2 className={styles.h2}>{copy.indicationsTitle}</h2>
              <p className={styles.lead}>{copy.indicationsLead}</p>
            </div>

            <div className={styles.indications}>
              {copy.indications.map((item, index) => (
                <div
                  className={`${styles.indication} ${styles.reveal}`}
                  data-reveal
                  style={{ "--d": `${index * 70}ms` }}
                  key={item.title}
                >
                  <span className={styles.indicationNum}>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className={styles.indicationTitle}>{item.title}</h3>
                    <p className={styles.indicationText}>{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 3. REZULTATI ────────────────────────────────────────────── */}
        {cases.length ? (
          <section className={styles.section}>
            <div className={styles.shell}>
              <div className={`${styles.head} ${styles.reveal}`} data-reveal>
                <span className={styles.eyebrow}>Rezultati</span>
                <h2 className={styles.h2}>{copy.resultsTitle}</h2>
                <p className={styles.lead}>{copy.resultsLead}</p>
              </div>
            </div>
            <ResultsShowcase
              /* Osam slučajeva je dovoljno da se dokaz vidi; svaki sledeći je
                 samo dodatnih ~60 KB na stranici koja se plaća po kliku. */
              cases={cases.slice(0, 8)}
              disclaimer="Fotografije su objavljene uz saglasnost pacijenata i nisu obrađivane. Prikazani rezultat je individualan i ne predstavlja obećanje istog ishoda."
            />
            <div className={styles.shell}>
              <a href={BOOKING_HREF} className={`${styles.btn} ${styles.btnDark}`} data-sheen>
                <CalendarIcon />
                {CTA_LABEL}
              </a>
            </div>
          </section>
        ) : null}

        {/* ── 4. DERISK ───────────────────────────────────────────────── */}
        <section className={`${styles.section} ${styles.derisk}`}>
          <div className={styles.shell}>
            <div className={`${styles.head} ${styles.reveal}`} data-reveal>
              <span className={styles.eyebrow}>Ono što najviše brine</span>
              <h2 className={styles.h2}>{copy.deriskTitle}</h2>
              <p className={styles.lead}>{copy.deriskLead}</p>
            </div>

            <div className={styles.deriskGrid}>
              {copy.derisk.map((item, index) => (
                <div
                  className={`${styles.deriskItem} ${styles.reveal}`}
                  data-reveal
                  style={{ "--d": `${index * 80}ms` }}
                  key={item.title}
                >
                  <h3 className={styles.deriskTitle}>{item.title}</h3>
                  <p className={styles.deriskText}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 5. BOL I OPORAVAK ───────────────────────────────────────── */}
        <section className={styles.section}>
          <div className={styles.shell}>
            <div className={`${styles.head} ${styles.reveal}`} data-reveal>
              <span className={styles.eyebrow}>Bez iznenađenja</span>
              <h2 className={styles.h2}>{copy.recoveryTitle}</h2>
              <p className={styles.lead}>{copy.recoveryLead}</p>
            </div>

            <div className={styles.timeline}>
              <span className={styles.timelineFill} aria-hidden="true" />
              {copy.recovery.map((step, index) => (
                <div
                  className={`${styles.timelineStep} ${styles.reveal}`}
                  data-reveal
                  style={{ "--d": `${index * 60}ms` }}
                  key={step.stage}
                >
                  <div className={styles.timelineStage}>{step.stage}</div>
                  <p className={styles.timelineText}>{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 6. LEKAR ────────────────────────────────────────────────── */}
        <section className={`${styles.section} ${styles.doctor}`}>
          <div className={styles.shell}>
            <div className={styles.doctorGrid}>
              <div className={`${styles.doctorMedia} ${styles.reveal}`} data-reveal>
                <img
                  src="/assets/img/doctor-about.webp"
                  alt="Dr Nikola Igić u ordinaciji Dr Igić Clinic u Nišu"
                  width={1080}
                  height={1350}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className={`${styles.doctorBody} ${styles.reveal}`} data-reveal>
                <span className={styles.eyebrow}>Ko izvodi tretman</span>
                <p className={styles.doctorQuote}>
                  „Radije ću uraditi manje pa dopuniti na kontroli, nego jednom previše. Lice
                  koje se ne prepoznaje nije dobar rezultat.“
                </p>
                <p className={styles.lead}>Dr Nikola Igić</p>
                <div className={styles.doctorCreds}>
                  {DOCTOR_CREDS.map((cred) => (
                    <span className={styles.doctorCred} key={cred}>
                      <span>{cred}</span>
                    </span>
                  ))}
                </div>
                <div className={styles.heroActions}>
                  <Link href="/nikola-igic" className={`${styles.btn} ${styles.btnOutline}`}>
                    Više o lekaru
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 7. CENE ─────────────────────────────────────────────────── */}
        {prices.length ? (
          <section className={styles.section}>
            <div className={styles.shell}>
              <div className={`${styles.head} ${styles.reveal}`} data-reveal>
                <span className={styles.eyebrow}>Cene</span>
                <h2 className={styles.h2}>{copy.priceTitle}</h2>
                <p className={styles.lead}>{copy.priceLead}</p>
              </div>

              <div className={styles.priceList}>
                {prices.map((item, index) => (
                  <div
                    className={`${styles.priceRow} ${styles.reveal}`}
                    data-reveal
                    style={{ "--d": `${Math.min(index, 8) * 45}ms` }}
                    key={item.id || item.name}
                  >
                    <span className={styles.priceName}>{item.name}</span>
                    <span className={styles.priceValue}>{formatPrice(item.price)}</span>
                    <span className={styles.priceMeta}>
                      {item.durationMin ? `oko ${item.durationMin} min` : "trajanje po dogovoru"}
                    </span>
                  </div>
                ))}
              </div>

              <p className={styles.priceNote}>{copy.priceNote}</p>

              <div className={styles.heroActions} style={{ marginTop: "2rem" }}>
                <a href={BOOKING_HREF} className={`${styles.btn} ${styles.btnDark}`} data-sheen>
                  <CalendarIcon />
                  {CTA_LABEL}
                </a>
                <Link href="/cenovnik" className={`${styles.btn} ${styles.btnOutline}`}>
                  Ceo cenovnik
                </Link>
              </div>
            </div>
          </section>
        ) : null}

        {/* ── 8. RECENZIJE ────────────────────────────────────────────── */}
        <section className={styles.section}>
          <div className={styles.shell}>
            <div className={`${styles.head} ${styles.reveal}`} data-reveal>
              <span className={styles.eyebrow}>Utisci pacijenata</span>
              <h2 className={styles.h2}>Šta kažu ljudi koji su već bili</h2>
              <p className={styles.lead}>
                Doslovni isečci recenzija sa Google profila ordinacije. Ništa nije napisano
                umesto pacijenata.
              </p>
            </div>
          </div>

          <div className={styles.shell}>
            <div className={styles.reviews}>
              {PATIENT_REVIEWS.map((review, index) => (
                <figure
                  className={`${styles.review} ${styles.reveal}`}
                  data-reveal
                  style={{ "--d": `${index * 70}ms` }}
                  key={review.id}
                >
                  <blockquote className={styles.reviewQuote}>„{review.quote}“</blockquote>
                  <figcaption className={styles.reviewMeta}>
                    <span className={styles.reviewName}>{review.name}</span>
                    <span className={styles.reviewSource}>{review.meta}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
            <p className={styles.reviewsFoot}>
              <a href={GOOGLE_PROFILE_URL} target="_blank" rel="noopener noreferrer">
                Pročitajte sve recenzije na Google profilu →
              </a>
            </p>
          </div>
        </section>

        {/* ── 9. FAQ ──────────────────────────────────────────────────── */}
        <section className={styles.section}>
          <div className={styles.shell}>
            <div className={`${styles.head} ${styles.reveal}`} data-reveal>
              <span className={styles.eyebrow}>Pitanja</span>
              <h2 className={styles.h2}>Ono što se najčešće pita</h2>
            </div>

            <div className={styles.faq}>
              {copy.faq.map((item) => (
                <details className={styles.faqItem} key={item.q}>
                  <summary className={styles.faqQ}>
                    <span>{item.q}</span>
                    <span className={styles.faqSign} aria-hidden="true" />
                  </summary>
                  <p className={styles.faqA}>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── 10. ZAKLJUČNI CTA ───────────────────────────────────────── */}
        <section className={`${styles.section} ${styles.closer}`}>
          <div className={styles.shell}>
            <div className={styles.closerGrid}>
              <div className={`${styles.head} ${styles.reveal}`} data-reveal style={{ marginBottom: 0 }}>
                <span className={styles.eyebrow}>Zakazivanje</span>
                <h2 className={styles.h2}>Termin se bira u minutu</h2>
                <div className={styles.closerMeta}>
                  <span>{CLINIC_ADDRESS}, Niš</span>
                  <span>Radnim danima 16:00 – 21:00</span>
                  <a href={`tel:${CLINIC_PHONE_TEL}`}>{CLINIC_PHONE_DISPLAY}</a>
                </div>
              </div>
              <div className={styles.heroActions}>
                <a href={BOOKING_HREF} className={`${styles.btn} ${styles.btnPrimary}`} data-sheen>
                  <CalendarIcon />
                  {CTA_LABEL}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── 11. FORMA ───────────────────────────────────────────────── */}
        <div className={styles.bookingWrap} id={BOOKING_ID}>
          <div className={styles.bookingHead}>
            <span className={styles.eyebrow}>Slobodni termini</span>
            <h2 className={styles.h2}>Izaberite termin koji vam odgovara</h2>
            <p className={styles.lead}>
              Prikazani termini su stvarno slobodni. Potvrdu dobijate od ordinacije.
            </p>
          </div>
          <div className="clinic-home5">
            <BookingSection googleNextPath={copy.publicPath || (copy.categorySlug ? `/tretmani/${copy.categorySlug}` : "/booking")} />
          </div>
        </div>

        {children}

        <StickyCta
          heroId={HERO_ID}
          bookingId={BOOKING_ID}
          href={BOOKING_HREF}
          label={CTA_LABEL}
          phoneHref={`tel:${CLINIC_PHONE_TEL}`}
          phoneLabel={CLINIC_PHONE_DISPLAY}
        />
      </main>

      <div className="clinic-home5">
        <Footer5 />
      </div>
    </>
  );
}
