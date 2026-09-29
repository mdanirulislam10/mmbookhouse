"use client";

import { useEffect } from "react";
import { parseRecent, pushRecent, RECENT_COOKIE, serializeRecent } from "@/lib/recent";

/** Remembers that this book was viewed (cookie, 90 days). Renders nothing. */
export function RecentTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const current = document.cookie.split("; ").find((c) => c.startsWith(`${RECENT_COOKIE}=`))?.slice(RECENT_COOKIE.length + 1);
    const next = serializeRecent(pushRecent(parseRecent(current), slug));
    document.cookie = `${RECENT_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 90}; samesite=lax`;
  }, [slug]);
  return null;
}
