import { DetailedBookProduct } from '@/types/pdp';

export const DETAILED_BOOKS_CATALOG: DetailedBookProduct[] = [
  {
    id: 'book-1',
    bookId: 'book-wbcs-manual-2026',
    slug: 'wbcs-preliminary-main-manual-2026',
    title: 'WBCS Preliminary & Main Exam Manual (2026 Edition)',
    titleBn: 'WBCS প্রিলিমিনারি ও মেইনস কমপ্লিট ম্যানুয়াল (২০২৬ সংস্করণ)',
    author: 'Dr. Nitin Singhania & Expert Panel',
    authorBn: 'ড. অশোক কুমার ঘোষ ও নিতিন সিংহানিয়া বিশেষজ্ঞ টিম',
    publisher: 'Chhaya Prakashani',
    publisherBn: 'ছায়া প্রকাশনী',
    category: 'wbcs-special',
    categoryName: 'WBCS ও সিভিল সার্ভিস',
    subCategory: 'prelims-mains',
    subCategoryName: 'প্রিলিমিনারি ও মেইনস',
    price: 595,
    mrp: 850,
    discount: '30%',
    badge: 'সেরা বিক্রেতা',
    rating: 4.9,
    reviewsCount: 128,
    inStock: true,
    stockQuantity: 18,
    edition: '2026 Annual Edition',
    binding: 'paperback',
    condition: 'new',
    language: 'bengali',
    coverImage: '/images/books/wbcs-manual.webp',
    galleryImages: [
      '/images/books/wbcs-manual.webp',
      '/images/books/wbcs-manual-back.webp',
      '/images/books/wbcs-manual-spine.webp',
      '/images/books/wbcs-manual-toc.webp',
    ],
    isMaldaPrime: true,
    inStoreMaldaStock: 4,
    recommendedBadge: 'উত্তরবঙ্গের বিশিষ্ট শিক্ষকমণ্ডলী ও WBCS সফল টপারদের দ্বারা সুপারিশকৃত',
    variants: [
      {
        format: 'paperback',
        formatBn: 'পেপারব্যাক (Paperback)',
        price: 595,
        mrp: 850,
        stockQuantity: 18,
      },
      {
        format: 'hardcover',
        formatBn: 'হার্ডকভার লাইব্রেরি এডিশন',
        price: 720,
        mrp: 990,
        stockQuantity: 5,
      },
    ],
    specifications: {
      isbn10: '938912345X',
      isbn13: '978-9389123456',
      publisher: 'ছায়া প্রকাশনী প্রাঃ লিঃ',
      publicationYear: 2026,
      edition: '২০২৬ পরিমার্জিত সংস্করণ (Revised)',
      language: 'বাংলা ও ইংরেজি (Bilingual)',
      languageBn: 'বাংলা মাধ্যম',
      pages: 864,
      weight: '950 গ্রাম',
      dimensions: '24 x 18 x 4.5 সেমি',
      paperType: '৭০ GSM প্রিমিয়াম হোয়াইট পেপার',
    },
    lookInside: {
      enabled: true,
      totalPages: 5,
      samplePages: [
        {
          pageNumber: 1,
          title: 'প্রচ্ছদ ও শিরোনাম (Cover Page)',
          imageUrl: '/images/books/wbcs-manual.webp',
        },
        {
          pageNumber: 2,
          title: 'ভূমিকা ও লেখকের বার্তা (Preface)',
          imageUrl: '/images/sample-pages/page-2.webp',
        },
        {
          pageNumber: 3,
          title: 'সম্পূর্ণ সিলেবাস ও নম্বর বিভাজন (Syllabus & Weightage)',
          imageUrl: '/images/sample-pages/page-3.webp',
        },
        {
          pageNumber: 4,
          title: 'সূচিপত্র: খণ্ড ১ ও ২ (Table of Contents)',
          imageUrl: '/images/sample-pages/page-4.webp',
        },
        {
          pageNumber: 5,
          title: 'প্রথম অধ্যায় নমুনা: ভারতের আধুনিক ইতিহাস',
          imageUrl: '/images/sample-pages/page-5.webp',
        },
      ],
    },
    authorBio: {
      name: 'Dr. Nitin Singhania & Expert Editorial Team',
      nameBn: 'ড. অশোক কুমার ঘোষ ও নিতিন সিংহানিয়া বিশেষজ্ঞ টিম',
      bio: 'Renowned civil servant and author with over 15 years of mentoring WBCS and UPSC aspirants across Eastern India.',
      bioBn: 'বিশিষ্ট সিভিল সার্ভেন্ট ও লেখক। গত ১৫ বছর ধরে পশ্চিমবঙ্গ ও উত্তরবঙ্গের হাজার হাজার সিভিল সার্ভিস পরীক্ষার্থীদের মেন্টরিং ও সেরা স্টাডি ম্যাটেরিয়াল তৈরিতে নেতৃত্ব দিচ্ছেন।',
      avatarUrl: '/images/authors/author-ashok-ghosh.webp',
      otherBookIds: ['book-wbcs-scanner-2026', 'book-wbcs-history-atul-roy'],
    },
    usedBookOption: {
      isAvailable: true,
      price: 380,
      mrp: 850,
      conditionNote: 'Used - Excellent Condition (No markings, intact cover)',
      conditionNoteBn: 'ব্যবহৃত বই — চমৎকার অবস্থা (কোনো দাগ নেই, মলাট ও সমস্ত পৃষ্ঠা একদম অটুট)',
      sellerName: 'মালদা ওল্ড বুক কর্নার (ভেরিফায়েড)',
      images: ['/images/books/wbcs-manual-used.webp'],
    },
    description:
      'WBCS Preliminary and Mains Complete Manual is a comprehensive, exam-oriented guidebook meticulously designed as per the latest PSC West Bengal syllabus. Covers Indian History, National Movement, Geography with Special Reference to West Bengal, Indian Polity, Economy, General Science, and English Composition.',
    descriptionBn:
      'WBCS প্রিলিমিনারি ও মেইনস পরীক্ষার জন্য একটি সম্পূর্ণ ও পূর্ণাঙ্গ সহায়িকা গ্রন্থ। পশ্চিমবঙ্গ পাবলিক সার্ভিস কমিশনের (PSC WB) সর্বশেষ পরিবর্তিত পাঠ্যক্রম অনুযায়ী রচিত। বইটিতে ভারতের ইতিহাস ও জাতীয় মুক্তি সংগ্রাম, পশ্চিমবঙ্গের ভূগোল, ভারতীয় সংবিধান ও অর্থনীতি, সাধারণ বিজ্ঞান এবং ইংরেজি রচনার বিশদ অধ্যায়ভিত্তিক আলোচনা ও গত ২০ বছরের প্রশ্ন সমাধান রয়েছে।',
    tableOfContents: [
      {
        chapterNumber: 'অধ্যায় ১',
        title: 'Ancient & Medieval Indian History',
        titleBn: 'প্রাচীন ও মধ্যযুগীয় ভারতের ইতিহাস',
        pageRange: '১–১১০',
        topics: ['সিন্ধু সভ্যতা', 'বৈদিক যুগ', 'মৌর্য ও গুপ্ত সাম্রাজ্য', 'দিল্লি সুলতানি ও মুঘল যুগ'],
      },
      {
        chapterNumber: 'অধ্যায় ২',
        title: 'Indian National Movement (Civil Services)',
        titleBn: 'ভারতের জাতীয় মুক্তি সংগ্রাম',
        pageRange: '১১১–২৪০',
        topics: ['১৮৫৭ সালের মহাবিদ্রোহ', 'কংগ্রেসের প্রতিষ্ঠা', 'গান্ধী যুগ', 'সুভাষচন্দ্র ও আজাদ হিন্দ ফৌজ'],
      },
      {
        chapterNumber: 'অধ্যায় ৩',
        title: 'Geography of India with Malda & WB Special',
        titleBn: 'ভারতের ভূগোল ও পশ্চিমবঙ্গের ভৌগোলিক রূপরেখা',
        pageRange: '২৪১–৩৯০',
        topics: ['ভূ-প্রকৃতি ও নদনদী', 'মালদা ও উত্তরবঙ্গের ভৌগোলিক বৈশিষ্ট্য', 'কৃষি ও শিল্প', 'জনগণনা ২০১১'],
      },
      {
        chapterNumber: 'অধ্যায় ৪',
        title: 'Indian Polity & Constitution of India',
        titleBn: 'ভারতীয় সংবিধান ও শাসনব্যবস্থা',
        pageRange: '৩৯১–৫২০',
        topics: ['মৌলিক অধিকার ও কর্তব্য', 'রাষ্ট্রপতি ও সংসদ', 'পঞ্চায়েতি রাজ ব্যবস্থা', 'গুরুত্বপূর্ণ সংশোধনী'],
      },
      {
        chapterNumber: 'অধ্যায় ৫',
        title: 'Previous Years Solved Questions (2010–2025)',
        titleBn: 'বিগত ১৫ বছরের প্রিলিমিনারি ও মেইনস সমাধান',
        pageRange: '৫২১–৮৬৪',
        topics: ['পূর্ণাঙ্গ ব্যাখ্যাসহ উত্তর', 'মডেল টেস্ট পেপারস ও ওএমআর শিট'],
      },
    ],
    ratingBreakdown: {
      5: 74,
      4: 18,
      3: 5,
      2: 2,
      1: 1,
    },
    frequentlyBoughtTogetherIds: [
      'book-wbcs-scanner-2026',
      'book-wbcs-current-affairs-2026',
    ],
    bonusOffer: {
      title: 'Free 2026 Online Mock Test Pass',
      titleBn: '🎁 ফ্রি অনলাইন মক টেস্ট অ্যাক্সেস',
      description: 'বইটির সাথে পাচ্ছেন ২০২৬ সালের ১০টি ফুল-লেংথ প্রিলিমস অনলাইন মক টেস্টের ফ্রি সিকিউর কুপন কোড।',
    },
    reviews: [
      {
        id: 'rev-1',
        authorName: 'সৌভিক মুখোপাধ্যায়',
        authorLocation: 'মালদা টাউন, পশ্চিমবঙ্গ',
        rating: 5,
        date: '২৮ ফেব্রুয়ারি, ২০২৬',
        title: 'WBCS ২০২৬ পরীক্ষার জন্য নিখুঁত ও সেরা সহায়িকা গ্রন্থ',
        content:
          '২০২৬ সালের পরিবর্তিত প্যাটার্ন ও নতুন সিলেবাস খুব সুন্দরভাবে সাজানো হয়েছে। বিশেষ করে পশ্চিমবঙ্গের ভূগোল ও আধুনিক ভারতের ইতিহাসের অধ্যায়গুলো অসাধারণ। নেতাজি সুভাষ রোডের কাউন্টার থেকে আজই নিয়ে এলাম, প্রিন্টিং ও বাঁধাই এক কথায় প্রিমিয়াম!',
        verifiedPurchase: true,
        helpfulCount: 42,
        topperBadge: 'WBCS 2024 প্রিলিমস উত্তীর্ণ',
      },
      {
        id: 'rev-2',
        authorName: 'প্রিয়ঙ্কা সরকার',
        authorLocation: 'ইংরেজবাজার, মালদা',
        rating: 5,
        date: '২০ ফেব্রুয়ারি, ২০২৬',
        title: 'অধ্যায়ভিত্তিক সিলেবাস ও নম্বর বিভাজন স্পষ্ট বুঝতে সুবিধা হয়েছে',
        content:
          'বইটির সবচেয়ে ভালো দিক হলো প্রতিটি চ্যাপ্টারের সাথে নম্বর বিভাজন ও বিগত ১৫ বছরের প্রশ্নের বিশদ ব্যাখ্যা। অনলাইন মক টেস্টের ফ্রি কোডটিও সক্রিয় পেয়েছি।',
        verifiedPurchase: true,
        helpfulCount: 28,
        topperBadge: 'WBCS গ্রুপ-A পরীক্ষার্থী',
      },
      {
        id: 'rev-3',
        authorName: 'দেবাশীষ মণ্ডল',
        authorLocation: 'চাঁচল, মালদা',
        rating: 4,
        date: '১২ ফেব্রুয়ারি, ২০২৬',
        title: 'খুব ভালো বই, দ্রুত হোম ডেলিভারি পেয়েছি',
        content:
          'চাঁচলে মাত্র ২৪ ঘণ্টার মধ্যে বই পৌঁছে গেছে। ৭০ জিএসএম পেপারের ছাপা নিখুঁত। সূচিপত্রের বিন্যাস পড়াকে অনেক সহজ করে দেয়। ছায়া প্রকাশনীকে ধন্যবাদ।',
        verifiedPurchase: true,
        helpfulCount: 15,
      },
    ],
  },
  {
    id: 'book-2',
    bookId: 'book-wbcs-scanner-2026',
    slug: 'wbcs-scanner-prelims-mains-solved-papers-2026',
    title: 'WBCS Scanner Prelims & Mains Solved Papers 2026',
    titleBn: 'WBCS স্ক্যানার প্রিলিমিনারি ও মেইনস সলভড পেপারস (২০২৬)',
    author: 'M.M Research Team',
    authorBn: 'এম.এম রিসার্চ প্যানেল',
    publisher: 'Chhaya Prakashani',
    publisherBn: 'ছায়া প্রকাশনী',
    category: 'wbcs-special',
    categoryName: 'WBCS ও সিভিল সার্ভিস',
    price: 455,
    mrp: 650,
    discount: '30%',
    rating: 4.8,
    reviewsCount: 86,
    inStock: true,
    stockQuantity: 12,
    edition: '2026 Edition',
    binding: 'paperback',
    condition: 'new',
    language: 'bengali',
    coverImage: '/images/books/wbcs-scanner.webp',
    galleryImages: [
      '/images/books/wbcs-scanner.webp',
      '/images/books/wbcs-scanner-back.webp',
    ],
    isMaldaPrime: true,
    inStoreMaldaStock: 3,
    recommendedBadge: 'WBCS সফল র‍্যাঙ্কারদের স্ক্যানার সংগ্রহ',
    specifications: {
      isbn13: '978-9389991234',
      publisher: 'ছায়া প্রকাশনী প্রাঃ লিঃ',
      publicationYear: 2026,
      edition: '২০২৬ সংশোধিত সংস্করণ',
      language: 'বাংলা',
      languageBn: 'বাংলা',
      pages: 640,
      weight: '750 গ্রাম',
      dimensions: '24 x 17 x 3.5 সেমি',
      paperType: '৭০ GSM পেপার',
    },
    tableOfContents: [
      {
        chapterNumber: 'খণ্ড ১',
        title: 'Prelims Solved Papers (2010–2025)',
        titleBn: 'প্রিলিমিনারি বিগত ১৫ বছরের প্রশ্ন সমাধান',
        pageRange: '১–৩২০',
        topics: ['ইতিহাস', 'ভূগোল', 'সংবিধান', 'অর্থনীতি', 'ইংরেজি'],
      },
      {
        chapterNumber: 'খণ্ড ২',
        title: 'Mains Compulsory Papers Analysis',
        titleBn: 'মেইনস বাধ্যতামূলক পেপারের বিস্তারিত উত্তর',
        pageRange: '৩২১–৬৪০',
        topics: ['পেপার ৩', 'পেপার ৪', 'পেপার ৫', 'পেপার ৬'],
      },
    ],
    ratingBreakdown: {
      5: 70,
      4: 20,
      3: 6,
      2: 3,
      1: 1,
    },
    reviews: [
      {
        id: 'rev-2-1',
        authorName: 'অনির্বাণ ঘোষ',
        authorLocation: 'রতুয়া, মালদা',
        rating: 5,
        date: '১ মার্চ, ২০২৬',
        title: 'মেইনসের প্রশ্নের ব্যাখ্যা অতুলনীয়',
        content: 'প্রতিটি প্রশ্নের সাথে রেফারেন্স ও অতিরিক্ত তথ্য দেওয়া আছে যা রিভিশনে দারুণ সাহায্য করে।',
        verifiedPurchase: true,
        helpfulCount: 19,
      },
    ],
    description: 'WBCS Scanner provides chapter-wise solved papers with in-depth analysis.',
    descriptionBn: 'WBCS প্রিলিমস ও মেইনসের বিগত ২৫ বছরের প্রশ্ন ও পুঙ্খানুপুঙ্খ অধ্যায়ভিত্তিক সমাধান।',
  },
  {
    id: 'book-3',
    bookId: 'book-wbcs-current-affairs-2026',
    slug: 'wbcs-current-affairs-yearbook-2026',
    title: 'WBCS Prelims Current Affairs & West Bengal Yearbook 2026',
    titleBn: '২০২৬ WBCS প্রিলিমস কারেন্ট অ্যাফেয়ার্স ও পশ্চিমবঙ্গ ইয়ারবুক',
    author: 'M.M Research Team',
    authorBn: 'এম.এম রিসার্চ টিম',
    publisher: 'Chhaya Prakashani',
    publisherBn: 'ছায়া প্রকাশনী',
    category: 'wbcs-special',
    categoryName: 'WBCS ও সিভিল সার্ভিস',
    price: 240,
    mrp: 320,
    discount: '25%',
    rating: 4.7,
    reviewsCount: 42,
    inStock: true,
    stockQuantity: 9,
    edition: '2026 First Edition',
    binding: 'paperback',
    condition: 'new',
    language: 'bengali',
    coverImage: '/images/books/wbcs-scanner.webp',
    galleryImages: ['/images/books/wbcs-scanner.webp'],
    isMaldaPrime: true,
    inStoreMaldaStock: 6,
    recommendedBadge: 'পশ্চিমবঙ্গ সিভিল সার্ভিসের সেরা কারেন্ট অ্যাফেয়ার্স গাইড',
    specifications: {
      isbn13: '978-9389995678',
      publisher: 'ছায়া প্রকাশনী প্রাঃ লিঃ',
      publicationYear: 2026,
      edition: '২০২৬ বার্ষিক সংস্করণ',
      language: 'বাংলা',
      languageBn: 'বাংলা',
      pages: 320,
      weight: '400 গ্রাম',
      dimensions: '22 x 15 x 2 সেমি',
      paperType: '৭০ GSM পেপার',
    },
    tableOfContents: [
      {
        chapterNumber: 'অংশ ১',
        title: 'West Bengal Schemes & Projects 2025-2026',
        titleBn: 'পশ্চিমবঙ্গ রাজ্য সরকারের প্রকল্প ও বাজেট রূপরেখা',
        pageRange: '১–১০০',
        topics: ['লক্ষ্মীর ভাণ্ডার', 'কন্যাশ্রী', 'কৃষকবন্ধু', 'শিক্ষা ও স্বাস্থ্য প্রকল্পসমূহ'],
      },
      {
        chapterNumber: 'অংশ ২',
        title: 'National & International Current Affairs',
        titleBn: 'জাতীয় ও আন্তর্জাতিক গুরুত্বপূর্ণ ঘটনাবলী',
        pageRange: '১০১–৩২০',
        topics: ['পুরস্কার ও সম্মাননা', 'খেলাধুলা', 'বিজ্ঞান ও প্রযুক্তি', 'শীর্ষ সম্মেলন'],
      },
    ],
    ratingBreakdown: {
      5: 65,
      4: 25,
      3: 7,
      2: 2,
      1: 1,
    },
    reviews: [
      {
        id: 'rev-3-1',
        authorName: 'সুকন্যা দাস',
        authorLocation: 'হবিবপুর, মালদা',
        rating: 5,
        date: '৫ মার্চ, ২০২৬',
        title: 'পশ্চিমবঙ্গের প্রকল্পের তথ্যগুলো খুব সাজানো',
        content: 'ডাব্লুবিসিএস প্রিলিমসে রাজ্যের প্রকল্প থেকে অনেক প্রশ্ন আসে, এই বইটি সেই ঘাটতি পূরণ করেছে।',
        verifiedPurchase: true,
        helpfulCount: 11,
      },
    ],
    description: 'Yearbook covering West Bengal current affairs, government schemes, and budget.',
    descriptionBn: 'পশ্চিমবঙ্গের সমস্ত সরকারি প্রকল্প, সাম্প্রতিক বাজেট ও জাতীয় ঘটনাবলীর বার্ষিক সংকলন।',
  },
];

