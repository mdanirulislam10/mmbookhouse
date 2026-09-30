import "server-only";
import { Type, type FunctionDeclaration } from "@google/genai";
import { z } from "zod";
import { createPublicClient } from "@/lib/supabase/public";
import { getBookBySlug, searchBooks } from "@/lib/data/catalog";
import { getCartLines } from "@/lib/data/cart";
import { getAddresses, getMyOrders } from "@/lib/data/account";
import { getSessionUser } from "@/lib/data/session";
import { getSettings } from "@/lib/data/settings";
import { addToCart, setCartQty } from "@/app/actions/cart";
import { trackOrder } from "@/app/actions/orders";
import { uuid } from "@/lib/actions";

/**
 * Tools of the storefront chat assistant (Gemini API). They run on the server with the
 * visitor's own session, so RLS and the normal server actions apply exactly as on the site.
 * Orders are never placed by the model: place_cod_order only proposes one, and the customer
 * confirms it with a button that calls confirmAssistantOrder().
 */

export interface BookCardOut {
  book_id: string;
  slug: string;
  title: string;
  author: string | null;
  price: number;
  mrp: number;
  in_stock: boolean;
  cover_url: string | null;
}

export interface OrderProposal {
  fulfillment: "delivery" | "pickup";
  addressId: string | null;
  addressText: string | null;
  items: { title: string; qty: number; price: number }[];
  subtotal: number;
  deliveryFee: number | null;
}

/** Side effects a tool run reports back to the chat UI. */
export interface ToolEffects {
  books?: BookCardOut[];
  cartChanged?: boolean;
  proposal?: OrderProposal;
}

const AUTH_TOOLS = new Set(["get_cart", "add_to_cart", "set_cart_quantity", "get_my_orders", "get_checkout_options", "place_cod_order"]);

export const functionDeclarations: FunctionDeclaration[] = [
  {
    name: "search_books",
    description:
      "Search the shop's catalogue by title, author, publisher or ISBN (Bengali or English). Use it whenever the customer names a book or sends a photo of one: read the title, author and ISBN from the cover and search with the clearest words. If nothing is found, retry with fewer words or the other language's spelling. Returns up to 6 books.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: "Title, author, publisher or ISBN." },
        max_price: { type: Type.NUMBER, description: "Optional upper price in rupees." },
        in_stock_only: { type: Type.BOOLEAN },
      },
      required: ["query"],
    },
  },
  {
    name: "get_book_details",
    description: "Full details of one book (description, ISBN, pages, edition, binding, publisher, categories, rating, stock). Use a slug from search_books.",
    parameters: { type: Type.OBJECT, properties: { slug: { type: Type.STRING } }, required: ["slug"] },
  },
  {
    name: "delivery_quote",
    description: "Delivery fee, delivery time and cash-on-delivery availability for a 6-digit pincode and order amount.",
    parameters: {
      type: Type.OBJECT,
      properties: { pincode: { type: Type.STRING }, amount: { type: Type.NUMBER } },
      required: ["pincode", "amount"],
    },
  },
  { name: "get_cart", description: "The customer's cart with quantities, prices and subtotal." },
  {
    name: "add_to_cart",
    description: "Add a book to the cart. Only when the customer asked for it or agreed.",
    parameters: {
      type: Type.OBJECT,
      properties: { book_id: { type: Type.STRING, description: "book_id from search_books." }, qty: { type: Type.INTEGER, description: "1-10, default 1." } },
      required: ["book_id"],
    },
  },
  {
    name: "set_cart_quantity",
    description: "Change the quantity of a book in the cart; 0 removes it.",
    parameters: {
      type: Type.OBJECT,
      properties: { book_id: { type: Type.STRING }, qty: { type: Type.INTEGER } },
      required: ["book_id", "qty"],
    },
  },
  {
    name: "get_my_orders",
    description: "The signed-in customer's recent orders with status, total, courier and items.",
    parameters: { type: Type.OBJECT, properties: { limit: { type: Type.INTEGER, description: "1-10, default 5." } } },
  },
  {
    name: "track_order",
    description: "Track an order by order number and the phone number on it (for customers who are not signed in).",
    parameters: {
      type: Type.OBJECT,
      properties: { order_no: { type: Type.STRING }, phone: { type: Type.STRING } },
      required: ["order_no", "phone"],
    },
  },
  {
    name: "get_checkout_options",
    description:
      "Before ordering: cart total, the customer's saved addresses (delivery fee, days, whether cash on delivery is available there) and whether store pickup is possible.",
  },
  {
    name: "place_cod_order",
    description:
      "Propose a cash-on-delivery (or pay-at-counter pickup) order for everything in the cart. Call get_checkout_options first and agree the address or pickup with the customer. This does NOT place the order: an order summary with a confirm button is shown to the customer, and only their button press places it.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        fulfillment: { type: Type.STRING, enum: ["delivery", "pickup"] },
        address_id: { type: Type.STRING, description: "Required for delivery: address_id from get_checkout_options." },
      },
      required: ["fulfillment"],
    },
  },
];

