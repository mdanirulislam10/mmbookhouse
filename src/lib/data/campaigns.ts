import { SeasonalCampaign } from '@/types/campaign';

export const SCHEDULED_CAMPAIGNS: SeasonalCampaign[] = [
  {
    id: 'campaign-malda-bookfair-2026',
    name: 'Malda District Book Fair & Academic Festival 2026',
    nameBn: 'মালদা জেলা বইমেলা ও নতুন শিক্ষাবর্ষ মেগা কার্নিভাল ২০২৬',
    startDate: '2026-01-01T00:00:00.000Z',
    endDate: '2026-12-31T23:59:59.999Z',
    isActive: true,
    priority: 10,
    theme: {
      gradient: 'from-amber-600 via-orange-600 to-rose-700',
      accentColor: '#ffd814',
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
      badgeText: '🎪 স্পেশাল সিজনাল কার্নিভাল',
      bannerHeadingBn: 'মালদা জেলা বইমেলা ও নতুন শিক্ষাবর্ষ মেগা অফার!',
      bannerSubheadingBn: 'সমস্ত কলেজ টেক্সটবুক, WBCS ও মাধ্যমিক-উচ্চমাধ্যমিকে অতিরিক্ত ২০% পর্যন্ত ছাড় + মালদায় ফ্রি ডেলিভারি',
      ctaTextBn: 'উৎসবের অফারসমূহ দেখুন',
      ctaLink: '/deals',
      urgencyTextBn: 'সীমিত সময়ের অফার • দ্রুত অর্ডার করুন',
    },
  },
  {
    id: 'campaign-puja-festival-2026',
    name: 'Durga Puja Sharodiya Boi Utsav 2026',
    nameBn: 'শারদীয়া বই উৎসব ও সাহিত্য মেলা ২০২৬',
    startDate: '2026-10-01T00:00:00.000Z',
    endDate: '2026-10-31T23:59:59.999Z',
    isActive: false,
    priority: 5,
    theme: {
      gradient: 'from-red-700 via-amber-700 to-orange-800',
      accentColor: '#f7ca00',
      badgeBg: 'bg-rose-100 text-rose-900 border-rose-300',
      badgeText: '🪔 শারদ উৎসব স্পেশাল',
      bannerHeadingBn: 'শারদীয়া পূজাবার্ষিকী ও ক্ল্যাসিক সাহিত্য সমাহার',
      bannerSubheadingBn: 'বাঙালি লেখকদের কালজয়ী সাহিত্য ও নতুন পূজা সংস্করণে বিশেষ উৎসব প্যাকেজ',
      ctaTextBn: 'সাহিত্য সম্ভার দেখুন',
      ctaLink: '/search?category=literature',
      urgencyTextBn: 'পূজা স্পেশাল উপহার প্যাক',
    },
  },
];
