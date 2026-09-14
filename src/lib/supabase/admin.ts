import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-supabase.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceRoleKey) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL CONFIGURATION ERROR: SUPABASE_SERVICE_ROLE_KEY is missing in production environment. Server actions will fail RLS.');
  } else {
    console.warn('⚠️ WARNING: SUPABASE_SERVICE_ROLE_KEY is missing. Falling back to ANON key for development/test only.');
  }
}

/**
 * Privileged Supabase client using Service Role Key.
 * Bypasses RLS strictly for trusted server actions (order placement, ledger entries, atomic inventory sync).
 * NEVER import this file into client components ('use client').
 */
const activeKey =
  supabaseServiceRoleKey ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'placeholder-service-key';

export const supabaseAdmin: SupabaseClient = createClient(
  supabaseUrl,
  activeKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
