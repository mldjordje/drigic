"use client";

import About from "@/components/homes/home-5/About";
import HeroActions from "@/components/homes/home-5/HeroActions";
import Projects from "@/components/homes/home-5/Projects";
import BeforeAfterShowcase from "@/components/homes/home-5/BeforeAfterShowcase";
import { useSession } from "@/components/common/SessionProvider";

export default function HomePageSections() {
  const { isLoggedIn } = useSession();

  return (
    <>
      {!isLoggedIn ? <About /> : null}
      <HeroActions />
      <BeforeAfterShowcase withFilter compactFilter maxItems={4} showCta={false} />
      <Projects />
      {isLoggedIn ? <About /> : null}
    </>
  );
}
