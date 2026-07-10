import BlogDetails from "@/components/blog/BlogDetails";
import Breadcumb2 from "@/components/blog/Breadcumb2";
import MarqueeComponent from "@/components/common/Marquee";
import Footer8 from "@/components/footers/Footer8";
import Header3 from "@/components/headers/Header3";
import { getDb, schema } from "@/lib/db/client";
import { getConfiguredSiteUrl } from "@/lib/site";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Script from "next/script";

export const revalidate = 300;

async function getPost(slug) {
  try {
    const db = getDb();
    const [post] = await db
      .select()
      .from(schema.blogPosts)
      .where(and(eq(schema.blogPosts.slug, slug), eq(schema.blogPosts.isPublished, true)))
      .limit(1);
    return post || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { id: slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Blog | Dr Igić Clinic Niš" };

  const title = post.seoTitle || `${post.title} | Dr Igić Clinic Niš`;
  const description = post.seoDescription ||
    post.excerpt ||
    "Stručni tekst o estetskoj i anti-age medicini — Dr Igić Clinic, Niš.";

  return {
    title,
    description,
    keywords: post.seoKeywords || [],
    alternates: { canonical: `/blog-details/${post.slug}` },
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: post.publishedAt,
      authors: ["Dr Nikola Igić"],
      ...(post.featuredImageUrl && {
        images: [{ url: post.featuredImageUrl, width: 1200, height: 630 }],
      }),
    },
  };
}

export default async function BlogPageDetails({ params }) {
  const { id: slug } = await params;
  const post = await getPost(slug);

  if (!post) notFound();

  const siteUrl = getConfiguredSiteUrl();
  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || post.seoDescription || "",
    author: {
      "@type": "Physician",
      name: "Dr Nikola Igić",
      url: `${siteUrl}/nikola-igic`,
    },
    publisher: {
      "@type": "MedicalOrganization",
      name: "Dr Igić Clinic",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/assets/img/logo.png`,
      },
    },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    url: `${siteUrl}/blog-details/${post.slug}`,
    ...(post.featuredImageUrl && { image: post.featuredImageUrl }),
    keywords: post.seoKeywords?.join(", ") || "",
    inLanguage: "sr",
    locationCreated: {
      "@type": "City",
      name: "Niš",
      addressCountry: "RS",
    },
  };

  return (
    <>
      <Script
        id="blog-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
      <Header3 />
      <Breadcumb2 />
      <BlogDetails post={post} />
      <MarqueeComponent />
      <Footer8 />
    </>
  );
}
