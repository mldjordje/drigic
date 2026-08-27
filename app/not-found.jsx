import Image from "next/image";
import Link from "next/link";
import React from "react";
import Footer5 from "@/components/footers/Footer5";
import Header4 from "@/components/headers/Header4";

export const metadata = {
  title: "Stranica nije pronađena",
  robots: { index: false, follow: false },
};

export default function NotFoundPage() {
  return (
    <div className="clinic-home5">
      <Header4 />
      <div className="error-wrapper text-center">
        <div className="container">
          <Image
            width={856}
            height={246}
            className="mb-50"
            src="/assets/img/normal/404.png"
            alt="404"
          />
          <h2>Stranica nije pronađena</h2>
          <p className="sec-text mb-30">
            Link koji ste otvorili više ne postoji ili je stranica uklonjena.
          </p>
          <Link scroll={false} href="/" className="link-btn">
            <span className="link-effect">
              <span className="effect-1">nazad na početnu</span>
              <span className="effect-1">nazad na početnu</span>
            </span>
            <Image
              width={13}
              height={13}
              src="/assets/img/icon/arrow-left-top.svg"
              alt="ikonica"
            />
          </Link>
        </div>
      </div>
      <Footer5 />
    </div>
  );
}
