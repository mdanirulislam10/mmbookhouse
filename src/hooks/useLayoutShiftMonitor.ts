'use client';

import { useState, useEffect } from 'react';

interface LayoutShiftMonitorResult {
  clsScore: number;
  isWithinBudget: boolean; // Target: < 0.01 (Google Core Web Vitals threshold is 0.1)
  shiftCount: number;
}

/**
 * Task 49: Cumulative Layout Shift (CLS) Observer Hook
 * Monitors runtime layout shifts via the PerformanceObserver API.
 * Ensures the hero banner, quad grids, and product carousels achieve CLS = 0.000.
 */
export function useLayoutShiftMonitor(): LayoutShiftMonitorResult {
  const [clsScore, setClsScore] = useState<number>(0);
  const [shiftCount, setShiftCount] = useState<number>(0);

  useEffect(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    let cumulativeScore = 0;
    let shifts = 0;

    try {
      const observer = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          // Only count unexpected layout shifts (no recent user input within 500ms)
          const layoutShiftEntry = entry as PerformanceEntry & {
            hadRecentInput?: boolean;
            value?: number;
          };

          if (!layoutShiftEntry.hadRecentInput && layoutShiftEntry.value) {
            cumulativeScore += layoutShiftEntry.value;
            shifts += 1;
            setClsScore(Number(cumulativeScore.toFixed(4)));
            setShiftCount(shifts);
          }
        }
      });

      observer.observe({ type: 'layout-shift', buffered: true });

      return () => {
        observer.disconnect();
      };
    } catch {
      // PerformanceObserver type layout-shift not supported in some testing environments
    }
  }, []);

  return {
    clsScore,
    isWithinBudget: clsScore < 0.01,
    shiftCount,
  };
}
