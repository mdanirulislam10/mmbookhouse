import "server-only";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/admin";
import { createPublicClient } from "@/lib/supabase/public";
import { getBookBySlug, searchBooks } from "@/lib/data/catalog";
import { getSettings } from "@/lib/data/settings";
import type { StaffRole } from "@/lib/types";

/**
 * Store tools exposed over MCP to the owner's Gemini app. Every call runs for a signed-in,
 * active staff member (checked per request in /api/mcp); data is read with the service role,
 * so each tool must only return what that staff role may see.
 */

export interface StaffContext {
  userId: string;
  role: StaffRole;
  name: string | null;
}

interface ToolDef {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  roles?: StaffRole[]; // omitted = every staff role
  schema: z.ZodTypeAny;
  run: (args: any, staff: StaffContext) => Promise<unknown>;
}

const ORDER_STATUSES = ["pending", "confirmed", "processing", "ready", "dispatched", "delivered", "cancelled", "returned"] as const;

function stock(onHand: number) {
  return onHand < 1 ? "out of stock" : `${onHand} in stock`;
}

const ORDER_COLUMNS =
  "id, order_no, status, channel, payment_method, payment_status, fulfillment, total, ship_name, ship_phone, ship_city, ship_pincode, courier_name, awb, placed_at, order_items(title, qty, unit_price)";

function orderOut(o: any) {
  return {
    order_no: o.order_no,
    status: o.status,
    channel: o.channel,
    payment: `${o.payment_method} / ${o.payment_status}`,
    fulfillment: o.fulfillment,
    total: Number(o.total),
    customer: o.ship_name,
    phone: o.ship_phone,
    place: [o.ship_city, o.ship_pincode].filter(Boolean).join(" ") || null,
    courier: o.courier_name ? `${o.courier_name} ${o.awb ?? ""}`.trim() : null,
    placed_at: new Date(o.placed_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    items: (o.order_items ?? []).map((i: any) => `${i.title} x${i.qty} @₹${Number(i.unit_price)}`),
  };
}

/** Midnight today in India, as an ISO timestamp. */
function startOfTodayIst(): string {
  const ist = new Date(Date.now() + 5.5 * 3600 * 1000);
  const midnightIstAsUtc = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()) - 5.5 * 3600 * 1000;
  return new Date(midnightIstAsUtc).toISOString();
}

