import MarqueeComponent from "@/components/common/Marquee";
import Footer8 from "@/components/footers/Footer8";
import Header3 from "@/components/headers/Header3";
import Breadcumb from "@/components/service/Breadcumb";
import Clients from "@/components/service/Clients";
import Faq from "@/components/service/Faq";

import React from "react";

export const metadata = {
  title: "Service 3 || Frisk - Creative Agency & Portfolio Nextjs Template",
};

export default function ServicePage3() {
  return (
    <>
      <Header3 />
      <Breadcumb />
      <Faq />
      <Clients />
      <MarqueeComponent />
      <Footer8 />
    </>
  );
}
