import type { Metadata } from "next";
import { Listing, type RawParams } from "@/components/shop/Listing";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Bestselling books" };

export default async function BestsellersPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  const { t } = await getT();
  return <Listing basePath="/bestsellers" sp={await searchParams} defaultSort="popular" header={<h1 className="text-2xl font-bold">{t("page.bestsellers")}</h1>} />;
}
