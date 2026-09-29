import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";
import { getAllBookSlugs, getCategories } from "@/lib/data/catalog";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicEnv.siteUrl;
  const [books, categories] = await Promise.all([getAllBookSlugs(), getCategories()]);
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    ...["deals", "bestsellers", "new-arrivals", "support", "bulk-order", "track"].map((p) => ({ url: `${base}/${p}`, changeFrequency: "daily" as const, priority: 0.6 })),
    ...categories.map((c) => ({ url: `${base}/category/${c.slug}`, changeFrequency: "daily" as const, priority: 0.7 })),
    ...books.map((b) => ({ url: `${base}/book/${b.slug}`, lastModified: b.updated_at, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