const args = {
  search_books: z.object({ query: z.string().trim().min(1).max(120), max_price: z.number().positive().optional(), in_stock_only: z.boolean().optional() }),
  get_book_details: z.object({ slug: z.string().trim().min(1).max(200) }),
  delivery_quote: z.object({ pincode: z.string().regex(/^\d{6}$/), amount: z.number().min(0) }),
  get_cart: z.object({}).passthrough(),
  add_to_cart: z.object({ book_id: uuid, qty: z.number().int().min(1).max(10).optional() }),
  set_cart_quantity: z.object({ book_id: uuid, qty: z.number().int().min(0).max(10) }),
  get_my_orders: z.object({ limit: z.number().int().min(1).max(10).optional() }),
  track_order: z.object({ order_no: z.string().trim().min(4).max(30), phone: z.string().trim().min(8).max(20) }),
  get_checkout_options: z.object({}).passthrough(),
  place_cod_order: z.object({ fulfillment: z.enum(["delivery", "pickup"]), address_id: uuid.optional() }),
};
type ToolName = keyof typeof args;

function stockText(onHand: number) {
  if (onHand < 1) return "out_of_stock";
  return onHand <= 3 ? `only_${onHand}_left` : "in_stock";
}

async function cartSummary() {
  const lines = (await getCartLines()).filter((l) => !l.saved_for_later);
  const items = lines.map((l) => ({
    book_id: l.book_id,
    title: l.book.title_bn || l.book.title,
    qty: l.qty,
    price: Number(l.book.price),
    stock: stockText(l.book.on_hand),
  }));
  return { items, subtotal: items.reduce((n, i) => n + i.price * i.qty, 0) };
}

async function quote(pincode: string, subtotal: number) {
  const { data } = await createPublicClient().rpc("quote_delivery", { p_pincode: pincode, p_subtotal: subtotal });
  return (data as { label: string; label_bn: string | null; fee: number; eta_min_days: number; eta_max_days: number; cod_available: boolean }[] | null)?.[0] ?? null;
}

/** Builds (and re-checks) the order the customer will confirm. Shared with the confirm action. */
export async function buildProposal(fulfillment: "delivery" | "pickup", addressId: string | null): Promise<OrderProposal | { error: string }> {
  const [cart, settings] = await Promise.all([cartSummary(), getSettings()]);
  if (!cart.items.length) return { error: "CART_EMPTY" };
  if (!settings.payment.cod_enabled) return { error: "COD_DISABLED" };
  if (cart.subtotal > settings.payment.cod_max_order) return { error: "COD_LIMIT_EXCEEDED" };
  if (fulfillment === "pickup") {
    if (!settings.checkout.pickup_enabled) return { error: "PICKUP_DISABLED" };
    return { fulfillment, addressId: null, addressText: settings.checkout.pickup_address, items: cart.items, subtotal: cart.subtotal, deliveryFee: 0 };
  }
  const address = (await getAddresses()).find((a) => a.id === addressId);
  if (!address) return { error: "ADDRESS_REQUIRED" };
  const q = await quote(address.pincode, cart.subtotal);
  if (!q) return { error: "NO_DELIVERY_TO_PINCODE" };
  if (!q.cod_available) return { error: "COD_NOT_AVAILABLE_HERE" };
  return {
    fulfillment,
    addressId: address.id,
    addressText: [address.full_name, address.line1, address.city, address.district, address.pincode].filter(Boolean).join(", "),
    items: cart.items,
    subtotal: cart.subtotal,
    deliveryFee: Number(q.fee),
  };
}

