import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderOrderMessage, renderOwnerMessage, EVENT_CHANNELS, type OrderContext } from "@/lib/notify/templates";
import { sendEmail, sendSms, sendWhatsApp, toIndianMsisdn } from "@/lib/notify/providers";
import { emailProvider, providerStatus } from "@/lib/notify/config";

const ctx: OrderContext = {
  storeName: "mmbookhouse",
  name: "Alice",
  orderNo: "MMB-2609-01001",
  total: "₹450",
  paymentMethod: "cod",
  fulfillment: "delivery",
  courier: "India Post",
  awb: "EE123456789IN",
  url: "https://mmbookhouse.vercel.app/account/orders/abc",
};

describe("phone numbers", () => {
  it("normalises Indian mobile numbers and rejects junk", () => {
    expect(toIndianMsisdn("+91 98765-43210")).toBe("919876543210");
    expect(toIndianMsisdn("098765 43210")).toBe("919876543210");
    expect(toIndianMsisdn("9733196010")).toBe("919733196010");
    expect(toIndianMsisdn("12345")).toBeNull();
    expect(toIndianMsisdn("5876543210")).toBeNull();
    expect(toIndianMsisdn(null)).toBeNull();
  });
});

describe("templates", () => {
  it("renders every event in both languages with the order number and link", () => {
    for (const event of Object.keys(EVENT_CHANNELS) as (keyof typeof EVENT_CHANNELS)[]) {
      for (const lang of ["bn", "en"] as const) {
        const r = renderOrderMessage(event, lang, ctx);
        expect(r.subject).toContain(ctx.orderNo);
        expect(r.message).toContain(ctx.orderNo);
        expect(r.text).toContain(ctx.url);
        expect(r.html).toContain(ctx.url);
        expect(r.short.length).toBeGreaterThan(0);
      }
    }
  });

  it("includes the courier and tracking number when shipped, the code when ready for pickup", () => {
    expect(renderOrderMessage("dispatched", "en", ctx).message).toMatch(/India Post.*EE123456789IN/);
    const pick = renderOrderMessage("ready", "bn", { ...ctx, fulfillment: "pickup", pickupOtp: "4821" });
    expect(pick.message).toContain("4821");
  });

  it("tells UPI customers to pay and COD customers to pay cash", () => {
    expect(renderOrderMessage("placed", "en", { ...ctx, paymentMethod: "upi" }).message).toMatch(/UPI/);
    expect(renderOrderMessage("placed", "en", ctx).message).toMatch(/cash/i);
  });

  it("escapes HTML in customer-controlled text", () => {
    const r = renderOrderMessage("cancelled", "en", { ...ctx, name: "<script>x</script>", reason: "\"><img src=x>" });
    expect(r.html).not.toContain("<script>");
    expect(r.html).not.toContain("<img src=x>");
  });

  it("renders owner alerts", () => {
    const c = { storeName: "mmbookhouse", orderNo: "MMB-1", total: "₹100", customer: "Ali", url: "https://x/admin", bookTitle: "Feluda", onHand: 2 };
    expect(renderOwnerMessage("new_order", c, "en").message).toContain("MMB-1");
    expect(renderOwnerMessage("low_stock", c, "en").message).toContain("Feluda");
    expect(renderOwnerMessage("payment_to_verify", c, "bn").message).toContain("MMB-1");
  });
});

describe("provider requests", () => {
  const calls: { url: string; init: RequestInit }[] = [];
  beforeEach(() => {
    calls.length = 0;
    vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(JSON.stringify({ return: true }), { status: 200 });
    });
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("EMAIL_FROM", "shop <orders@example.com>");
    vi.stubEnv("WHATSAPP_TOKEN", "wa_token");
    vi.stubEnv("WHATSAPP_PHONE_NUMBER_ID", "12345");
    vi.stubEnv("WHATSAPP_TEMPLATE_NAME", "mm_order_update");
    vi.stubEnv("FAST2SMS_API_KEY", "sms_key");
    vi.stubEnv("FAST2SMS_SENDER_ID", "MMBHSE");
    vi.stubEnv("FAST2SMS_DLT_TEMPLATE_ID", "1707");
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("sends e-mail through Resend", async () => {
    expect(emailProvider()).toBe("resend");
    await sendEmail({ to: "a@b.com", subject: "S", text: "T", html: "<p>H</p>" });
    expect(calls[0].url).toBe("https://api.resend.com/emails");
    expect((calls[0].init.headers as Record<string, string>).Authorization).toBe("Bearer re_test");
    expect(JSON.parse(calls[0].init.body as string)).toMatchObject({ to: ["a@b.com"], subject: "S" });
  });

  it("sends a WhatsApp template with 4 body variables", async () => {
    await sendWhatsApp("919733196010", ["Alice", "MMB-1", "Shipped", "https://x/o/1"]);
    expect(calls[0].url).toBe("https://graph.facebook.com/v21.0/12345/messages");
    const body = JSON.parse(calls[0].init.body as string);
    expect(body.to).toBe("919733196010");
    expect(body.template.name).toBe("mm_order_update");
    expect(body.template.components[0].parameters.map((p: { text: string }) => p.text)).toEqual(["Alice", "MMB-1", "Shipped", "https://x/o/1"]);
  });

  it("sends SMS through the Fast2SMS DLT route with pipe-separated variables", async () => {
    await sendSms("919733196010", ["MMB-1", "shipped", "site/o/1"]);
    const body = JSON.parse(calls[0].init.body as string);
    expect(calls[0].url).toBe("https://www.fast2sms.com/dev/bulkV2");
    expect(body).toMatchObject({ route: "dlt", sender_id: "MMBHSE", message: "1707", numbers: "9733196010", variables_values: "MMB-1|shipped|site/o/1" });
  });

  it("surfaces provider errors", async () => {
    vi.stubGlobal("fetch", async () => new Response("bad token", { status: 401 }));
    await expect(sendWhatsApp("919733196010", ["a", "b", "c", "d"])).rejects.toThrow(/WhatsApp 401/);
    await expect(sendEmail({ to: "a@b.com", subject: "S", text: "T", html: "H" })).rejects.toThrow(/Resend 401/);
  });

  it("reports which providers are configured", () => {
    const s = Object.fromEntries(providerStatus().map((p) => [p.channel, p.configured]));
    expect(s).toEqual({ email: true, whatsapp: true, sms: true });
    vi.stubEnv("WHATSAPP_TOKEN", "");
    expect(providerStatus().find((p) => p.channel === "whatsapp")).toMatchObject({ configured: false, missing: ["WHATSAPP_TOKEN"] });
  });
});
