import Header2 from "@/components/headers/Header2";
import Features from "@/components/homes/home-2/Features";
import Hero from "@/components/homes/home-2/Hero";
import Portfolio from "@/components/homes/home-2/Portfolio";
import React from "react";
import Cta from "@/components/homes/home-2/Cta";
import Footer2 from "@/components/footers/Footer2";
export const metadata = {
  title: "Dr Igić Klinika Estetske Medicine",
};
export default function HomePage2() {
  return (
    <>
      <Header2 />
      <Hero />
      <Features />
      <Portfolio />
      <Cta />
      <Footer2 />
    </>
  );
}
