export interface CampaignTheme {
  gradient: string;
  accentColor: string;
  badgeBg: string;
  badgeText: string;
  bannerHeadingBn: string;
  bannerSubheadingBn: string;
  ctaTextBn: string;
  ctaLink: string;
  urgencyTextBn?: string;
}

export interface SeasonalCampaign {
  id: string;
  name: string;
  nameBn: string;
  startDate: string; // ISO 8601 string
  endDate: string;   // ISO 8601 string
  isActive: boolean;
  priority: number;
  theme: CampaignTheme;
}
