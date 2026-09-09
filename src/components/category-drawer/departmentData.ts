import { CategoryItem } from '@/types/category-drawer';

/**
 * Tasks 13, 14, 15: Department Sub-Category Trees for Amazon 2nd-Layer Drill-Down
 *
 * Covers:
 * - Task 13: WBCS & Civil Services (Prelims, Mains, 10-Yr Solved, Mock Tests, Optionals)
 * - Task 14: University & College Semesters (UGB, CU, Semesters 1-6, BA/BSc/BCom)
 * - Task 15: Board Schooling (Madhyamik, HS, WBBSE/WBCHSE) & Govt Exams (Rail, SSC, Police, TET)
 */
export const DEPARTMENT_SUBCATEGORIES: Record<string, CategoryItem[]> = {
  // Task 13: WBCS & সিভিল সার্ভিস ডিপার্টমেন্ট
  'dept-wbcs': [
    {
      id: 'wbcs-all',
      title: 'All WBCS & Civil Services Books',
      titleBn: 'সকল WBCS বই এক নজরে (View All)',
      slug: 'wbcs',
    },
    {
      id: 'wbcs-prelims',
      title: 'WBCS Prelims Complete Guides & Manuals',
      titleBn: 'WBCS প্রিলিমস গাইড ও জেনারেল স্টাডিজ ম্যানুয়াল',
      slug: 'wbcs/prelims',
      badge: 'HOT',
    },
    {
      id: 'wbcs-mains',
      title: 'WBCS Mains Compulsory & Optional Papers',
      titleBn: 'WBCS মেইনস পেপারস ও ডেসক্রিপটিভ রাইটিং',
      slug: 'wbcs/mains',
    },
    {
      id: 'wbcs-solved',
      title: '10-Year Solved Question Papers & Explanations',
      titleBn: 'বিগত ১০ বছরের প্রশ্নোত্তর সমাধান ও এনালাইসিস',
      slug: 'wbcs/solved-papers',
    },
    {
      id: 'wbcs-mock',
      title: 'Mock Tests & Practice OMR Sets',
      titleBn: 'মক টেস্ট সেট ও প্র্যাকটিস ওএমআর শিট',
      slug: 'wbcs/mock-tests',
    },
    {
      id: 'wbcs-optional-hist',
      title: 'Optional: History of India & World',
      titleBn: 'ঐচ্ছিক বিষয়: ভারত ও আধুনিক বিশ্বের ইতিহাস',
      slug: 'wbcs/optional-history',
    },
    {
      id: 'wbcs-optional-geo',
      title: 'Optional: Geography of India & WB',
      titleBn: 'ঐচ্ছিক বিষয়: ভারত ও পশ্চিমবঙ্গের ভূগোল',
      slug: 'wbcs/optional-geography',
    },
    {
      id: 'wbcs-ca-yearbook',
      title: 'Current Affairs & West Bengal Yearbooks',
      titleBn: 'কারেন্ট অ্যাফেয়ার্স, বাজেট ও ইয়ারবুক সংকলন',
      slug: 'wbcs/current-affairs',
      badge: 'NEW',
    },
  ],

  // Task 14: বিশ্ববিদ্যালয় ও কলেজ সেমিস্টার ডিপার্টমেন্ট
  'dept-college': [
    {
      id: 'college-all',
      title: 'All College & University Semester Books',
      titleBn: 'সকল কলেজ ও বিশ্ববিদ্যালয় সহায়িকা (View All)',
      slug: 'college',
    },
    {
      id: 'college-ugb',
      title: 'University of Gour Banga (UGB) Syllabus Books',
      titleBn: 'গৌড়বঙ্গ বিশ্ববিদ্যালয় (UGB) - সেমিস্টার ১ থেকে ৬',
      slug: 'college/ugb',
      badge: 'HOT',
    },
    {
      id: 'college-cu',
      title: 'Calcutta University (CU) Semester Guides',
      titleBn: 'কলকাতা বিশ্ববিদ্যালয় (CU) - CBCS ও NEP গাইড',
      slug: 'college/cu',
    },
    {
      id: 'college-other-univ',
      title: 'Kalyani, Burdwan & North Bengal Universities',
      titleBn: 'কল্যাণী, বর্ধমান ও উত্তরবঙ্গ বিশ্ববিদ্যালয় সহায়িকা',
      slug: 'college/other-universities',
    },
    {
      id: 'college-ba-arts',
      title: 'B.A Honours & General (History, Pol Science, Bengali)',
      titleBn: 'বি.এ অনার্স ও পাস (ইতিহাস, রাষ্ট্রবিজ্ঞান, বাংলা, দর্শন)',
      slug: 'college/ba-arts',
    },
    {
      id: 'college-bsc-science',
      title: 'B.Sc (Mathematics, Physics, Chemistry, CS)',
      titleBn: 'বি.এসসি (গণিত, পদার্থবিদ্যা, রসায়ন ও কম্পিউটার)',
      slug: 'college/bsc-science',
    },
    {
      id: 'college-bcom',
      title: 'B.Com Accounting, Finance, Tax & Auditing',
      titleBn: 'বি.কম সেমিস্টার: একাউন্টিং, ট্যাক্স ও বিজনেস ল',
      slug: 'college/bcom',
    },
  ],

  // Task 15 (Part A): স্কুল এডুকেশন (WBBSE/WBCHSE)
  'dept-school': [
    {
      id: 'school-all',
      title: 'All School Education Books',
      titleBn: 'সকল স্কুল সহায়িকা ও পাঠ্যবই (View All)',
      slug: 'school',
    },
    {
      id: 'school-madhyamik',
      title: 'Madhyamik (Class 10) Guidebooks & Suggestions',
      titleBn: 'মাধ্যমিক (দশম শ্রেণী) পাঠ্যবই, টেস্ট পেপার ও সাজেশন',
      slug: 'school/madhyamik',
      badge: 'HOT',
    },
    {
      id: 'school-hs',
      title: 'Higher Secondary (Class 11 & 12) Arts/Science/Commerce',
      titleBn: 'উচ্চমাধ্যমিক (একাদশ ও দ্বাদশ) টেস্ট পেপারস ও প্রশ্নব্যাংক',
      slug: 'school/higher-secondary',
    },
    {
      id: 'school-test-papers',
      title: 'ABTA, WBTA & WBBSE Test Papers',
      titleBn: 'ABTA ও WBTA অফিসিয়াল টেস্ট পেপার সংকলন',
      slug: 'school/test-papers',
    },
    {
      id: 'school-prashna-bichitra',
      title: 'Ray & Martin / Parul Prashna Bichitra',
      titleBn: 'রায় ও মার্টিন এবং পারুল প্রশ্ন বিচিত্রা',
      slug: 'school/prashna-bichitra',
    },
  ],

  // Task 15 (Part B): সরকারি চাকরির অন্যান্য পরীক্ষা (Rail, SSC, Police, TET)
  'dept-gov-jobs': [
    {
      id: 'jobs-all',
      title: 'All Competitive & Govt Exam Books',
      titleBn: 'সকল চাকরির পরীক্ষার বই (View All)',
      slug: 'competitive-exams',
    },
    {
      id: 'jobs-police',
      title: 'West Bengal Police (Constable, SI & Lady Constable)',
      titleBn: 'পশ্চিমবঙ্গ পুলিশ (WBP কনস্টেবল, এসআই ও কেপি গাইড)',
      slug: 'competitive-exams/wb-police',
      badge: 'HOT',
    },
    {
      id: 'jobs-tet',
      title: 'Primary & Upper Primary TET Guidebooks',
      titleBn: 'পশ্চিমবঙ্গ প্রাথমিক ও উচ্চ প্রাথমিক TET শিক্ষক নিয়োগ গাইড',
      slug: 'competitive-exams/tet',
    },
    {
      id: 'jobs-rail',
      title: 'Railway Recruitment Board (RRB NTPC, Group D, ALP)',
      titleBn: 'রেলওয়ে রিক্রুটমেন্ট (RRB NTPC, Group D, ALP)',
      slug: 'competitive-exams/railway',
    },
    {
      id: 'jobs-ssc',
      title: 'SSC CGL, CHSL, MTS, GD Constable in Bengali/English',
      titleBn: 'স্টাফ সিলেকশন কমিশন (SSC CGL, CHSL, MTS, GD)',
      slug: 'competitive-exams/ssc',
    },
    {
      id: 'jobs-clerkship',
      title: 'WBPSC Clerkship, Miscellaneous & Food SI',
      titleBn: 'WBPSC ক্লার্কশিপ, মিসলেনিয়াস ও ফুড এসআই স্পেশাল',
      slug: 'competitive-exams/wbpsc-clerkship',
      badge: 'NEW',
    },
  ],

  // Task 15 (Part C) & Task 21: বাংলা ও বিশ্ব সাহিত্য জঁরা সেকশন (Literature & Fiction)
  'dept-literature': [
    {
      id: 'lit-all',
      title: 'All Literature & General Books',
      titleBn: 'সকল সাহিত্য ও সাধারণ বই (View All)',
      slug: 'literature',
    },
    {
      id: 'lit-novels',
      title: 'Classic & Modern Bengali Novels',
      titleBn: 'কালজয়ী বাংলা উপন্যাস ও উপন্যাস সমগ্র',
      slug: 'literature/novels',
      badge: 'HOT',
    },
    {
      id: 'lit-short-stories',
      title: 'Short Stories & Bengali Anthologies',
      titleBn: 'ছোটগল্প সংকলন ও নির্বাচিত শ্রেষ্ঠ গল্প',
      slug: 'literature/short-stories',
    },
    {
      id: 'lit-history',
      title: 'Indian History, Bengal Heritage & Liberation War',
      titleBn: 'ভারতের স্বাধীনতা সংগ্রাম ও বাংলার ঐতিহ্য ইতিহাস',
      slug: 'literature/history',
    },
    {
      id: 'lit-poetry',
      title: 'Bengali Poetry & Kobita Somogro',
      titleBn: 'বাংলা কবিতা সংকলন ও আধুনিক কবিতা সমগ্র',
      slug: 'literature/poetry',
    },
    {
      id: 'lit-biography',
      title: 'Biographies, Memoirs & Self-Help',
      titleBn: 'অনুপ্রেরণামূলক গ্রন্থ ও বিখ্যাত ব্যক্তিত্বের আত্মজীবনী',
      slug: 'literature/biography',
      badge: 'NEW',
    },
    {
      id: 'lit-translation',
      title: 'World Literature & Bengali Translations',
      titleBn: 'অনুবাদ সাহিত্য ও বিশ্ব সাহিত্যের ক্ল্যাসিকস',
      slug: 'literature/translation',
    },
    {
      id: 'lit-detective',
      title: 'Detective, Thriller & Teen Mystery',
      titleBn: 'গোয়েন্দা রহস্য, থ্রিলার ও কিশোর অ্যাডভেঞ্চার',
      slug: 'literature/detective-thriller',
      badge: 'HOT',
    },
  ],

  // Specials & Collector Catalog
  'dept-specials': [
    {
      id: 'specials-all',
      title: 'All Specials & Collector Editions',
      titleBn: 'সকল স্পেশাল ক্যাটালগ (View All)',
      slug: 'specials',
    },
    {
      id: 'specials-malda',
      title: 'Malda Heritage & North Bengal History',
      titleBn: 'মালদা জেলা ও উত্তরবঙ্গের ইতিহাস-ঐতিহ্য',
      slug: 'specials/malda-heritage',
      badge: 'HOT',
    },
    {
      id: 'specials-boxsets',
      title: 'Special Discounted Book Box Sets',
      titleBn: 'বিশেষ ছাড়ের কম্বো বুক সেট',
      slug: 'specials/combo-boxsets',
      badge: 'SALE',
    },
    {
      id: 'specials-rare',
      title: 'Rare & Antique Bengali Literature',
      titleBn: 'দুষ্প্রাপ্য ও সংগ্রাহক সাহিত্য সংস্করণ',
      slug: 'specials/rare-editions',
      badge: 'NEW',
    },
  ],

  // E-Books & Guidelines
  'dept-ebooks': [
    {
      id: 'ebooks-all',
      title: 'All E-Books & Guidelines',
      titleBn: 'সকল ই-বুক ও সিলেবাস (View All)',
      slug: 'ebooks',
    },
    {
      id: 'ebooks-syllabus',
      title: 'WBCS & UGB Syllabus Guidelines (PDF)',
      titleBn: 'WBCS ও UGB অফিসিয়াল সিলেবাস গাইডলাইন',
      slug: 'ebooks/syllabus-guidelines',
      badge: 'HOT',
    },
    {
      id: 'ebooks-practice',
      title: 'Downloadable Model Question Banks',
      titleBn: 'মডেল প্রশ্নব্যাংক ও প্র্যাকটিস নোটস',
      slug: 'ebooks/question-banks',
    },
    {
      id: 'ebooks-magazines',
      title: 'Literary & Competitive Magazines',
      titleBn: 'ডিজিটাল সাময়িকী ও পরীক্ষার কারেন্ট অ্যাফেয়ার্স',
      slug: 'ebooks/periodicals',
      badge: 'NEW',
    },
  ],
};

// Support lookup by raw slug as well as department ID (for dynamic DB categories with UUIDs)
DEPARTMENT_SUBCATEGORIES['wbcs'] = DEPARTMENT_SUBCATEGORIES['dept-wbcs'];
DEPARTMENT_SUBCATEGORIES['college'] = DEPARTMENT_SUBCATEGORIES['dept-college'];
DEPARTMENT_SUBCATEGORIES['school'] = DEPARTMENT_SUBCATEGORIES['dept-school'];
DEPARTMENT_SUBCATEGORIES['competitive-exams'] = DEPARTMENT_SUBCATEGORIES['dept-gov-jobs'];
DEPARTMENT_SUBCATEGORIES['literature'] = DEPARTMENT_SUBCATEGORIES['dept-literature'];
DEPARTMENT_SUBCATEGORIES['specials'] = DEPARTMENT_SUBCATEGORIES['dept-specials'];
DEPARTMENT_SUBCATEGORIES['ebooks'] = DEPARTMENT_SUBCATEGORIES['dept-ebooks'];


