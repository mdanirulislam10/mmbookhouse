import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";

/** Cookie-less anon client for cacheable, non-personalised reads. */
export function createPublicClient() {
  return createClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
