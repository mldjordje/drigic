"use client";

import Image from "next/image";
import Link from "next/link";

const MAP_EMBED_SRC =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3639.5122122653975!2d21.905029300000002!3d43.323902!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4755b1b5c3758feb%3A0xe88cb950fc4b45ff!2sDr%20Igic%20Clinic!5e1!3m2!1sen!2srs!4v1775406887149!5m2!1sen!2srs";

const PHONE_DISPLAY = "062 238 888";
const PHONE_TEL = "062238888";
const EMAIL = "drigicclinic@gmail.com";

export default function ClinicContactPage() {
  return (
    <section className="space overflow-hidden" style={{ paddingTop: 48, paddingBottom: 80 }}>
      <div className="container">
        <div className="row gy-5 align-items-center">
          <div className="col-lg-6">
            <div
              className="position-relative overflow-hidden rounded-4"
              style={{ minHeight: 420, background: "rgba(0,0,0,0.04)" }}
            >
              <Image
                src="/assets/img/doctor-about.webp"
                alt="Dr Igic Clinic"
                width={844}
                height={836}
                className="w-100 h-100 object-fit-cover"
                sizes="(max-width: 991px) 100vw, 50vw"
                priority
              />
            </div>
          </div>
          <div className="col-lg-6">
            <span className="sub-title text-anime-style-1" style={{ display: "block", marginBottom: 12 }}>
              Kontakt
            </span>
            <h2 className="sec-title mb-3">Dr Igic Clinic</h2>
            <p className="sec-text mb-4" style={{ maxWidth: 520 }}>
              Za zakazivanje, pitanja o tretmanima ili dodatne informacije pozovite ordinaciju ili pišite na
              e-mail. Rado odgovaramo na sve upite.
            </p>

            <div className="d-grid gap-3" style={{ maxWidth: 440 }}>
              <div className="d-flex align-items-start gap-3">
                <span
                  className="icon-btn"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    background: "rgba(0,0,0,0.06)",
                    flexShrink: 0,
                  }}
                  aria-hidden
                >
                  📞
                </span>
                <div>
                  <strong className="d-block mb-1">Telefon ordinacije</strong>
                  <a href={`tel:${PHONE_TEL}`} className="text-body" style={{ fontSize: "1.1rem" }}>
                    {PHONE_DISPLAY}
                  </a>
                </div>
              </div>

              <div className="d-flex align-items-start gap-3">
                <span
                  className="icon-btn"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    background: "rgba(0,0,0,0.06)",
                    flexShrink: 0,
                  }}
                  aria-hidden
                >
                  ✉️
                </span>
                <div>
                  <strong className="d-block mb-1">E-mail</strong>
                  <a href={`mailto:${EMAIL}`} className="text-body">
                    {EMAIL}
                  </a>
                </div>
              </div>

              <div className="d-flex align-items-start gap-3">
                <span
                  className="icon-btn"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    background: "rgba(0,0,0,0.06)",
                    flexShrink: 0,
                  }}
                  aria-hidden
                >
                  📍
                </span>
                <div>
                  <strong className="d-block mb-1">Lokacija</strong>
                  <p className="mb-1">Dr Igic Clinic — Niš, Srbija</p>
                  <a
                    href="https://www.google.com/maps?ll=43.323902,21.9050293&z=16&t=m&hl=en&gl=RS&mapclient=embed&cid=16708722205926497279"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Otvori u Google Maps
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-4 d-flex flex-wrap gap-2">
              <Link href="/booking" className="btn btn-primary">
                Zakaži termin
              </Link>
              <a href={`tel:${PHONE_TEL}`} className="btn style2">
                Pozovi kliniku
              </a>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <h2 className="sec-title mb-3 h4">Mapa</h2>
          <div
            className="overflow-hidden rounded-4 border"
            style={{ minHeight: 420, borderColor: "rgba(0,0,0,0.08)" }}
          >
            <iframe
              title="Dr Igic Clinic na mapi"
              src={MAP_EMBED_SRC}
              width="100%"
              height="420"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
