/**
 * Module 18: Automated SMS & WhatsApp Transactional Notifications Types
 * M.M Book House Malda - E-Commerce Platform
 * 
 * Implements architectural specifications from proposed_modules.md:
 * - Item 2: WhatsApp first, DLT SMS fallback cascade
 * - Item 3: Meta Cloud WhatsApp Business API integration
 * - Item 4: TRAI DLT Compliant SMS (Header MMBOOK)
 * - Item 5: Interactive Quick Reply & CTA buttons
 * - Item 10: E.164 Phone format
 * - Items 11-20: 10 Transactional notification triggers
 * - Item 32: Notification logs database entity
 * - Item 40: Customer notification preferences
 * - Item 48: INotificationProvider abstract interface
 */

export type NotificationChannel = 'whatsapp' | 'sms' | 'email' | 'web_push';

export type NotificationTrigger =
  | 'order_confirmed'
  | 'cod_verification'
  | 'order_packed'
  | 'order_shipped'
  | 'out_for_delivery'
  | 'order_delivered'
  | 'delivery_attempted'
  | 'order_cancelled_refund'
  | 'review_request'
  | 'abandoned_cart';

export type NotificationStatus =
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed'
  | 'fallback_sms';

export interface WhatsAppButton {
  type: 'url' | 'quick_reply';
  label: string;
  url?: string;
  payload?: string;
}

export interface NotificationPayload {
  id?: string;
  user_id?: string;
  recipient_name: string;
  phone_number: string; // E.164 formatted (e.g. +919832000000)
  email?: string;
  order_id?: string;
  trigger: NotificationTrigger;
  template_name: string;
  variables: Record<string, string | number>;
  buttons?: WhatsAppButton[];
  media_url?: string; // PDF Invoice or book thumbnail
  media_type?: 'document' | 'image';
  filename?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationLog {
  id: string;
  user_id?: string;
  order_id?: string;
  channel: NotificationChannel;
  trigger: NotificationTrigger;
  recipient_phone: string;
  template_name: string;
  rendered_message: string;
  status: NotificationStatus;
  gateway_message_id?: string;
  cost_estimate_inr: number;
  error_message?: string;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  created_at: string;
}

export interface CustomerNotificationPreference {
  user_id: string;
  whatsapp_enabled: boolean;
  sms_enabled: boolean;
  email_enabled: boolean;
  promotions_opt_in: boolean;
  updated_at: string;
}

export interface NotificationDispatchResult {
  success: boolean;
  primary_channel: NotificationChannel;
  actual_channel: NotificationChannel;
  fallback_triggered: boolean;
  message_id?: string;
  cost_inr: number;
  rendered_message: string;
  error?: string;
}

export interface INotificationProvider {
  name: string;
  channel: NotificationChannel;
  send(payload: NotificationPayload): Promise<{
    success: boolean;
    message_id?: string;
    cost_inr: number;
    error?: string;
  }>;
}

export interface MetaWebhookStatusUpdate {
  message_id: string;
  recipient_id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  error?: {
    code: number;
    title: string;
    message: string;
  };
}

export interface MetaWebhookInboundMessage {
  from: string;
  message_id: string;
  timestamp: string;
  type: 'text' | 'button' | 'interactive';
  text?: {
    body: string;
  };
  button?: {
    text: string;
    payload: string;
  };
}
