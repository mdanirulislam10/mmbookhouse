import { ComboDeal } from '@/types/combo';
import { WBCS_BESTSELLERS, MALDA_STUDENT_FAVORITES, UGB_COLLEGE_TEXTBOOKS } from './carouselBooks';

export const SUPER_SAVER_COMBOS: ComboDeal[] = [
  {
    id: 'combo-wbcs-prelims-mega',
    title: 'WBCS 2026 Prelims 3-Book Mega Success Pack',
    titleBn: 'WBCS ২০২৬ মেগা প্রিলিমস ৩-বুক কম্বো প্যাক',
    subtitleBn: 'ম্যানুয়াল + ২০ বছরের স্ক্যানার + আধুনিক ভারতের ইতিহাস — এক সাথে কিনুন এবং অতিরিক্ত ৩৮% সাশ্রয় করুন!',
    badgeBn: '🔥 মেগা সেভার কম্বো',
    badgeType: 'hot',
    books: [
      WBCS_BESTSELLERS[0], // Manual (850 MRP)
      WBCS_BESTSELLERS[1], // Scanner (650 MRP)
      WBCS_BESTSELLERS[2], // Modern History (450 MRP)
    ],
    totalMrp: 1950,
    comboPrice: 1199,
    savingsAmount: 751,
    savingsPercentage: 38,
    freeDelivery: true,
  },
  {
    id: 'combo-hs-madhyamik-bundle',
    title: 'WBCHSE 2026 ABTA Test Paper & Complete Guide Combo',
    titleBn: 'উচ্চমাধ্যমিক ২০২৬ এবিটিএ ও মালদা জেলা স্পেশাল ৩-বুক সেট',
    subtitleBn: 'ABTA টেস্ট পেপার + ১০০% কমন সাজেশন + উত্তরবঙ্গ স্পেশাল জিকে সেট',
    badgeBn: '🎯 এইচ.এস টপার্স কম্বো',
    badgeType: 'value',
    books: [
      MALDA_STUDENT_FAVORITES[2], // WBCHSE ABTA Test Paper (350 MRP)
      MALDA_STUDENT_FAVORITES[7], // Madhyamik / HS Suggestion (300 MRP)
      MALDA_STUDENT_FAVORITES[1], // North Bengal & Malda Geography (350 MRP)
    ],
    totalMrp: 1000,
    comboPrice: 680,
    savingsAmount: 320,
    savingsPercentage: 32,
    freeDelivery: true,
  },
  {
    id: 'combo-ugb-history-companion',
    title: 'Gour Banga University History Honours Semester Bundle',
    titleBn: 'গৌড়বঙ্গ বিশ্ববিদ্যালয় ইতিহাস অনার্স সেমিস্টার কমপ্লিট বান্ডেল',
    subtitleBn: 'ইউরোপের রূপান্তর (রেনেসাঁস থেকে WWII) + UGB অনার্স মাস্টার গাইড',
    badgeBn: '📚 UGB সেমিস্টার ডিল',
    badgeType: 'seasonal',
    books: [
      MALDA_STUDENT_FAVORITES[0], // UGB BA Honours History Companion (450 MRP)
      UGB_COLLEGE_TEXTBOOKS[0],   // Modern Europe (425 MRP)
    ],
    totalMrp: 875,
    comboPrice: 590,
    savingsAmount: 285,
    savingsPercentage: 33,
    freeDelivery: true,
  },
];
