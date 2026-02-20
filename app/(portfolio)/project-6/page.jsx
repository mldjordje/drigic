import MarqueeComponent from "@/components/common/Marquee";
import Footer8 from "@/components/footers/Footer8";
import Header3 from "@/components/headers/Header3";
import Breadcumb from "@/components/portfolio/Breadcumb";

import Projects6 from "@/components/portfolio/Projects6";
import React from "react";
export const metadata = {
  title: "Project 6 || Frisk - Creative Agency & Portfolio Nextjs Template",
};
export default function ProjectPage6() {
  return (
    <>
      <Header3 />
      <Breadcumb />
      <Projects6 />
      <MarqueeComponent />
      <Footer8 />
    </>
  );
}
