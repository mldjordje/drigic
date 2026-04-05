import MarqueeComponent from "@/components/common/Marquee";
import Breadcumb from "@/components/contact/Breadcumb";
import ClinicContactPage from "@/components/contact/ClinicContactPage";
import Footer8 from "@/components/footers/Footer8";
import Header3 from "@/components/headers/Header3";
import React from "react";

export const metadata = {
  title: "Kontakt | Dr Igic Clinic",
  description: "Kontakt Dr Igic Clinic — telefon, e-mail i mapa ordinacije u Nišu.",
};

export default function ContactPage() {
  return (
    <>
      <Header3 />
      <Breadcumb />
      <ClinicContactPage />
      <MarqueeComponent />
      <Footer8 />
    </>
  );
}
