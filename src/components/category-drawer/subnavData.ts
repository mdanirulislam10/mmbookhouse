import { Sparkles, Flame, BookOpen, GraduationCap, School, Clock, Headphones, Award } from 'lucide-react';
import React from 'react';

export interface SubnavLinkItem {
  id: string;
  label: string;
  href: string;
  icon?: React.ElementType;
  iconColor?: string;
  badge?: 'HOT' | 'NEW' | 'SALE';
  badgeColor?: string;
  isExternal?: boolean;
}

/**
 * Task 6: Top Sub-nav Quick Links
 * Amazon-pattern curated quick navigation items:
 * "বেস্টসেলার", "আজকের ডিলস", "WBCS স্পেশাল", "কলেজ সেমিস্টার", "স্কুল বোর্ড", "নতুন বই", "গ্রাহক সেবা"
 */
export const DEFAULT_SUBNAV_LINKS: SubnavLinkItem[] = [
  {
    id: 'deals',
    label: 'আজকের ডিলস',
    href: '/deals',
    icon: Sparkles,
    iconColor: 'text-amber-400',
    badge: 'HOT',
    badgeColor: 'bg-red-500 text-white',
  },
  {
    id: 'bestsellers',
    label: 'বেস্টসেলার',
    href: '/bestsellers',
    icon: Award,
    iconColor: 'text-yellow-400',
  },
  {
    id: 'wbcs',
    label: 'WBCS স্পেশাল',
    href: '/category/wbcs',
    icon: BookOpen,
    iconColor: 'text-blue-300',
  },
  {
    id: 'college',
    label: 'কলেজ সেমিস্টার',
    href: '/category/college',
    icon: GraduationCap,
    iconColor: 'text-emerald-300',
  },
  {
    id: 'school',
    label: 'স্কুল বোর্ড',
    href: '/category/school',
    icon: School,
    iconColor: 'text-purple-300',
  },
  {
    id: 'new-arrivals',
    label: 'নতুন বই',
    href: '/new-arrivals',
    icon: Clock,
    iconColor: 'text-amber-300',
    badge: 'NEW',
    badgeColor: 'bg-emerald-600 text-white',
  },
  {
    id: 'support',
    label: 'গ্রাহক সেবা',
    href: '/support',
    icon: Headphones,
    iconColor: 'text-gray-300',
  },
];

/**
 * Task 10: Curated Malda Student Hub & Ticker Items
 */
export interface TickerNotice {
  id: string;
  text: string;
  href?: string;
  highlight?: boolean;
}

export const DEFAULT_TICKER_NOTICES: TickerNotice[] = [
  {
    id: 'fair-discount',
    text: '📢 মালদা জেলা বইমেলা উপলক্ষ্যে বিশেষ ২০% অতিরিক্ত ছাড়!',
    href: '/deals',
    highlight: true,
  },
  {
    id: 'wbcs-forms',
    text: '⚡ ২০২৬ সালের WBCS প্রিলিমিনারি নতুন সিলেবাস বই স্টকে এসেছে',
    href: '/category/wbcs',
    highlight: false,
  },
  {
    id: 'ugb-sem',
    text: '🎓 গৌড়বঙ্গ বিশ্ববিদ্যালয় ৩য় ও ৫ম সেমিস্টার সহায়িকা সহজলভ্য',
    href: '/category/college',
    highlight: false,
  },
];
