import { CustomerNotificationPreference } from '../../types/notifications';
import { sanitizePhoneNumberE164 } from './notificationTemplateService';

/**
 * Module 18: Customer Notification Preferences & Opt-Out Service
 * 
 * Complies with:
 * - Item 26: TRAI & WhatsApp Opt-Out keyword handling ("STOP", "UNSUBSCRIBE", "থামুন")
 * - Item 40: Granular Customer Preferences (WhatsApp, SMS, Promotions)
 * - Item 46: DPDP Act 2023 Privacy Compliance
 */

export interface OptOutRecord {
  phone: string;
  keyword: string;
  channel: 'whatsapp' | 'sms' | 'all';
  opted_out_at: string;
}

export class NotificationPreferenceService {
  private preferences: Map<string, CustomerNotificationPreference> = new Map();
  private optOutRegistry: Map<string, OptOutRecord> = new Map();

  /**
   * Get preferences for a user, or return safe defaults
   */
  public getPreferences(userId: string): CustomerNotificationPreference {
    const existing = this.preferences.get(userId);
    if (existing) return existing;

    const defaultPrefs: CustomerNotificationPreference = {
      user_id: userId,
      whatsapp_enabled: true,
      sms_enabled: true,
      email_enabled: true,
      promotions_opt_in: false, // Default opt-out for marketing per DPDP
      updated_at: new Date().toISOString(),
    };

    this.preferences.set(userId, defaultPrefs);
    return defaultPrefs;
  }

  /**
   * Update preferences
   */
  public updatePreferences(
    userId: string,
    updates: Partial<Omit<CustomerNotificationPreference, 'user_id' | 'updated_at'>>
  ): CustomerNotificationPreference {
    const current = this.getPreferences(userId);
    const updated: CustomerNotificationPreference = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    this.preferences.set(userId, updated);
    return updated;
  }

  /**
   * Handle incoming STOP / UNSUBSCRIBE / থামুন / বন্ধ keyword
   */
  public handleOptOut(
    rawPhone: string,
    keyword: string,
    channel: 'whatsapp' | 'sms' | 'all' = 'all'
  ): { success: boolean; message: string; record?: OptOutRecord } {
    const sanitized = sanitizePhoneNumberE164(rawPhone);
    if (!sanitized.valid) {
      return {
        success: false,
        message: 'অবৈধ ফোন নম্বর',
      };
    }

    const normKey = keyword.trim().toUpperCase();
    const validKeywords = ['STOP', 'UNSUBSCRIBE', 'থামুন', 'বন্ধ', 'CANCEL'];

    if (!validKeywords.includes(normKey)) {
      return {
        success: false,
        message: 'অপরিচিত কি-ওয়ার্ড। আনসাবস্ক্রাইব করতে "STOP" অথবা "থামুন" লিখুন।',
      };
    }

    const record: OptOutRecord = {
      phone: sanitized.formatted,
      keyword: normKey,
      channel,
      opted_out_at: new Date().toISOString(),
    };

    this.optOutRegistry.set(sanitized.formatted, record);

    return {
      success: true,
      message: `আপনার নম্বর (${sanitized.masked}) থেকে প্রমোশনাল নোটিফিকেশন সফলভাবে বন্ধ করা হয়েছে। কেবল আবশ্যক ট্রানজ্যাকশনাল অর্ডার আপডেট পাঠানো হবে।`,
      record,
    };
  }

  /**
   * Check if a phone is opted out from a channel or marketing
   */
  public isOptedOut(rawPhone: string, isPromotional = false): boolean {
    const sanitized = sanitizePhoneNumberE164(rawPhone);
    if (!sanitized.valid) return false;

    const record = this.optOutRegistry.get(sanitized.formatted);
    if (!record) return false;

    // If opted out via STOP keyword, always block promotional notifications
    if (isPromotional) return true;

    // Transactional critical messages (order confirmed, OTP) are permitted unless strictly blocked
    return false;
  }

  /**
   * Re-subscribe / Opt back in
   */
  public optIn(rawPhone: string): { success: boolean; message: string } {
    const sanitized = sanitizePhoneNumberE164(rawPhone);
    if (!sanitized.valid) {
      return { success: false, message: 'অবৈধ ফোন নম্বর' };
    }

    this.optOutRegistry.delete(sanitized.formatted);
    return {
      success: true,
      message: `আপনার নম্বর (${sanitized.masked}) পুনরায় নোটিফিকেশন সার্ভিসে সক্রিয় করা হয়েছে।`,
    };
  }

  public clearAll() {
    this.preferences.clear();
    this.optOutRegistry.clear();
  }
}

export const defaultPreferenceService = new NotificationPreferenceService();
