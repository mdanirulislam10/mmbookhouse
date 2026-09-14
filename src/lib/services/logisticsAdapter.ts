/**
 * Module 16: 3PL Logistics Adapter & Webhook Normalizer
 * M.M Book House Malda - Unified Courier Integration
 * 
 * Implements architectural specifications from proposed_modules.md:
 * - Item 11: Multi-carrier tracking (Delhivery, Shiprocket, India Post, Local Malda riders)
 * - Item 12: External courier tracking URL generator & deep-linking
 * - Item 14: HMAC-SHA256 signature verification for webhook security
 * - Item 15: Status code normalization into platform standard OrderStatus
 * - Item 16: Tracking milestone event builder & location parser
 * - Item 43: Webhook idempotency deduplication cache preventing replay storms
 */

import crypto from 'crypto';
import { CourierProvider, OrderStatus, TrackingMilestone } from '@/types/tracking';

/**
 * Generates direct external tracking URL for standard carriers
 */
export function getCarrierTrackingUrl(
  carrier: CourierProvider,
  awbOrConsignment: string,
  orderId?: string
): string {
  const code = awbOrConsignment.trim();

  switch (carrier) {
    case 'delhivery':
      return `https://www.delhivery.com/track/package/${encodeURIComponent(code)}`;
    case 'shiprocket':
      return `https://shiprocket.co/tracking/${encodeURIComponent(code)}`;
    case 'india_post':
      return `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx?consignmentNo=${encodeURIComponent(code)}`;
    case 'local_malda':
    default:
      return orderId ? `/account/orders/${orderId}` : `/track?orderId=${encodeURIComponent(code)}`;
  }
}

/**
 * Verifies HMAC-SHA256 signature of an incoming courier webhook payload (Item 14)
 */
export function verifyCourierWebhookSignature(
  payloadString: string,
  providedSignature: string,
  secretKey: string = process.env.COURIER_WEBHOOK_SECRET || 'mmb_default_webhook_secret_malda_2026'
): boolean {
  if (!payloadString || !providedSignature) {
    return false;
  }

  try {
    const computedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(payloadString, 'utf8')
      .digest('hex');

    const cleanProvided = providedSignature.trim().toLowerCase().replace(/^sha256=/, '');
    const cleanComputed = computedSignature.trim().toLowerCase();

    if (cleanProvided.length !== cleanComputed.length) {
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(cleanProvided, 'utf8'),
      Buffer.from(cleanComputed, 'utf8')
    );
  } catch {
    return false;
  }
}

/**
 * Normalizes 3PL carrier specific status string into canonical OrderStatus (Item 15)
 */
