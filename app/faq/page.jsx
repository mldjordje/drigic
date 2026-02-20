import MarqueeComponent from "@/components/common/Marquee";
import Breadcumb from "@/components/faq/Breadcumb";
import ContactInfo from "@/components/faq/ContactInfo";
import Faq from "@/components/faq/Faq";

import Footer8 from "@/components/footers/Footer8";
import Header3 from "@/components/headers/Header3";
import React from "react";

export const metadata = {
  title: "Faq || Frisk - Creative Agency & Portfolio Nextjs Template",
};
export default function FaqPage() {
  return (
    <>
      <Header3 />
      <Breadcumb />
      <Faq />
      <ContactInfo />
      <MarqueeComponent />
      <Footer8 />
    </>
  );
}
