/** Which notification providers are configured through environment variables (no secrets exposed). */
export type Channel = "email" | "whatsapp" | "sms";

export interface ProviderStatus {
  channel: Channel;
  configured: boolean;
  provider: string;
  missing: string[];
}

const env = (k: string) => (process.env[k] ?? "").trim();

export function emailProvider(): "resend" | "smtp" | null {
  if (env("RESEND_API_KEY") && env("EMAIL_FROM")) return "resend";
  if (env("SMTP_HOST") && env("SMTP_USER") && env("SMTP_PASS") && env("EMAIL_FROM")) return "smtp";
  return null;
}

export function providerStatus(): ProviderStatus[] {
  const missing = (keys: string[]) => keys.filter((k) => !env(k));
  const ep = emailProvider();
  const wa = missing(["WHATSAPP_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_TEMPLATE_NAME"]);
  const sms = missing(["FAST2SMS_API_KEY", "FAST2SMS_SENDER_ID", "FAST2SMS_DLT_TEMPLATE_ID"]);
  return [
    {
      channel: "email",
      configured: ep !== null,
      provider: ep === "resend" ? "Resend" : ep === "smtp" ? "SMTP" : "Resend / SMTP",
      missing: ep ? [] : ["EMAIL_FROM + (RESEND_API_KEY | SMTP_HOST, SMTP_USER, SMTP_PASS)"],
    },
    { channel: "whatsapp", configured: wa.length === 0, provider: "WhatsApp Cloud API", missing: wa },
    { channel: "sms", configured: sms.length === 0, provider: "Fast2SMS (DLT)", missing: sms },
  ];
}

export function isConfigured(channel: Channel): boolean {
  return providerStatus().find((p) => p.channel === channel)?.configured ?? false;
}

export const MAX_ATTEMPTS = 3;
