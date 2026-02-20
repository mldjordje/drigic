import MarqueeComponent from "@/components/common/Marquee";
import Footer8 from "@/components/footers/Footer8";
import Header3 from "@/components/headers/Header3";
import Breadcumb from "@/components/portfolio/Breadcumb";

import Projects from "@/components/portfolio/Projects";
import React from "react";
export const metadata = {
  title: "Project 1 || Frisk - Creative Agency & Portfolio Nextjs Template",
};
export default function ProjectPage1() {
  return (
    <>
      <Header3 />
      <Breadcumb />
      <Projects />
      <MarqueeComponent />
      <Footer8 />
    </>
  );
}
