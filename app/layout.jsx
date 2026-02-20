"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import "../public/assets/css/vendor.css";
import "../public/assets/sass/style.scss";
import { ParallaxProvider } from "react-scroll-parallax";
import ScrollTop from "@/components/common/ScrollTop";
import "rc-slider/assets/index.css";
import { Unbounded, Poppins } from "next/font/google";
import ScrollTopBehaviour from "@/components/common/ScrollTopBehavier";
import Context from "@/context/Context";
if (typeof window !== "undefined") {
  import("bootstrap/dist/js/bootstrap.esm").then((module) => {
    // Module is imported, you can access any exported functionality if
  });
}
// wow js

const unbounded = Unbounded({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--title-font",
});

// Poppins font
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--body-font",
});

export default function RootLayout({ children }) {
  const path = usePathname();
  let wow = null;
  useEffect(() => {
    const WOW = require("@/utils/wow");
    wow = new WOW.default({
      live: false,
      mobile: false,
    });
    wow.init();
  }, [path]);
  //useEffect(() => {

  //wow?.sync();
  //}, [path]);
  return (
    <html lang="en">
      <body className={`body  ${poppins.variable} ${unbounded.variable}`}>
        <Context>
          <ParallaxProvider>{children}</ParallaxProvider>
          <ScrollTop />
          <ScrollTopBehaviour />
        </Context>
      </body>
    </html>
  );
}
