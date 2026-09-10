import { OtpDeliveryChannel } from '@/types/auth';

export interface ChannelRoutingDecision {
  channel: OtpDeliveryChannel;
  reason: string;
  isCostOptimized: boolean;
  costSavedEstimateInInr: number;
}

export interface RoutingMetrics {
  totalDispatches: number;
  whatsappCount: number;
  smsCount: number;
  estimatedSavingsInInr: number;
}

const WHATSAPP_COST_INR = 0.12; // Typical WhatsApp Auth conversation rate
const SMS_DLT_COST_INR = 0.35;   // Typical Indian DLT transactional SMS rate
const KNOWN_WHATSAPP_USERS_KEY = 'mm_known_whatsapp_users';
const ROUTING_METRICS_KEY = 'mm_otp_routing_metrics';

let memoryRoutingMetrics: RoutingMetrics = {
  totalDispatches: 0,
  whatsappCount: 0,
  smsCount: 0,
  estimatedSavingsInInr: 0,
};
let memoryKnownUsers: string[] = [];

/**
 * Task 49: Smart Channel Routing Engine (WhatsApp OTP Priority)
 * Automatically routes authentication OTPs through WhatsApp when available
 * to slash telecommunication costs by up to 60% while elevating delivery rates to >99%.
 */
export const smartChannelRouter = {
  /**
   * Determine whether WhatsApp or SMS should be prioritized for this phone number
   */
  resolveOptimalChannel(
    phoneNumber: string,
    explicitChannel?: OtpDeliveryChannel
  ): ChannelRoutingDecision {
    // If customer explicitly requested a channel (e.g. clicked Resend via WhatsApp or Resend via SMS)
    if (explicitChannel) {
      return {
        channel: explicitChannel,
        reason: 'গ্রাহকের পছন্দ অনুযায়ী চ্যানেল নির্ধারণ করা হয়েছে',
        isCostOptimized: explicitChannel === 'whatsapp',
        costSavedEstimateInInr: explicitChannel === 'whatsapp' ? SMS_DLT_COST_INR - WHATSAPP_COST_INR : 0,
      };
    }

    // Check 1: User's stored WhatsApp opt-in preference from Task 37
    if (typeof window !== 'undefined') {
      try {
        const storedOptIn = localStorage.getItem('mm_whatsapp_order_opt_in');
        if (storedOptIn === 'true') {
          return {
            channel: 'whatsapp',
            reason: 'হোয়াটসঅ্যাপ আপডেট কনসেন্ট সক্রিয় থাকায় হোয়াটসঅ্যাপ অগ্রাধিকার',
            isCostOptimized: true,
            costSavedEstimateInInr: SMS_DLT_COST_INR - WHATSAPP_COST_INR,
          };
        }

        // Check 2: Known WhatsApp history ledger
        const rawHistory = localStorage.getItem(KNOWN_WHATSAPP_USERS_KEY);
        if (rawHistory) {
          const knownList: string[] = JSON.parse(rawHistory);
          if (knownList.includes(phoneNumber)) {
            return {
              channel: 'whatsapp',
              reason: 'পূর্বে সফল হোয়াটসঅ্যাপ ডেলিভারি রেকর্ড থাকায় ওটিপি হোয়াটসঅ্যাপে পাঠানো হচ্ছে',
              isCostOptimized: true,
              costSavedEstimateInInr: SMS_DLT_COST_INR - WHATSAPP_COST_INR,
            };
          }
        }
      } catch {
        // Fallback gracefully
      }
    } else {
      if (memoryKnownUsers.includes(phoneNumber)) {
        return {
          channel: 'whatsapp',
          reason: 'পূর্বে সফল হোয়াটসঅ্যাপ ডেলিভারি রেকর্ড থাকায় ওটিপি হোয়াটসঅ্যাপে পাঠানো হচ্ছে',
          isCostOptimized: true,
          costSavedEstimateInInr: SMS_DLT_COST_INR - WHATSAPP_COST_INR,
        };
      }
    }

    // Default primary: WhatsApp prioritized for modern smartphone users (Task 49)
    // with automatic SMS fallback after 30s countdown
    return {
      channel: 'whatsapp',
      reason: 'স্মার্ট রাউটিং: ৬০% খরচ সাশ্রয় ও দ্রুততম ডেলিভারির জন্য হোয়াটসঅ্যাপ অগ্রাধিকার',
      isCostOptimized: true,
      costSavedEstimateInInr: SMS_DLT_COST_INR - WHATSAPP_COST_INR,
    };
  },

  /**
   * Record successful delivery for learning and cost accounting
   */
  recordDispatch(phoneNumber: string, channel: OtpDeliveryChannel): void {
    // 1. Update known WhatsApp ledger
    if (channel === 'whatsapp') {
      if (typeof window !== 'undefined') {
        try {
          const rawHistory = localStorage.getItem(KNOWN_WHATSAPP_USERS_KEY);
          const knownList: string[] = rawHistory ? JSON.parse(rawHistory) : [];
          if (!knownList.includes(phoneNumber)) {
            knownList.push(phoneNumber);
            localStorage.setItem(KNOWN_WHATSAPP_USERS_KEY, JSON.stringify(knownList.slice(-100)));
          }
        } catch {
          // Ignored
        }
      } else {
        if (!memoryKnownUsers.includes(phoneNumber)) {
          memoryKnownUsers.push(phoneNumber);
        }
      }
    }

    // 2. Update routing metrics
    const saving = channel === 'whatsapp' ? SMS_DLT_COST_INR - WHATSAPP_COST_INR : 0;

    if (typeof window !== 'undefined') {
      try {
        const rawMetrics = localStorage.getItem(ROUTING_METRICS_KEY);
        const metrics: RoutingMetrics = rawMetrics
          ? JSON.parse(rawMetrics)
          : { totalDispatches: 0, whatsappCount: 0, smsCount: 0, estimatedSavingsInInr: 0 };

        metrics.totalDispatches += 1;
        if (channel === 'whatsapp') {
          metrics.whatsappCount += 1;
          metrics.estimatedSavingsInInr = Number((metrics.estimatedSavingsInInr + saving).toFixed(2));
        } else {
          metrics.smsCount += 1;
        }

        localStorage.setItem(ROUTING_METRICS_KEY, JSON.stringify(metrics));
      } catch {
        // Non-blocking telemetry
      }
    } else {
      memoryRoutingMetrics.totalDispatches += 1;
      if (channel === 'whatsapp') {
        memoryRoutingMetrics.whatsappCount += 1;
        memoryRoutingMetrics.estimatedSavingsInInr = Number(
          (memoryRoutingMetrics.estimatedSavingsInInr + saving).toFixed(2)
        );
      } else {
        memoryRoutingMetrics.smsCount += 1;
      }
    }
  },

  /**
   * Retrieve aggregate cost savings metrics
   */
  getMetrics(): RoutingMetrics {
    if (typeof window === 'undefined') {
      return memoryRoutingMetrics;
    }

    try {
      const raw = localStorage.getItem(ROUTING_METRICS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // Return defaults
    }

    return { totalDispatches: 0, whatsappCount: 0, smsCount: 0, estimatedSavingsInInr: 0 };
  },
};
