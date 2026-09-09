'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { BannerAnalyticsMetric, BannerAnalyticsSummary } from '@/types/analytics';

const ANALYTICS_STORAGE_KEY = 'mm_banner_analytics_v1';

export function useBannerAnalytics() {
  const [metrics, setMetrics] = useState<Record<string, BannerAnalyticsMetric>>({});
  const recentImpressions = useRef<Map<string, number>>(new Map());

  // Load metrics from storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(ANALYTICS_STORAGE_KEY);
      if (stored) {
        setMetrics(JSON.parse(stored));
      }
    } catch {
      // Ignore
    }
  }, []);

  // Save metrics to storage
  const saveMetrics = useCallback((updated: Record<string, BannerAnalyticsMetric>) => {
    setMetrics(updated);
    try {
      localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  }, []);

  // Track an impression (debounced to 1 impression per 10s per banner)
  const trackImpression = useCallback((bannerId: string, bannerTitle: string) => {
    if (!bannerId) return;

    const now = Date.now();
    const lastTime = recentImpressions.current.get(bannerId) || 0;
    if (now - lastTime < 10000) {
      return; // Skip duplicate impression within 10s
    }
    recentImpressions.current.set(bannerId, now);

    setMetrics((prev) => {
      const existing = prev[bannerId] || {
        bannerId,
        bannerTitle,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        lastInteraction: new Date().toISOString(),
      };

      const updated = {
        ...prev,
        [bannerId]: {
          ...existing,
          bannerTitle,
          impressions: existing.impressions + 1,
          lastInteraction: new Date().toISOString(),
        },
      };

      try {
        localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore
      }

      return updated;
    });
  }, []);

  // Track a banner click
  const trackClick = useCallback((bannerId: string, bannerTitle: string) => {
    if (!bannerId) return;

    setMetrics((prev) => {
      const existing = prev[bannerId] || {
        bannerId,
        bannerTitle,
        impressions: 1,
        clicks: 0,
        conversions: 0,
        lastInteraction: new Date().toISOString(),
      };

      const updated = {
        ...prev,
        [bannerId]: {
          ...existing,
          clicks: existing.clicks + 1,
          lastInteraction: new Date().toISOString(),
        },
      };

      try {
        localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore
      }

      return updated;
    });
  }, []);

  // Track a conversion (e.g. Add to cart / Buy from banner)
  const trackConversion = useCallback((bannerId: string) => {
    if (!bannerId) return;

    setMetrics((prev) => {
      const existing = prev[bannerId];
      if (!existing) return prev;

      const updated = {
        ...prev,
        [bannerId]: {
          ...existing,
          conversions: existing.conversions + 1,
          lastInteraction: new Date().toISOString(),
        },
      };

      try {
        localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore
      }

      return updated;
    });
  }, []);

  // Get summary of all metrics
  const getSummary = useCallback((): BannerAnalyticsSummary => {
    const list = Object.values(metrics);
    const totalImpressions = list.reduce((sum, item) => sum + item.impressions, 0);
    const totalClicks = list.reduce((sum, item) => sum + item.clicks, 0);
    const averageCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    return {
      totalImpressions,
      totalClicks,
      averageCtr,
      metrics,
    };
  }, [metrics]);

  const clearMetrics = useCallback(() => {
    recentImpressions.current.clear();
    setMetrics({});
    try {
      localStorage.removeItem(ANALYTICS_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  return {
    metrics,
    trackImpression,
    trackClick,
    trackConversion,
    getSummary,
    clearMetrics,
  };
}
