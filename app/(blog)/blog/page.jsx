import BlogList1 from "@/components/blog/BlogList1";
import Breadcumb from "@/components/blog/Breadcumb";
import MarqueeComponent from "@/components/common/Marquee";

import Footer8 from "@/components/footers/Footer8";
import Header3 from "@/components/headers/Header3";
import React from "react";

export const metadata = {
  title: "Blog — Estetska medicina | Dr Igić Clinic Niš",
  description:
    "Saveti i stručni tekstovi o estetskoj i anti-age medicini. Hijaluronski fileri, botoks, PRP, nega kože — Dr Igić Clinic, Niš.",
  alternates: { canonical: "/blog" },
};
export default function BlogPage1() {
  return (
    <>
      <Header3 />
      <Breadcumb />
      <BlogList1 />
      <MarqueeComponent />
      <Footer8 />
    </>
  );
}
