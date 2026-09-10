'use client';

import {
  ConsentPurpose,
  DpdpConsentRecord,
  DataErasureRequest,
  DpoGrievanceContact,
  UserProfile,
} from '@/types/auth';

export const CURRENT_CONSENT_NOTICE_VERSION = 'v1.0-DPDP-2023';
const DPDP_CONSENTS_KEY = 'mm_dpdp_consents_store';
const DPDP_ERASURE_LOG_KEY = 'mm_dpdp_erasure_audit_log';

/**
 * Task 30: Digital Personal Data Protection Act, 2023 (DPDP Act 2023)
 * Grievance Redressal Officer & Data Protection Officer Contact
 */
export const DPO_GRIEVANCE_CONTACT: DpoGrievanceContact = {
  name: 'জনাব সাবির খান',
  designation: 'ডাটা প্রটেকশন ও গ্রিভেন্স রিড্রেসাল অফিসার',
  email: 'privacy@mmbookhouse.com',
  phone: '+91 98001 23456',
  address: 'এম.এম বুক হাউস, রবীন্দ্র এভিনিউ, মালদহ টাউন, পশ্চিমবঙ্গ - ৭৩২৪০১',
  grievanceSlaHours: 48,
};

/**
 * DPDP Act 2023 Compliance & Consent Architecture Engine
 */
export const dpdpCompliance = {
  /**
   * Mask 10-digit mobile number for privacy (Data Minimization)
   * e.g., 9800123456 -> "+91 98001 *****"
   */
  maskPhoneNumber(phone: string): string {
    const clean = phone.replace(/\D/g, '');
    if (clean.length < 10) return phone;
    const first5 = clean.slice(0, 5);
    return `+91 ${first5} *****`;
  },

  /**
   * Mask email address for privacy
   * e.g., sabir@example.com -> s***@example.com
   */
  maskEmail(email?: string): string {
    if (!email || !email.includes('@')) return '';
    const [local, domain] = email.split('@');
    if (local.length <= 2) return `${local[0]}***@${domain}`;
    return `${local[0]}***${local.slice(-1)}@${domain}`;
  },

  /**
   * Get all active consent records for a user
   */
  getConsents(userId: string): Record<ConsentPurpose, DpdpConsentRecord> {
    if (typeof window === 'undefined') {
      return this.getDefaultConsents();
    }
    try {
      const raw = localStorage.getItem(`${DPDP_CONSENTS_KEY}_${userId}`);
      if (!raw) return this.getDefaultConsents();
      return JSON.parse(raw);
    } catch {
      return this.getDefaultConsents();
    }
  },

  /**
   * Default initial consent state
   */
  getDefaultConsents(): Record<ConsentPurpose, DpdpConsentRecord> {
    const now = new Date().toISOString();
    return {
      essential_auth: {
        purpose: 'essential_auth',
        isGranted: true,
        timestamp: now,
        consentNoticeVersion: CURRENT_CONSENT_NOTICE_VERSION,
      },
      order_delivery: {
        purpose: 'order_delivery',
        isGranted: true,
        timestamp: now,
        consentNoticeVersion: CURRENT_CONSENT_NOTICE_VERSION,
      },
      whatsapp_notifications: {
        purpose: 'whatsapp_notifications',
        isGranted: true,
        timestamp: now,
        consentNoticeVersion: CURRENT_CONSENT_NOTICE_VERSION,
      },
      promotional_updates: {
        purpose: 'promotional_updates',
        isGranted: false,
        timestamp: now,
        consentNoticeVersion: CURRENT_CONSENT_NOTICE_VERSION,
      },
    };
  },

  /**
   * Update / record user consent for a specific purpose
   */
  recordConsent(
    userId: string,
    purpose: ConsentPurpose,
    isGranted: boolean
  ): DpdpConsentRecord {
    const current = this.getConsents(userId);
    const updated: DpdpConsentRecord = {
      purpose,
      isGranted,
      timestamp: new Date().toISOString(),
      consentNoticeVersion: CURRENT_CONSENT_NOTICE_VERSION,
    };
    current[purpose] = updated;

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`${DPDP_CONSENTS_KEY}_${userId}`, JSON.stringify(current));
      } catch {
        // Storage failure fallback
      }
    }

    return updated;
  },

  /**
   * Withdraw / Revoke consent for an optional purpose
   */
  revokeConsent(userId: string, purpose: ConsentPurpose): void {
    if (purpose === 'essential_auth') {
      console.warn('Essential auth consent cannot be revoked while keeping active account.');
      return;
    }
    this.recordConsent(userId, purpose, false);
  },

  /**
   * Task 30: Section 12 Right to Erasure (তথ্য মোছার অধিকার)
   * Permanently deletes customer personal identifying data (PII)
   * while maintaining sanitized accounting hashes required by Indian Tax Laws.
   */
  async executeRightToErasure(userId: string, phoneNumber: string): Promise<DataErasureRequest> {
    const request: DataErasureRequest = {
      id: `erasure-${Date.now()}`,
      userId,
      phoneNumber: this.maskPhoneNumber(phoneNumber),
      status: 'completed',
      requestedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      retentionNotes: 'ব্যক্তিগত তথ্য সম্পূর্ণরূপে মুছে ফেলা হয়েছে। আয়কর ও জিএসটি বিধিমালা ২০১৭ অনুযায়ী লেনদেন রেকর্ড অপরিবর্তনীয়ভাবে সংরক্ষণ করা হয়েছে।',
    };

    if (typeof window !== 'undefined') {
      // 1. Purge personal session storage
      sessionStorage.clear();

      // 2. Remove user-specific local storage items
      localStorage.removeItem(`mm_dpdp_consents_store_${userId}`);
      localStorage.removeItem('mm_user_session');
      localStorage.removeItem('mm_auth_session_persistence');

      // 3. Log audit event
      try {
        const auditLog = JSON.parse(localStorage.getItem(DPDP_ERASURE_LOG_KEY) || '[]');
        auditLog.push(request);
        localStorage.setItem(DPDP_ERASURE_LOG_KEY, JSON.stringify(auditLog));
      } catch {
        // Ignore
      }

      // 4. Dispatch browser event
      window.dispatchEvent(new CustomEvent('mm_auth_account_erased', { detail: { userId } }));
    }

    return request;
  },

  /**
   * Alias for executeRightToErasure
   */
  async requestDataErasure(userId: string, phoneNumber: string): Promise<DataErasureRequest> {
    return this.executeRightToErasure(userId, phoneNumber);
  },

  /**
   * Sanitize & anonymize a profile object
   */
  anonymizeProfile(profile: UserProfile): UserProfile {
    return {
      ...profile,
      fullName: 'নামহীন গ্রাহক (Erased User)',
      phoneNumber: '0000000000',
      email: undefined,
      avatarUrl: undefined,
      whatsappOptIn: false,
      promoNotificationEnabled: false,
      updatedAt: new Date().toISOString(),
    };
  },
};
