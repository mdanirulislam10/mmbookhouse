import { DealItem, DealStatus } from '@/types/deal';
import { getSyncedCurrentTime } from '@/lib/utils/serverTime';

// Helper to generate dynamic past time
export const getPastIsoTime = (hoursAgo: number, minutesAgo: number = 0): string => {
  const date = new Date(Date.now() - (hoursAgo * 3600 + minutesAgo * 60) * 1000);
  return date.toISOString();
};

// Helper to generate dynamic future time relative to runtime for realistic ticking countdown
export const getFutureIsoTime = (hoursAhead: number, minutesAhead: number = 0): string => {
  const date = new Date(Date.now() + (hoursAhead * 3600 + minutesAhead * 60) * 1000);
  return date.toISOString();
};

export const FLASH_DEALS: DealItem[] = [
  {
    id: 'deal-wbcs-manual-2026',
    bookId: 'book-wbcs-manual-2026',
    title: 'WBCS Preliminary & Main Exam Manual (2026 Edition)',
    titleBn: 'WBCS প্রিলিমিনারি ও মেইনস কমপ্লিট ম্যানুয়াল (২০২৬ সংস্করণ)',
    author: 'Dr. Ashok Kumar Ghosh & Nitin Singhania Team',
    authorBn: 'ড. অশোক কুমার ঘোষ ও নিতিন সিংহানিয়া বিশেষজ্ঞ টিম',
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    mrp: 950,
    dealPrice: 520,
    discountPercentage: 45,
    claimedPercentage: 72,
    totalStock: 50,
    claimedStock: 36,
    startTime: getPastIsoTime(2, 0),
    endTime: getFutureIsoTime(4, 32), // ~4h 32m left
    dealType: 'deal_of_the_day',
    maxPerCustomer: 1,
    category: 'wbcs',
    categoryBn: 'WBCS স্পেশাল',
    rating: 4.8,
    reviewsCount: 342,
    badgeLabel: 'Deal of the Day',
    badgeLabelBn: 'আজকের সেরা ডিল',
  },
  {
    id: 'deal-ugb-ba-guide',
    bookId: 'book-ugb-ba-guide',
    title: 'UGB Semester 1-6 BA Honours History & Pol Science Master Guide',
    titleBn: 'গৌড়বঙ্গ বিশ্ববিদ্যালয় (UGB) বি.এ অনার্স সেমিস্টার ১-৬ মাস্টার গাইড',
    author: 'Prof. Subir Roy Chowdhury (Malda College)',
    authorBn: 'অধ্যাপক সুবীর রায়চৌধুরী (মালদা কলেজ ফ্যাকাল্টি)',
    coverImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80',
    mrp: 650,
    dealPrice: 420,
    discountPercentage: 35,
    claimedPercentage: 55,
    totalStock: 40,
    claimedStock: 22,
    startTime: getPastIsoTime(1, 15),
    endTime: getFutureIsoTime(2, 18), // ~2h 18m left
    dealType: 'lightning_deal',
    maxPerCustomer: 1,
    category: 'college',
    categoryBn: 'কলেজ সহায়িকা',
    rating: 4.7,
    reviewsCount: 189,
    badgeLabel: 'Lightning Deal',
    badgeLabelBn: 'ফ্ল্যাশ লাইটনিং ডিল',
  },
  {
    id: 'deal-malda-literature-combo',
    bookId: 'book-malda-literature-combo',
    title: 'Malda District Book Fair Literature Combo: 5 Classics Collector Edition',
    titleBn: 'মালদা জেলা বইমেলা উইকএন্ড স্পেশাল: ৫টি সেরা ক্লাসিক সাহিত্যের সেট',
    author: 'Rabindranath, Saratchandra & Bibhutibhushan Collection',
    authorBn: 'রবীন্দ্রনাথ, শরৎচন্দ্র ও বিভূতিভূষণ ক্লাসিক সংকলন',
    coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80',
    mrp: 1500,
    dealPrice: 750,
    discountPercentage: 50,
    claimedPercentage: 42,
    totalStock: 30,
    claimedStock: 12,
    startTime: getPastIsoTime(3, 0),
    endTime: getFutureIsoTime(8, 0), // ~8h left
    dealType: 'weekend_special',
    maxPerCustomer: 1,
    category: 'literature',
    categoryBn: 'উইকএন্ড স্পেশাল',
    rating: 4.9,
    reviewsCount: 420,
    badgeLabel: 'Weekend Special',
    badgeLabelBn: 'উইকএন্ড ধামাকা',
  },
  {
    id: 'deal-abta-madhyamik-2026',
    bookId: 'book-abta-madhyamik-2026',
    title: 'ABTA Madhyamik Test Paper 2026 with Complete Question Bank & Solved Papers',
    titleBn: 'ABTA মাধ্যমিক টেস্ট পেপার ২০২৬ (পূর্ণাঙ্গ উত্তরপত্র ও সলভড পেপারস)',
    author: 'ABTA Central Committee Experts',
    authorBn: 'নিখিলবঙ্গ শিক্ষক সমিতি (ABTA) বিশেষজ্ঞ পরিষদ',
    coverImage: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80',
    mrp: 450,
    dealPrice: 270,
    discountPercentage: 40,
    claimedPercentage: 88,
    totalStock: 100,
    claimedStock: 88,
    startTime: getPastIsoTime(0, 45),
    endTime: getFutureIsoTime(6, 45), // ~6h 45m left
    dealType: 'limited_time',
    maxPerCustomer: 1,
    category: 'school',
    categoryBn: 'মাধ্যমিক টেস্ট পেপার',
    rating: 4.9,
    reviewsCount: 512,
    badgeLabel: 'Limited Time Deal',
    badgeLabelBn: 'সীমিত সময়ের অফার',
  },
  {
    id: 'deal-wbcs-mains-optional',
    bookId: 'book-wbcs-mains-optional',
    title: 'WBCS Mains Optional History & Anthropology 10-Year Question Solution Kit',
    titleBn: 'WBCS মেইনস অপশনাল পেপারস কিট (ইতিহাস ও নৃবিজ্ঞান বিগত ১০ বছরের সমাধান)',
    author: 'WBCS Toppers & Academic Faculty Circle',
    authorBn: 'WBCS টপার্স ও মালদা বিশিষ্ট অধ্যাপকমণ্ডলী',
    coverImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=80',
    mrp: 1100,
    dealPrice: 550,
    discountPercentage: 50,
    claimedPercentage: 0,
    totalStock: 40,
    claimedStock: 0,
    startTime: getFutureIsoTime(1, 30), // Starts in ~1h 30m (UPCOMING DEAL!)
    endTime: getFutureIsoTime(9, 30),
    dealType: 'deal_of_the_day',
    maxPerCustomer: 1,
    category: 'wbcs',
    categoryBn: 'আসন্ন ডিল',
    rating: 4.9,
    reviewsCount: 160,
    badgeLabel: 'Starts Soon',
    badgeLabelBn: 'শীঘ্রই শুরু হচ্ছে',
    notifyEnabled: true,
  },
];

