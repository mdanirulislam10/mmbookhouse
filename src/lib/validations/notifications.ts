import { z } from 'zod';

/**
 * Module 18: Notification Validations
 * Validates notification payloads, preferences, and webhook signatures.
 */

// E.164 Phone format for India (+91 followed by 10 digits starting with 6, 7, 8, or 9)
export const e164PhoneSchema = z
  .string()
  .trim()
  .regex(/^\+91[6-9]\d{9}$/, {
    message: 'ফোন নম্বরটি অবশ্যই সঠিক ভারতীয় E.164 ফরম্যাটে হতে হবে (যেমন: +919832000000)',
  });

// Accepts raw input for sanitization testing (10 digits, with optional leading 0 or +91)
export const rawPhoneInputSchema = z
  .string()
  .trim()
  .transform((val) => val.replace(/[\s\-\(\)]/g, ''))
  .refine((val) => /^(\+?91|0)?[6-9]\d{9}$/.test(val), {
    message: 'অবৈধ মোবাইল নম্বর। অনুগ্রহ করে সঠিক ১০ সংখ্যার ভারতীয় নম্বর প্রদান করুন।',
  });

export const whatsAppButtonSchema = z.object({
  type: z.enum(['url', 'quick_reply']),
  label: z.string().min(1).max(25, 'বাটনের টেক্সট সর্বোচ্চ ২৫ অক্ষরের হতে পারে'),
  url: z.string().url('সঠিক ওয়েব লিংক প্রদান করুন').optional(),
  payload: z.string().max(128, 'পে-লোড সর্বোচ্চ ১২৮ অক্ষরের হতে পারে').optional(),
}).refine((btn) => {
  if (btn.type === 'url') return !!btn.url;
  if (btn.type === 'quick_reply') return !!btn.payload;
  return true;
}, {
  message: 'বাটনের ধরনের উপর ভিত্তি করে URL অথবা Payload আবশ্যক',
});

export const notificationTriggerSchema = z.enum([
  'order_confirmed',
  'cod_verification',
  'order_packed',
  'order_shipped',
  'out_for_delivery',
  'order_delivered',
  'delivery_attempted',
  'order_cancelled_refund',
  'review_request',
  'abandoned_cart',
]);

export const sendNotificationPayloadSchema = z.object({
  id: z.string().optional(),
  user_id: z.string().optional(),
  recipient_name: z.string().min(1, 'প্রাপকের নাম আবশ্যক').max(100),
  phone_number: e164PhoneSchema,
  email: z.string().email('সঠিক ইমেইল দিন').optional(),
  order_id: z.string().optional(),
  trigger: notificationTriggerSchema,
  template_name: z.string().min(1, 'টেমপ্লেট নাম আবশ্যক'),
  variables: z.record(z.string(), z.union([z.string(), z.number()])),
  buttons: z.array(whatsAppButtonSchema).max(3, 'সর্বোচ্চ ৩টি বাটন অনুমোদিত').optional(),
  media_url: z.string().url('সঠিক মিডিয়া URL দিন').optional(),
  media_type: z.enum(['document', 'image']).optional(),
  filename: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const customerNotificationPreferenceSchema = z.object({
  user_id: z.string().min(1, 'ইউজার আইডি আবশ্যক'),
  whatsapp_enabled: z.boolean().default(true),
  sms_enabled: z.boolean().default(true),
  email_enabled: z.boolean().default(true),
  promotions_opt_in: z.boolean().default(false),
});

export const optOutRequestSchema = z.object({
  phone_number: z.string().min(10, 'ফোন নম্বর আবশ্যক'),
  keyword: z.enum(['STOP', 'UNSUBSCRIBE', 'থামুন', 'বন্ধ']),
  channel: z.enum(['whatsapp', 'sms', 'all']).default('all'),
});

export const metaWebhookPayloadSchema = z.object({
  object: z.string(),
  entry: z.array(
    z.object({
      id: z.string(),
      changes: z.array(
        z.object({
          value: z.object({
            messaging_product: z.string().optional(),
            metadata: z.object({
              display_phone_number: z.string().optional(),
              phone_number_id: z.string().optional(),
            }).optional(),
            contacts: z.array(z.any()).optional(),
            messages: z.array(
              z.object({
                from: z.string(),
                id: z.string(),
                timestamp: z.string(),
                type: z.string(),
                text: z.object({ body: z.string() }).optional(),
                button: z.object({ payload: z.string(), text: z.string() }).optional(),
                interactive: z.object({
                  type: z.string(),
                  button_reply: z.object({ id: z.string(), title: z.string() }).optional(),
                }).optional(),
              })
            ).optional(),
            statuses: z.array(
              z.object({
                id: z.string(),
                status: z.enum(['sent', 'delivered', 'read', 'failed']),
                timestamp: z.string(),
                recipient_id: z.string(),
                errors: z.array(z.any()).optional(),
              })
            ).optional(),
          }),
          field: z.string(),
        })
      ),
    })
  ),
});
