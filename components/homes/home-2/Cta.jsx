import Link from "next/link";
import React from "react";

export default function Cta() {
  return (
    <div className="cta-area-1 overflow-hidden bg-theme space" id="konsultacije">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-xl-8 col-lg-10">
            <div className="title-area text-center mb-0">
              <h2 className="sec-title">📞 Rezervišite konsultaciju</h2>
              <p className="sec-text mt-30 mb-40">
                Spremni ste za transformaciju koja izgleda prirodno i
                autentično? Kontaktirajte nas danas i zakoračite ka svom
                najboljem izdanju.
              </p>
              <div className="btn-group justify-content-center">
                <Link scroll={false} href="/contact" className="btn mt-0">
                  <span className="link-effect">
                    <span className="effect-1">KONTAKTIRAJTE NAS</span>
                    <span className="effect-1">KONTAKTIRAJTE NAS</span>
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
