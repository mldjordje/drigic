import SearchPopup from "@/components/headers/component/SearchPopup";
import Header1 from "@/components/headers/Header1";
import Projects from "@/components/homes/home-11/Projects";

import React from "react";
export const metadata = {
  title: "Home 11 || Frisk - Creative Agency & Portfolio Nextjs Template",
};
export default function page() {
  return (
    <>
      <div className="bg-title">
        <SearchPopup />
        <Header1 parentClass="header-dark nav-header header-layout2" />
        <Projects />
      </div>
    </>
  );
}
