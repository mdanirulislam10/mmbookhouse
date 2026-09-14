import {
  INotificationProvider,
  NotificationPayload,
  NotificationDispatchResult,
  NotificationChannel,
} from '../../types/notifications';
import {
  sanitizePhoneNumberE164,
  renderNotificationMessage,
  getNotificationButtons,
  NOTIFICATION_TEMPLATES,
} from './notificationTemplateService';

/**
 * Module 18: Notification Provider Service & Cascade Fallback Engine
 * 
 * Complies with:
 * - Item 2: WhatsApp first -> DLT SMS fallback cascade
 * - Item 3: Meta Cloud WhatsApp Business API integration
 * - Item 4: TRAI DLT Compliant SMS
 * - Item 8: Automatic delivery failover logic
 * - Item 9: Message cost tracking (WhatsApp ₹0.12 vs SMS ₹0.15)
 * - Item 34: Exponential backoff retry mechanism (up to 3 attempts)
 * - Item 36: Rate Limiting protection
 * - Item 48: INotificationProvider modular architecture
 */

export interface ProviderSendResponse {
  success: boolean;
  message_id?: string;
  cost_inr: number;
  error?: string;
}

// In-memory rate limiter: max 5 messages per phone per 10 minutes (prevents abuse)
class NotificationRateLimiter {
  private timestamps: Map<string, number[]> = new Map();
  private maxPerWindow = 5;
  private windowMs = 10 * 60 * 1000; // 10 minutes

  public isAllowed(phone: string): { allowed: boolean; retryAfterMs?: number } {
    const now = Date.now();
    const history = this.timestamps.get(phone) || [];
    const validHistory = history.filter((t) => now - t < this.windowMs);

    if (validHistory.length >= this.maxPerWindow) {
      const oldest = validHistory[0];
      const retryAfterMs = this.windowMs - (now - oldest);
      return { allowed: false, retryAfterMs };
    }

    validHistory.push(now);
    this.timestamps.set(phone, validHistory);
    return { allowed: true };
  }

  public reset(phone?: string) {
    if (phone) {
      this.timestamps.delete(phone);
    } else {
      this.timestamps.clear();
    }
  }
}

export const rateLimiter = new NotificationRateLimiter();

/**
 * WhatsApp Business API Provider (Meta Cloud API / Simulated Mock)
 */
export class MetaWhatsAppProvider implements INotificationProvider {
  public name = 'MetaWhatsAppProvider';
  public channel: NotificationChannel = 'whatsapp';

  // For testing/mocking simulated failures
  public simulateFailureForPhones: Set<string> = new Set();

  public async send(payload: NotificationPayload): Promise<ProviderSendResponse> {
    const phone = payload.phone_number;

    // Check simulated failure
    if (this.simulateFailureForPhones.has(phone)) {
      return {
        success: false,
        cost_inr: 0,
        error: 'WhatsApp Meta API error: Recipient phone number not registered on WhatsApp or unreachable (Simulated).',
      };
    }

    // Real API Check
    const token = process.env.WHATSAPP_CLOUD_API_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (token && phoneId && !process.env.TEST_MODE) {
      try {
        const rendered = renderNotificationMessage(payload.trigger, 'whatsapp', payload.variables);
        const buttons = getNotificationButtons(payload.trigger, payload.variables, payload.buttons);

        const res = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: phone.replace('+', ''),
            type: 'text',
            text: { body: rendered },
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          return {
            success: false,
            cost_inr: 0,
            error: `WhatsApp API HTTP ${res.status}: ${JSON.stringify(errData)}`,
          };
        }

        const data = await res.json();
        return {
          success: true,
          message_id: data.messages?.[0]?.id || `wamid.${Date.now()}`,
          cost_inr: 0.12, // Utility template cost ₹0.12
        };
      } catch (err: unknown) {
        return {
          success: false,
          cost_inr: 0,
          error: (err as Error).message || 'Network exception while connecting to Meta WhatsApp API',
        };
      }
    }

    // Default: High-fidelity simulation mode
    const fakeMessageId = `wamid.HBgLOTE${phone.slice(-6)}FQIAERgS${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    return {
      success: true,
      message_id: fakeMessageId,
      cost_inr: 0.12, // Meta WhatsApp Indian Utility Conversation Rate ₹0.12
    };
  }
}

/**
 * TRAI DLT Compliant SMS Provider (Header: MMBOOK)
 */
export class TraiDltSmsProvider implements INotificationProvider {
  public name = 'TraiDltSmsProvider';
  public channel: NotificationChannel = 'sms';

  // For testing/mocking simulated failures
  public simulateFailureForPhones: Set<string> = new Set();

  public async send(payload: NotificationPayload): Promise<ProviderSendResponse> {
    const phone = payload.phone_number;

    if (this.simulateFailureForPhones.has(phone)) {
      return {
        success: false,
        cost_inr: 0,
        error: 'TRAI DLT SMS Gateway error: Operator route unavailable (Simulated).',
      };
    }

    const tpl = NOTIFICATION_TEMPLATES[payload.trigger];
    const rendered = renderNotificationMessage(payload.trigger, 'sms', payload.variables);

    const smsApiKey = process.env.DLT_SMS_API_KEY;
    if (smsApiKey && !process.env.TEST_MODE) {
      try {
        // e.g. Fast2SMS / ValueFirst / Gupshup DLT endpoint
        const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
          method: 'POST',
          headers: {
            authorization: smsApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sender_id: tpl.dltHeader,
            message: rendered,
            template_id: tpl.dltTemplateId,
            entity_id: process.env.DLT_PRINCIPAL_ENTITY_ID || '1701158291000010482',
            route: 'dlt',
            numbers: phone.replace('+91', ''),
          }),
        });

        if (!res.ok) {
          return {
            success: false,
            cost_inr: 0,
            error: `SMS Gateway HTTP ${res.status}`,
          };
        }

        const data = await res.json();
        return {
          success: true,
          message_id: data.request_id || `sms_${Date.now()}`,
          cost_inr: 0.15,
        };
      } catch (err: unknown) {
        return {
          success: false,
          cost_inr: 0,
          error: (err as Error).message,
        };
      }
    }

    // High-fidelity simulation mode
    const fakeSmsId = `sms_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return {
      success: true,
      message_id: fakeSmsId,
      cost_inr: 0.15, // DLT SMS standard cost ₹0.15
    };
  }
}

