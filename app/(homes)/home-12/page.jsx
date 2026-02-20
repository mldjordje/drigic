import Header5 from "@/components/headers/Header5";
import Portfolio from "@/components/homes/home-12/Portfolio";
import React from "react";
export const metadata = {
  title: "Home 12 || Frisk - Creative Agency & Portfolio Nextjs Template",
};
export default function page() {
  return (
    <>
      <div className="bg-title">
        <Header5 />
        <Portfolio />
      </div>
    </>
  );
}