const TOOLS: ToolDef[] = [
  {
    name: "search_books",
    title: "Search books",
    description:
      "Search the shop's catalogue by title, author, publisher or ISBN, in Bengali or English. When a book is shown on camera, read its title/author/ISBN and search with the clearest words; if nothing is found, retry with fewer words or the other language's spelling. Returns price, MRP and exact stock count.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Title, author, publisher or ISBN." },
        in_stock_only: { type: "boolean", description: "Only books currently in stock." },
      },
      required: ["query"],
    },
    schema: z.object({ query: z.string().trim().min(1).max(120), in_stock_only: z.boolean().optional() }),
    run: async (a) => {
      const q = /^[0-9-\s]{10,17}$/.test(a.query) ? a.query.replace(/\D/g, "") : a.query;
      const { rows, total } = await searchBooks({ q, inStock: a.in_stock_only ?? false, pageSize: 8 });
      return {
        total_matches: total,
        books: rows.map((b) => ({
          slug: b.slug,
          title: b.title_bn ? `${b.title_bn} / ${b.title}` : b.title,
          author: b.author_names_bn || b.author_names,
          publisher: b.publisher_name,
          language: b.language,
          price: Number(b.price),
          mrp: Number(b.mrp),
          discount_pct: b.discount_pct,
          stock: stock(b.on_hand),
        })),
      };
    },
  },
  {
    name: "get_book_details",
    title: "Book details",
    description: "Full details of one book: description, ISBN, pages, edition, binding, publisher, categories, rating, price and stock. Use a slug from search_books.",
    inputSchema: { type: "object", properties: { slug: { type: "string" } }, required: ["slug"] },
    schema: z.object({ slug: z.string().trim().min(1).max(200) }),
    run: async (a) => {
      const b = await getBookBySlug(a.slug);
      if (!b) return { error: "Book not found" };
      return {
        title: b.title,
        title_bn: b.title_bn,
        subtitle: b.subtitle,
        status: b.status,
        authors: b.authors.map((x) => `${x.name_bn || x.name} (${x.role})`),
        publisher: b.publisher?.name_bn || b.publisher?.name || null,
        description: (b.description_bn || b.description || "").slice(0, 2000),
        isbn: b.isbn,
        language: b.language,
        edition: [b.edition, b.edition_year].filter(Boolean).join(" ") || null,
        pages: b.pages,
        binding: b.binding,
        condition: b.condition,
        class_level: b.class_level,
        categories: b.categories.map((c) => c.name_bn || c.name),
        price: Number(b.card.price),
        mrp: Number(b.card.mrp),
        rating: b.card.rating_count ? `${Number(b.card.rating_avg).toFixed(1)} (${b.card.rating_count})` : null,
        stock: stock(b.card.on_hand),
      };
    },
  },
  {
    name: "delivery_quote",
    title: "Delivery charge",
    description: "Delivery fee, delivery time and cash-on-delivery availability for a 6-digit Indian pincode and an order amount.",
    inputSchema: {
      type: "object",
      properties: { pincode: { type: "string" }, amount: { type: "number", description: "Order subtotal in rupees." } },
      required: ["pincode", "amount"],
    },
    schema: z.object({ pincode: z.string().regex(/^\d{6}$/), amount: z.number().min(0) }),
    run: async (a) => {
      const [{ data }, settings] = await Promise.all([
        createPublicClient().rpc("quote_delivery", { p_pincode: a.pincode, p_subtotal: a.amount }),
        getSettings(),
      ]);
      const q = (data as any[] | null)?.[0];
      if (!q) return { delivers: false };
      return {
        delivers: true,
        zone: q.label_bn || q.label,
        fee: Number(q.fee),
        days: `${q.eta_min_days}-${q.eta_max_days}`,
        cod_available: q.cod_available && settings.payment.cod_enabled && a.amount <= settings.payment.cod_max_order,
        cod_limit: settings.payment.cod_max_order,
      };
    },
  },
  {
    name: "find_orders",
    title: "Find orders",
    description: "Look up orders by order number, or by the customer's phone number (latest first).",
    inputSchema: {
      type: "object",
      properties: {
        order_no: { type: "string" },
        phone: { type: "string", description: "Customer mobile number (last 10 digits are matched)." },
        limit: { type: "integer", description: "1-10, default 5." },
      },
    },
    schema: z
      .object({ order_no: z.string().trim().min(3).max(30).optional(), phone: z.string().trim().max(20).optional(), limit: z.number().int().min(1).max(10).optional() })
      .refine((a) => a.order_no || (a.phone && a.phone.replace(/\D/g, "").length >= 10), "Give an order number or a 10-digit phone number"),
    run: async (a) => {
      let q = createServiceClient().from("orders").select(ORDER_COLUMNS).order("placed_at", { ascending: false }).limit(a.limit ?? 5);
      if (a.order_no) q = q.ilike("order_no", a.order_no.replace(/[%_]/g, ""));
      else q = q.like("ship_phone", `%${a.phone.replace(/\D/g, "").slice(-10)}`);
      const { data, error } = await q;
      if (error) return { error: error.message };
      return { orders: (data ?? []).map(orderOut) };
    },
  },
  {
    name: "recent_orders",
    title: "Recent orders",
    description: "Latest orders, optionally only one status (e.g. pending orders that still need confirming).",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", enum: [...ORDER_STATUSES] },
        limit: { type: "integer", description: "1-20, default 10." },
      },
    },
    schema: z.object({ status: z.enum(ORDER_STATUSES).optional(), limit: z.number().int().min(1).max(20).optional() }),
    run: async (a) => {
      let q = createServiceClient().from("orders").select(ORDER_COLUMNS).order("placed_at", { ascending: false }).limit(a.limit ?? 10);
      if (a.status) q = q.eq("status", a.status);
      const { data, error } = await q;
      if (error) return { error: error.message };
      return { orders: (data ?? []).map(orderOut) };
    },
  },
  {
    name: "low_stock_books",
    title: "Low stock",
    description: "Active books that are out of stock or at/below their low-stock level, lowest first. Useful for reordering.",
    inputSchema: { type: "object", properties: { limit: { type: "integer", description: "1-50, default 20." } } },
    roles: ["super_admin", "inventory_manager"],
    schema: z.object({ limit: z.number().int().min(1).max(50).optional() }),
    run: async (a) => {
      const { data, error } = await createServiceClient()
        .from("v_books")
        .select("title, title_bn, author_names, publisher_name, on_hand, price")
        .eq("low_stock", true)
        .order("on_hand", { ascending: true })
        .limit(a.limit ?? 20);
      if (error) return { error: error.message };
      return { books: (data ?? []).map((b: any) => ({ title: b.title_bn || b.title, author: b.author_names, publisher: b.publisher_name, on_hand: b.on_hand, price: Number(b.price) })) };
    },
  },
  {
    name: "sales_today",
    title: "Today's sales",
    description: "Today's (India time) order count and sales total, split by online/counter, plus how many orders are still pending.",
    inputSchema: { type: "object", properties: {} },
    roles: ["super_admin"],
    schema: z.object({}).passthrough(),
    run: async () => {
      const supabase = createServiceClient();
      const [{ data, error }, { count: pending }] = await Promise.all([
        supabase.from("orders").select("channel, status, total").gte("placed_at", startOfTodayIst()),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      if (error) return { error: error.message };
      const live = (data ?? []).filter((o: any) => o.status !== "cancelled" && o.status !== "returned");
      const sum = (rows: any[]) => rows.reduce((n, o) => n + Number(o.total), 0);
      const online = live.filter((o: any) => o.channel === "online");
      const pos = live.filter((o: any) => o.channel === "pos");
      return {
        orders: live.length,
        sales_total: sum(live),
        online: { orders: online.length, total: sum(online) },
        counter: { orders: pos.length, total: sum(pos) },
        cancelled_today: (data ?? []).length - live.length,
        pending_orders_all_days: pending ?? 0,
      };
    },
  },
];

function allowed(t: ToolDef, staff: StaffContext) {
  return !t.roles || staff.role === "super_admin" || t.roles.includes(staff.role);
}

export function listTools(staff: StaffContext) {
  return TOOLS.filter((t) => allowed(t, staff)).map((t) => ({
    name: t.name,
    title: t.title,
    description: t.description,
    inputSchema: t.inputSchema,
    annotations: { readOnlyHint: true, openWorldHint: false },
  }));
}

/** MCP tools/call result: text content, isError on failures. */
export async function callTool(name: string, rawArgs: unknown, staff: StaffContext) {
  const t = TOOLS.find((x) => x.name === name);
  if (!t || !allowed(t, staff)) return { content: [{ type: "text", text: `Unknown or not permitted tool: ${name}` }], isError: true };
  const parsed = t.schema.safeParse(rawArgs ?? {});
  if (!parsed.success) return { content: [{ type: "text", text: `Invalid arguments: ${parsed.error.issues[0]?.message}` }], isError: true };
  try {
    const result = (await t.run(parsed.data, staff)) as Record<string, unknown>;
    return { content: [{ type: "text", text: JSON.stringify(result) }], isError: Boolean(result && "error" in result) };
  } catch (err) {
    console.error(`[mcp] ${name}:`, err instanceof Error ? err.message : err);
    return { content: [{ type: "text", text: "The tool failed. Please try again." }], isError: true };
  }
}
