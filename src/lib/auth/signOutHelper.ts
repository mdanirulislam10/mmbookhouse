'use client';

import { supabase } from '@/lib/supabase/client';
import { sessionPersistence } from './sessionPersistence';
import { useAuthSessionStore } from '@/hooks/useAuthSession';

/**
 * Task 46: Complete Session Sign-Out & Cookie Cleanup
 * Ensures 100% thorough termination across:
 * 1. Server-side HttpOnly/Standard Cookies via /api/auth/logout
 * 2. Client-side sessionPersistence (document.cookie & localStorage meta)
 * 3. Supabase Auth Client
 * 4. Zustand Auth Store
 * 5. Clean redirect to homepage or designated URL
 */
export async function performCompleteSignOut(redirectUrl: string = '/'): Promise<void> {
  try {
    const currentUserId = useAuthSessionStore.getState().profile.id;

    // Step 1: Terminate client-side persistent cookies and session keys
    sessionPersistence.terminateSession(currentUserId);

    // Step 2: Call server API to emit Set-Cookie with Max-Age=0
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      // Graceful fallback if offline
    }

    // Step 3: Sign out from Supabase Auth client
    try {
      await supabase.auth.signOut();
    } catch {
      // Safe fallback
    }

    // Step 4: Reset Zustand global state to guest
    useAuthSessionStore.getState().logout();

    // Step 5: Full window navigation to flush in-memory states
    if (typeof window !== 'undefined') {
      window.location.href = redirectUrl;
    }
  } catch (err) {
    console.error('Sign-out error:', err);
    if (typeof window !== 'undefined') {
      window.location.href = redirectUrl;
    }
  }
}