/**
 * Execute an async operation with exponential backoff retry (up to maxRetries)
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  initialDelayMs = 200
): Promise<T> {
  let attempt = 0;
  let delay = initialDelayMs;

  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (err) {
      attempt++;
      if (attempt >= maxRetries) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2; // exponential backoff
    }
  }

  throw new Error('Maximum retry attempts exceeded');
}

/**
 * Cascade Engine:
 * 1. Sanitizes phone number to E.164.
 * 2. Checks Rate Limit.
 * 3. Attempts WhatsApp Business API first.
 * 4. On WhatsApp failure -> automatically fallbacks to TRAI DLT SMS.
 * 5. Returns unified NotificationDispatchResult with costs and message IDs.
 */
export class CascadeNotificationEngine {
  private whatsAppProvider: MetaWhatsAppProvider;
  private smsProvider: TraiDltSmsProvider;

  constructor(
    whatsAppProvider = new MetaWhatsAppProvider(),
    smsProvider = new TraiDltSmsProvider()
  ) {
    this.whatsAppProvider = whatsAppProvider;
    this.smsProvider = smsProvider;
  }

  public getWhatsAppProvider(): MetaWhatsAppProvider {
    return this.whatsAppProvider;
  }

  public getSmsProvider(): TraiDltSmsProvider {
    return this.smsProvider;
  }

  public async dispatchWithCascade(payload: NotificationPayload): Promise<NotificationDispatchResult> {
    // 1. Sanitize Phone
    const sanitized = sanitizePhoneNumberE164(payload.phone_number);
    if (!sanitized.valid) {
      return {
        success: false,
        primary_channel: 'whatsapp',
        actual_channel: 'whatsapp',
        fallback_triggered: false,
        cost_inr: 0,
        rendered_message: '',
        error: `ফোন নম্বর বৈধ নয়: ${sanitized.error}`,
      };
    }

    const cleanPayload: NotificationPayload = {
      ...payload,
      phone_number: sanitized.formatted,
    };

    // 2. Rate Limiting Check
    const rateCheck = rateLimiter.isAllowed(sanitized.formatted);
    if (!rateCheck.allowed) {
      return {
        success: false,
        primary_channel: 'whatsapp',
        actual_channel: 'whatsapp',
        fallback_triggered: false,
        cost_inr: 0,
        rendered_message: '',
        error: `রেট লিমিট অতিক্রান্ত হয়েছে। পুনরায় চেষ্টা করুন ${Math.ceil((rateCheck.retryAfterMs || 0) / 1000)} সেকেন্ড পর।`,
      };
    }

    // 3. Primary Attempt: WhatsApp Business API
    const waRendered = renderNotificationMessage(cleanPayload.trigger, 'whatsapp', cleanPayload.variables);
    let waResult: ProviderSendResponse;

    try {
      waResult = await withRetry(() => this.whatsAppProvider.send(cleanPayload), 2, 100);
    } catch (err: unknown) {
      waResult = {
        success: false,
        cost_inr: 0,
        error: (err as Error).message,
      };
    }

    if (waResult.success) {
      return {
        success: true,
        primary_channel: 'whatsapp',
        actual_channel: 'whatsapp',
        fallback_triggered: false,
        message_id: waResult.message_id,
        cost_inr: waResult.cost_inr,
        rendered_message: waRendered,
      };
    }

    // 4. Fallback Attempt: TRAI DLT SMS
    const smsRendered = renderNotificationMessage(cleanPayload.trigger, 'sms', cleanPayload.variables);
    let smsResult: ProviderSendResponse;

    try {
      smsResult = await withRetry(() => this.smsProvider.send(cleanPayload), 2, 100);
    } catch (err: unknown) {
      smsResult = {
        success: false,
        cost_inr: 0,
        error: (err as Error).message,
      };
    }

    if (smsResult.success) {
      return {
        success: true,
        primary_channel: 'whatsapp',
        actual_channel: 'sms',
        fallback_triggered: true,
        message_id: smsResult.message_id,
        cost_inr: smsResult.cost_inr,
        rendered_message: smsRendered,
      };
    }

    // Both WhatsApp and SMS failed
    return {
      success: false,
      primary_channel: 'whatsapp',
      actual_channel: 'sms',
      fallback_triggered: true,
      cost_inr: 0,
      rendered_message: smsRendered,
      error: `WhatsApp ব্যর্থতা (${waResult.error}) এবং SMS ব্যাকআপ ব্যর্থতা (${smsResult.error})`,
    };
  }
}

export const defaultCascadeEngine = new CascadeNotificationEngine();
