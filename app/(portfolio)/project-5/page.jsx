import MarqueeComponent from "@/components/common/Marquee";
import Footer8 from "@/components/footers/Footer8";
import Header3 from "@/components/headers/Header3";
import Breadcumb from "@/components/portfolio/Breadcumb";

import Projects5 from "@/components/portfolio/Projects5";
import React from "react";
export const metadata = {
  title: "Project 5 || Frisk - Creative Agency & Portfolio Nextjs Template",
};
export default function ProjectPage5() {
  return (
    <>
      <Header3 />
      <Breadcumb />
      <Projects5 />
      <MarqueeComponent />
      <Footer8 />
    </>
  );
}
