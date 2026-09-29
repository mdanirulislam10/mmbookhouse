import { NextResponse, type NextRequest } from "next/server";
import { getStaff } from "@/lib/data/session";
import { createServiceClient } from "@/lib/supabase/admin";
import { likeTerm } from "@/lib/admin/data";

export const dynamic = "force-dynamic";

/** Staff-only quick lookup (title / ISBN / slug) used by pickers and the POS screen. */
export async function GET(request: NextRequest) {
  const staff = await getStaff();
  if (!staff) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const q = likeTerm(request.nextUrl.searchParams.get("q") ?? "").slice(0, 80);
  if (q.length < 2) return NextResponse.json({ books: [] });
  const includeDrafts = request.nextUrl.searchParams.get("all") === "1";

  let query = createServiceClient()
    .from("books")
    .select("id, title, title_bn, isbn, cover_url, mrp, sale_price, status, inventory(on_hand)")
    .or(`title.ilike.%${q}%,title_bn.ilike.%${q}%,isbn.eq.${q.replace(/[-\s]/g, "")},search_text.ilike.%${q.toLowerCase()}%`)
    .order("sold_count", { ascending: false })
    .limit(10);
  if (!includeDrafts) query = query.eq("status", "active");
  const { data } = await query;
  return NextResponse.json({
    books: (data ?? []).map((b: any) => ({
      id: b.id,
      title: b.title,
      title_bn: b.title_bn,
      isbn: b.isbn,
      cover_url: b.cover_url,
      mrp: Number(b.mrp),
      price: Number(b.sale_price),
      status: b.status,
      on_hand: (Array.isArray(b.inventory) ? b.inventory[0] : b.inventory)?.on_hand ?? 0,
    })),
  });
}
