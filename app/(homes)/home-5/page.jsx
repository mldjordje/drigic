import React from "react";
import Footer5 from "@/components/footers/Footer5";
import Header4 from "@/components/headers/Header4";
import AnnouncementBar from "@/components/homes/home-5/AnnouncementBar";
import ClinicPreloader from "@/components/homes/home-5/ClinicPreloader";
import DeferredHomeSections from "@/components/homes/home-5/DeferredHomeSections";
import Hero from "@/components/homes/home-5/Hero";

export const metadata = {
  title: "Dr Igic Klinika Estetske Medicine",
};

export default async function HomePage5() {
  return (
    <div className="clinic-home5">
      <ClinicPreloader />
      <Header4 />
      <AnnouncementBar />
      <Hero />
      <DeferredHomeSections />
      <Footer5 />
    </div>
  );
}
