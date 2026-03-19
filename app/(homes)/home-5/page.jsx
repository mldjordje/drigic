import Header4 from "@/components/headers/Header4";
import { cookies } from "next/headers";
import Blogs from "@/components/homes/home-5/Blogs";
import About from "@/components/homes/home-5/About";
import Hero from "@/components/homes/home-5/Hero";
import HeroActions from "@/components/homes/home-5/HeroActions";
import Projects from "@/components/homes/home-5/Projects";
import BeforeAfterShowcase from "@/components/homes/home-5/BeforeAfterShowcase";
import Steps from "@/components/homes/home-5/Steps";
import Testimonials from "@/components/homes/home-5/Testimonials";
import Video from "@/components/homes/home-5/Video";
import React from "react";
import Footer5 from "@/components/footers/Footer5";
import AnnouncementBar from "@/components/homes/home-5/AnnouncementBar";
import ClinicPreloader from "@/components/homes/home-5/ClinicPreloader";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

export const metadata = {
  title: "Dr Igic Klinika Estetske Medicine",
};

export default async function HomePage5() {
  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  const isLoggedIn = Boolean(session?.sub);

  return (
    <div className="clinic-home5">
      <ClinicPreloader />
      <Header4 />
      <AnnouncementBar />
      <Hero />
      {!isLoggedIn ? <About /> : null}
      <HeroActions />
      <BeforeAfterShowcase withFilter compactFilter maxItems={4} showCta={false} />
      <Projects />
      {isLoggedIn ? <About /> : null}
      <Steps />
      <Testimonials />
      <Video />
      <Blogs />
      <Footer5 />
    </div>
  );
}
