import MarqueeComponent from "@/components/common/Marquee";
import Footer8 from "@/components/footers/Footer8";
import Header3 from "@/components/headers/Header3";
import Contact2 from "@/components/team/Contact2";

import TeamDetails from "@/components/team/TeamDetails";
import { teamData } from "@/data/team";

//For Static Side Genaration(SSG)

// export async function generateStaticParams() {
//   return teamData.map((elm) => ({
//     id: `${elm.id}`,
//   }));
// }

export const metadata = {
  title: "Team Details || Frisk - Creative Agency & Portfolio Nextjs Template",
};

export default async function TeamPageDetails(props) {
  const params = await props.params;
  return (
    <>
      <Header3 />
      <TeamDetails teamId={params.id} />
      <Contact2 />
      <MarqueeComponent />
      <Footer8 />
    </>
  );
}
