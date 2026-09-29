import { NextResponse, type NextRequest } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";
import { getCategories } from "@/lib/data/catalog";

export const dynamic = "force-dynamic";

interface Suggestion {
  type: "book" | "author" | "category";
  label: string;
  sub?: string;
  href: string;
  image?: string | null;
  price?: number;
}

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 80);
  if (q.length < 2) return NextResponse.json({ suggestions: [] });

  const supabase = createPublicClient();
  const escaped = q.replace(/[%_\\,()]/g, " ");
  const [books, authors, categories] = await Promise.all([
    supabase.rpc("search_books", { p_q: q, p_limit: 6, p_offset: 0 }),
    supabase.from("authors").select("slug, name, name_bn").or(`name.ilike.%${escaped}%,name_bn.ilike.%${escaped}%`).limit(3),
    getCategories(),
  ]);

  const needle = q.toLowerCase();
  const out: Suggestion[] = [];
  for (const c of categories) {
    if (c.name.toLowerCase().includes(needle) || (c.name_bn ?? "").toLowerCase().includes(needle)) {
      out.push({ type: "category", label: c.name_bn || c.name, sub: c.name_bn ? c.name : undefined, href: `/category/${c.slug}` });
      if (out.length >= 3) break;
    }
  }
  for (const a of authors.data ?? []) {
    out.push({ type: "author", label: a.name_bn || a.name, sub: a.name_bn ? a.name : undefined, href: `/search?q=${encodeURIComponent(a.name)}` });
  }
  for (const b of (books.data ?? []) as any[]) {
    out.push({
      type: "book",
      label: b.title_bn || b.title,
      sub: b.author_names_bn || b.author_names || undefined,
      href: `/book/${b.slug}`,
      image: b.cover_url,
      price: Number(b.price),
    });
  }
  return NextResponse.json({ suggestions: out }, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } });
}
