import Header3 from "@/components/headers/Header3";
import Hero from "@/components/homes/home-3/Hero";

import Facts from "@/components/homes/home-3/Facts";
import Features from "@/components/homes/home-3/Features";
import Portfolio from "@/components/homes/home-3/Portfolio";
import Features2 from "@/components/homes/home-3/Features2";
import Contact from "@/components/homes/common/Contact";
import Blogs from "@/components/homes/home-3/Blogs";
import Cta from "@/components/homes/home-3/Cta";
import Footer3 from "@/components/footers/Footer3";
export const metadata = {
  title: "Home 3 || Frisk - Creative Agency & Portfolio Nextjs Template",
};
export default function HomePage3() {
  return (
    <>
      <Header3 />
      <Hero />
      <Facts />
      <Features />
      <Portfolio />
      <Features2 />
      <Contact />

      <Blogs />

      <Cta />
      <Footer3 />
    </>
  );
}
