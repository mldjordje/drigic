import Footer9 from "@/components/footers/Footer9";
import SearchPopup from "@/components/headers/component/SearchPopup";

import Header1 from "@/components/headers/Header1";
import Projects from "@/components/homes/home-10/Projects";

import React from "react";
export const metadata = {
  title: "Home 10 || Frisk - Creative Agency & Portfolio Nextjs Template",
};
export default function page() {
  return (
    <>
      <SearchPopup />
      <Header1 />
      <Projects />
      <Footer9 />
    </>
  );
}
