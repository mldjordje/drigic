import MarqueeComponent from "@/components/common/Marquee";
import Breadcumb from "@/components/contact/Breadcumb";
import Contact from "@/components/contact/Contact";
import ContactInfo from "@/components/contact/ContactInfo";

import Footer8 from "@/components/footers/Footer8";
import Header3 from "@/components/headers/Header3";
import React from "react";

export const metadata = {
  title: "Contact || Frisk - Creative Agency & Portfolio Nextjs Template",
};

export default function ContactPage() {
  return (
    <>
      <Header3 />
      <Breadcumb />
      <ContactInfo />
      <Contact />
      <MarqueeComponent />
      <Footer8 />
    </>
  );
}
