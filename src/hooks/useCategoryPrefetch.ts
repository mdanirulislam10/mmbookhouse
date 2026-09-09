'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

// Module-level persistent cache across component unmounts/remounts
const prefetchedUrls = new Set<string>();

/**
 * Task 20: Next.js Soft Pre-fetching Optimization Hook
 * Pre-fetches category routes on mouse hover (pointerEnter) to eliminate page-transition latency.
 */
export function useCategoryPrefetch() {
  const router = useRouter();

  const prefetchUrl = useCallback(
    (url: string) => {
      if (!url || !url.startsWith('/')) return;
      if (prefetchedUrls.has(url)) return;

      try {
        router.prefetch(url);
        prefetchedUrls.add(url);
      } catch {
        // Ignore prefetch failures in unsupported environments
      }
    },
    [router]
  );

  return { prefetchUrl };
}
