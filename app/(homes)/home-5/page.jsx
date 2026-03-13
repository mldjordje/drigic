import Header4 from "@/components/headers/Header4";
import Blogs from "@/components/homes/home-5/Blogs";
import About from "@/components/homes/home-5/About";
import Hero from "@/components/homes/home-5/Hero";
import HeroActions from "@/components/homes/home-5/HeroActions";
import Projects from "@/components/homes/home-5/Projects";
import BeforeAfterShowcase from "@/components/homes/home-5/BeforeAfterShowcase";
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

export default function HomePage5() {
  return (
    <div className="clinic-home5">
      <ClinicPreloader />
      <Header4 />
      <AnnouncementBar />
      <Hero />
      <HeroActions />
      <BeforeAfterShowcase withFilter compactFilter maxItems={4} showCta={false} />
      <Projects />
      <About />
      <Steps />
      <Testimonials />
      <Video />
      <Blogs />
      <Footer5 />
    </div>
  );
}
