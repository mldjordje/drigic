import BlogList1 from "@/components/blog/BlogList1";
import Breadcumb from "@/components/blog/Breadcumb";
import MarqueeComponent from "@/components/common/Marquee";
import Footer8 from "@/components/footers/Footer8";
import Header3 from "@/components/headers/Header3";
import { getDb, schema } from "@/lib/db/client";
import { desc, eq } from "drizzle-orm";

export const revalidate = 300;

export const metadata = {
  title: "Blog — Estetska medicina | Dr Igić Clinic Niš",
  description:
    "Saveti i stručni tekstovi o estetskoj i anti-age medicini. Hijaluronski fileri, botoks, PRP, nega kože — Dr Igić Clinic, Niš.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog — Estetska medicina Niš | Dr Igić Clinic",
    description: "Stručni tekstovi o estetskim tretmanima u Nišu.",
    type: "website",
  },
};

export default async function BlogPage1() {
  let posts = [];
  try {
    const db = getDb();
    posts = await db
      .select({
        id: schema.blogPosts.id,
        slug: schema.blogPosts.slug,
        title: schema.blogPosts.title,
        excerpt: schema.blogPosts.excerpt,
        category: schema.blogPosts.category,
        featuredImageUrl: schema.blogPosts.featuredImageUrl,
        publishedAt: schema.blogPosts.publishedAt,
      })
      .from(schema.blogPosts)
      .where(eq(schema.blogPosts.isPublished, true))
      .orderBy(desc(schema.blogPosts.publishedAt));
  } catch {
    posts = [];
  }

  return (
    <>
      <Header3 />
      <Breadcumb />
      <BlogList1 posts={posts} />
      <MarqueeComponent />
      <Footer8 />
    </>
  );
}
