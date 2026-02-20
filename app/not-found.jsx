import Header3 from "@/components/headers/Header3";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export const metadata = {
  title: "Not Found || Frisk - Creative Agency & Portfolio Nextjs Template",
};
export default function NotFoundPage() {
  return (
    <>
      <Header3 />
      <div className="error-wrapper text-center">
        <div className="container">
          <Image
            width={856}
            height={246}
            className="mb-50"
            src="/assets/img/normal/404.png"
            alt="error"
          />
          <h2>Look Like You’re Lost</h2>
          <p className="sec-text mb-30">
            The link you followed probably broken or the page has been removed
          </p>
          <Link scroll={false} href="/" className="link-btn">
            <span className="link-effect">
              <span className="effect-1">back to home</span>
              <span className="effect-1">back to home</span>
            </span>
            <Image
              width={13}
              height={13}
              src="/assets/img/icon/arrow-left-top.svg"
              alt="icon"
            />
          </Link>
        </div>
      </div>
    </>
  );
}
