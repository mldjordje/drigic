import Header4 from "@/components/headers/Header4";
import Blogs from "@/components/homes/home-5/Blogs";

import About from "@/components/homes/home-5/About";
import Hero from "@/components/homes/home-5/Hero";
import Projects from "@/components/homes/home-5/Projects";
import Steps from "@/components/homes/home-5/Steps";
import Testimonials from "@/components/homes/home-5/Testimonials";
import Video from "@/components/homes/home-5/Video";
import React from "react";
import Footer5 from "@/components/footers/Footer5";
export const metadata = {
  title: "Dr Igić Klinika Estetske Medicine",
};
export default function HomePage5() {
  return (
    <div className="clinic-home5">
      <Header4 />
      <Hero />
      <Steps />
      <About />
      <Projects />
      <Testimonials />
      <Video />
      <Blogs />
      <Footer5 />
    </div>
  );
}
