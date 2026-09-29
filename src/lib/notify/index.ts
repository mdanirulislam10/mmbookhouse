import "server-only";
import { after } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { getSettings } from "@/lib/data/settings";
import { publicEnv } from "@/lib/env";
import { formatINR } from "@/lib/utils";
import type { Lang } from "@/lib/i18n";
import { isConfigured, MAX_ATTEMPTS, type Channel } from "./config";
import { sendEmail, sendSms, sendWhatsApp, toIndianMsisdn } from "./providers";
import {
  EVENT_CHANNELS,
  renderOrderMessage,
  renderOwnerMessage,
  type OrderContext,
  type OrderEvent,
  type OwnerContext,
  type OwnerEvent,
  type Rendered,
} from "./templates";

export interface NotifyPrefs {
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
}
export const DEFAULT_PREFS: NotifyPrefs = { email: true, sms: true, whatsapp: true };

export interface ChannelSwitches {
  email: boolean;
  whatsapp: boolean;
  sms: boolean;
}
export const DEFAULT_SWITCHES: ChannelSwitches = { email: true, whatsapp: true, sms: true };

export async function getChannelSwitches(): Promise<ChannelSwitches> {
  const { data } = await createServiceClient().from("site_settings").select("value").eq("key", "notifications").maybeSingle();
  return { ...DEFAULT_SWITCHES, ...((data?.value as Partial<ChannelSwitches> | undefined) ?? {}) };
}

interface OutboxPayload {
  event: string;
  order_id?: string | null;
  subject?: string;
  text?: string;
  html?: string;
  wa?: string[];
  sms?: [string, string, string];
}

/** Run after the response is sent when possible, otherwise inline. Never throws. */
export function defer(task: () => Promise<unknown>): void {
  const safe = async () => {
    try {
      await task();
    } catch (e) {
      console.error("[notify]", e);
    }
  };
  try {
    after(safe);
  } catch {
    void safe();
  }
}

async function deliver(channel: Channel, recipient: string, p: OutboxPayload): Promise<void> {
  if (channel === "email") return sendEmail({ to: recipient, subject: p.subject ?? "", text: p.text ?? "", html: p.html ?? "" });
  if (channel === "whatsapp") return sendWhatsApp(recipient, p.wa ?? []);
  return sendSms(recipient, p.sms ?? ["", "", ""]);
}

/** Records the message in the outbox and tries to send it right away. */
async function enqueue(channel: Channel, recipient: string, template: string, payload: OutboxPayload, switches: ChannelSwitches): Promise<void> {
  const service = createServiceClient();
  const disabled = !switches[channel];
  const missing = !isConfigured(channel);
  if (disabled || missing) {
    await service.from("outbox").insert({ channel, recipient, template, payload, status: "skipped", last_error: disabled ? "channel turned off" : "provider not configured" });
    return;
  }
  const { data: row } = await service.from("outbox").insert({ channel, recipient, template, payload, status: "queued" }).select("id").single();
  if (!row) return;
  await attempt(row.id as string, channel, recipient, payload, 0);
}

async function attempt(id: string, channel: Channel, recipient: string, payload: OutboxPayload, prior: number): Promise<boolean> {
  const service = createServiceClient();
  try {
    await deliver(channel, recipient, payload);
    await service.from("outbox").update({ status: "sent", attempts: prior + 1, sent_at: new Date().toISOString(), last_error: null }).eq("id", id);
    return true;
  } catch (e) {
    const attempts = prior + 1;
    await service
      .from("outbox")
      .update({ status: attempts >= MAX_ATTEMPTS ? "failed" : "queued", attempts, last_error: String((e as Error).message ?? e).slice(0, 400) })
      .eq("id", id);
    return false;
  }
}

async function customerPrefs(userId: string | null): Promise<{ prefs: NotifyPrefs; lang: Lang }> {
  if (!userId) return { prefs: DEFAULT_PREFS, lang: "bn" };
  const service = createServiceClient();
  const [{ data: u }, { data: p }] = await Promise.all([service.auth.admin.getUserById(userId), service.from("profiles").select("lang").eq("id", userId).maybeSingle()]);
  const meta = (u.user?.user_metadata?.notify ?? {}) as Partial<NotifyPrefs>;
  return { prefs: { ...DEFAULT_PREFS, ...meta }, lang: p?.lang === "en" ? "en" : "bn" };
}

