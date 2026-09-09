export interface HeroBanner {
  id: string;
  title: string;
  titleBn: string;
  subtitle: string;
  subtitleBn: string;
  description?: string;
  descriptionBn?: string;
  imageUrl?: string;
  mobileImageUrl?: string;
  targetUrl: string;
  ctaText: string;
  ctaTextBn: string;
  badgeText?: string;
  badgeTextBn?: string;
  bgGradient: string;
  badgeColor?: string;
  priority?: boolean;
}

export interface BannerSliderConfig {
  autoRotateInterval?: number; // default 5000ms
  pauseOnHover?: boolean;
  pauseOnTouch?: boolean;
  swipeThreshold?: number; // default 50px
}
