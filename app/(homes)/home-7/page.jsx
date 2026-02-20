import Header5 from "@/components/headers/Header5";
import Skills from "@/components/homes/common/Skills";

import Clients from "@/components/homes/home-7/Clients";
import Features from "@/components/homes/home-7/Features";

import Hero from "@/components/homes/home-7/Hero";
import Projects from "@/components/homes/home-7/Projects";
import React from "react";
import Faq from "@/components/homes/home-7/Faq";
import Testimonials from "@/components/homes/common/Testimonials";
import Blogs from "@/components/homes/home-7/Blogs";
import Cta from "@/components/homes/home-7/Cta";
import Footer3 from "@/components/footers/Footer3";
import MarqueeComponent from "@/components/common/Marquee";
export const metadata = {
  title: "Home 7 || Frisk - Creative Agency & Portfolio Nextjs Template",
};
export default function HomePage7() {
  return (
    <>
      <Header5 />
      <Hero />
      <Clients />
      <Features />
      <Skills />
      <Projects />
      <MarqueeComponent />
      <Faq />
      <Testimonials />
      <Blogs />
      <Cta />
      <Footer3 />
    </>
  );
}
