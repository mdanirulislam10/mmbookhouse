'use client';

import { GranularNotificationPreferences } from '@/types/auth';
import { profileService, DEFAULT_CUSTOMER_PROFILE } from './profileService';
import { dpdpCompliance } from './dpdpCompliance';

const NOTIFICATION_PREFERENCES_KEY = 'mm_user_notification_preferences';

export const DEFAULT_NOTIFICATION_PREFERENCES: GranularNotificationPreferences = {
  transactionalSms: true,
  transactionalEmail: true,
  promotionalSms: false,
  promotionalEmail: false,
  promotionalWhatsApp: false,
  priceDropAlerts: true,
  examSyllabusUpdates: true,
};

/**
 * Task 38: Granular Notification Preferences Service
 * Separates transactional/security messages from optional promotional messages.
 */
export const notificationPreferencesService = {
  /**
   * Get notification preferences for a user
   */
  getPreferences(userId: string): GranularNotificationPreferences {
    if (typeof window === 'undefined') return DEFAULT_NOTIFICATION_PREFERENCES;

    try {
      const raw = localStorage.getItem(`${NOTIFICATION_PREFERENCES_KEY}_${userId}`);
      if (raw) {
        return {
          ...DEFAULT_NOTIFICATION_PREFERENCES,
          ...JSON.parse(raw),
          transactionalSms: true, // enforced immutable
          transactionalEmail: true, // enforced immutable
        };
      }
    } catch {
      // Storage fallback
    }

    return DEFAULT_NOTIFICATION_PREFERENCES;
  },

  /**
   * Save updated preferences
   */
  savePreferences(
    userId: string,
    preferences: GranularNotificationPreferences
  ): GranularNotificationPreferences {
    const sanitized: GranularNotificationPreferences = {
      ...preferences,
      transactionalSms: true, // security mandated
      transactionalEmail: true, // tax compliance mandated
    };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          `${NOTIFICATION_PREFERENCES_KEY}_${userId}`,
          JSON.stringify(sanitized)
        );

        // Update profile promo flag
        const currentUserId = userId || DEFAULT_CUSTOMER_PROFILE.id;
        const profile = profileService.getProfile(currentUserId);
        const hasAnyPromo =
          sanitized.promotionalSms ||
          sanitized.promotionalEmail ||
          sanitized.promotionalWhatsApp ||
          sanitized.priceDropAlerts ||
          sanitized.examSyllabusUpdates;

        profileService.saveProfile({
          ...profile,
          promoNotificationEnabled: hasAnyPromo,
          notificationPreferences: sanitized,
        });

        // Sync with DPDP Act consent
        dpdpCompliance.recordConsent(currentUserId, 'promotional_updates', hasAnyPromo);

        // Broadcast event
        window.dispatchEvent(
          new CustomEvent('mm_notification_preferences_changed', { detail: sanitized })
        );
      } catch {
        // Fallback
      }
    }

    return sanitized;
  },

  /**
   * 1-Click Do Not Disturb (DND) - Silences all promotional / advertising messages
   */
  enableDndMode(userId: string): GranularNotificationPreferences {
    const dndPreferences: GranularNotificationPreferences = {
      transactionalSms: true,
      transactionalEmail: true,
      promotionalSms: false,
      promotionalEmail: false,
      promotionalWhatsApp: false,
      priceDropAlerts: false,
      examSyllabusUpdates: false,
    };

    return this.savePreferences(userId, dndPreferences);
  },
};
