import MarqueeComponent from "@/components/common/Marquee";
import Footer8 from "@/components/footers/Footer8";
import Header3 from "@/components/headers/Header3";
import Breadcumb from "@/components/service/Breadcumb";
import Contact from "@/components/service/Contact";
import Features2 from "@/components/service/Features2";

export const metadata = {
  title: "Service 2 || Frisk - Creative Agency & Portfolio Nextjs Template",
};

import React from "react";

export default function ServicePage2() {
  return (
    <>
      <Header3 />
      <Breadcumb />
      <Features2 />
      <Contact />
      <MarqueeComponent />
      <Footer8 />
    </>
  );
}