export async function runTool(name: string, rawArgs: unknown, effects: ToolEffects): Promise<Record<string, unknown>> {
  if (!(name in args)) return { error: "UNKNOWN_TOOL" };
  const tool = name as ToolName;
  const parsed = args[tool].safeParse(rawArgs ?? {});
  if (!parsed.success) return { error: "INVALID_ARGUMENTS", detail: parsed.error.issues[0]?.message };
  if (AUTH_TOOLS.has(tool) && !(await getSessionUser())) {
    return { error: "LOGIN_REQUIRED", message: "Ask the customer to sign in with the Login button (top right) first." };
  }
  const a = parsed.data as any;

  switch (tool) {
    case "search_books": {
      const q = /^[0-9-\s]{10,17}$/.test(a.query) ? a.query.replace(/\D/g, "") : a.query;
      const { rows, total } = await searchBooks({ q, max: a.max_price, inStock: a.in_stock_only ?? false, pageSize: 6 });
      effects.books = rows.map((b) => ({
        book_id: b.id,
        slug: b.slug,
        title: b.title_bn || b.title,
        author: b.author_names_bn || b.author_names,
        price: Number(b.price),
        mrp: Number(b.mrp),
        in_stock: b.on_hand > 0,
        cover_url: b.cover_url,
      }));
      return {
        total_matches: total,
        books: rows.map((b) => ({
          book_id: b.id,
          slug: b.slug,
          title: b.title,
          title_bn: b.title_bn,
          author: b.author_names_bn || b.author_names,
          publisher: b.publisher_name,
          language: b.language,
          price: Number(b.price),
          mrp: Number(b.mrp),
          discount_pct: b.discount_pct,
          stock: stockText(b.on_hand),
        })),
        note: rows.length ? "The books are shown to the customer as cards with links; do not repeat links." : undefined,
      };
    }

    case "get_book_details": {
      const b = await getBookBySlug(a.slug);
      if (!b || b.status !== "active") return { error: "BOOK_NOT_FOUND" };
      return {
        book_id: b.id,
        title: b.title,
        title_bn: b.title_bn,
        subtitle: b.subtitle,
        authors: b.authors.map((x) => `${x.name_bn || x.name} (${x.role})`),
        publisher: b.publisher?.name_bn || b.publisher?.name || null,
        description: (b.description_bn || b.description || "").slice(0, 1500),
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
        stock: stockText(b.card.on_hand),
      };
    }

    case "delivery_quote": {
      const [q, settings] = await Promise.all([quote(a.pincode, a.amount), getSettings()]);
      if (!q) return { delivers: false };
      return {
        delivers: true,
        zone: q.label_bn || q.label,
        fee: Number(q.fee),
        days: `${q.eta_min_days}-${q.eta_max_days}`,
        cod_available: q.cod_available && settings.payment.cod_enabled && a.amount <= settings.payment.cod_max_order,
      };
    }

    case "get_cart":
      return cartSummary();

    case "add_to_cart": {
      const r = await addToCart(a.book_id, a.qty ?? 1);
      if (!r.ok) return { error: r.error };
      effects.cartChanged = true;
      return { ok: true, qty_in_cart: r.data?.qty, limited_by_stock: r.data?.capped ?? false };
    }

    case "set_cart_quantity": {
      const r = await setCartQty(a.book_id, a.qty);
      if (!r.ok) return { error: r.error };
      effects.cartChanged = true;
      return { ok: true, qty_in_cart: r.data?.qty };
    }

    case "get_my_orders": {
      const orders = await getMyOrders(a.limit ?? 5);
      return {
        orders: orders.map((o) => ({
          order_no: o.order_no,
          status: o.status,
          payment: `${o.payment_method} / ${o.payment_status}`,
          fulfillment: o.fulfillment,
          total: Number(o.total),
          placed_at: new Date(o.placed_at).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }),
          courier: o.courier_name ? `${o.courier_name} ${o.awb ?? ""}`.trim() : null,
          tracking_url: o.tracking_url,
          items: o.items.map((i) => `${i.title} x${i.qty}`),
        })),
      };
    }

    case "track_order": {
      const r = await trackOrder(a.order_no, a.phone);
      if (!r.ok) return { error: r.error };
      return r.data ? { order: r.data } : { error: "ORDER_NOT_FOUND" };
    }

    case "get_checkout_options": {
      const [cart, addresses, settings] = await Promise.all([cartSummary(), getAddresses(), getSettings()]);
      const codAllowed = settings.payment.cod_enabled && cart.subtotal <= settings.payment.cod_max_order;
      const quoted = await Promise.all(
        addresses.map(async (ad) => {
          const q = await quote(ad.pincode, cart.subtotal);
          return {
            address_id: ad.id,
            label: ad.label,
            summary: [ad.full_name, ad.line1, ad.city, ad.pincode].filter(Boolean).join(", "),
            is_default: ad.is_default,
            delivers_here: Boolean(q),
            delivery_fee: q ? Number(q.fee) : null,
            days: q ? `${q.eta_min_days}-${q.eta_max_days}` : null,
            cod_available: codAllowed && (q?.cod_available ?? false),
          };
        }),
      );
      return {
        cart,
        cod_limit: settings.payment.cod_max_order,
        addresses: quoted,
        pickup_available: settings.checkout.pickup_enabled,
        pickup_address: settings.checkout.pickup_enabled ? settings.checkout.pickup_address : undefined,
        note: quoted.length ? undefined : "No saved address: offer store pickup, or ask them to add an address on the checkout page.",
      };
    }

    case "place_cod_order": {
      const p = await buildProposal(a.fulfillment, a.address_id ?? null);
      if ("error" in p) return { error: p.error };
      effects.proposal = p;
      return {
        status: "awaiting_customer_confirmation",
        message: "An order summary with a 'Place order' button is now shown. Tell the customer to check it and press the button. The order is NOT placed yet.",
        total: p.subtotal + (p.deliveryFee ?? 0),
      };
    }
  }
}