export function normalizeCourierStatus(
  carrier: CourierProvider,
  rawStatus: string
): {
  normalizedStatus: OrderStatus;
  statusTitleBn: string;
  statusTitleEn: string;
  descriptionBn: string;
  descriptionEn: string;
} {
  const s = (rawStatus || '').toUpperCase().trim();

  // 1. Delhivery mapping
  if (carrier === 'delhivery') {
    if (s.includes('RTO DELIVERED')) {
      return {
        normalizedStatus: 'rto_delivered',
        statusTitleBn: 'স্টোরে ফেরত এসেছে (RTO)',
        statusTitleEn: 'Returned to Store',
        descriptionBn: 'পার্সেলটি মালদা স্টোরে সফলভাবে ফেরত এসেছে।',
        descriptionEn: 'Package has returned to Malda store origin.',
      };
    }
    if (s.includes('RTO') || s.includes('RETURN TO ORIGIN')) {
      return {
        normalizedStatus: 'rto_initiated',
        statusTitleBn: 'ফেরত পাঠানো শুরু হয়েছে (RTO)',
        statusTitleEn: 'Return to Origin Initiated',
        descriptionBn: 'পার্সেলটি মালদা স্টোরে ফেরত পাঠানোর প্রক্রিয়া শুরু হয়েছে।',
        descriptionEn: 'Return process to origin store has been initiated.',
      };
    }
    if (s.includes('UNDELIVERED') || s.includes('FAILED') || s.includes('ATTEMPT')) {
      return {
        normalizedStatus: 'delivery_attempted',
        statusTitleBn: 'ডেলিভারির চেষ্টা ব্যর্থ হয়েছে',
        statusTitleEn: 'Delivery Attempted',
        descriptionBn: 'ঠিকানা বা ফোন অনুপলব্ধ থাকায় ডেলিভারির চেষ্টা ব্যর্থ হয়েছে। পুনরায় চেষ্টা করা হবে।',
        descriptionEn: 'Delivery was attempted but customer was unavailable. Next attempt scheduled.',
      };
    }
    if (s.includes('OUT FOR DELIVERY') || s.includes('OFD') || s.includes('DISPATCHED FOR DELIVERY')) {
      return {
        normalizedStatus: 'out_for_delivery',
        statusTitleBn: 'ডেলিভারির জন্য বের হয়েছে',
        statusTitleEn: 'Out for Delivery',
        descriptionBn: 'ডেলিভারি রাইডার পার্সেল নিয়ে আপনার ঠিকানায় আসছে।',
        descriptionEn: 'Rider is on the way to deliver your parcel.',
      };
    }
    if (s.includes('DELIVERED') || s.includes('DL')) {
      return {
        normalizedStatus: 'delivered',
        statusTitleBn: 'ডেলিভারি সম্পন্ন',
        statusTitleEn: 'Delivered',
        descriptionBn: 'পার্সেলটি গ্রাহকের হাতে সফলভাবে হস্তান্তর করা হয়েছে।',
        descriptionEn: 'Package has been successfully handed over to recipient.',
      };
    }
    if (s.includes('DELAY') || s.includes('WEATHER') || s.includes('HOLD') || s.includes('MISROUTE')) {
      return {
        normalizedStatus: 'delayed',
        statusTitleBn: 'যাত্রাপথে সাময়িক বিলম্ব',
        statusTitleEn: 'In Transit Delay',
        descriptionBn: 'আবহাওয়া বা লজিস্টিক সমস্যার কারণে পার্সেল পৌঁছাতে কিছুটা বিলম্ব হতে পারে।',
        descriptionEn: 'Unavoidable transit delay due to weather or logistics routing.',
      };
    }
    if (s.includes('LOST') || s.includes('DAMAGED')) {
      return {
        normalizedStatus: 'lost_in_transit',
        statusTitleBn: 'পার্সেল ক্ষতিগ্রস্ত/হারিয়ে গেছে',
        statusTitleEn: 'Lost / Damaged in Transit',
        descriptionBn: 'কুরিয়ার যাত্রাপথে সমস্যা দেখা দেওয়ায় দ্রুত নতুন পার্সেল পাঠানো হচ্ছে।',
        descriptionEn: 'Package lost or damaged in transit. Replacement dispatch in progress.',
      };
    }
    if (s.includes('CANCEL')) {
      return {
        normalizedStatus: 'cancelled_by_seller',
        statusTitleBn: 'অর্ডার বাতিল',
        statusTitleEn: 'Cancelled by Seller',
        descriptionBn: 'শিপমেন্ট বাতিল করা হয়েছে।',
        descriptionEn: 'Shipment was cancelled.',
      };
    }
    // Default Delhivery in-transit
    return {
      normalizedStatus: 'shipped',
      statusTitleBn: 'শিপমেন্ট প্রেরণ করা হয়েছে',
      statusTitleEn: 'Shipped & In Transit',
      descriptionBn: 'পার্সেলটি কুরিয়ার হাবে স্থানান্তর প্রক্রিয়ায় রয়েছে।',
      descriptionEn: 'Parcel has been dispatched and is moving across transit hubs.',
    };
  }

  // 2. Shiprocket mapping
  if (carrier === 'shiprocket') {
    if (s.includes('RTO DELIVERED')) {
      return {
        normalizedStatus: 'rto_delivered',
        statusTitleBn: 'স্টোরে ফেরত এসেছে (RTO)',
        statusTitleEn: 'RTO Delivered',
        descriptionBn: 'পার্সেলটি সফলভাবে বিক্রেতার ঠিকানায় ফেরত এসেছে।',
        descriptionEn: 'Package delivered back to origin seller warehouse.',
      };
    }
    if (s.includes('RTO') || s.includes('RETURN')) {
      return {
        normalizedStatus: 'rto_initiated',
        statusTitleBn: 'রিটার্ন শুরু হয়েছে',
        statusTitleEn: 'RTO Initiated',
        descriptionBn: 'পার্সেলটি ফেরত আসার প্রক্রিয়ায় রয়েছে।',
        descriptionEn: 'Return to origin transit started.',
      };
    }
    if (s.includes('UNDELIVERED') || s.includes('UNAVAILABLE') || s.includes('ATTEMPT')) {
      return {
        normalizedStatus: 'delivery_attempted',
        statusTitleBn: 'ডেলিভারি চেষ্টা সম্পন্ন',
        statusTitleEn: 'Delivery Attempted',
        descriptionBn: 'গ্রাহক অনুপলব্ধ থাকায় পরবর্তী কার্যদিবসে পুনরায় চেষ্টা করা হবে।',
        descriptionEn: 'Recipient unavailable. Re-attempt scheduled for next working day.',
      };
    }
    if (s.includes('OUT FOR DELIVERY') || s.includes('OFD')) {
      return {
        normalizedStatus: 'out_for_delivery',
        statusTitleBn: 'ডেলিভারির জন্য বের হয়েছে',
        statusTitleEn: 'Out for Delivery',
        descriptionBn: 'ডেলিভারি এক্সিকিউটিভ পার্সেল নিয়ে বের হয়েছেন।',
        descriptionEn: 'Delivery executive is out for delivery today.',
      };
    }
    if (s.includes('DELIVERED')) {
      return {
        normalizedStatus: 'delivered',
        statusTitleBn: 'ডেলিভারি সম্পন্ন',
        statusTitleEn: 'Delivered',
        descriptionBn: 'পার্সেলটি গ্রাহকের ঠিকানায় পৌঁছে দেওয়া হয়েছে।',
        descriptionEn: 'Package delivered to the customer address.',
      };
    }
    if (s.includes('LOST')) {
      return {
        normalizedStatus: 'lost_in_transit',
        statusTitleBn: 'যাত্রাপথে নিখোঁজ',
        statusTitleEn: 'Lost in Transit',
        descriptionBn: 'শিপমেন্টটি যাত্রাপথে হারিয়ে গেছে। তদন্ত চলছে।',
        descriptionEn: 'Shipment lost during carrier handling.',
      };
    }
    return {
      normalizedStatus: 'shipped',
      statusTitleBn: 'শিপমেন্ট রওয়ানা হয়েছে',
      statusTitleEn: 'Shipped / In Transit',
      descriptionBn: 'পার্সেলটি শিপিং নেটওয়ার্কে চলছে।',
      descriptionEn: 'Package in transit via Shiprocket logistics.',
    };
  }

  // 3. India Post mapping
  if (carrier === 'india_post') {
    if (s.includes('RETURNED TO SENDER') || s.includes('RTD')) {
      return {
        normalizedStatus: 'rto_delivered',
        statusTitleBn: 'প্রেরকের কাছে ফেরত',
        statusTitleEn: 'Returned to Sender',
        descriptionBn: 'পার্সেলটি মালদা প্রধান ডাকঘরে ফেরত এসেছে।',
        descriptionEn: 'Consignment returned back to origin post office.',
      };
    }
    if (s.includes('RETURN') || s.includes('REDIRECT')) {
      return {
        normalizedStatus: 'rto_initiated',
        statusTitleBn: 'ডাক ফেরত প্রক্রিয়া',
        statusTitleEn: 'Return in Transit',
        descriptionBn: 'ডাকটি ফেরত পাঠানোর প্রক্রিয়ায় রয়েছে।',
        descriptionEn: 'Consignment redirect/return underway.',
      };
    }
    if (s.includes('ATTEMPT') || s.includes('LOCKED') || s.includes('ABSENT') || s.includes('INSUFFICIENT')) {
      return {
        normalizedStatus: 'delivery_attempted',
        statusTitleBn: 'বিতরণ প্রচেষ্টা ব্যর্থ',
        statusTitleEn: 'Delivery Attempted',
        descriptionBn: 'দরজা বন্ধ বা গ্রাহক অনুপস্থিত থাকায় ডাক বিতরণ সম্পন্ন হয়নি।',
        descriptionEn: 'Door locked or addressee absent during postal beat.',
      };
    }
    if (s.includes('OUT FOR DELIVERY') || s.includes('DISPATCHED')) {
      return {
        normalizedStatus: 'out_for_delivery',
        statusTitleBn: 'বিতরণের জন্য বের হয়েছে',
        statusTitleEn: 'Out for Delivery (India Post)',
        descriptionBn: 'স্থানীয় ডাকঘর থেকে পোস্টম্যান পার্সেল নিয়ে বের হয়েছেন।',
        descriptionEn: 'Consignment out for delivery from destination Sub-Post Office.',
      };
    }
    if (s.includes('ITEM DELIVERED') || s.includes('DELIVERED')) {
      return {
        normalizedStatus: 'delivered',
        statusTitleBn: 'ডেলিভারি সম্পন্ন (ইন্ডিয়া পোস্ট)',
        statusTitleEn: 'Delivered (India Post)',
        descriptionBn: 'পোস্টম্যান দ্বারা পার্সেল ডেলিভারি সম্পন্ন হয়েছে।',
        descriptionEn: 'Consignment successfully delivered by postman.',
      };
    }
    return {
      normalizedStatus: 'shipped',
      statusTitleBn: 'ডাক প্রেরণ করা হয়েছে',
      statusTitleEn: 'Dispatched in Transit',
      descriptionBn: 'পার্সেলটি আরএমএস (RMS) হাবে প্রক্রিয়াকরণ হচ্ছে।',
      descriptionEn: 'Consignment processed at RMS sorting hub.',
    };
  }

  // 4. Local Malda delivery boy mapping
  if (carrier === 'local_malda') {
    if (s.includes('DELIVERED')) {
      return {
        normalizedStatus: 'delivered',
        statusTitleBn: 'ডেলিভারি সম্পন্ন',
        statusTitleEn: 'Delivered by Malda Express',
        descriptionBn: 'আমাদের লোকাল ডেলিভারি রাইডার সফলভাবে বই হস্তান্তর করেছেন।',
        descriptionEn: 'Handed over by our local Malda Town delivery rider.',
      };
    }
    if (s.includes('OUT') || s.includes('ASSIGNED')) {
      return {
        normalizedStatus: 'out_for_delivery',
        statusTitleBn: 'রাইডার আসছে',
        statusTitleEn: 'Rider Out for Delivery',
        descriptionBn: 'মালদা এক্সপ্রেস রাইডার আপনার বই নিয়ে আসছে।',
        descriptionEn: 'Malda express delivery partner is on the way.',
      };
    }
    return {
      normalizedStatus: 'shipped',
      statusTitleBn: 'অর্ডার প্রস্তুত ও প্রেরিত',
      statusTitleEn: 'Order Dispatched Locally',
      descriptionBn: 'নেতাজি সুভাষ রোড স্টোর থেকে রাইডারের কাছে হস্তান্তর করা হয়েছে।',
      descriptionEn: 'Dispatched from Netaji Subhash Road store to local rider.',
    };
  }

  return {
    normalizedStatus: 'shipped',
    statusTitleBn: 'ট্রানজিটে রয়েছে',
    statusTitleEn: 'In Transit',
    descriptionBn: 'পার্সেলটি গন্তব্যের দিকে এগিয়ে চলেছে।',
    descriptionEn: 'Package is moving towards destination.',
  };
}

