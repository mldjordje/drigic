import MarqueeComponent from "@/components/common/Marquee";
import Footer8 from "@/components/footers/Footer8";
import Header3 from "@/components/headers/Header3";
import Breadcumb from "@/components/portfolio/Breadcumb";

import Projects2 from "@/components/portfolio/Projects2";
import React from "react";
export const metadata = {
  title: "Project 2 || Frisk - Creative Agency & Portfolio Nextjs Template",
};
export default function ProjectPage2() {
  return (
    <>
      <Header3 />
      <Breadcumb />
      <Projects2 />
      <MarqueeComponent />
      <Footer8 />
    </>
  );
}
