import type { Metadata } from "next";
import { Listing, type RawParams } from "@/components/shop/Listing";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "New arrivals" };

export default async function NewArrivalsPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  const { t } = await getT();
  return <Listing basePath="/new-arrivals" sp={await searchParams} defaultSort="newest" header={<h1 className="text-2xl font-bold">{t("page.newArrivals")}</h1>} />;
}
