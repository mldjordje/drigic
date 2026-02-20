import MarqueeComponent from "@/components/common/Marquee";

import Footer2 from "@/components/footers/Footer2";
import Header8 from "@/components/headers/Header8";

import Breadcumb2 from "@/components/shop/Breadcumb2";

import ShopDetails from "@/components/shop/ShopDetails";
import { products } from "@/data/products";
export const metadata = {
  title: "Shop Details || Frisk - Creative Agency & Portfolio Nextjs Template",
};
export default async function page({ params }) {
  const { id } = await params;

  const product = products.filter((p) => p.id == id)[0] || products[0];
  return (
    <>
      <Header8 />
      <Breadcumb2 />
      <ShopDetails product={product} />
      <MarqueeComponent />
      <Footer2 />
    </>
  );
}
