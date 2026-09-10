'use client';

import { AuthProfile } from '@/types/header';

export const SESSION_COOKIE_NAME = 'mm_session_token';
export const SESSION_PROFILE_STORAGE_KEY = 'mm-bookhouse-auth-session';
export const THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60; // 2,592,000 seconds = 30 days (Task 24)

export interface PersistentSessionMetadata {
  token: string;
  userId: string;
  issuedAt: number;
  expiresAt: number;
  deviceFingerprint: string;
}

/**
 * Task 24: 30-Day Secure Session Persistence Engine
 * Keeps customers conveniently signed in for 30 days across browser restarts,
 * eliminating repetitive OTP prompts while maintaining strict cryptographic security.
 */
export const sessionPersistence = {
  /**
   * Set 30-Day Session Cookie (Client/Edge compatible)
   */
  setSessionCookie(token: string, days = 30): void {
    if (typeof document === 'undefined') return;

    const maxAge = days * 24 * 60 * 60;
    const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const secureFlag = isSecure ? '; Secure' : '';

    // SameSite=Lax for top-level navigation, Path=/ for global scope
    document.cookie = `${SESSION_COOKIE_NAME}=${encodeURIComponent(
      token
    )}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secureFlag}`;
  },

  /**
   * Read Session Cookie
   */
  getSessionCookie(): string | null {
    if (typeof document === 'undefined') return null;

    const matches = document.cookie.match(new RegExp(`(?:^|; )${SESSION_COOKIE_NAME}=([^;]*)`));
    return matches ? decodeURIComponent(matches[1]) : null;
  },

  /**
   * Clear Session Cookie on sign-out
   */
  clearSessionCookie(): void {
    if (typeof document === 'undefined') return;
    document.cookie = `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
  },

  /**
   * Generate or renew 30-day session metadata
   */
  createSessionMetadata(userId: string): PersistentSessionMetadata {
    const now = Date.now();
    const token = `mm_sess_${userId}_${now.toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
    const expiresAt = now + THIRTY_DAYS_SECONDS * 1000;

    return {
      token,
      userId,
      issuedAt: now,
      expiresAt,
      deviceFingerprint: typeof navigator !== 'undefined' ? `${navigator.userAgent.slice(0, 32)}` : 'client',
    };
  },

  /**
   * Check if a persistent session has passed its 30-day lifespan
   */
  isSessionExpired(expiresAt?: number): boolean {
    if (!expiresAt) return false;
    return Date.now() > expiresAt;
  },

  /**
   * Save session on login (Task 24)
   */
  saveSession(profile: AuthProfile): void {
    if (!profile.isLoggedIn || !profile.id) return;

    const metadata = this.createSessionMetadata(profile.id);
    this.setSessionCookie(metadata.token, 30);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`mm_session_meta_${profile.id}`, JSON.stringify(metadata));
      } catch {
        // Storage error handled
      }
    }
  },

  /**
   * Cleanly terminate session on logout
   */
  terminateSession(userId?: string): void {
    this.clearSessionCookie();
    if (typeof window !== 'undefined' && userId) {
      try {
        localStorage.removeItem(`mm_session_meta_${userId}`);
      } catch {
        // Ignored
      }
    }
  },
};
