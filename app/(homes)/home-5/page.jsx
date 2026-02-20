import Header4 from "@/components/headers/Header4";
import SearchPopup from "@/components/headers/component/SearchPopup";
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
  title: "Home 5 || Frisk - Creative Agency & Portfolio Nextjs Template",
};
export default function HomePage5() {
  return (
    <div>
      <SearchPopup />
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
