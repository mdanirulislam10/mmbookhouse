export interface QuadCardItem {
  id: string;
  title: string;
  titleBn: string;
  imageUrl: string;
  targetUrl: string;
  badgeText?: string;
  badgeTextBn?: string;
}

export interface QuadCardBlock {
  id: string;
  title: string;
  titleBn: string;
  subtitle?: string;
  subtitleBn?: string;
  seeMoreText: string;
  seeMoreTextBn: string;
  seeMoreUrl: string;
  items: [QuadCardItem, QuadCardItem, QuadCardItem, QuadCardItem]; // Exactly 4 items for 2x2 grid
}

export interface SpotlightUser {
  name: string;
  phone: string;
  isLoggedIn: boolean;
  avatarUrl?: string;
  recentCategory?: {
    name: string;
    nameBn: string;
    targetUrl: string;
  };
}
