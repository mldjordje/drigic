import MarqueeComponent from "@/components/common/Marquee";
import Footer8 from "@/components/footers/Footer8";
import Header3 from "@/components/headers/Header3";
import Breadcumb from "@/components/portfolio/Breadcumb";

import Projects4 from "@/components/portfolio/Projects4";
import React from "react";
export const metadata = {
  title: "Project 4 || Frisk - Creative Agency & Portfolio Nextjs Template",
};
export default function ProjectPage4() {
  return (
    <>
      <Header3 />
      <Breadcumb />
      <Projects4 />
      <MarqueeComponent />
      <Footer8 />
    </>
  );
}
