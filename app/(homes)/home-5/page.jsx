import Header4 from "@/components/headers/Header4";
import Blogs from "@/components/homes/home-5/Blogs";
import Hero from "@/components/homes/home-5/Hero";
import HomePageSections from "@/components/homes/home-5/HomePageSections";
import Steps from "@/components/homes/home-5/Steps";
import Testimonials from "@/components/homes/home-5/Testimonials";
import Video from "@/components/homes/home-5/Video";
import React from "react";
import Footer5 from "@/components/footers/Footer5";
import AnnouncementBar from "@/components/homes/home-5/AnnouncementBar";
import ClinicPreloader from "@/components/homes/home-5/ClinicPreloader";

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
      <HomePageSections />
      <Steps />
      <Testimonials />
      <Video />
      <Blogs />
      <Footer5 />
    </div>
  );
}