/**
 * Task 27 & 30: Cross-Page Promotion Lookup with Server-Clock Drift Prevention
 * Returns active deal for a book if any exists based on synchronized IST clock
 */
export function getActiveDealForBook(bookId: string, referenceTimeMs: number = getSyncedCurrentTime()): DealItem | null {
  const deal = FLASH_DEALS.find((d) => d.bookId === bookId);
  if (!deal) return null;

  const startMs = new Date(deal.startTime).getTime();
  const endMs = new Date(deal.endTime).getTime();

  if (referenceTimeMs >= startMs && referenceTimeMs < endMs) {
    return deal;
  }
  return null;
}

/**
 * Task 28 & 30: Determine deal status (upcoming, active, or expired) using server-synced time
 */
export function getDealStatus(deal: DealItem, referenceTimeMs: number = getSyncedCurrentTime()): DealStatus {
  const startMs = new Date(deal.startTime).getTime();
  const endMs = new Date(deal.endTime).getTime();

  if (referenceTimeMs < startMs) {
    return 'upcoming';
  }
  if (referenceTimeMs >= endMs) {
    return 'expired';
  }
  return 'active';
}

/**
 * Task 28 & 30: Filter deals by status using server-synced time
 */
export function getAllDealsByStatus(status: DealStatus, referenceTimeMs: number = getSyncedCurrentTime()): DealItem[] {
  return FLASH_DEALS.filter((deal) => getDealStatus(deal, referenceTimeMs) === status);
}

