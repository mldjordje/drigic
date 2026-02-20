import MarqueeComponent from "@/components/common/Marquee";
import Footer8 from "@/components/footers/Footer8";
import Header3 from "@/components/headers/Header3";
import Breadcumb from "@/components/pricing/Breadcumb";
import Faq from "@/components/pricing/Faq";

import Pricing from "@/components/pricing/Pricing";
import React from "react";

export const metadata = {
  title: "Pricing || Frisk - Creative Agency & Portfolio Nextjs Template",
};
export default function PricingPage() {
  return (
    <>
      <Header3 />
      <Breadcumb />
      <Pricing />
      <Faq />
      <MarqueeComponent />
      <Footer8 />
    </>
  );
}
