'use client';

import { useCallback } from 'react';

export interface CategoryEventPayload {
  event: 'drawer_open' | 'drawer_close' | 'category_select' | 'subcategory_click' | 'subnav_click';
  categoryId?: string;
  categoryTitle?: string;
  slug?: string;
  source?: 'drawer' | 'subnav' | 'header';
  timestamp?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Task 47: Category Engagement Event Analytics Hook
 * - Lightweight structured telemetry for Mega Drawer and Sub-nav interactions
 * - Emits standard browser CustomEvents ('mm:category_event') for GA4/GTM/Pixel listeners
 * - Development logging for debugging without adding heavy external tracking libraries
 */
export function useCategoryAnalytics() {
  const trackCategoryEvent = useCallback((payload: CategoryEventPayload) => {
    try {
      const fullPayload = {
        ...payload,
        timestamp: payload.timestamp || Date.now(),
      };

      if (typeof window !== 'undefined') {
        const customEvent = new CustomEvent('mm:category_event', { detail: fullPayload });
        window.dispatchEvent(customEvent);

        if (process.env.NODE_ENV === 'development') {
          console.debug('[Category Analytics]', fullPayload.event, fullPayload);
        }
      }
    } catch {
      // Non-blocking telemetry fallback
    }
  }, []);

  return { trackCategoryEvent };
}
