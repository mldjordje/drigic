import Home5 from "./(homes)/home-5/page";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export const metadata = {
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
};

export default function Home() {
  return <Home5 />;
}
