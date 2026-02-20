import Header3 from "@/components/headers/Header3";
import SearchPopup from "@/components/headers/component/SearchPopup";
import Awards from "@/components/homes/common/Awards";
import Team from "@/components/homes/common/Team";
import Blogs from "@/components/homes/common/Blogs";
import Features from "@/components/homes/home-6/Features";
import Hero from "@/components/homes/home-6/Hero";
import Portfolio from "@/components/homes/home-6/Portfolio";
import React from "react";
import Contact from "@/components/homes/common/Contact";
import Cta from "@/components/homes/home-6/Cta";
import Footer6 from "@/components/footers/Footer6";
export const metadata = {
  title: "Home 6 || Frisk - Creative Agency & Portfolio Nextjs Template",
};
export default function HomePage6() {
  return (
    <>
      <SearchPopup />
      <Header3 />
      <Hero />
      <Features />
      <Awards />
      <Portfolio />
      <Team />
      <Contact />
      <Blogs />
      <Cta />
      <Footer6 />
    </>
  );
}
