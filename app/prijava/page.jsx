import PrijavaClient from "@/components/forms/PrijavaClient";

export const dynamic = "force-dynamic";

export default async function PrijavaPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const nextPath = resolvedSearchParams?.next || "/";
  const reason = resolvedSearchParams?.reason || "";

  return <PrijavaClient nextPath={nextPath} reason={reason} />;
}

