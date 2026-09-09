export type DealType = 'deal_of_the_day' | 'lightning_deal' | 'limited_time' | 'weekend_special';

export type DealStatus = 'upcoming' | 'active' | 'expired';

export interface DealItem {
  id: string;
  bookId: string;
  title: string;
  titleBn: string;
  author: string;
  authorBn: string;
  coverImage: string;
  mrp: number;
  dealPrice: number;
  discountPercentage: number;
  claimedPercentage: number; // e.g. 72 for 72%
  totalStock: number;
  claimedStock: number;
  startTime: string; // ISO date string e.g. 2026-09-08T18:00:00Z
  endTime: string; // ISO date string e.g. 2026-09-08T22:00:00Z
  dealType: DealType;
  maxPerCustomer: number; // default 1
  category: string;
  categoryBn: string;
  rating: number;
  reviewsCount: number;
  badgeLabel?: string;
  badgeLabelBn?: string;
  notifyEnabled?: boolean;
}

export interface CountdownState {
  hours: number;
  minutes: number;
  seconds: number;
  totalSecondsLeft: number;
  isExpired: boolean;
  isUpcoming: boolean;
  status: DealStatus;
  formattedTime: string;
  formattedTimeBn: string;
}

