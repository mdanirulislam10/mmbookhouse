export interface BannerAnalyticsMetric {
  bannerId: string;
  bannerTitle: string;
  impressions: number;
  clicks: number;
  conversions: number;
  lastInteraction: string;
}

export interface BannerAnalyticsSummary {
  totalImpressions: number;
  totalClicks: number;
  averageCtr: number;
  metrics: Record<string, BannerAnalyticsMetric>;
}
