"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

async function parseResponse(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export default function BeforeAfterShowcase() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    fetch("/api/media/before-after")
      .then(async (response) => {
        const data = await parseResponse(response);
        if (!response.ok || !data?.ok) {
          throw new Error("Neuspesno ucitavanje rezultata.");
        }
        if (mounted) {
          setCases(Array.isArray(data.data) ? data.data : []);
        }
      })
      .catch(() => {
        if (mounted) {
          setCases([]);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (!loading && !cases.length) {
    return null;
  }

  return (
    <section className="space overflow-hidden" id="rezultati">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-xl-8 col-lg-10">
            <div className="title-area text-center clinic-reveal">
              <h2 className="sec-title text-smoke">Rezultati tretmana</h2>
              <p className="sec-text text-smoke">
                Realni pre/posle prikazi tretmana iz klinicke prakse.
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <p className="text-center" style={{ margin: 0 }}>
            Ucitavanje rezultata...
          </p>
        ) : (
          <div className="clinic-before-after-grid">
            {cases.map((item) => (
              <article key={item.id} className="clinic-before-after-card glass-panel clinic-reveal">
                <div className="clinic-before-after-head">
                  <h3>{item.treatmentType || "Tretman"}</h3>
                  {item.productUsed ? <span>{item.productUsed}</span> : null}
                </div>
                <div className="clinic-before-after-images">
                  <figure>
                    <img src={item.beforeImageUrl} alt={`${item.treatmentType || "Tretman"} pre`} />
                    <figcaption>Pre</figcaption>
                  </figure>
                  <figure>
                    <img src={item.afterImageUrl} alt={`${item.treatmentType || "Tretman"} posle`} />
                    <figcaption>Posle</figcaption>
                  </figure>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="btn-wrap mt-40 justify-content-center">
          <Link scroll={false} href="/#booking" className="btn bg-theme text-title clinic-glow-btn">
            <span className="link-effect">
              <span className="effect-1">ZAKAZI TERMIN</span>
              <span className="effect-1">ZAKAZI TERMIN</span>
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
