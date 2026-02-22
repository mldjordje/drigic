import Link from "next/link";
import Header4 from "@/components/headers/Header4";
import Footer5 from "@/components/footers/Footer5";
import { SERVICE_CATEGORY_SPECS } from "@/lib/services/category-map";

export const metadata = {
  title: "Tretmani | Dr Igic",
};

export default function TreatmentsIndexPage() {
  return (
    <div className="clinic-home5">
      <Header4 />
      <main style={{ paddingTop: 130, paddingBottom: 90 }}>
        <section className="container">
          <div className="title-area text-center clinic-reveal">
            <h1 className="sec-title text-smoke" style={{ marginBottom: 12 }}>
              Kategorije tretmana
            </h1>
            <p className="sec-text text-smoke" style={{ maxWidth: 760, margin: "0 auto" }}>
              Izaberite kategoriju i pogledajte sve aktivne usluge koje su trenutno dostupne za
              zakazivanje.
            </p>
          </div>

          <div className="clinic-treatment-grid">
            {SERVICE_CATEGORY_SPECS.map((category, index) => (
              <article
                key={category.slug}
                className="clinic-treatment-card glass-panel clinic-hover-raise clinic-reveal"
                style={{ "--clinic-reveal-delay": `${Math.min(index, 10) * 45}ms` }}
              >
                <h3>{category.name}</h3>
                <p>{category.shortDescription}</p>
                <Link href={`/tretmani/${category.slug}`} className="clinic-treatment-link">
                  Pogledaj usluge
                </Link>
              </article>
            ))}
          </div>

          <div className="btn-wrap mt-50 justify-content-center">
            <Link href="/booking" className="btn bg-theme text-title clinic-glow-btn">
              <span className="link-effect">
                <span className="effect-1">ZAKAZI TERMIN</span>
                <span className="effect-1">ZAKAZI TERMIN</span>
              </span>
            </Link>
          </div>
        </section>
      </main>
      <Footer5 />
    </div>
  );
}
