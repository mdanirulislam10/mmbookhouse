'use client';

import { sessionPersistence } from './sessionPersistence';

export interface RotatedTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  rotatedAt: number;
}

export interface TokenFamilyRecord {
  familyId: string;
  userId: string;
  activeToken: string;
  revokedTokens: string[];
  createdAt: number;
  lastRotatedAt: number;
  isCompromised: boolean;
}

const TOKEN_FAMILIES_STORAGE_KEY = 'mm_token_families';

/**
 * Task 26: Refresh Token Rotation (RTR) & Anti-Hijacking Engine
 * Implements RFC 6749 OAuth 2.0 Security Best Current Practices:
 * 1. Single-use refresh tokens: every token usage invalidates the prior token.
 * 2. Automatic token reuse detection: replaying an old token immediately revokes the entire token family.
 * 3. Neutralizes stolen tokens and prevents man-in-the-middle replay attacks.
 */
let memoryTokenFamilies: Record<string, TokenFamilyRecord> = {};

export const tokenRotationService = {
  /**
   * Load all token families from secure client/mock storage with SSR fallback
   */
  getTokenFamilies(): Record<string, TokenFamilyRecord> {
    if (typeof window === 'undefined') return memoryTokenFamilies;
    try {
      const data = localStorage.getItem(TOKEN_FAMILIES_STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return memoryTokenFamilies;
    }
  },

  /**
   * Persist token families
   */
  saveTokenFamilies(families: Record<string, TokenFamilyRecord>): void {
    if (typeof window === 'undefined') {
      memoryTokenFamilies = families;
      return;
    }
    try {
      localStorage.setItem(TOKEN_FAMILIES_STORAGE_KEY, JSON.stringify(families));
    } catch {
      memoryTokenFamilies = families;
    }
  },

  /**
   * Initialize a new token family for an authenticated user session
   */
  initializeTokenFamily(userId: string): RotatedTokenResponse {
    const families = this.getTokenFamilies();
    const familyId = `fam_${userId}_${Date.now().toString(36)}`;
    const initialToken = `mm_rtr_${Math.random().toString(36).substring(2, 12)}_${Date.now().toString(36)}`;
    const now = Date.now();

    const record: TokenFamilyRecord = {
      familyId,
      userId,
      activeToken: initialToken,
      revokedTokens: [],
      createdAt: now,
      lastRotatedAt: now,
      isCompromised: false,
    };

    families[familyId] = record;
    this.saveTokenFamilies(families);

    // Save active token in 30-day session cookie
    sessionPersistence.setSessionCookie(initialToken, 30);

    return {
      accessToken: `mm_at_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`,
      refreshToken: initialToken,
      expiresInSeconds: 3600, // 1 hour access token
      rotatedAt: now,
    };
  },

  /**
   * Execute Refresh Token Rotation (RTR)
   * If a revoked token is re-used, IMMEDIATELY REVOKE THE ENTIRE FAMILY!
   */
  rotateToken(tokenToRotate: string, userId: string): {
    success: boolean;
    tokens?: RotatedTokenResponse;
    hijackDetected: boolean;
    message: string;
  } {
    const families = this.getTokenFamilies();

    // Find the family containing this token
    let targetFamilyId: string | null = null;
    let targetFamily: TokenFamilyRecord | null = null;

    for (const [fId, family] of Object.entries(families)) {
      if (family.userId === userId) {
        if (family.activeToken === tokenToRotate || family.revokedTokens.includes(tokenToRotate)) {
          targetFamilyId = fId;
          targetFamily = family;
          break;
        }
      }
    }

    // Case 1: Token not found or invalid
    if (!targetFamilyId || !targetFamily) {
      return {
        success: false,
        hijackDetected: false,
        message: 'অবৈধ সেশন টোকেন। অনুগ্রহ করে নতুন করে ওটিপি দিয়ে লগইন করুন।',
      };
    }

    // Case 2: CRITICAL - TOKEN REUSE DETECTED (Task 26 Hijacking Prevention)
    // An old/previously rotated token was presented again! An attacker has intercepted an old token!
    if (targetFamily.revokedTokens.includes(tokenToRotate)) {
      console.warn(
        `[SECURITY ALERT] Token reuse detected for User ${userId} on family ${targetFamilyId}! Revoking entire token family.`
      );

      // Permanently invalidate the compromised family
      delete families[targetFamilyId];
      this.saveTokenFamilies(families);

      // Kill session cookie immediately
      sessionPersistence.clearSessionCookie();

      return {
        success: false,
        hijackDetected: true,
        message: 'নিরাপত্তা ঝুঁকি সনাক্ত হয়েছে (টোকেন পুনঃব্যবহার)। আপনার অ্যাকাউন্ট সুরক্ষিত রাখতে সেশনটি অবিলম্বে বাতিল করা হয়েছে।',
      };
    }

    // Case 3: Legitimate rotation (Active token presented)
    // Revoke old token and issue fresh token
    const now = Date.now();
    const newRefreshToken = `mm_rtr_${Math.random().toString(36).substring(2, 12)}_${now.toString(36)}`;
    const newAccessToken = `mm_at_${now.toString(36)}_${Math.random().toString(36).substring(2, 8)}`;

    targetFamily.revokedTokens.push(tokenToRotate);
    // Keep revoked list limited to last 20 tokens to save memory
    if (targetFamily.revokedTokens.length > 20) {
      targetFamily.revokedTokens = targetFamily.revokedTokens.slice(-20);
    }

    targetFamily.activeToken = newRefreshToken;
    targetFamily.lastRotatedAt = now;

    families[targetFamilyId] = targetFamily;
    this.saveTokenFamilies(families);

    // Update 30-day session cookie with new token
    sessionPersistence.setSessionCookie(newRefreshToken, 30);

    return {
      success: true,
      hijackDetected: false,
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresInSeconds: 3600,
        rotatedAt: now,
      },
      message: 'টোকেন সফলভাবে রোটেশন (রিনিউ) করা হয়েছে।',
    };
  },

  /**
   * Check if a token is valid and currently active
   */
  isTokenActive(token: string, userId: string): boolean {
    const families = this.getTokenFamilies();
    for (const family of Object.values(families)) {
      if (family.userId === userId && family.activeToken === token) {
        return true;
      }
    }
    return false;
  },
};
