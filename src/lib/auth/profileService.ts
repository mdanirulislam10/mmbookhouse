'use client';

import { UserProfile } from '@/types/auth';

const PROFILE_STORAGE_PREFIX = 'mm_customer_profile_data';

export const DEFAULT_CUSTOMER_PROFILE: UserProfile = {
  id: 'user-demo-sabir',
  fullName: 'সাবির আহমেদ',
  phoneNumber: '9800123456',
  altPhoneNumber: '9733098765',
  email: 'sabir@mmbookhouse.com',
  isEmailVerified: true,
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
  role: 'customer',
  examPreferences: ['wbcs', 'ugb'],
  whatsappOptIn: true,
  promoNotificationEnabled: false,
  securityPasswordSet: false,
  referralCode: 'MMSABIR24',
  referralPoints: 120,
  createdAt: '2024-01-15T10:00:00.000Z',
  updatedAt: new Date().toISOString(),
};

/**
 * Task 31: Customer Profile Metadata Management Service
 */
export const profileService = {
  /**
   * Validate full name (Bengali or English, min 2 characters)
   */
  validateFullName(name: string): { isValid: boolean; error?: string } {
    const trimmed = name.trim();
    if (!trimmed) {
      return { isValid: false, error: 'গ্রাহকের পুরো নাম প্রদান করা আবশ্যক।' };
    }
    if (trimmed.length < 2) {
      return { isValid: false, error: 'নামে কমপক্ষে ২টি অক্ষর থাকতে হবে।' };
    }
    if (trimmed.length > 50) {
      return { isValid: false, error: 'নাম ৫০ অক্ষরের বেশি হতে পারবে না।' };
    }
    return { isValid: true };
  },

  /**
   * Validate primary phone number (10 digits)
   */
  validatePrimaryPhone(phone: string): { isValid: boolean; error?: string } {
    const clean = phone.replace(/\D/g, '');
    if (!clean) {
      return { isValid: false, error: 'মোবাইল নম্বর প্রদান আবশ্যক।' };
    }
    if (clean.length !== 10) {
      return { isValid: false, error: 'সঠিক ১০-ডিজিটের ভারতীয় মোবাইল নম্বর লিখুন।' };
    }
    if (!/^[6-9]\d{9}$/.test(clean)) {
      return { isValid: false, error: 'ভারতীয় মোবাইল নম্বর ৬, ৭, ৮ বা ৯ দিয়ে শুরু হতে হবে।' };
    }
    return { isValid: true };
  },

  /**
   * Validate alternative phone number (optional, but if provided must be valid and distinct from primary)
   */
  validateAltPhone(altPhone: string, primaryPhone: string): { isValid: boolean; error?: string } {
    const cleanAlt = altPhone.replace(/\D/g, '');
    if (!cleanAlt) {
      return { isValid: true }; // optional
    }
    if (cleanAlt.length !== 10) {
      return { isValid: false, error: 'বিকল্প নম্বরটি সঠিক ১০-ডিজিটের হতে হবে।' };
    }
    if (!/^[6-9]\d{9}$/.test(cleanAlt)) {
      return { isValid: false, error: 'বিকল্প নম্বর ৬, ৭, ৮ বা ৯ দিয়ে শুরু হতে হবে।' };
    }
    const cleanPrimary = primaryPhone.replace(/\D/g, '');
    if (cleanAlt === cleanPrimary) {
      return { isValid: false, error: 'বিকল্প নম্বরটি প্রধান মোবাইল নম্বরের সমান হতে পারবে না।' };
    }
    return { isValid: true };
  },

  /**
   * Validate optional email format
   */
  validateEmail(email: string): { isValid: boolean; error?: string } {
    const trimmed = email.trim();
    if (!trimmed) {
      return { isValid: true }; // optional
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return { isValid: false, error: 'সঠিক ইমেইল ফরম্যাট প্রদান করুন (যেমন: student@example.com)।' };
    }
    return { isValid: true };
  },

  /**
   * Get user profile by ID
   */
  getProfile(userId: string): UserProfile {
    if (typeof window === 'undefined') {
      return {
        ...DEFAULT_CUSTOMER_PROFILE,
        id: userId || DEFAULT_CUSTOMER_PROFILE.id,
      };
    }
    try {
      const stored = localStorage.getItem(`${PROFILE_STORAGE_PREFIX}_${userId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore
    }

    return {
      ...DEFAULT_CUSTOMER_PROFILE,
      id: userId || DEFAULT_CUSTOMER_PROFILE.id,
    };
  },

  /**
   * Save / Update Profile Metadata (Task 31)
   */
  saveProfile(profile: UserProfile): { success: boolean; profile: UserProfile; error?: string } {
    // Validate inputs
    const nameCheck = this.validateFullName(profile.fullName);
    if (!nameCheck.isValid) return { success: false, profile, error: nameCheck.error };

    const phoneCheck = this.validatePrimaryPhone(profile.phoneNumber);
    if (!phoneCheck.isValid) return { success: false, profile, error: phoneCheck.error };

    if (profile.altPhoneNumber) {
      const altCheck = this.validateAltPhone(profile.altPhoneNumber, profile.phoneNumber);
      if (!altCheck.isValid) return { success: false, profile, error: altCheck.error };
    }

    if (profile.email) {
      const emailCheck = this.validateEmail(profile.email);
      if (!emailCheck.isValid) return { success: false, profile, error: emailCheck.error };
    }

    const updated: UserProfile = {
      ...profile,
      updatedAt: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`${PROFILE_STORAGE_PREFIX}_${updated.id}`, JSON.stringify(updated));
        // Also fire update event
        window.dispatchEvent(new CustomEvent('mm_profile_updated', { detail: updated }));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'স্টোরেজে সেভ করতে ব্যর্থ হয়েছে।';
        return { success: false, profile, error: msg };
      }
    }

    return { success: true, profile: updated };
  },
};
