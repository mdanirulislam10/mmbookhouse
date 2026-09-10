'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AuthProfile } from '@/types/header';
import { supabase } from '@/lib/supabase/client';
import { sessionPersistence } from '@/lib/auth/sessionPersistence';
import { tokenRotationService } from '@/lib/auth/tokenRotation';
import { useCartStore } from '@/hooks/useCartStore';

const DEMO_USER: AuthProfile = {
  id: 'user-demo-sabir',
  fullName: 'সাবির আহমেদ',
  email: 'sabir@mmbookhouse.com',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
  isLoggedIn: true,
};

const GUEST_USER: AuthProfile = {
  id: '',
  fullName: '',
  email: '',
  isLoggedIn: false,
};

interface AuthSessionStore {
  profile: AuthProfile;
  setProfile: (profile: AuthProfile) => void;
  loginAsDemo: () => void;
  logout: () => void;
  toggleAuthStatus: () => void;
  rotateToken: () => void;
}

export const useAuthSessionStore = create<AuthSessionStore>()(
  persist(
    (set, get) => ({
      profile: GUEST_USER, // Default to guest, can be toggled to demo or synced with Supabase
      setProfile: (profile) => {
        set({ profile });
        if (profile.isLoggedIn && profile.id) {
          // Task 24 & 26: Save 30-day persistent cookie & initialize RTR token family
          sessionPersistence.saveSession(profile);
          tokenRotationService.initializeTokenFamily(profile.id);

          try {
            // Task 23: Instant guest-to-user cart synchronization
            useCartStore.getState().syncWithUserAccount(profile.id);
          } catch {
            // Graceful fallback
          }
        }
      },
      loginAsDemo: () => {
        set({ profile: DEMO_USER });
        sessionPersistence.saveSession(DEMO_USER);
        tokenRotationService.initializeTokenFamily(DEMO_USER.id);
        try {
          useCartStore.getState().syncWithUserAccount(DEMO_USER.id);
        } catch {
          // Graceful fallback
        }
      },
      logout: () => {
        const currentUserId = get().profile.id;
        sessionPersistence.terminateSession(currentUserId);
        set({ profile: GUEST_USER });
        supabase.auth.signOut().catch(() => {});
      },
      toggleAuthStatus: () => {
        const isCurrentlyLoggedIn = get().profile.isLoggedIn;
        if (isCurrentlyLoggedIn) {
          get().logout();
        } else {
          get().loginAsDemo();
        }
      },
      rotateToken: () => {
        const user = get().profile;
        if (!user.isLoggedIn || !user.id) return;
        const currentCookie = sessionPersistence.getSessionCookie() || '';
        const res = tokenRotationService.rotateToken(currentCookie, user.id);
        if (res.hijackDetected) {
          get().logout();
        }
      },
    }),
    {
      name: 'mm-bookhouse-auth-session',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        // Task 24: Check if 30-day session has expired or restore cookie
        if (state?.profile.isLoggedIn && state.profile.id) {
          try {
            const rawMeta = localStorage.getItem(`mm_session_meta_${state.profile.id}`);
            if (rawMeta) {
              const meta = JSON.parse(rawMeta);
              if (sessionPersistence.isSessionExpired(meta.expiresAt)) {
                // Session expired after 30 days: clean logout
                state.logout();
              } else {
                // Renew cookie active life
                sessionPersistence.setSessionCookie(meta.token, 30);
              }
            } else {
              // Ensure valid 30-day cookie is restored for middleware guard
              sessionPersistence.saveSession(state.profile);
            }
          } catch {
            sessionPersistence.saveSession(state.profile);
          }
        }
      },
    }
  )
);

export function useAuthSession() {
  const { profile, setProfile, loginAsDemo, logout, toggleAuthStatus, rotateToken } =
    useAuthSessionStore();

  return {
    profile,
    isLoggedIn: profile.isLoggedIn,
    fullName: profile.fullName,
    email: profile.email,
    avatarUrl: profile.avatarUrl,
    loginAsDemo,
    logout,
    toggleAuthStatus,
    setProfile,
    rotateToken,
  };
}
