import {
  NotificationPayload,
  NotificationLog,
  NotificationStatus,
  NotificationDispatchResult,
} from '../../types/notifications';
import { defaultCascadeEngine, CascadeNotificationEngine } from './notificationProviderService';
import { sanitizePhoneNumberE164, maskPhoneNumber } from './notificationTemplateService';

/**
 * Module 18: Notification Queue & Background Dispatcher
 * 
 * Complies with:
 * - Item 31: Decoupled Non-blocking Notification Queue
 * - Item 32: Notification Logs Tracker
 * - Item 37: Admin Instant WhatsApp Alert Bot
 * - Item 39: Zero Client Latency Decoupling
 * - Item 42: Dispatch Latency Measurement
 * - Item 49: Idempotency Protection against duplicate sends
 */

export interface QueueJob {
  job_id: string;
  idempotency_key: string;
  payload: NotificationPayload;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  created_at: string;
  dispatch_result?: NotificationDispatchResult;
  latency_ms?: number;
}

export class NotificationQueueService {
  private queue: QueueJob[] = [];
  private logs: NotificationLog[] = [];
  private idempotencyStore: Map<string, { job_id: string; timestamp: number; result?: NotificationDispatchResult }> = new Map();
  private engine: CascadeNotificationEngine;
  private isProcessing = false;
  private adminPhone: string;

  constructor(engine = defaultCascadeEngine, adminPhone = '+919832000000') {
    this.engine = engine;
    this.adminPhone = adminPhone;
  }

  /**
   * Enqueue a notification job. Returns immediately with job_id (zero client blocking).
   */
  public enqueueNotification(
    payload: NotificationPayload,
    idempotencyKey?: string
  ): { job_id: string; status: 'queued' | 'duplicate_skipped'; result?: NotificationDispatchResult } {
    const key = idempotencyKey || `${payload.order_id || 'no_ord'}_${payload.trigger}_${payload.phone_number}`;
    const now = Date.now();

    // Idempotency check: Ignore duplicate trigger within 5 minutes (300,000 ms)
    const existing = this.idempotencyStore.get(key);
    if (existing && now - existing.timestamp < 300000) {
      return {
        job_id: existing.job_id,
        status: 'duplicate_skipped',
        result: existing.result,
      };
    }

    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const job: QueueJob = {
      job_id: jobId,
      idempotency_key: key,
      payload,
      status: 'queued',
      created_at: new Date().toISOString(),
    };

    this.queue.push(job);
    this.idempotencyStore.set(key, { job_id: jobId, timestamp: now });

    // Trigger non-blocking asynchronous processing
    setTimeout(() => {
      this.processQueue().catch((err) => {
        console.error('Queue worker error:', err);
      });
    }, 0);

    return {
      job_id: jobId,
      status: 'queued',
    };
  }

  /**
   * Admin WhatsApp Bot Alert: Instant alert when new order is placed
   */
  public sendAdminNewOrderAlert(orderData: {
    order_id: string;
    customer_name: string;
    total_amount: number | string;
    item_count: number;
    payment_mode: string;
    delivery_address?: string;
  }): { job_id: string; status: string } {
    const adminPayload: NotificationPayload = {
      recipient_name: 'M.M Book House Admin',
      phone_number: this.adminPhone,
      trigger: 'order_confirmed',
      template_name: 'admin_order_alert_bn',
      order_id: orderData.order_id,
      variables: {
        customer_name: orderData.customer_name,
        order_id: orderData.order_id,
        total_amount: String(orderData.total_amount),
        item_count: orderData.item_count,
        payment_mode: orderData.payment_mode,
        delivery_address: orderData.delivery_address || 'মালদা শপ সংগ্রহ / হোম ডেলিভারি',
      },
      buttons: [
        {
          type: 'url',
          label: 'অ্যাডমিনে দেখুন',
          url: `https://mmbook.in/admin/orders/${orderData.order_id}`,
        },
      ],
      metadata: { isAdminAlert: true },
    };

    return this.enqueueNotification(adminPayload, `admin_alert_${orderData.order_id}`);
  }

  /**
   * Worker processor: drains the queue
   */
  public async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (this.queue.length > 0) {
        const job = this.queue.shift();
        if (!job) break;

        job.status = 'processing';
        const startTime = Date.now();

        const dispatchResult = await this.engine.dispatchWithCascade(job.payload);
        const latencyMs = Date.now() - startTime;

        job.dispatch_result = dispatchResult;
        job.latency_ms = latencyMs;
        job.status = dispatchResult.success ? 'completed' : 'failed';

        // Update idempotency store with final result
        const existingKey = this.idempotencyStore.get(job.idempotency_key);
        if (existingKey) {
          existingKey.result = dispatchResult;
        }

        // Record persistent log
        const logStatus: NotificationStatus = dispatchResult.success
          ? dispatchResult.fallback_triggered
            ? 'fallback_sms'
            : 'sent'
          : 'failed';

        const newLog: NotificationLog = {
          id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          user_id: job.payload.user_id,
          order_id: job.payload.order_id,
          channel: dispatchResult.actual_channel,
          trigger: job.payload.trigger,
          recipient_phone: sanitizePhoneNumberE164(job.payload.phone_number).formatted,
          template_name: job.payload.template_name,
          rendered_message: dispatchResult.rendered_message,
          status: logStatus,
          gateway_message_id: dispatchResult.message_id,
          cost_estimate_inr: dispatchResult.cost_inr,
          error_message: dispatchResult.error,
          sent_at: dispatchResult.success ? new Date().toISOString() : undefined,
          created_at: job.created_at,
        };

        this.logs.unshift(newLog); // latest first
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Synchronously drain all queued items (primarily for tests)
   */
  public async drainQueue(): Promise<void> {
    await this.processQueue();
  }

  /**
   * Query logs with multi-field filters
   */
  public getLogs(filters?: {
    order_id?: string;
    user_id?: string;
    channel?: string;
    status?: NotificationStatus;
    limit?: number;
  }): NotificationLog[] {
    let result = [...this.logs];

    if (filters?.order_id) {
      result = result.filter((l) => l.order_id === filters.order_id);
    }
    if (filters?.user_id) {
      result = result.filter((l) => l.user_id === filters.user_id);
    }
    if (filters?.channel) {
      result = result.filter((l) => l.channel === filters.channel);
    }
    if (filters?.status) {
      result = result.filter((l) => l.status === filters.status);
    }
    if (filters?.limit) {
      result = result.slice(0, filters.limit);
    }

    return result;
  }

  /**
   * Update status based on webhook delivery receipt (e.g. delivered, read, failed)
   */
  public updateStatusByMessageId(
    messageId: string,
    newStatus: NotificationStatus,
    timestamp = new Date().toISOString()
  ): boolean {
    const log = this.logs.find((l) => l.gateway_message_id === messageId);
    if (!log) return false;

    log.status = newStatus;
    if (newStatus === 'delivered') {
      log.delivered_at = timestamp;
    } else if (newStatus === 'read') {
      log.read_at = timestamp;
      if (!log.delivered_at) log.delivered_at = timestamp;
    }
    return true;
  }

  public getAdminPhone(): string {
    return this.adminPhone;
  }

  public clearAll() {
    this.queue = [];
    this.logs = [];
    this.idempotencyStore.clear();
  }
}

export const defaultQueueService = new NotificationQueueService();
