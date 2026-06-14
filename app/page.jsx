import Home5 from "./(homes)/home-5/page";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export const metadata = {
  title: `${SITE_NAME} — Estetska medicina Niš`,
  description: SITE_DESCRIPTION,
  keywords: [
    "estetska medicina Niš",
    "dr igić clinic",
    "hijaluronski fileri Niš",
    "botoks Niš",
    "PRP Niš",
    "mezoterapija Niš",
    "anti-age medicina Niš",
    "estetski tretmani Niš",
  ],
  alternates: { canonical: "/" },
};

export default function Home() {
  return <Home5 />;
}
