import type { Lang } from "@/lib/i18n";

export type OrderEvent = "placed" | "payment_approved" | "payment_rejected" | "confirmed" | "ready" | "dispatched" | "delivered" | "cancelled" | "returned";
export type OwnerEvent = "new_order" | "payment_to_verify" | "low_stock";

/** Which channels each customer event goes to (email is always tried first). */
export const EVENT_CHANNELS: Record<OrderEvent, ("email" | "whatsapp" | "sms")[]> = {
  placed: ["email", "whatsapp", "sms"],
  payment_approved: ["email", "whatsapp"],
  payment_rejected: ["email", "whatsapp", "sms"],
  confirmed: ["email"],
  ready: ["email", "whatsapp", "sms"],
  dispatched: ["email", "whatsapp", "sms"],
  delivered: ["email", "whatsapp"],
  cancelled: ["email", "whatsapp", "sms"],
  returned: ["email"],
};

export interface OrderContext {
  storeName: string;
  name: string;
  orderNo: string;
  total: string; // already formatted, e.g. "₹450"
  paymentMethod: "cod" | "upi" | "online" | "cash";
  fulfillment: "delivery" | "pickup";
  pickupOtp?: string | null;
  courier?: string | null;
  awb?: string | null;
  trackingUrl?: string | null;
  url: string; // order page
  reason?: string | null;
}

export interface Rendered {
  subject: string;
  /** One friendly sentence: used as the WhatsApp body variable and in the plain-text email. */
  message: string;
  /** Very short status label for SMS. */
  short: string;
  html: string;
  text: string;
}

