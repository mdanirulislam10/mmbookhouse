import { CustomerExamPreference } from '@/types/auth';

export interface ExamPreferenceOption {
  id: CustomerExamPreference;
  nameBn: string;
  nameEn: string;
  taglineBn: string;
  icon: string;
  popularTag?: string;
  gradientClass: string;
  activeBorderClass: string;
}

export const EXAM_PREFERENCE_OPTIONS: ExamPreferenceOption[] = [
  {
    id: 'wbcs',
    nameBn: 'WBCS ও সিভিল সার্ভিস',
    nameEn: 'WBCS & State PSC',
    taglineBn: 'প্রিলিমস, মেনস ও প্র্যাকটিস সেটের সমস্ত রেফারেন্স বই',
    icon: '🏛️',
    popularTag: 'সবচেয়ে জনপ্রিয়',
    gradientClass: 'from-amber-50 to-orange-50/40',
    activeBorderClass: 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-200',
  },
  {
    id: 'ugb',
    nameBn: 'গৌড়বঙ্গ বিশ্ববিদ্যালয় (UGB)',
    nameEn: 'Univ of Gour Banga',
    taglineBn: 'মালদা ও উত্তরবঙ্গের কলেজ ও ইউজিবি সেমিস্টার টেক্সটবুক',
    icon: '🎓',
    popularTag: 'মালদা স্পেশাল',
    gradientClass: 'from-blue-50 to-indigo-50/40',
    activeBorderClass: 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-200',
  },
  {
    id: 'primary_tet',
    nameBn: 'প্রাথমিক টেট ও শিক্ষক নিয়োগ',
    nameEn: 'Primary TET / SLST',
    taglineBn: 'WB Primary TET, Upper Primary ও SLST গাইড বুক',
    icon: '📚',
    popularTag: 'পরীক্ষা প্রস্তুতি',
    gradientClass: 'from-emerald-50 to-teal-50/40',
    activeBorderClass: 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-200',
  },
  {
    id: 'wb_police',
    nameBn: 'পশ্চিমবঙ্গ পুলিশ (WBP / KP)',
    nameEn: 'WB Police & KP SI',
    taglineBn: 'কনস্টেবল, লেডি কনস্টেবল ও এসআই নিয়োগ প্রস্তুতি',
    icon: '👮‍♂️',
    popularTag: 'হট ট্রেন্ডিং',
    gradientClass: 'from-sky-50 to-cyan-50/40',
    activeBorderClass: 'border-sky-500 bg-sky-50/60 ring-2 ring-sky-200',
  },
  {
    id: 'ssc_csl',
    nameBn: 'এসএসসি (SSC CGL / CHSL)',
    nameEn: 'Staff Selection Commission',
    taglineBn: 'কেন্দ্রীয় সরকারি চাকরি, সিজিএল ও এমটিএস প্র্যাকটিস বুক',
    icon: '🏢',
    gradientClass: 'from-purple-50 to-pink-50/40',
    activeBorderClass: 'border-purple-500 bg-purple-50/60 ring-2 ring-purple-200',
  },
  {
    id: 'railway',
    nameBn: 'ভারতীয় রেলওয়ে (RRB)',
    nameEn: 'Railway NTPC & Group D',
    taglineBn: 'রেল রিক্রুটমেন্ট বোর্ডের টেকনিক্যাল ও নন-টেকনিক্যাল বই',
    icon: '🚆',
    gradientClass: 'from-rose-50 to-red-50/40',
    activeBorderClass: 'border-rose-500 bg-rose-50/60 ring-2 ring-rose-200',
  },
  {
    id: 'higher_secondary',
    nameBn: 'উচ্চমাধ্যমিক (XI - XII)',
    nameEn: 'WBCHSE Higher Secondary',
    taglineBn: 'কলা, বিজ্ঞান ও বাণিজ্য বিভাগের সিলেবাস ও সহায়িকা বই',
    icon: '🔬',
    gradientClass: 'from-violet-50 to-purple-50/40',
    activeBorderClass: 'border-violet-500 bg-violet-50/60 ring-2 ring-violet-200',
  },
  {
    id: 'madhyamik',
    nameBn: 'মাধ্যমিক (Class X)',
    nameEn: 'WBBSE Madhyamik',
    taglineBn: 'মাধ্যমিক টেস্ট পেপারস, পাঠ্যবই ও প্রশ্নোত্তরের সম্ভার',
    icon: '📝',
    gradientClass: 'from-yellow-50 to-amber-50/40',
    activeBorderClass: 'border-yellow-500 bg-yellow-50/60 ring-2 ring-yellow-200',
  },
  {
    id: 'general',
    nameBn: 'সাধারণ সাহিত্য ও জ্ঞানচর্চা',
    nameEn: 'General & Bengali Classics',
    taglineBn: 'উপন্যাস, গল্প সমগ্র, ইতিহাস ও আত্মউন্নয়নমূলক জনপ্রিয় বই',
    icon: '📖',
    gradientClass: 'from-stone-50 to-neutral-50/40',
    activeBorderClass: 'border-stone-500 bg-stone-50/60 ring-2 ring-stone-200',
  },
];
