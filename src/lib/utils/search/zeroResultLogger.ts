/**
 * Module 5 - Task 45: Zero-Result Search Analytics Logger ("Wanted Books")
 * Tracks unfulfilled book searches so merchants can identify missing stock and high-demand books.
 */

import { supabase } from '@/lib/supabase/client';

export interface WantedBookStat {
  query: string;
  category: string;
  count: number;
  lastSearchedAt: string;
}

// In-memory wanted books aggregator for instant merchant dashboard access
const wantedBooksStore = new Map<string, WantedBookStat>();

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export async function logZeroResultSearch(query: string, category: string, clientIp: string): Promise<void> {
  const clean = query.trim().toLowerCase();
  if (clean.length < 3) return;

  const key = `${clean}::${category || 'all'}`;
  const now = new Date().toISOString();

  // 1. Update in-memory aggregate store
  const existing = wantedBooksStore.get(key);
  if (existing) {
    existing.count += 1;
    existing.lastSearchedAt = now;
  } else {
    wantedBooksStore.set(key, {
      query: clean,
      category: category || 'all',
      count: 1,
      lastSearchedAt: now,
    });
  }

  // 2. Persist to Supabase if configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
    try {
      await supabase.from('zero_result_searches').insert({
        query: clean,
        category: category || 'all',
        ip_hash: hashString(clientIp),
        searched_at: now,
      });
    } catch {
      // Fail silently to never block or delay the search response
    }
  }
}

export function getTopWantedBooks(limit: number = 20): WantedBookStat[] {
  return Array.from(wantedBooksStore.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