const T = {
  bn: {
    hello: (n: string) => `প্রিয় ${n},`,
    thanks: "আমাদের থেকে কেনাকাটার জন্য ধন্যবাদ।",
    track: "অর্ডার দেখুন",
    order: "অর্ডার",
    total: "মোট",
    placed: (c: OrderContext) =>
      c.paymentMethod === "upi"
        ? `আপনার অর্ডার ${c.orderNo} (${c.total}) গ্রহণ করা হয়েছে। অনুগ্রহ করে UPI-তে পেমেন্ট করে অর্ডার পাতায় UTR জমা দিন।`
        : c.fulfillment === "pickup"
          ? `আপনার অর্ডার ${c.orderNo} (${c.total}) গ্রহণ করা হয়েছে। বই প্রস্তুত হলে জানাব।`
          : `আপনার অর্ডার ${c.orderNo} (${c.total}) গ্রহণ করা হয়েছে। ডেলিভারির সময় নগদে টাকা দিন।`,
    payment_approved: (c: OrderContext) => `আপনার অর্ডার ${c.orderNo}-এর পেমেন্ট যাচাই হয়েছে। ধন্যবাদ! আমরা শীঘ্রই বই প্যাক করব।`,
    payment_rejected: (c: OrderContext) => `আপনার অর্ডার ${c.orderNo}-এর পেমেন্ট যাচাই করা যায়নি। অনুগ্রহ করে সঠিক UTR জমা দিন বা আমাদের সাথে যোগাযোগ করুন।`,
    confirmed: (c: OrderContext) => `আপনার অর্ডার ${c.orderNo} নিশ্চিত হয়েছে।`,
    ready: (c: OrderContext) =>
      c.fulfillment === "pickup"
        ? `আপনার অর্ডার ${c.orderNo} দোকান থেকে সংগ্রহের জন্য প্রস্তুত।${c.pickupOtp ? ` পিকআপ কোড: ${c.pickupOtp}।` : ""}`
        : `আপনার অর্ডার ${c.orderNo} প্যাক হয়েছে, শীঘ্রই কুরিয়ারে যাবে।`,
    dispatched: (c: OrderContext) => `আপনার অর্ডার ${c.orderNo} পাঠানো হয়েছে।${c.courier ? ` কুরিয়ার: ${c.courier}।` : ""}${c.awb ? ` ট্র্যাকিং নম্বর: ${c.awb}।` : ""}`,
    delivered: (c: OrderContext) => `আপনার অর্ডার ${c.orderNo} পৌঁছে গেছে। বইগুলো কেমন লাগল রিভিউ লিখে জানান।`,
    cancelled: (c: OrderContext) => `আপনার অর্ডার ${c.orderNo} বাতিল করা হয়েছে।${c.reason ? ` কারণ: ${c.reason}।` : ""} পেমেন্ট করা থাকলে ফেরত দেওয়া হবে।`,
    returned: (c: OrderContext) => `আপনার অর্ডার ${c.orderNo} ফেরত (রিটার্ন) হিসেবে নথিভুক্ত হয়েছে।`,
    subjects: {
      placed: "অর্ডার গ্রহণ করা হয়েছে",
      payment_approved: "পেমেন্ট যাচাই হয়েছে",
      payment_rejected: "পেমেন্ট যাচাই করা যায়নি",
      confirmed: "অর্ডার নিশ্চিত",
      ready: "অর্ডার প্রস্তুত",
      dispatched: "অর্ডার পাঠানো হয়েছে",
      delivered: "অর্ডার পৌঁছে গেছে",
      cancelled: "অর্ডার বাতিল",
      returned: "অর্ডার ফেরত",
    } as Record<OrderEvent, string>,
    shorts: {
      placed: "গ্রহণ করা হয়েছে",
      payment_approved: "পেমেন্ট যাচাই হয়েছে",
      payment_rejected: "পেমেন্ট যাচাই হয়নি",
      confirmed: "নিশ্চিত",
      ready: "প্রস্তুত",
      dispatched: "পাঠানো হয়েছে",
      delivered: "পৌঁছেছে",
      cancelled: "বাতিল",
      returned: "ফেরত",
    } as Record<OrderEvent, string>,
  },
  en: {
    hello: (n: string) => `Hello ${n},`,
    thanks: "Thank you for shopping with us.",
    track: "View order",
    order: "Order",
    total: "Total",
    placed: (c: OrderContext) =>
      c.paymentMethod === "upi"
        ? `We received your order ${c.orderNo} (${c.total}). Please pay by UPI and submit the UTR on your order page.`
        : c.fulfillment === "pickup"
          ? `We received your order ${c.orderNo} (${c.total}). We will tell you when it is ready to collect.`
          : `We received your order ${c.orderNo} (${c.total}). Please pay cash when it arrives.`,
    payment_approved: (c: OrderContext) => `Payment for order ${c.orderNo} is verified. Thank you! We will pack your books shortly.`,
    payment_rejected: (c: OrderContext) => `We could not verify the payment for order ${c.orderNo}. Please submit the correct UTR or contact us.`,
    confirmed: (c: OrderContext) => `Your order ${c.orderNo} is confirmed.`,
    ready: (c: OrderContext) =>
      c.fulfillment === "pickup"
        ? `Your order ${c.orderNo} is ready to collect at our store.${c.pickupOtp ? ` Pickup code: ${c.pickupOtp}.` : ""}`
        : `Your order ${c.orderNo} is packed and will go to the courier soon.`,
    dispatched: (c: OrderContext) => `Your order ${c.orderNo} has been shipped.${c.courier ? ` Courier: ${c.courier}.` : ""}${c.awb ? ` Tracking no: ${c.awb}.` : ""}`,
    delivered: (c: OrderContext) => `Your order ${c.orderNo} has been delivered. We would love a review of your books.`,
    cancelled: (c: OrderContext) => `Your order ${c.orderNo} has been cancelled.${c.reason ? ` Reason: ${c.reason}.` : ""} Any payment made will be refunded.`,
    returned: (c: OrderContext) => `Your order ${c.orderNo} has been recorded as returned.`,
    subjects: {
      placed: "Order received",
      payment_approved: "Payment verified",
      payment_rejected: "Payment could not be verified",
      confirmed: "Order confirmed",
      ready: "Order ready",
      dispatched: "Order shipped",
      delivered: "Order delivered",
      cancelled: "Order cancelled",
      returned: "Order returned",
    } as Record<OrderEvent, string>,
    shorts: {
      placed: "received",
      payment_approved: "payment verified",
      payment_rejected: "payment not verified",
      confirmed: "confirmed",
      ready: "ready",
      dispatched: "shipped",
      delivered: "delivered",
      cancelled: "cancelled",
      returned: "returned",
    } as Record<OrderEvent, string>,
  },
} as const;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function renderOrderMessage(event: OrderEvent, lang: Lang, c: OrderContext): Rendered {
  const t = T[lang];
  const message = t[event](c);
  const subject = `${t.subjects[event]} — ${c.orderNo} | ${c.storeName}`;
  const text = `${t.hello(c.name)}\n\n${message}\n\n${t.track}: ${c.url}\n\n${c.storeName}`;
  const html = `<!doctype html><html><body style="margin:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#0f1111">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:10px;overflow:hidden">
<tr><td style="background:#131921;padding:16px 24px;color:#fff;font-size:20px;font-weight:bold">${esc(c.storeName)}</td></tr>
<tr><td style="padding:24px">
<p style="margin:0 0 12px;font-size:16px">${esc(t.hello(c.name))}</p>
<p style="margin:0 0 16px;font-size:15px;line-height:1.55">${esc(message)}</p>
<p style="margin:0 0 20px;font-size:14px;color:#555">${esc(t.order)}: <b>${esc(c.orderNo)}</b> &nbsp;·&nbsp; ${esc(t.total)}: <b>${esc(c.total)}</b></p>
${c.trackingUrl ? `<p style="margin:0 0 16px;font-size:14px"><a href="${esc(c.trackingUrl)}" style="color:#007185">${esc(c.trackingUrl)}</a></p>` : ""}
<a href="${esc(c.url)}" style="display:inline-block;background:#febd69;color:#0f1111;text-decoration:none;font-weight:bold;padding:11px 22px;border-radius:24px">${esc(t.track)}</a>
<p style="margin:24px 0 0;font-size:12px;color:#777">${esc(t.thanks)}</p>
</td></tr></table></td></tr></table></body></html>`;
  return { subject, message, short: t.shorts[event], html, text };
}

