import Breadcumb from "@/components/contact/Breadcumb";
import ClinicContactPage from "@/components/contact/ClinicContactPage";
import Footer5 from "@/components/footers/Footer5";
import Header4 from "@/components/headers/Header4";
import React from "react";

export const metadata = {
  title: "Kontakt | Dr Igić Clinic",
  description: "Kontakt Dr Igić Clinic — telefon, e-mail i mapa ordinacije u Nišu.",
};

export default function ContactPage() {
  return (
    <div className="clinic-home5">
      <Header4 />
      <main style={{ paddingBottom: 90 }}>
        <Breadcumb />
        <ClinicContactPage />
      </main>
      <Footer5 />
    </div>
  );
}
