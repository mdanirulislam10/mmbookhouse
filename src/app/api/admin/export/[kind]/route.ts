import { NextResponse, type NextRequest } from "next/server";
import { getStaff } from "@/lib/data/session";
import { createServiceClient } from "@/lib/supabase/admin";
import { rolesFor } from "@/lib/admin/permissions";
import { writeAudit } from "@/lib/admin/guard";
import { toCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function csv(name: string, rows: unknown[][]) {
  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "no-store",
    },
  });
}

/** Owner-only CSV downloads: orders, customers, inventory, GSTR-1 HSN summary. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  const staff = await getStaff();
  const area = kind === "inventory" ? "inventory" : "reports";
  if (!staff || !rolesFor(area).includes(staff.role)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const sp = request.nextUrl.searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const from = DATE.test(sp.get("from") ?? "") ? sp.get("from")! : today.slice(0, 8) + "01";
  const to = DATE.test(sp.get("to") ?? "") ? sp.get("to")! : today;
  const service = createServiceClient();

  if (kind === "orders") {
    const { data } = await service
      .from("orders")
      .select("order_no, placed_at, status, payment_method, payment_status, fulfillment, channel, ship_name, ship_phone, ship_city, ship_district, ship_state, ship_pincode, subtotal, discount_total, delivery_fee, total, coupon_code, awb, order_items(title, qty)")
      .gte("placed_at", `${from}T00:00:00+05:30`)
      .lte("placed_at", `${to}T23:59:59+05:30`)
      .order("placed_at")
      .limit(20000);
    await writeAudit(staff, "export.orders", "export", null, { after: { from, to } });
    return csv(`orders-${from}_${to}.csv`, [
      ["Order", "Placed at", "Status", "Payment", "Payment status", "Fulfilment", "Channel", "Name", "Phone", "City", "District", "State", "Pincode", "Subtotal", "Discount", "Delivery", "Total", "Coupon", "AWB", "Items"],
      ...((data ?? []) as any[]).map((o) => [o.order_no, o.placed_at, o.status, o.payment_method, o.payment_status, o.fulfillment, o.channel, o.ship_name, o.ship_phone, o.ship_city, o.ship_district, o.ship_state, o.ship_pincode, o.subtotal, o.discount_total, o.delivery_fee, o.total, o.coupon_code, o.awb, (o.order_items ?? []).map((i: any) => `${i.title} x${i.qty}`).join("; ")]),
    ]);
  }

  if (kind === "gstr1") {
    const { data } = await service.rpc("admin_hsn_summary", { p_from: from, p_to: to });
    await writeAudit(staff, "export.gstr1", "export", null, { after: { from, to } });
    return csv(`gstr1-hsn-${from}_${to}.csv`, [
      ["HSN", "Description", "UQC", "Total quantity", "Total value", "Taxable value", "GST rate %"],
      ...((data ?? []) as any[]).map((r) => [r.hsn_code, r.description, r.uqc, r.total_qty, r.total_value, r.taxable_value, r.gst_rate]),
    ]);
  }

  if (kind === "inventory") {
    const { data } = await service.from("inventory").select("on_hand, low_stock_threshold, books!inner(title, isbn, status, mrp, sale_price, book_private(cost_price, rack_location))").order("on_hand").limit(20000);
    const money = staff.role === "super_admin";
    return csv(`inventory-${today}.csv`, [
      ["Title", "ISBN", "Status", "On hand", "Alert at", "Rack", "MRP", "Selling price", ...(money ? ["Cost", "Stock value at cost"] : [])],
      ...((data ?? []) as any[]).map((r) => {
        const p = Array.isArray(r.books.book_private) ? r.books.book_private[0] : r.books.book_private;
        return [r.books.title, r.books.isbn, r.books.status, r.on_hand, r.low_stock_threshold, p?.rack_location, r.books.mrp, r.books.sale_price, ...(money ? [p?.cost_price, p?.cost_price ? Number(p.cost_price) * r.on_hand : ""] : [])];
      }),
    ]);
  }

  if (kind === "customers") {
    if (staff.role !== "super_admin") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    const rows: unknown[][] = [["Name", "Email", "Phone", "Joined", "Orders", "Total spent"]];
    for (let page = 1; page <= 20; page++) {
      const { data } = await service.auth.admin.listUsers({ page, perPage: 250 });
      const users = data?.users ?? [];
      if (!users.length) break;
      const ids = users.map((u) => u.id);
      const [{ data: profiles }, { data: orders }] = await Promise.all([
        service.from("profiles").select("id, full_name, phone").in("id", ids),
        service.from("orders").select("user_id, total, status").in("user_id", ids).not("status", "in", "(cancelled,returned)"),
      ]);
      const pm = new Map((profiles ?? []).map((p) => [p.id as string, p]));
      const om = new Map<string, { n: number; sum: number }>();
      for (const o of orders ?? []) {
        const cur = om.get(o.user_id as string) ?? { n: 0, sum: 0 };
        cur.n++;
        cur.sum += Number(o.total);
        om.set(o.user_id as string, cur);
      }
      for (const u of users) rows.push([pm.get(u.id)?.full_name ?? "", u.email ?? "", pm.get(u.id)?.phone ?? "", u.created_at, om.get(u.id)?.n ?? 0, om.get(u.id)?.sum ?? 0]);
      if (users.length < 250) break;
    }
    await writeAudit(staff, "export.customers", "export", null, { after: { rows: rows.length - 1 } });
    return csv(`customers-${today}.csv`, rows);
  }

  return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
}
