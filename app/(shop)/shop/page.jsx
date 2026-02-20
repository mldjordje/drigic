import MarqueeComponent from "@/components/common/Marquee";

import Footer2 from "@/components/footers/Footer2";
import Header8 from "@/components/headers/Header8";
import Breadcumb from "@/components/shop/Breadcumb";
import Shop from "@/components/shop/Shop";
import React from "react";
export const metadata = {
  title: "Shop || Frisk - Creative Agency & Portfolio Nextjs Template",
};
export default function page() {
  return (
    <>
      <Header8 />
      <Breadcumb />
      <Shop />
      <MarqueeComponent />
      <Footer2 />
    </>
  );
}
