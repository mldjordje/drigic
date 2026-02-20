import BlogDetails from "@/components/blog/BlogDetails";
import Breadcumb2 from "@/components/blog/Breadcumb2";
import MarqueeComponent from "@/components/common/Marquee";

import Footer8 from "@/components/footers/Footer8";
import Header3 from "@/components/headers/Header3";
import { allBlogs } from "@/data/blogs";

//For Static Side Genaration(SSG)

// export async function generateStaticParams() {
//   return allBlogs.map((post) => ({
//     id: `${post.id}`,
//   }));
// }

export const metadata = {
  title: "Blog Details || Frisk - Creative Agency & Portfolio Nextjs Template",
};

export default async function BlogPageDetails(props) {
  const params = await props.params;
  return (
    <>
      <Header3 />
      <Breadcumb2 />
      <BlogDetails blogId={params.id} />
      <MarqueeComponent />
      <Footer8 />
    </>
  );
}
