import type { Metadata } from "next";
import { Listing, type RawParams } from "@/components/shop/Listing";
import { first } from "@/lib/utils";

export async function generateMetadata({ searchParams }: { searchParams: Promise<RawParams> }): Promise<Metadata> {
  const q = first((await searchParams).q);
  return { title: q ? `Search: ${q}` : "Search books", robots: { index: false, follow: true } };
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  const sp = await searchParams;
  return <Listing basePath="/search" sp={sp} header={null} showSearchTerm />;
}