/** Tell the customer about an order event by e-mail / WhatsApp / SMS (honouring their preferences). */
export async function notifyCustomer(orderId: string, event: OrderEvent, extra: { reason?: string } = {}): Promise<void> {
  const service = createServiceClient();
  const { data: o } = await service.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!o || o.channel === "pos") return;
  const [{ prefs, lang }, switches, settings] = await Promise.all([customerPrefs(o.user_id), getChannelSwitches(), getSettings()]);
  const ctx: OrderContext = {
    storeName: settings.store_profile.name,
    name: (o.ship_name as string).split(" ")[0],
    orderNo: o.order_no,
    total: formatINR(o.total),
    paymentMethod: o.payment_method,
    fulfillment: o.fulfillment,
    pickupOtp: o.pickup_otp,
    courier: o.courier_name,
    awb: o.awb,
    trackingUrl: o.tracking_url,
    url: `${publicEnv.siteUrl}/account/orders/${o.id}`,
    reason: extra.reason ?? o.cancel_reason,
  };
  const r = renderOrderMessage(event, lang, ctx);
  const base = { event, order_id: orderId };
  const phone = toIndianMsisdn(o.ship_phone);

  for (const channel of EVENT_CHANNELS[event]) {
    if (!prefs[channel]) continue;
    if (channel === "email" && o.customer_email) await enqueue("email", o.customer_email, `order_${event}`, { ...base, subject: r.subject, text: r.text, html: r.html }, switches);
    if (channel === "whatsapp" && phone) await enqueue("whatsapp", phone, `order_${event}`, { ...base, wa: [ctx.name, ctx.orderNo, r.message, ctx.url] }, switches);
    if (channel === "sms" && phone) await enqueue("sms", phone, `order_${event}`, { ...base, sms: [ctx.orderNo, r.short, ctx.url.replace(/^https?:\/\//, "")] }, switches);
  }
}

/** Alert the shop owner (new order, payment to verify, low stock) on the owner's e-mail / WhatsApp. */
export async function notifyOwner(event: OwnerEvent, data: Omit<OwnerContext, "storeName" | "url"> & { path?: string }): Promise<void> {
  const [switches, settings] = await Promise.all([getChannelSwitches(), getSettings()]);
  const s = settings.store_profile;
  const ctx: OwnerContext = { ...data, storeName: s.name, url: `${publicEnv.siteUrl}${data.path ?? "/admin/orders"}` };
  const r: Rendered = renderOwnerMessage(event, ctx, "bn");
  const base = { event };
  if (s.email) await enqueue("email", s.email, `owner_${event}`, { ...base, subject: r.subject, text: r.text, html: r.html }, switches);
  const wa = toIndianMsisdn(s.whatsapp || s.phone);
  if (wa) await enqueue("whatsapp", wa, `owner_${event}`, { ...base, wa: [s.name, ctx.orderNo ?? "-", r.message, ctx.url] }, switches);
}

/** Retry queued messages (used by the cron route and the admin "Retry" button). */
export async function processQueue(limit = 40): Promise<{ sent: number; failed: number; skipped: number }> {
  const service = createServiceClient();
  const { data } = await service.from("outbox").select("id, channel, recipient, payload, attempts").eq("status", "queued").lt("attempts", MAX_ATTEMPTS).order("created_at").limit(limit);
  let sent = 0;
  let failed = 0;
  let skipped = 0;
  for (const row of data ?? []) {
    const channel = row.channel as Channel;
    if (!isConfigured(channel)) {
      await service.from("outbox").update({ status: "skipped", last_error: "provider not configured" }).eq("id", row.id);
      skipped++;
      continue;
    }
    (await attempt(row.id as string, channel, row.recipient as string, row.payload as OutboxPayload, row.attempts as number)) ? sent++ : failed++;
  }
  return { sent, failed, skipped };
}

/** Sends a test message to one address/number so the owner can verify a provider. */
export async function sendTest(channel: Channel, to: string): Promise<void> {
  if (!isConfigured(channel)) throw new Error("PROVIDER_NOT_CONFIGURED");
  if (channel === "email") return sendEmail({ to, subject: "mmbookhouse test message", text: "This is a test notification from mmbookhouse.", html: "<p>This is a test notification from <b>mmbookhouse</b>.</p>" });
  const msisdn = toIndianMsisdn(to);
  if (!msisdn) throw new Error("PHONE_INVALID");
  if (channel === "whatsapp") return sendWhatsApp(msisdn, ["Test", "MMB-TEST", "This is a test notification.", publicEnv.siteUrl]);
  return sendSms(msisdn, ["MMB-TEST", "test", publicEnv.siteUrl.replace(/^https?:\/\//, "")]);
}

/** Everything that should happen right after a customer places an order. */
export async function notifyOrderPlaced(orderId: string): Promise<void> {
  const service = createServiceClient();
  await notifyCustomer(orderId, "placed");
  const { data: o } = await service.from("orders").select("order_no, total, ship_name, channel").eq("id", orderId).maybeSingle();
  if (!o) return;
  await notifyOwner("new_order", { orderNo: o.order_no, total: formatINR(o.total), customer: o.ship_name, path: `/admin/orders/${orderId}` });

  // Low-stock alert when this order pushed a book down to (or below) its alert level.
  const { data: items } = await service.from("order_items").select("book_id, qty, title").eq("order_id", orderId);
  for (const it of items ?? []) {
    if (!it.book_id) continue;
    const { data: inv } = await service.from("inventory").select("on_hand, low_stock_threshold").eq("book_id", it.book_id).maybeSingle();
    if (inv && inv.on_hand <= inv.low_stock_threshold && inv.on_hand + (it.qty as number) > inv.low_stock_threshold) {
      await notifyOwner("low_stock", { bookTitle: it.title as string, onHand: inv.on_hand as number, path: `/admin/books/${it.book_id}` });
    }
  }
}

export async function notifyPaymentSubmitted(orderId: string): Promise<void> {
  const { data: o } = await createServiceClient().from("orders").select("order_no, total").eq("id", orderId).maybeSingle();
  if (o) await notifyOwner("payment_to_verify", { orderNo: o.order_no, total: formatINR(o.total), path: `/admin/orders/${orderId}` });
}

/** Order status -> customer event (statuses that need no message return null). */
export function eventForStatus(status: string): OrderEvent | null {
  return ({ confirmed: "confirmed", ready: "ready", dispatched: "dispatched", delivered: "delivered", cancelled: "cancelled", returned: "returned" } as Record<string, OrderEvent>)[status] ?? null;
}
