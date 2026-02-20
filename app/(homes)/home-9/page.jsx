import Footer3 from "@/components/footers/Footer3";
import Header3 from "@/components/headers/Header3";
import Cta from "@/components/homes/home-3/Cta";
import Hero from "@/components/homes/home-9/Hero";
import Portfolio from "@/components/homes/home-9/Portfolio";
import React from "react";
export const metadata = {
  title: "Home 9 || Frisk - Creative Agency & Portfolio Nextjs Template",
};
export default function page() {
  return (
    <>
      <Header3 />
      <Hero />
      <Portfolio />
      <Cta />
      <Footer3 />
    </>
  );
}
