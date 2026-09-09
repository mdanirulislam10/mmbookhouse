'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AuthProfile } from '@/types/header';
import { supabase } from '@/lib/supabase/client';

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
}

export const useAuthSessionStore = create<AuthSessionStore>()(
  persist(
    (set) => ({
      profile: GUEST_USER, // Default to guest, can be toggled to demo or synced with Supabase
      setProfile: (profile) => set({ profile }),
      loginAsDemo: () => set({ profile: DEMO_USER }),
      logout: () => {
        set({ profile: GUEST_USER });
        supabase.auth.signOut().catch(() => {});
      },
      toggleAuthStatus: () =>
        set((state) => ({
          profile: state.profile.isLoggedIn ? GUEST_USER : DEMO_USER,
        })),
    }),
    {
      name: 'mm-bookhouse-auth-session',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function useAuthSession() {
  const { profile, setProfile, loginAsDemo, logout, toggleAuthStatus } =
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
  };
}