export function getDetailedBookBySlug(slug: string): DetailedBookProduct | undefined {
  const decoded = decodeURIComponent(slug);
  const found = DETAILED_BOOKS_CATALOG.find((b) => b.slug === decoded || b.bookId === decoded || b.id === decoded);
  if (found) return found;

  // Graceful fallback for any book in BOOKS_CATALOG
  try {
    const { BOOKS_CATALOG } = require('@/lib/data/booksCatalog');
    const basic = BOOKS_CATALOG.find((b: any) => b.slug === decoded || b.bookId === decoded || b.id === decoded);
    if (basic) {
      return {
        ...basic,
        slug: basic.slug || basic.bookId,
        galleryImages: [basic.coverImage || '/images/books/wbcs-manual.webp'],
        specifications: {
          isbn13: '978-9389123000',
          publisher: basic.publisher || 'এম.এম পাবলিকেশন',
          publicationYear: 2026,
          edition: basic.edition || '২০২৬ সংস্করণ',
          language: 'bengali',
          languageBn: 'বাংলা',
          pages: 450,
          weight: '550 গ্রাম',
          dimensions: '22 x 15 x 3 সেমি',
          paperType: '৭০ GSM হোয়াইট পেপার',
        },
        description: basic.title + ' - Detailed guide and reference material.',
        descriptionBn: (basic.titleBn || basic.title) + ' — শিক্ষার্থীদের জন্য নির্ভরযোগ্য ও প্রামাণ্য গ্রন্থ।',
        ratingBreakdown: { 5: 70, 4: 20, 3: 6, 2: 2, 1: 2 },
        inStoreMaldaStock: 3,
        isMaldaPrime: true,
        tableOfContents: [
          {
            chapterNumber: 'সূচিপত্র ১',
            title: 'Syllabus and Fundamentals',
            titleBn: 'সিলেবাস রূপরেখা ও প্রাথমিক ধারণা',
            pageRange: '১–১৫০',
            topics: ['মৌলিক বিষয়বস্তু', 'গুরুত্বপূর্ণ প্রশ্নমালা'],
          },
          {
            chapterNumber: 'সূচিপত্র ২',
            title: 'Model Papers & Questions',
            titleBn: 'মডেল প্রশ্নপত্র ও সমাধান',
            pageRange: '১৫১–৪৫০',
            topics: ['বিগত বছরের প্রশ্ন ও উত্তর'],
          },
        ],
      };
    }
  } catch {
    // Ignore fallback failure
  }

  return undefined;
}

export function getAllDetailedBookSlugs(): string[] {
  const slugs = new Set<string>();
  DETAILED_BOOKS_CATALOG.forEach((b) => slugs.add(b.slug));
  try {
    const { BOOKS_CATALOG } = require('@/lib/data/booksCatalog');
    BOOKS_CATALOG.forEach((b: any) => {
      if (b.slug) slugs.add(b.slug);
    });
  } catch {
    // ignore
  }
  return Array.from(slugs);
}
