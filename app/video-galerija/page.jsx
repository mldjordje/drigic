import VideoGalleryFeed from "@/components/homes/home-5/VideoGalleryFeed";
import { SITE_NAME } from "@/lib/site";

export const metadata = {
  title: { absolute: `Video galerija tretmana | ${SITE_NAME}` },
  description:
    "Video snimci estetskih tretmana u ordinaciji Dr Igić u Nišu — fileri, botoks, PRP i drugi zahvati pre i posle, iz prve ruke.",
  alternates: { canonical: "/video-galerija" },
};

export default function VideoGalleryPage() {
  return (
    <div className="clinic-home5">
      <VideoGalleryFeed />
    </div>
  );
}
