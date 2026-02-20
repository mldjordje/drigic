import MarqueeComponent from "@/components/common/Marquee";

import Footer2 from "@/components/footers/Footer2";
import Header8 from "@/components/headers/Header8";

import Breadcumb4 from "@/components/shop/Breadcumb4";
import Checkout from "@/components/shop/Checkout";

import React from "react";
export const metadata = {
  title: "Shop Checkout || Frisk - Creative Agency & Portfolio Nextjs Template",
};
export default function page() {
  return (
    <>
      <Header8 />
      <Breadcumb4 />
      <Checkout />
      <MarqueeComponent />
      <Footer2 />
    </>
  );
}
