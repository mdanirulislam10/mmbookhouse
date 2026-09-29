import nodemailer from "nodemailer";
import { emailProvider } from "./config";

const env = (k: string) => (process.env[k] ?? "").trim();
const TIMEOUT = 12_000;

/** "+91 98765-43210", "098765 43210" … -> "919876543210" (India). Returns null if not a valid mobile number. */
export function toIndianMsisdn(input: string | null | undefined): string | null {
  const digits = (input ?? "").replace(/\D/g, "");
  const national = digits.length > 10 ? digits.slice(-10) : digits;
  return /^[6-9]\d{9}$/.test(national) ? `91${national}` : null;
}

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendEmail(m: EmailMessage): Promise<void> {
  const from = env("EMAIL_FROM");
  const provider = emailProvider();
  if (provider === "resend") {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env("RESEND_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [m.to], subject: m.subject, html: m.html, text: m.text }),
      signal: AbortSignal.timeout(TIMEOUT),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return;
  }
  if (provider === "smtp") {
    const port = Number(env("SMTP_PORT") || 587);
    const transport = nodemailer.createTransport({
      host: env("SMTP_HOST"),
      port,
      secure: env("SMTP_SECURE") ? env("SMTP_SECURE") === "true" : port === 465,
      auth: { user: env("SMTP_USER"), pass: env("SMTP_PASS") },
      connectionTimeout: TIMEOUT,
      socketTimeout: TIMEOUT,
    });
    await transport.sendMail({ from, to: m.to, subject: m.subject, text: m.text, html: m.html });
    return;
  }
  throw new Error("Email provider is not configured");
}

/**
 * WhatsApp Cloud API template message. Business-initiated messages must use an approved template
 * whose body has 4 variables: {{1}} name, {{2}} order number, {{3}} message, {{4}} link.
 */
export async function sendWhatsApp(toMsisdn: string, params: string[]): Promise<void> {
  const res = await fetch(`https://graph.facebook.com/v21.0/${env("WHATSAPP_PHONE_NUMBER_ID")}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env("WHATSAPP_TOKEN")}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: toMsisdn,
      type: "template",
      template: {
        name: env("WHATSAPP_TEMPLATE_NAME"),
        language: { code: env("WHATSAPP_TEMPLATE_LANG") || "en" },
        components: [{ type: "body", parameters: params.map((text) => ({ type: "text", text: text.slice(0, 900) })) }],
      },
    }),
    signal: AbortSignal.timeout(TIMEOUT),
  });
  if (!res.ok) throw new Error(`WhatsApp ${res.status}: ${(await res.text()).slice(0, 240)}`);
}

/**
 * Fast2SMS DLT route. The DLT-approved template must have 3 variables:
 * e.g. "Order {#var#} update: {#var#}. Details: {#var#} -mmbookhouse".
 */
export async function sendSms(toMsisdn: string, vars: [string, string, string]): Promise<void> {
  const number = toMsisdn.slice(-10);
  const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
    method: "POST",
    headers: { authorization: env("FAST2SMS_API_KEY"), "Content-Type": "application/json" },
    body: JSON.stringify({
      route: "dlt",
      sender_id: env("FAST2SMS_SENDER_ID"),
      message: env("FAST2SMS_DLT_TEMPLATE_ID"),
      variables_values: vars.map((v) => v.replace(/\|/g, "/")).join("|"),
      numbers: number,
      flash: 0,
    }),
    signal: AbortSignal.timeout(TIMEOUT),
  });
  const body = (await res.json().catch(() => ({}))) as { return?: boolean; message?: string | string[] };
  if (!res.ok || body.return === false) throw new Error(`SMS ${res.status}: ${JSON.stringify(body.message ?? body).slice(0, 200)}`);
}
