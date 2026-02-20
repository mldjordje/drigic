import MarqueeComponent from "@/components/common/Marquee";

import Footer2 from "@/components/footers/Footer2";
import Header8 from "@/components/headers/Header8";

import Breadcumb3 from "@/components/shop/Breadcumb3";

import ShopCart from "@/components/shop/ShopCart";
import React from "react";
export const metadata = {
  title: "Shop Cart || Frisk - Creative Agency & Portfolio Nextjs Template",
};
export default function page() {
  return (
    <>
      <Header8 />
      <Breadcumb3 />
      <ShopCart />
      <MarqueeComponent />
      <Footer2 />
    </>
  );
}