export interface OwnerContext {
  storeName: string;
  orderNo?: string;
  total?: string;
  customer?: string;
  url: string;
  bookTitle?: string;
  onHand?: number;
}

/** Owner alerts are short and English/Bengali-neutral enough to read quickly. */
export function renderOwnerMessage(event: OwnerEvent, c: OwnerContext, lang: Lang = "bn"): Rendered {
  const bn = lang === "bn";
  const message =
    event === "new_order"
      ? bn ? `নতুন অর্ডার ${c.orderNo} — ${c.customer}, ${c.total}।` : `New order ${c.orderNo} — ${c.customer}, ${c.total}.`
      : event === "payment_to_verify"
        ? bn ? `UPI পেমেন্ট যাচাই করুন: অর্ডার ${c.orderNo}, ${c.total}।` : `Verify UPI payment: order ${c.orderNo}, ${c.total}.`
        : bn ? `স্টক কমে গেছে: “${c.bookTitle}” — মাত্র ${c.onHand}টি বাকি।` : `Low stock: “${c.bookTitle}” — only ${c.onHand} left.`;
  const subject = `[${c.storeName}] ${message}`;
  const text = `${message}\n${c.url}`;
  const html = `<p style="font-family:Arial,sans-serif;font-size:15px">${esc(message)}</p><p><a href="${esc(c.url)}">${esc(c.url)}</a></p>`;
  return { subject, message, short: event, html, text };
}