/**
 * In-memory idempotency deduplication cache for webhook events (Item 43)
 * Stores SHA-256(awb + status + timestamp) for 24 hours.
 */
class WebhookIdempotencyManager {
  private cache: Map<string, number> = new Map();
  private readonly TTL_MS = 24 * 60 * 60 * 1000; // 24 Hours

  public isDuplicate(awb: string, rawStatus: string, timestamp: string | number): boolean {
    this.cleanExpired();
    const key = `${awb.trim()}:${rawStatus.trim().toUpperCase()}:${String(timestamp).trim()}`;
    const hash = crypto.createHash('sha256').update(key).digest('hex');

    if (this.cache.has(hash)) {
      return true;
    }

    this.cache.set(hash, Date.now() + this.TTL_MS);
    return false;
  }

  public clear(): void {
    this.cache.clear();
  }

  private cleanExpired(): void {
    const now = Date.now();
    for (const [key, expiresAt] of this.cache.entries()) {
      if (expiresAt <= now) {
        this.cache.delete(key);
      }
    }
  }
}

export const webhookIdempotency = new WebhookIdempotencyManager();

/**
 * Builds a clean tracking milestone object from webhook data (Item 16)
 */
export function buildTrackingMilestone(params: {
  carrier: CourierProvider;
  rawStatus: string;
  location?: string;
  timestamp?: string;
  notes?: string;
}): TrackingMilestone {
  const normalized = normalizeCourierStatus(params.carrier, params.rawStatus);
  const time = params.timestamp ? new Date(params.timestamp).toISOString() : new Date().toISOString();

  return {
    status: normalized.normalizedStatus,
    title: normalized.statusTitleEn,
    titleBn: normalized.statusTitleBn,
    description: params.notes || normalized.descriptionEn,
    descriptionBn: normalized.descriptionBn,
    location: params.location || 'Hub Processing Center',
    timestamp: time,
  };
}
