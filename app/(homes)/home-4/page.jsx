import MarqueeComponent from "@/components/common/Marquee";
import Footer4 from "@/components/footers/Footer4";
import Header1 from "@/components/headers/Header1";
import SearchPopup from "@/components/headers/component/SearchPopup";
import Blogs from "@/components/homes/home-4/Blogs";
import Clients from "@/components/homes/home-4/Clients";
import Cta from "@/components/homes/home-4/Cta";
import Faq from "@/components/homes/home-4/Faq";
import Features from "@/components/homes/home-4/Features";
import Features2 from "@/components/homes/home-4/Features2";
import Hero from "@/components/homes/home-4/Hero";

import Pricing from "@/components/homes/home-4/Pricing";
import Projects from "@/components/homes/home-4/Projects";
import React from "react";
export const metadata = {
  title: "Home 4 || Frisk - Creative Agency & Portfolio Nextjs Template",
};
export default function HomePage4() {
  return (
    <>
      <SearchPopup />
      <Header1 />
      <Hero />
      <Features />
      <Clients />
      <Projects />
      <Features2 />
      <MarqueeComponent />
      <Pricing />
      <Faq />
      <Blogs />
      <Cta />
      <Footer4 />
    </>
  );
}
