import { Sparkles, Flame, BookOpen, GraduationCap, School, Clock, Headphones, Award } from 'lucide-react';
import React from 'react';

export interface SubnavLinkItem {
  id: string;
  label: string;
  labelBn: string;
  labelEn: string;
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
    labelBn: 'আজকের ডিলস',
    labelEn: "Today's Deals",
    href: '/deals',
    icon: Sparkles,
    iconColor: 'text-amber-400',
    badge: 'HOT',
    badgeColor: 'bg-red-500 text-white',
  },
  {
    id: 'bestsellers',
    label: 'বেস্টসেলার',
    labelBn: 'বেস্টসেলার',
    labelEn: 'Bestsellers',
    href: '/bestsellers',
    icon: Award,
    iconColor: 'text-yellow-400',
  },
  {
    id: 'wbcs',
    label: 'WBCS স্পেশাল',
    labelBn: 'WBCS স্পেশাল',
    labelEn: 'WBCS Special',
    href: '/category/wbcs',
    icon: BookOpen,
    iconColor: 'text-blue-300',
  },
  {
    id: 'college',
    label: 'কলেজ সেমিস্টার',
    labelBn: 'কলেজ সেমিস্টার',
    labelEn: 'College Semesters',
    href: '/category/college',
    icon: GraduationCap,
    iconColor: 'text-emerald-300',
  },
  {
    id: 'school',
    label: 'স্কুল বোর্ড',
    labelBn: 'স্কুল বোর্ড',
    labelEn: 'School Education',
    href: '/category/school',
    icon: School,
    iconColor: 'text-purple-300',
  },
  {
    id: 'new-arrivals',
    label: 'নতুন বই',
    labelBn: 'নতুন বই',
    labelEn: 'New Arrivals',
    href: '/new-arrivals',
    icon: Clock,
    iconColor: 'text-amber-300',
    badge: 'NEW',
    badgeColor: 'bg-emerald-600 text-white',
  },
  {
    id: 'support',
    label: 'গ্রাহক সেবা',
    labelBn: 'গ্রাহক সেবা',
    labelEn: 'Customer Service',
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
  textBn?: string;
  textEn?: string;
  href?: string;
  highlight?: boolean;
}

export const DEFAULT_TICKER_NOTICES: TickerNotice[] = [
  {
    id: 'fair-discount',
    text: '📢 মালদা জেলা বইমেলা উপলক্ষ্যে বিশেষ ২০% অতিরিক্ত ছাড়!',
    textBn: '📢 মালদা জেলা বইমেলা উপলক্ষ্যে বিশেষ ২০% অতিরিক্ত ছাড়!',
    textEn: '📢 Special 20% Extra Discount for Malda Book Fair!',
    href: '/deals',
    highlight: true,
  },
  {
    id: 'wbcs-forms',
    text: '⚡ ২০২৬ সালের WBCS প্রিলিমিনারি নতুন সিলেবাস বই স্টকে এসেছে',
    textBn: '⚡ ২০২৬ সালের WBCS প্রিলিমিনারি নতুন সিলেবাস বই স্টকে এসেছে',
    textEn: '⚡ 2026 WBCS Prelims New Syllabus Books Now in Stock',
    href: '/category/wbcs',
    highlight: false,
  },
  {
    id: 'ugb-sem',
    text: '🎓 গৌড়বঙ্গ বিশ্ববিদ্যালয় ৩য় ও ৫ম সেমিস্টার সহায়িকা সহজলভ্য',
    textBn: '🎓 গৌড়বঙ্গ বিশ্ববিদ্যালয় ৩য় ও ৫ম সেমিস্টার সহায়িকা সহজলভ্য',
    textEn: '🎓 Gour Banga University Sem 3 & 5 Guides Readily Available',
    href: '/category/college',
    highlight: false,
  },
];
