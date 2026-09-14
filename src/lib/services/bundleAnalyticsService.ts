/**
 * Module 15 - Task 9: Bundle Analytics & Conversion Attribution Service
 * Complies with:
 * - Item 28: Logging & Conversion Attribution
 * - Item 45: Attach Rate Target (15% - 25%)
 * - Item 46: AOV Uplift Tracking (+25% to +40%)
 * - Item 47: A/B Testing Telemetry (Control vs Algorithmic vs Curated)
 */

import { BundleAnalyticsEvent, AttachRateStats } from '../../types/bundle';

export interface AbTestVariantStats {
  variant: string;
  impressions: number;
  clicks: number;
  conversions: number;
  click_through_rate: number; // (clicks / impressions) * 100
  conversion_rate: number; // (conversions / impressions) * 100
  total_revenue: number;
  average_order_value: number;
}

/**
 * Creates and normalizes a bundle analytics event
 */
export function createBundleEvent(
  params: Omit<BundleAnalyticsEvent, 'id' | 'timestamp'>
): BundleAnalyticsEvent {
  return {
    ...params,
    id: `event-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Computes Attach Rate and AOV Uplift from raw analytics logs (Items 45, 46)
 * Target Attach Rate: 15% - 25%
 */
export function calculateAttachRateStats(
  events: BundleAnalyticsEvent[],
  totalPrimaryBookOrders: number,
  standardOrderAmounts: number[] = [220, 180, 250, 190, 210]
): AttachRateStats {
  let impressions = 0;
  let clicks = 0;
  const bundleOrderAmounts: number[] = [];

  for (const ev of events) {
    if (ev.event_type === 'IMPRESSION') impressions++;
    if (ev.event_type === 'CLICK') clicks++;
    if (ev.event_type === 'CONVERT') {
      bundleOrderAmounts.push(ev.total_amount || 0);
    }
  }

  const bundleConversions = bundleOrderAmounts.length;

  // Attach rate formula: (bundle orders / total primary book buyers) * 100
  const attachRatePercentage =
    totalPrimaryBookOrders > 0
      ? Math.round((bundleConversions / totalPrimaryBookOrders) * 1000) / 10
      : 0;

  // AOV calculations
  const avgBundleAov =
    bundleOrderAmounts.length > 0
      ? Math.round(
          (bundleOrderAmounts.reduce((sum, val) => sum + val, 0) / bundleOrderAmounts.length) * 100
        ) / 100
      : 0;

  const avgStandardAov =
    standardOrderAmounts.length > 0
      ? Math.round(
          (standardOrderAmounts.reduce((sum, val) => sum + val, 0) / standardOrderAmounts.length) * 100
        ) / 100
      : 0;

  // AOV uplift percentage formula: ((avgBundle - avgStandard) / avgStandard) * 100
  const aovUpliftPercentage =
    avgStandardAov > 0
      ? Math.round(((avgBundleAov - avgStandardAov) / avgStandardAov) * 1000) / 10
      : 0;

  return {
    total_pdp_impressions: impressions,
    total_bundle_clicks: clicks,
    total_bundle_conversions: bundleConversions,
    attach_rate_percentage: attachRatePercentage,
    average_order_value_bundle: avgBundleAov,
    average_order_value_standard: avgStandardAov,
    aov_uplift_percentage: aovUpliftPercentage,
  };
}

/**
 * Computes A/B Testing Telemetry breakdown across experimental cohorts (Item 47)
 * Cohorts:
 * - Variant A: Control (No bundle shown)
 * - Variant B: Algorithmic Co-Purchase
 * - Variant C: Curated Bundle with Combo Savings
 */
export function computeAbTestBreakdown(
  eventsWithVariant: (BundleAnalyticsEvent & { variant: 'A' | 'B' | 'C' })[]
): Record<'A' | 'B' | 'C', AbTestVariantStats> {
  const stats: Record<'A' | 'B' | 'C', {
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
  }> = {
    A: { impressions: 0, clicks: 0, conversions: 0, revenue: 0 },
    B: { impressions: 0, clicks: 0, conversions: 0, revenue: 0 },
    C: { impressions: 0, clicks: 0, conversions: 0, revenue: 0 },
  };

  for (const ev of eventsWithVariant) {
    const v = ev.variant || 'A';
    if (!stats[v]) continue;

    if (ev.event_type === 'IMPRESSION') stats[v].impressions++;
    if (ev.event_type === 'CLICK') stats[v].clicks++;
    if (ev.event_type === 'CONVERT') {
      stats[v].conversions++;
      stats[v].revenue += ev.total_amount || 0;
    }
  }

  const result: Record<'A' | 'B' | 'C', AbTestVariantStats> = {} as any;

  (['A', 'B', 'C'] as const).forEach((key) => {
    const s = stats[key];
    const ctr = s.impressions > 0 ? Math.round((s.clicks / s.impressions) * 1000) / 10 : 0;
    const cr = s.impressions > 0 ? Math.round((s.conversions / s.impressions) * 1000) / 10 : 0;
    const aov = s.conversions > 0 ? Math.round((s.revenue / s.conversions) * 100) / 100 : 0;

    result[key] = {
      variant: key,
      impressions: s.impressions,
      clicks: s.clicks,
      conversions: s.conversions,
      click_through_rate: ctr,
      conversion_rate: cr,
      total_revenue: Math.round(s.revenue * 100) / 100,
      average_order_value: aov,
    };
  });

  return result;
}
