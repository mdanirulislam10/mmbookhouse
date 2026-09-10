'use client';

import { useEffect, useRef } from 'react';

interface UseScrollToResultsOptions {
  containerId?: string;
  headerOffset?: number;
  triggerDeps: any[];
  enabled?: boolean;
}

/**
 * Smart auto scroll-to-top mechanism for faceted search & catalog
 * Module 6 - Task 6
 * Mutes scrolling when mobile modal/drawer is open to avoid background layout shifts.
 */
export function useScrollToResults({
  containerId = 'search-results-main',
  headerOffset = 120,
  triggerDeps,
  enabled = true,
}: UseScrollToResultsOptions) {
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Skip scroll on initial page render
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Skip scroll if disabled (e.g. while mobile drawer is open)
    if (!enabled) return;

    // When filters or sorting change, smoothly scroll to top of results container
    const element = document.getElementById(containerId);
    if (!element) return;

    const elementRect = element.getBoundingClientRect();
    const currentScrollY = window.scrollY || window.pageYOffset;
    const targetScrollY = currentScrollY + elementRect.top - headerOffset;

    // Only scroll if the user has scrolled below the container top
    if (elementRect.top < headerOffset - 20) {
      window.scrollTo({
        top: Math.max(0, targetScrollY),
        behavior: 'smooth',
      });
    }
  }, triggerDeps); // eslint-disable-line react-hooks/exhaustive-deps
}
