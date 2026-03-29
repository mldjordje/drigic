"use client";

import dynamic from "next/dynamic";
import DeferredRender from "@/components/common/DeferredRender";

const LazyHomePageSections = dynamic(
  () => import("@/components/homes/home-5/HomePageSections"),
  { ssr: false }
);
const LazyBeforeAfterShowcase = dynamic(
  () => import("@/components/homes/home-5/BeforeAfterShowcase"),
  { ssr: false }
);
const LazySteps = dynamic(() => import("@/components/homes/home-5/Steps"), {
  ssr: false,
});
const LazyTestimonials = dynamic(
  () => import("@/components/homes/home-5/Testimonials"),
  { ssr: false }
);
const LazyVideoGalleryFeed = dynamic(
  () => import("@/components/homes/home-5/VideoGalleryFeed"),
  { ssr: false }
);

export default function DeferredHomeSections() {
  return (
    <>
      <DeferredRender minHeight={860} rootMargin="220px 0px">
        <LazyHomePageSections showResults={false} />
      </DeferredRender>
      <DeferredRender minHeight={620} rootMargin="80px 0px">
        <LazyBeforeAfterShowcase withFilter compactFilter maxItems={4} showCta={false} />
      </DeferredRender>
      <DeferredRender minHeight={420} rootMargin="240px 0px">
        <LazySteps />
      </DeferredRender>
      <DeferredRender minHeight={420} rootMargin="220px 0px">
        <LazyTestimonials />
      </DeferredRender>
      <DeferredRender minHeight={760} rootMargin="260px 0px">
        <LazyVideoGalleryFeed inline limit={3} />
      </DeferredRender>
    </>
  );
}
