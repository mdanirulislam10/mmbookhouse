'use client';

import React, { Suspense, useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  BookOpen,
  Star,
  ShoppingCart,
  Heart,
  Check,
  Zap,
  ArrowUpDown,
  Home,
  ChevronRight,
  Sparkles,
  RotateCcw,
  SlidersHorizontal,
  Package,
  PhoneCall,
  X,
  BadgePercent,
  CheckCircle2,
} from 'lucide-react';
import { useCartStore } from '@/hooks/useCartStore';
import { useWishlistStore, useWishlistActions } from '@/hooks/useWishlistStore';
import { useLanguage } from '@/hooks/useLanguage';
import { formatINR, toBengaliNumerals } from '@/lib/utils/currency';
import {
  BookProduct,
  FilterState,
  FacetGroup,
  HierarchyCategoryNode,
  ViewMode,
  SortOption,
} from '@/types/catalog-filter';
import { SearchResultsLayout } from '@/components/search/SearchResultsLayout';
import { DesktopFacetSidebar } from '@/components/search/DesktopFacetSidebar';
import { ViewModeToggle } from '@/components/search/ViewModeToggle';
import { MobileSortFilterBar } from '@/components/search/MobileSortFilterBar';
import { MobileDualPaneDrawer } from '@/components/search/MobileDualPaneDrawer';
import { ResultSummaryHeader } from '@/components/search/ResultSummaryHeader';
import { ActiveFilterChips } from '@/components/search/ActiveFilterChips';
import { useScrollToResults } from '@/hooks/useScrollToResults';
import { getActiveDealForBook } from '@/lib/data/flashDeals';
import { AmazonDealBadge } from '@/components/deals/AmazonDealBadge';

// Comprehensive realistic catalog for M.M Book House Malda
const SEARCH_CATALOG: BookProduct[] = [
  {
    id: 'book-1',
    bookId: 'book-wbcs-manual-2026',
    title: 'WBCS Preliminary & Main Exam Manual (2026 Edition)',
    titleBn: 'WBCS প্রিলিমিনারি ও মেইনস কমপ্লিট ম্যানুয়াল (২০২৬ সংস্করণ)',
    author: 'ড. অশোক কুমার ঘোষ ও নিতিন সিংহানিয়া বিশেষজ্ঞ টিম',
    publisher: 'ছায়া প্রকাশনী',
    category: 'wbcs-special',
    categoryName: 'WBCS ও সিভিল সার্ভিস',
    subCategory: 'wbcs-manual',
    subCategoryName: 'প্রিলিমিনারি ও মেইনস ম্যানুয়াল',
    price: 595,
    mrp: 850,
    discount: '30%',
    badge: 'BESTSELLER',
    rating: 4.9,
    reviewsCount: 342,
    inStock: true,
    edition: '2026 Annual Edition',
    createdAt: '2026-08-15',
    binding: 'paperback',
    condition: 'new',
    language: 'bilingual',
    keywords: ['wbcs', 'manual', 'civil service', 'ঘোষ', 'ছায়া', 'প্রিলিমিনারি'],
  },
  {
    id: 'book-2',
    bookId: 'book-wbcs-scanner-2026',
    title: 'WBCS Scanner Prelims & Mains Solved Papers 2026',
    titleBn: 'WBCS স্ক্যানার প্রিলিমিনারি ও মেইনস সলভড পেপারস (২০২৬)',
    author: 'এম.এম রিসার্চ প্যানেল',
    publisher: 'ছায়া প্রকাশনী',
    category: 'wbcs-special',
    categoryName: 'WBCS ও সিভিল সার্ভিস',
    subCategory: 'wbcs-scanner',
    subCategoryName: 'সলভড স্ক্যানার ও প্রশ্নব্যাংক',
    price: 455,
    mrp: 650,
    discount: '30%',
    badge: 'TOP CHOICE',
    rating: 4.8,
    reviewsCount: 215,
    inStock: true,
    edition: '2026 Edition',
    createdAt: '2026-08-10',
    binding: 'paperback',
    condition: 'new',
    language: 'bilingual',
    keywords: ['wbcs', 'scanner', 'solved', 'ছায়া', 'প্রশ্নোত্তর'],
  },
  {
    id: 'book-3',
    bookId: 'book-wbcs-current-affairs-2026',
    title: 'WBCS Prelims Current Affairs & West Bengal Yearbook 2026',
    titleBn: '২০২৬ WBCS প্রিলিমস কারেন্ট অ্যাফেয়ার্স ও পশ্চিমবঙ্গ ইয়ারবুক',
    author: 'এম.এম রিসার্চ টিম',
    publisher: 'ছায়া প্রকাশনী',
    category: 'wbcs-special',
    categoryName: 'WBCS ও সিভিল সার্ভিস',
    subCategory: 'wbcs-current-affairs',
    subCategoryName: 'কারেন্ট অ্যাফেয়ার্স ও ইয়ারবুক',
    price: 240,
    mrp: 320,
    discount: '25%',
    rating: 4.7,
    reviewsCount: 180,
    inStock: true,
    edition: '2026 First Edition',
    createdAt: '2026-08-01',
    binding: 'paperback',
    condition: 'new',
    language: 'bengali',
    keywords: ['current affairs', 'yearbook', 'পশ্চিমবঙ্গ', 'ইয়ারবুক', 'wbcs'],
  },
  {
    id: 'book-4',
    bookId: 'book-wbcs-history-compendium',
    title: 'Bharat O Paschimbanger Itihas (WBCS Special Reference)',
    titleBn: 'ভারত ও পশ্চিমবঙ্গের ইতিহাস (WBCS স্পেশাল রেফারেন্স)',
    author: 'জীবন মুখোপাধ্যায়',
    publisher: 'মৌলিক লাইব্রেরী',
    category: 'wbcs-special',
    categoryName: 'WBCS ও সিভিল সার্ভিস',
    subCategory: 'wbcs-manual',
    subCategoryName: 'হিস্ট্রি ও স্পেশাল রেফারেন্স',
    price: 360,
    mrp: 450,
    discount: '20%',
    rating: 4.8,
    reviewsCount: 410,
    inStock: true,
    edition: 'Revised 2025-26',
    createdAt: '2026-05-20',
    binding: 'hardcover',
    condition: 'new',
    language: 'bengali',
    keywords: ['ইতিহাস', 'জীবন মুখোপাধ্যায়', 'history', 'wbcs'],
  },
  {
    id: 'book-5',
    bookId: 'book-ugb-history-sem4',
    title: 'Gour Banga University History Honours Sem-4 (Modern India)',
    titleBn: 'গৌড়বঙ্গ বিশ্ববিদ্যালয় ইতিহাস অনার্স ৪র্থ সেমিস্টার (আধুনিক ভারত)',
    author: 'ড. অশোক কুমার ঘোষ',
    publisher: 'দে’জ পাবলিশিং',
    category: 'college-university',
    categoryName: 'কলেজ ও বিশ্ববিদ্যালয়',
    subCategory: 'ugb-sem-3-4',
    subCategoryName: 'UGB সেমিস্টার ৩ ও ৪ (২য় বর্ষ)',
    price: 315,
    mrp: 450,
    discount: '30%',
    badge: 'UGB SYLLABUS',
    rating: 4.6,
    reviewsCount: 124,
    inStock: true,
    edition: '2025-26 CBCS',
    createdAt: '2026-06-15',
    binding: 'paperback',
    condition: 'new',
    language: 'bengali',
    keywords: ['ugb', 'history', 'sem 4', 'গৌড়বঙ্গ', 'অনার্স'],
  },
  {
    id: 'book-6',
    bookId: 'book-ugb-polscience-sem2',
    title: 'UGB Political Science Honours Sem-2 Core Course Guide',
    titleBn: 'UGB রাষ্ট্রবিজ্ঞান অনার্স ২য় সেমিস্টার সিলেবাস সহায়িকা',
    author: 'অমল কুমার মুখোপাধ্যায়',
    publisher: 'পশ্চিমবঙ্গ রাজ্য পুস্তক পর্ষদ',
    category: 'college-university',
    categoryName: 'কলেজ ও বিশ্ববিদ্যালয়',
    subCategory: 'ugb-sem-1-2',
    subCategoryName: 'UGB সেমিস্টার ১ ও ২ (১ম বর্ষ)',
    price: 260,
    mrp: 325,
    discount: '20%',
    rating: 4.5,
    reviewsCount: 88,
    inStock: true,
    edition: '2025-26',
    createdAt: '2025-11-10',
    binding: 'paperback',
    condition: 'used',
    language: 'bengali',
    keywords: ['ugb', 'pol science', 'রাষ্ট্রবিজ্ঞান', 'সেমিস্টার ২'],
  },
  {
    id: 'book-7',
    bookId: 'book-ugb-bengali-hons-sem1',
    title: 'Bangla Sahityer Itihas (Prachin O Madhyajug) UGB Sem-1',
    titleBn: 'বাংলা সাহিত্যের ইতিবৃত্ত (প্রাচীন ও মধ্যযুগ) UGB ১ম সেমিস্টার',
    author: 'ড. ক্ষেত্র গুপ্ত',
    publisher: 'দে’জ পাবলিশিং',
    category: 'college-university',
    categoryName: 'কলেজ ও বিশ্ববিদ্যালয়',
    subCategory: 'ugb-sem-1-2',
    subCategoryName: 'UGB সেমিস্টার ১ ও ২ (১ম বর্ষ)',
    price: 340,
    mrp: 400,
    discount: '15%',
    rating: 4.7,
    reviewsCount: 140,
    inStock: true,
    edition: '2025 Edition',
    createdAt: '2026-01-20',
    binding: 'paperback',
    condition: 'new',
    language: 'bengali',
    keywords: ['বাংলা সাহিত্য', 'ক্ষেত্র গুপ্ত', 'ugb', 'sem 1'],
  },
  {
    id: 'book-8',
    bookId: 'book-primary-tet-challenger',
    title: 'WB Primary TET Challenger 2026 (Child Dev, Bengali, Eng, Math, EVS)',
    titleBn: 'প্রাথমিক টেট চ্যালেঞ্জার ২০২৬ (পূর্ণাঙ্গ ৫টি বিষয় ও ২০ সেট প্রশ্ন)',
    author: 'শান্তনু পাত্র ও বিশেষজ্ঞ মণ্ডল',
    publisher: 'ছায়া প্রকাশনী',
    category: 'primary-tet-slst',
    categoryName: 'টেট ও স্কুল সার্ভিস',
    subCategory: 'primary-tet',
    subCategoryName: 'প্রাথমিক টেট (Primary TET)',
    price: 385,
    mrp: 550,
    discount: '30%',
    badge: 'POPULAR',
    rating: 4.9,
    reviewsCount: 680,
    inStock: true,
    edition: '2026 New Syllabus',
    createdAt: '2026-07-25',
    binding: 'paperback',
    condition: 'new',
    language: 'bengali',
    keywords: ['tet', 'primary', 'টেট', 'ছায়া', 'চ্যালেঞ্জার'],
  },
  {
    id: 'book-9',
    bookId: 'book-upper-primary-tet-social',
    title: 'Upper Primary TET Social Studies Guide & Practice Tests',
    titleBn: 'উচ্চ প্রাথমিক টেট সমাজবিদ্যা সহায়িকা ও প্র্যাকটিস টেস্ট',
    author: 'ড. নিমাইচাঁদ সাহা',
    publisher: 'মিত্র ও ঘোষ পাবলিশার্স',
    category: 'primary-tet-slst',
    categoryName: 'টেট ও স্কুল সার্ভিস',
    subCategory: 'upper-primary',
    subCategoryName: 'উচ্চ প্রাথমিক টেট (Upper Primary)',
    price: 320,
    mrp: 400,
    discount: '20%',
    rating: 4.6,
    reviewsCount: 154,
    inStock: true,
    edition: '2025-26',
    createdAt: '2026-03-12',
    binding: 'paperback',
    condition: 'new',
    language: 'bengali',
    keywords: ['upper primary', 'সমাজবিদ্যা', 'social studies', 'tet'],
  },
  {
    id: 'book-10',
    bookId: 'book-slst-bangla-complete',
    title: 'School Service Commission SLST Bengali PG & Hons Complete Guide',
    titleBn: 'স্কুল সার্ভিস কমিশন SLST বাংলা অনার্স ও পিজি সহায়িকা',
    author: 'প্রফেসর অসীম কুমার সরকার',
    publisher: 'দে’জ পাবলিশিং',
    category: 'primary-tet-slst',
    categoryName: 'টেট ও স্কুল সার্ভিস',
    subCategory: 'slst-ssc',
    subCategoryName: 'স্কুল সার্ভিস কমিশন (SLST)',
    price: 490,
    mrp: 700,
    discount: '30%',
    rating: 4.8,
    reviewsCount: 220,
    inStock: true,
    edition: 'Updated 2026',
    createdAt: '2026-04-18',
    binding: 'hardcover',
    condition: 'new',
    language: 'bengali',
    keywords: ['slst', 'ssc', 'স্কুল সার্ভিস', 'বাংলা অনার্স'],
  },
  {
    id: 'book-11',
    bookId: 'book-wb-police-constable-2026',
    title: 'West Bengal Police Constable & Lady Constable Guide 2026',
    titleBn: 'পশ্চিমবঙ্গ পুলিশ কনস্টেবল ও লেডি কনস্টেবল প্র্যাকটিস সহায়িকা ২০২৬',
    author: 'অভিজিৎ মুখোপাধ্যায়',
    publisher: 'পারুল প্রকাশনী',
    category: 'competitive-exams',
    categoryName: 'সরকারি চাকরির পরীক্ষা',
    subCategory: 'wb-police',
    subCategoryName: 'পশ্চিমবঙ্গ পুলিশ ও কনস্টেবল',
    price: 270,
    mrp: 360,
    discount: '25%',
    badge: 'MALDA TOP SELLER',
    rating: 4.7,
    reviewsCount: 450,
    inStock: true,
    edition: '2026 Special Edition',
    createdAt: '2026-07-10',
    binding: 'paperback',
    condition: 'new',
    language: 'bengali',
    keywords: ['police', 'wbp', 'কনস্টেবল', 'লেডি কনস্টেবল', 'পারুল'],
  },
  {
    id: 'book-12',
    bookId: 'book-railway-alp-technician',
    title: 'RRB Railway ALP & Technician Stage-1 & 2 CBT Guide 2026',
    titleBn: 'রেলওয়ে ALP ও টেকনিশিয়ান সম্পূর্ণ প্রস্তুতি সহায়িকা (বাংলা ও ইংরেজি)',
    author: 'আর.কে. গুপ্ত টেকনিক্যাল প্যানেল',
    publisher: 'ছায়া প্রকাশনী',
    category: 'competitive-exams',
    categoryName: 'সরকারি চাকরির পরীক্ষা',
    subCategory: 'railway-rrb',
    subCategoryName: 'রেলওয়ে রিক্রুটমেন্ট (RRB)',
    price: 420,
    mrp: 600,
    discount: '30%',
    rating: 4.6,
    reviewsCount: 310,
    inStock: true,
    edition: '2026 CBT Edition',
    createdAt: '2026-06-05',
    binding: 'paperback',
    condition: 'new',
    language: 'bilingual',
    keywords: ['railway', 'rrb', 'alp', 'রেলওয়ে', 'টেকনিশিয়ান'],
  },
  {
    id: 'book-13',
    bookId: 'book-ssc-chsl-bengali-guide',
    title: 'SSC CHSL 10+2 Tier-1 Complete Guide in Bengali',
    titleBn: 'এসএসসি সিএইচএসএল (১০+২) টায়ার-১ বাংলা সংস্করণ সহায়িকা',
    author: 'এম.এম স্টাফ সিলেকশন টিম',
    publisher: 'পারুল প্রকাশনী',
    category: 'competitive-exams',
    categoryName: 'সরকারি চাকরির পরীক্ষা',
    subCategory: 'ssc-central',
    subCategoryName: 'স্টাফ সিলেকশন কমিশন (SSC)',
    price: 345,
    mrp: 460,
    discount: '25%',
    rating: 4.5,
    reviewsCount: 195,
    inStock: true,
    edition: '2025-26',
    createdAt: '2025-10-15',
    binding: 'paperback',
    condition: 'used',
    language: 'bilingual',
    keywords: ['ssc', 'chsl', 'সিএইচএসএল', 'স্টাফ সিলেকশন'],
  },
  {
    id: 'book-14',
    bookId: 'book-feluda-samagra-vol1',
    title: 'Feluda Samagra (Volume 1) by Satyajit Ray',
    titleBn: 'ফেলুদা সমগ্র (১ম খণ্ড - অখণ্ড সংস্করণ) - সত্যজিৎ রায়',
    author: 'সত্যজিৎ রায়',
    publisher: 'আনন্দ পাবলিশার্স',
    category: 'bengali-literature',
    categoryName: 'বাংলা সাহিত্য ও উপন্যাস',
    subCategory: 'detective-feluda',
    subCategoryName: 'ফেলুদা সমগ্র - সত্যজিৎ রায়',
    price: 520,
    mrp: 650,
    discount: '20%',
    badge: 'CLASSIC',
    rating: 4.9,
    reviewsCount: 1120,
    inStock: true,
    edition: 'Collector Hardcover',
    createdAt: '2025-01-01',
    binding: 'hardcover',
    condition: 'new',
    language: 'bengali',
    keywords: ['feluda', 'satyajit ray', 'ফেলুদা', 'সত্যজিৎ রায়', 'আনন্দ'],
  },
  {
    id: 'book-15',
    bookId: 'book-byomkesh-samagra',
    title: 'Byomkesh Samagra (Complete Stories) by Sharadindu Bandyopadhyay',
    titleBn: 'ব্যোমকেশ সমগ্র (সম্পূর্ণ ৩২টি রহস্য গল্প) - শরদিন্দু বন্দ্যোপাধ্যায়',
    author: 'শরদিন্দু বন্দ্যোপাধ্যায়',
    publisher: 'আনন্দ পাবলিশার্স',
    category: 'bengali-literature',
    categoryName: 'বাংলা সাহিত্য ও উপন্যাস',
    subCategory: 'detective-byomkesh',
    subCategoryName: 'ব্যোমকেশ সমগ্র - শরদিন্দু',
    price: 595,
    mrp: 700,
    discount: '15%',
    badge: 'CLASSIC',
    rating: 4.9,
    reviewsCount: 890,
    inStock: true,
    edition: 'Deluxe Hardcover',
    createdAt: '2024-12-01',
    binding: 'hardcover',
    condition: 'new',
    language: 'bengali',
    keywords: ['byomkesh', 'ব্যোমকেশ', 'শরদিন্দু', 'রহস্য গল্প'],
  },
  {
    id: 'book-16',
    bookId: 'book-sanchayita-rabindranath',
    title: 'Sanchayita (Complete Poetry Collection) - Rabindranath Tagore',
    titleBn: 'সঞ্চয়িতা (অখণ্ড রবীন্দ্র কাব্য সংকলন) - রবীন্দ্রনাথ ঠাকুর',
    author: 'রবীন্দ্রনাথ ঠাকুর',
    publisher: 'বিশ্বভারতী গ্রন্থন বিভাগ',
    category: 'bengali-literature',
    categoryName: 'বাংলা সাহিত্য ও উপন্যাস',
    subCategory: 'tagore-poetry',
    subCategoryName: 'রবীন্দ্র সাহিত্য ও সঞ্চয়িতা',
    price: 450,
    mrp: 500,
    discount: '10%',
    rating: 4.9,
    reviewsCount: 750,
    inStock: true,
    edition: 'Official Visva-Bharati Edition',
    createdAt: '2023-05-08',
    binding: 'hardcover',
    condition: 'new',
    language: 'bengali',
    keywords: ['সঞ্চয়িতা', 'রবীন্দ্রনাথ', 'tagore', 'কবিতা'],
  },
  {
    id: 'book-17',
    bookId: 'book-sei-somoy-sunil',
    title: 'Sei Somoy (Volume 1 & 2 Complete) by Sunil Gangopadhyay',
    titleBn: 'সেই সময় (১ম ও ২য় খণ্ড একত্রে) - সুনীল গঙ্গোপাধ্যায়',
    author: 'সুনীল গঙ্গোপাধ্যায়',
    publisher: 'আনন্দ পাবলিশার্স',
    category: 'bengali-literature',
    categoryName: 'বাংলা সাহিত্য ও উপন্যাস',
    subCategory: 'historical-novels',
    subCategoryName: 'ধ্রুপদী ও আধুনিক উপন্যাস',
    price: 680,
    mrp: 850,
    discount: '20%',
    badge: 'AKADEMI AWARD',
    rating: 4.9,
    reviewsCount: 940,
    inStock: true,
    edition: 'Popular Edition',
    createdAt: '2024-08-15',
    binding: 'hardcover',
    condition: 'new',
    language: 'bengali',
    keywords: ['সেই সময়', 'সুনীল', 'উপন্যাস', 'gangopadhyay'],
  },
  {
    id: 'book-18',
    bookId: 'book-madhyamik-pariksha-prastuti',
    title: 'Madhyamik 2026 All-in-One Suggestion & Practice Book (WBBSE)',
    titleBn: 'মাধ্যমিক ২০২৬ অল-ইন-ওয়ান লাস্ট মিনিট সাজেশন ও মডেল পেপার্স',
    author: 'অভিজ্ঞ শিক্ষক পরিষদ মালদা শাখা',
    publisher: 'ছায়া প্রকাশনী',
    category: 'school-madhyamik-hs',
    categoryName: 'স্কুল (মাধ্যমিক ও উচ্চমাধ্যমিক)',
    subCategory: 'madhyamik-10',
    subCategoryName: 'মাধ্যমিক দশম শ্রেণি (WBBSE)',
    price: 290,
    mrp: 390,
    discount: '25%',
    badge: 'FAST SELLING',
    rating: 4.8,
    reviewsCount: 520,
    inStock: true,
    edition: '2026 WBBSE',
    createdAt: '2026-08-05',
    binding: 'paperback',
    condition: 'new',
    language: 'bengali',
    keywords: ['madhyamik', 'মাধ্যমিক', 'wbbse', 'ছায়া', 'সাজেশন'],
  },
  {
    id: 'book-19',
    bookId: 'book-hs-science-combo-2026',
    title: 'WBCHSE Class 12 Science Solved Test Papers (Phys, Chem, Math, Bio)',
    titleBn: 'উচ্চমাধ্যমিক দ্বাদশ বিজ্ঞান বিভাগ টেস্ট পেপারস সমাধান ২০২৬',
    author: 'ছায়া সায়েন্স বিশেষজ্ঞ ফোরাম',
    publisher: 'ছায়া প্রকাশনী',
    category: 'school-madhyamik-hs',
    categoryName: 'স্কুল (মাধ্যমিক ও উচ্চমাধ্যমিক)',
    subCategory: 'hs-12',
    subCategoryName: 'উচ্চমাধ্যমিক দ্বাদশ শ্রেণি (WBCHSE)',
    price: 480,
    mrp: 640,
    discount: '25%',
    rating: 4.7,
    reviewsCount: 340,
    inStock: true,
    edition: '2026 Exam Special',
    createdAt: '2026-07-30',
    binding: 'paperback',
    condition: 'new',
    language: 'bengali',
    keywords: ['hs', 'উচ্চমাধ্যমিক', 'wbchse', 'class 12', 'সায়েন্স'],
  },
  {
    id: 'book-20',
    bookId: 'book-malda-itihas-heritage',
    title: 'Gour O Panduar Aitihasik Bibaran (History of Malda Heritage)',
    titleBn: 'গৌড় ও পাণ্ডুয়ার ঐতিহাসিক বিবরণ ও প্রত্নতত্ত্ব সহায়িকা',
    author: 'ড. রাধাগোবিন্দ বসাক',
    publisher: 'এম.এম হেরিটেজ প্রেস',
    category: 'college-university',
    categoryName: 'কলেজ ও বিশ্ববিদ্যালয়',
    subCategory: 'malda-heritage',
    subCategoryName: 'মালদা হেরিটেজ ও আঞ্চলিক ইতিহাস',
    price: 232,
    mrp: 290,
    discount: '20%',
    badge: 'MALDA SPECIAL',
    rating: 4.9,
    reviewsCount: 92,
    inStock: true,
    edition: 'Heritage Edition',
    createdAt: '2025-09-12',
    binding: 'paperback',
    condition: 'new',
    language: 'bengali',
    keywords: ['গৌড়', 'মালদা', 'পাণ্ডুয়া', 'ইতিহাস', 'malda'],
  },
  {
    id: 'book-21',
    bookId: 'book-wbcs-all-in-one-bundle',
    title: 'WBCS 2026 Complete Success Combo Set (Manual + Scanner + Yearbook)',
    titleBn: 'WBCS ২০২৬ সম্পূর্ণ প্রস্তুতি কম্বো বান্ডল (ম্যানুয়াল + স্ক্যানার + ইয়ারবুক একত্রে)',
    author: 'ছায়া ও এম.এম সিভিল সার্ভিস গবেষণা পর্ষদ',
    publisher: 'ছায়া প্রকাশনী',
    category: 'wbcs-special',
    categoryName: 'WBCS ও সিভিল সার্ভিস',
    subCategory: 'wbcs-bundle',
    subCategoryName: 'সম্পূর্ণ কম্বো বান্ডল প্যাকেজ',
    price: 999,
    mrp: 1820,
    discount: '45%',
    badge: 'COMBO PACK',
    rating: 4.9,
    reviewsCount: 178,
    inStock: true,
    edition: '2026 3-in-1 Bundle Set',
    createdAt: '2026-08-20',
    binding: 'bundle',
    condition: 'new',
    language: 'bilingual',
    keywords: ['wbcs', 'combo', 'bundle', 'বান্ডল', 'সেট'],
  },
  {
    id: 'book-22',
    bookId: 'book-tet-practice-combo',
    title: 'WB Primary TET Challenger + 30 Mock Papers Combo Bundle',
    titleBn: 'প্রাথমিক টেট ২০২৬ সুপার কম্বো বান্ডল (চ্যালেঞ্জার ও ৩০টি ওএমআর মক পেপার্স)',
    author: 'শান্তনু পাত্র ও অভিজ্ঞ শিক্ষক পরিষদ',
    publisher: 'ছায়া প্রকাশনী',
    category: 'primary-tet-slst',
    categoryName: 'টেট ও স্কুল সার্ভিস',
    subCategory: 'primary-tet',
    subCategoryName: 'প্রাথমিক টেট (Primary TET)',
    price: 520,
    mrp: 850,
    discount: '39%',
    badge: 'STUDENT SAVER',
    rating: 4.8,
    reviewsCount: 290,
    inStock: true,
    edition: '2026 Bundle Pack',
    createdAt: '2026-08-18',
    binding: 'bundle',
    condition: 'new',
    language: 'bengali',
    keywords: ['tet', 'combo', 'bundle', 'বান্ডল', 'টেট'],
  },
];

const POPULAR_SUGGESTION_TAGS = [
  'WBCS ২০২৬',
  'প্রাথমিক টেট',
  'UGB ইতিহাস',
  'সুনীল গঙ্গোপাধ্যায়',
  'পুলিশ কনস্টেবল',
  'ব্যোমকেশ সমগ্র',
  'মাধ্যমিক টেস্ট পেপার',
  'ছায়া প্রকাশনী',
];

function SearchResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, isBengali } = useLanguage();
  const { addItem } = useCartStore();
  const { toggleItem: toggleWishlistItem } = useWishlistActions();
  const isInWishlist = useWishlistStore((state) => state.isInWishlist);

  // URL Query Parameters
  const queryParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || 'all';

  // State Management initialized from URL params (Critical Bug 2 fix)
  const [filterState, setFilterState] = useState<FilterState>(() => ({
    category: searchParams.get('category') || 'all',
    subCategory: searchParams.get('subCategory') || undefined,
    authors: searchParams.get('authors')?.split(',').filter(Boolean) || [],
    publishers: searchParams.get('publishers')?.split(',').filter(Boolean) || [],
    formats: searchParams.get('formats')?.split(',').filter(Boolean) || [],
    conditions: searchParams.get('conditions')?.split(',').filter(Boolean) || [],
    languages: searchParams.get('languages')?.split(',').filter(Boolean) || [],
    minRating: Number(searchParams.get('rating') || '0'),
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    discountRange: searchParams.get('discount') ? Number(searchParams.get('discount')) : undefined,
  }));

  const [sortBy, setSortBy] = useState<SortOption>(
    (searchParams.get('sort') as SortOption) || 'relevance'
  );

  const [viewMode, setViewMode] = useState<ViewMode>(
    (searchParams.get('view') as ViewMode) || 'grid'
  );

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [addedBooks, setAddedBooks] = useState<Record<string, boolean>>({});

  // URL sync helper (router.replace without scroll)
  const syncFiltersToUrl = (nextFilter: FilterState, nextSort: SortOption, nextView: ViewMode) => {
    const params = new URLSearchParams();

    if (queryParam) params.set('q', queryParam);
    if (nextFilter.category && nextFilter.category !== 'all') params.set('category', nextFilter.category);
    if (nextFilter.subCategory) params.set('subCategory', nextFilter.subCategory);
    if (nextFilter.authors.length > 0) params.set('authors', nextFilter.authors.join(','));
    if (nextFilter.publishers.length > 0) params.set('publishers', nextFilter.publishers.join(','));
    if (nextFilter.formats.length > 0) params.set('formats', nextFilter.formats.join(','));
    if (nextFilter.conditions.length > 0) params.set('conditions', nextFilter.conditions.join(','));
    if (nextFilter.languages.length > 0) params.set('languages', nextFilter.languages.join(','));
    if (nextFilter.minRating > 0) params.set('rating', String(nextFilter.minRating));
    if (nextFilter.minPrice !== undefined) params.set('minPrice', String(nextFilter.minPrice));
    if (nextFilter.maxPrice !== undefined) params.set('maxPrice', String(nextFilter.maxPrice));
    if (nextFilter.discountRange !== undefined) params.set('discount', String(nextFilter.discountRange));
    if (nextSort !== 'relevance') params.set('sort', nextSort);
    if (nextView !== 'grid') params.set('view', nextView);

    const queryString = params.toString();
    router.replace(queryString ? `/search?${queryString}` : '/search', { scroll: false });
  };

  const handleFilterChange = (next: FilterState) => {
    setFilterState(next);
    syncFiltersToUrl(next, sortBy, viewMode);
  };

  const handleSortChange = (next: SortOption) => {
    setSortBy(next);
    syncFiltersToUrl(filterState, next, viewMode);
  };

  const handleViewModeChange = (next: ViewMode) => {
    setViewMode(next);
    syncFiltersToUrl(filterState, sortBy, next);
  };

  // Sync state with URL when browser Back/Forward navigation occurs
  useEffect(() => {
    const urlCategory = searchParams.get('category') || 'all';
    const urlSubCategory = searchParams.get('subCategory') || undefined;
    const urlAuthors = searchParams.get('authors')?.split(',').filter(Boolean) || [];
    const urlPublishers = searchParams.get('publishers')?.split(',').filter(Boolean) || [];
    const urlFormats = searchParams.get('formats')?.split(',').filter(Boolean) || [];
    const urlConditions = searchParams.get('conditions')?.split(',').filter(Boolean) || [];
    const urlLanguages = searchParams.get('languages')?.split(',').filter(Boolean) || [];
    const urlRating = Number(searchParams.get('rating') || '0');
    const urlSort = (searchParams.get('sort') as SortOption) || 'relevance';
    const urlView = (searchParams.get('view') as ViewMode) || 'grid';

    setFilterState({
      category: urlCategory,
      subCategory: urlSubCategory,
      authors: urlAuthors,
      publishers: urlPublishers,
      formats: urlFormats,
      conditions: urlConditions,
      languages: urlLanguages,
      minRating: urlRating,
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      discountRange: searchParams.get('discount') ? Number(searchParams.get('discount')) : undefined,
    });
    setSortBy(urlSort);
    setViewMode(urlView);
  }, [searchParams]);

  // Compute live filtered books based on search query, category, and multi-facet selections
  const filteredBooks = useMemo(() => {
    const qLower = queryParam.trim().toLowerCase();

    return SEARCH_CATALOG.filter((book) => {
      // 1. Text Query Filter
      if (qLower) {
        const matchTitle = book.title.toLowerCase().includes(qLower);
        const matchTitleBn = book.titleBn.toLowerCase().includes(qLower);
        const matchAuthor = book.author.toLowerCase().includes(qLower);
        const matchPublisher = book.publisher.toLowerCase().includes(qLower);
        const matchCategory = book.categoryName.toLowerCase().includes(qLower);
        const matchKeywords = book.keywords?.some((k) => k.toLowerCase().includes(qLower));

        if (!matchTitle && !matchTitleBn && !matchAuthor && !matchPublisher && !matchCategory && !matchKeywords) {
          return false;
        }
      }

      // 2. Department / Category & Sub-Category Filter (Task 11)
      if (filterState.category && filterState.category !== 'all') {
        if (book.category !== filterState.category) {
          return false;
        }
      }
      if (filterState.subCategory) {
        if (book.subCategory !== filterState.subCategory) {
          return false;
        }
      }

      // 3. Authors Filter (OR within group)
      if (filterState.authors.length > 0) {
        const authorMatch = filterState.authors.some((author) =>
          book.author.includes(author)
        );
        if (!authorMatch) return false;
      }

      // 4. Publishers Filter (OR within group)
      if (filterState.publishers.length > 0) {
        const pubMatch = filterState.publishers.includes(book.publisher);
        if (!pubMatch) return false;
      }

      // 5. Binding Format Filter (OR within group)
      if (filterState.formats.length > 0) {
        const formatMatch = book.binding ? filterState.formats.includes(book.binding) : false;
        if (!formatMatch) return false;
      }

      // 6. Condition Filter (OR within group)
      if (filterState.conditions.length > 0) {
        const conditionMatch = book.condition ? filterState.conditions.includes(book.condition) : false;
        if (!conditionMatch) return false;
      }

      // 7. Languages Filter (Moderate Bug 3 fix)
      if (filterState.languages.length > 0) {
        const langMatch = book.language ? filterState.languages.includes(book.language) : false;
        if (!langMatch) return false;
      }

      // 8. Rating Filter (>= minRating)
      if (filterState.minRating > 0) {
        if (book.rating < filterState.minRating) {
          return false;
        }
      }

      // 9. Discount Range Filter (Task 17 & 20)
      if (filterState.discountRange !== undefined && filterState.discountRange > 0) {
        const discountVal = Math.round(((book.mrp - book.price) / book.mrp) * 100);
        if (discountVal < filterState.discountRange) {
          return false;
        }
      }

      // 10. Price Range Filter (Task 19 & 20)
      if (filterState.minPrice !== undefined) {
        if (book.price < filterState.minPrice) return false;
      }
      if (filterState.maxPrice !== undefined) {
        if (book.price > filterState.maxPrice) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      // Moderate Bug 1 fix: newest sorted by publication / createdAt date
      if (sortBy === 'newest') {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      }
      if (sortBy === 'bestselling') return (b.reviewsCount || 0) - (a.reviewsCount || 0);
      // Moderate Bug 2 fix: Multi-factor weighted relevance (Spec Q25):
      // Score = (TextMatch/Rating × 0.5) + (Bestseller × 0.3) + (InStock × 0.2)
      const scoreA = (a.rating * 0.5) + ((a.reviewsCount / 500) * 0.3) + (a.inStock ? 0.2 : 0);
      const scoreB = (b.rating * 0.5) + ((b.reviewsCount / 500) * 0.3) + (b.inStock ? 0.2 : 0);
      return scoreB - scoreA;
    });
  }, [queryParam, filterState, sortBy]);

  // Dynamically compute Facet Groups & Counts from the catalog matching current query
  const facetGroups = useMemo<FacetGroup[]>(() => {
    // Subset of books matching query only (so facets show available counts)
    const qLower = queryParam.trim().toLowerCase();
    const queryMatchedBooks = SEARCH_CATALOG.filter((book) => {
      if (!qLower) return true;
      const matchTitle = book.title.toLowerCase().includes(qLower);
      const matchTitleBn = book.titleBn.toLowerCase().includes(qLower);
      const matchAuthor = book.author.toLowerCase().includes(qLower);
      const matchPublisher = book.publisher.toLowerCase().includes(qLower);
      const matchCategory = book.categoryName.toLowerCase().includes(qLower);
      const matchKeywords = book.keywords?.some((k) => k.toLowerCase().includes(qLower));
      return matchTitle || matchTitleBn || matchAuthor || matchPublisher || matchCategory || matchKeywords;
    });

    // 1. Categories
    const categoryOptions = [
      { id: 'all', label: 'All Departments', labelBn: 'সকল বিভাগ', count: queryMatchedBooks.length },
      {
        id: 'wbcs-special',
        label: 'WBCS Special',
        labelBn: 'WBCS ও সিভিল সার্ভিস',
        count: queryMatchedBooks.filter((b) => b.category === 'wbcs-special').length,
      },
      {
        id: 'college-university',
        label: 'College & University',
        labelBn: 'কলেজ ও বিশ্ববিদ্যালয়',
        count: queryMatchedBooks.filter((b) => b.category === 'college-university').length,
      },
      {
        id: 'primary-tet-slst',
        label: 'Primary TET & School Service',
        labelBn: 'টেট ও স্কুল সার্ভিস',
        count: queryMatchedBooks.filter((b) => b.category === 'primary-tet-slst').length,
      },
      {
        id: 'competitive-exams',
        label: 'Competitive Exams (Police/RRB)',
        labelBn: 'সরকারি চাকরির পরীক্ষা',
        count: queryMatchedBooks.filter((b) => b.category === 'competitive-exams').length,
      },
      {
        id: 'bengali-literature',
        label: 'Bengali Literature & Fiction',
        labelBn: 'বাংলা সাহিত্য ও উপন্যাস',
        count: queryMatchedBooks.filter((b) => b.category === 'bengali-literature').length,
      },
      {
        id: 'school-madhyamik-hs',
        label: 'School (Madhyamik & HS)',
        labelBn: 'স্কুল (মাধ্যমিক ও উচ্চমাধ্যমিক)',
        count: queryMatchedBooks.filter((b) => b.category === 'school-madhyamik-hs').length,
      },
    ];

    // 2. Authors
    const topAuthors = [
      'ড. অশোক কুমার ঘোষ',
      'সত্যজিৎ রায়',
      'শরদিন্দু বন্দ্যোপাধ্যায়',
      'সুনীল গঙ্গোপাধ্যায়',
      'রবীন্দ্রনাথ ঠাকুর',
      'শান্তনু পাত্র',
      'অভিজিৎ মুখোপাধ্যায়',
    ];
    const authorOptions = topAuthors.map((author) => ({
      id: author,
      label: author,
      labelBn: author,
      count: queryMatchedBooks.filter((b) => b.author.includes(author)).length,
    }));

    // 3. Publishers
    const topPublishers = [
      'ছায়া প্রকাশনী',
      'আনন্দ পাবলিশার্স',
      'দে’জ পাবলিশিং',
      'মিত্র ও ঘোষ পাবলিশার্স',
      'পারুল প্রকাশনী',
      'বিশ্বভারতী গ্রন্থন বিভাগ',
      'মৌলিক লাইব্রেরী',
      'এম.এম হেরিটেজ প্রেস',
      'পশ্চিমবঙ্গ রাজ্য পুস্তক পর্ষদ',
    ];
    const publisherOptions = topPublishers.map((pub) => ({
      id: pub,
      label: pub,
      labelBn: pub,
      count: queryMatchedBooks.filter((b) => b.publisher === pub).length,
    }));

    // 4. Binding Format
    const formatOptions = [
      {
        id: 'paperback',
        label: 'Paperback',
        labelBn: 'পেপারব্যাক (Paperback)',
        count: queryMatchedBooks.filter((b) => b.binding === 'paperback').length,
      },
      {
        id: 'hardcover',
        label: 'Hardcover',
        labelBn: 'হার্ডকভার (Hardcover)',
        count: queryMatchedBooks.filter((b) => b.binding === 'hardcover').length,
      },
      {
        id: 'bundle',
        label: 'Combo Bundle',
        labelBn: 'কম্বো সেট (Book Bundle)',
        count: queryMatchedBooks.filter((b) => b.binding === 'bundle').length,
      },
    ];

    // 5. Condition
    const conditionOptions = [
      {
        id: 'new',
        label: 'New Edition',
        labelBn: 'নতুন বই (New Edition)',
        count: queryMatchedBooks.filter((b) => b.condition === 'new').length,
      },
      {
        id: 'used',
        label: 'Used / Second-hand',
        labelBn: 'ব্যবহৃত বই (Used)',
        count: queryMatchedBooks.filter((b) => b.condition === 'used').length,
      },
    ];

    // 5.1 Language (Moderate Bug 3 fix)
    const languageOptions = [
      {
        id: 'bengali',
        label: 'Bengali',
        labelBn: 'বাংলা',
        count: queryMatchedBooks.filter((b) => b.language === 'bengali').length,
      },
      {
        id: 'english',
        label: 'English',
        labelBn: 'ইংরেজি',
        count: queryMatchedBooks.filter((b) => b.language === 'english').length,
      },
      {
        id: 'bilingual',
        label: 'Bilingual (EN+BN)',
        labelBn: 'দ্বিভাষিক',
        count: queryMatchedBooks.filter((b) => b.language === 'bilingual').length,
      },
    ];

    // 6. Rating (Task 18)
    const ratingOptions = [
      {
        id: '4',
        label: '4 Stars & Up',
        labelBn: '৪★ ও তদূর্ধ্ব',
        count: queryMatchedBooks.filter((b) => b.rating >= 4.0).length,
      },
      {
        id: '3',
        label: '3 Stars & Up',
        labelBn: '৩★ ও তদূর্ধ্ব',
        count: queryMatchedBooks.filter((b) => b.rating >= 3.0).length,
      },
      {
        id: '2',
        label: '2 Stars & Up',
        labelBn: '২★ ও তদূর্ধ্ব',
        count: queryMatchedBooks.filter((b) => b.rating >= 2.0).length,
      },
      {
        id: '1',
        label: '1 Star & Up',
        labelBn: '১★ ও তদূর্ধ্ব',
        count: queryMatchedBooks.filter((b) => b.rating >= 1.0).length,
      },
    ];

    // 7. Price Brackets (Task 19)
    const priceOptions = [
      {
        id: 'under-200',
        label: 'Under ₹200',
        labelBn: '₹২০০ এর নিচে',
        count: queryMatchedBooks.filter((b) => b.price < 200).length,
      },
      {
        id: '200-500',
        label: '₹200 – ₹500',
        labelBn: '₹২০০ – ₹৫০০',
        count: queryMatchedBooks.filter((b) => b.price >= 200 && b.price <= 500).length,
      },
      {
        id: '500-1000',
        label: '₹500 – ₹1,000',
        labelBn: '₹৫০০ – ₹১,০০০',
        count: queryMatchedBooks.filter((b) => b.price >= 500 && b.price <= 1000).length,
      },
      {
        id: 'over-1000',
        label: 'Over ₹1,000',
        labelBn: '₹১,০০০ এর বেশি',
        count: queryMatchedBooks.filter((b) => b.price > 1000).length,
      },
    ];

    // 8. Discount Ranges (Task 17)
    const getDiscountPct = (b: (typeof SEARCH_CATALOG)[0]) =>
      Math.round(((b.mrp - b.price) / b.mrp) * 100);

    const discountOptions = [
      {
        id: '50',
        label: '50% Off or more',
        labelBn: '৫০% বা তার বেশি ছাড়',
        count: queryMatchedBooks.filter((b) => getDiscountPct(b) >= 50).length,
      },
      {
        id: '35',
        label: '35% Off or more',
        labelBn: '৩৫% বা তার বেশি ছাড়',
        count: queryMatchedBooks.filter((b) => getDiscountPct(b) >= 35).length,
      },
      {
        id: '25',
        label: '25% Off or more',
        labelBn: '২৫% বা তার বেশি ছাড়',
        count: queryMatchedBooks.filter((b) => getDiscountPct(b) >= 25).length,
      },
      {
        id: '10',
        label: '10% Off or more',
        labelBn: '১০% বা তার বেশি ছাড়',
        count: queryMatchedBooks.filter((b) => getDiscountPct(b) >= 10).length,
      },
    ];

    return [
      {
        id: 'category',
        title: 'Department / Category',
        titleBn: 'বিষয় ও পরীক্ষা',
        options: categoryOptions,
      },
      {
        id: 'publishers',
        title: 'Publishers',
        titleBn: 'শীর্ষ প্রকাশনী',
        options: publisherOptions,
      },
      {
        id: 'authors',
        title: 'Authors',
        titleBn: 'জনপ্রিয় লেখক',
        options: authorOptions,
      },
      {
        id: 'price',
        title: 'Price Range',
        titleBn: 'বইয়ের মূল্য',
        options: priceOptions,
      },
      {
        id: 'discount',
        title: 'Discount & Deals',
        titleBn: 'বিশেষ ছাড় ও অফার',
        options: discountOptions,
      },
      {
        id: 'rating',
        title: 'Customer Reviews',
        titleBn: 'গ্রাহক রিভিউ',
        options: ratingOptions,
      },
      {
        id: 'languages',
        title: 'Language',
        titleBn: 'বইয়ের ভাষা',
        options: languageOptions,
      },
      {
        id: 'formats',
        title: 'Binding Format',
        titleBn: 'বাঁধাইয়ের ধরন',
        options: formatOptions,
      },
      {
        id: 'conditions',
        title: 'Book Condition',
        titleBn: 'বইয়ের অবস্থা',
        options: conditionOptions,
      },
    ];
  }, [queryParam]);

  // Dynamically compute Hierarchical Category Tree (Task 11)
  const hierarchyCategories = useMemo<HierarchyCategoryNode[]>(() => {
    const qLower = queryParam.trim().toLowerCase();
    const queryMatched = SEARCH_CATALOG.filter((book) => {
      if (!qLower) return true;
      const matchTitle = book.title.toLowerCase().includes(qLower);
      const matchTitleBn = book.titleBn.toLowerCase().includes(qLower);
      const matchAuthor = book.author.toLowerCase().includes(qLower);
      const matchPublisher = book.publisher.toLowerCase().includes(qLower);
      const matchCategory = book.categoryName.toLowerCase().includes(qLower);
      const matchKeywords = book.keywords?.some((k) => k.toLowerCase().includes(qLower));
      return matchTitle || matchTitleBn || matchAuthor || matchPublisher || matchCategory || matchKeywords;
    });

    const getCount = (catId: string, subId?: string) => {
      return queryMatched.filter((b) => {
        if (b.category !== catId) return false;
        if (subId && b.subCategory !== subId) return false;
        return true;
      }).length;
    };

    return [
      {
        id: 'wbcs-special',
        label: 'WBCS & Civil Services',
        labelBn: 'WBCS ও সিভিল সার্ভিস',
        count: getCount('wbcs-special'),
        subCategories: [
          {
            id: 'wbcs-manual',
            label: 'Prelims & Mains Manual',
            labelBn: 'প্রিলিমিনারি ও মেইনস ম্যানুয়াল',
            count: getCount('wbcs-special', 'wbcs-manual'),
          },
          {
            id: 'wbcs-scanner',
            label: 'Scanner & Solved Papers',
            labelBn: 'সলভড স্ক্যানার ও প্রশ্নব্যাংক',
            count: getCount('wbcs-special', 'wbcs-scanner'),
          },
          {
            id: 'wbcs-current-affairs',
            label: 'Current Affairs & Yearbook',
            labelBn: 'কারেন্ট অ্যাফেয়ার্স ও ইয়ারবুক',
            count: getCount('wbcs-special', 'wbcs-current-affairs'),
          },
          {
            id: 'wbcs-bundle',
            label: 'Complete Combo Bundles',
            labelBn: 'সম্পূর্ণ কম্বো বান্ডল প্যাকেজ',
            count: getCount('wbcs-special', 'wbcs-bundle'),
          },
        ],
      },
      {
        id: 'college-university',
        label: 'College & University',
        labelBn: 'কলেজ ও বিশ্ববিদ্যালয় (UGB)',
        count: getCount('college-university'),
        subCategories: [
          {
            id: 'ugb-sem-1-2',
            label: 'Semester 1 & 2 (1st Year)',
            labelBn: 'সেমিস্টার ১ ও ২ (১ম বর্ষ CBCS)',
            count: getCount('college-university', 'ugb-sem-1-2'),
          },
          {
            id: 'ugb-sem-3-4',
            label: 'Semester 3 & 4 (2nd Year)',
            labelBn: 'সেমিস্টার ৩ ও ৪ (২য় বর্ষ অনার্স/পাস)',
            count: getCount('college-university', 'ugb-sem-3-4'),
          },
          {
            id: 'malda-heritage',
            label: 'Malda Heritage & History',
            labelBn: 'মালদা হেরিটেজ ও আঞ্চলিক ইতিহাস',
            count: getCount('college-university', 'malda-heritage'),
          },
        ],
      },
      {
        id: 'primary-tet-slst',
        label: 'Primary TET & School Service',
        labelBn: 'টেট ও স্কুল সার্ভিস',
        count: getCount('primary-tet-slst'),
        subCategories: [
          {
            id: 'primary-tet',
            label: 'Primary TET Complete',
            labelBn: 'প্রাথমিক টেট (Primary TET)',
            count: getCount('primary-tet-slst', 'primary-tet'),
          },
          {
            id: 'upper-primary',
            label: 'Upper Primary TET',
            labelBn: 'উচ্চ প্রাথমিক টেট (Upper Primary)',
            count: getCount('primary-tet-slst', 'upper-primary'),
          },
          {
            id: 'slst-ssc',
            label: 'SLST Assistant Teacher',
            labelBn: 'স্কুল সার্ভিস কমিশন (SLST)',
            count: getCount('primary-tet-slst', 'slst-ssc'),
          },
        ],
      },
      {
        id: 'competitive-exams',
        label: 'Police & Railway Exams',
        labelBn: 'পুলিশ ও রেলওয়ে পরীক্ষা',
        count: getCount('competitive-exams'),
        subCategories: [
          {
            id: 'wb-police',
            label: 'WB Police & Constable',
            labelBn: 'পশ্চিমবঙ্গ পুলিশ ও কনস্টেবল',
            count: getCount('competitive-exams', 'wb-police'),
          },
          {
            id: 'railway-rrb',
            label: 'Railway RRB ALP/Tech',
            labelBn: 'রেলওয়ে রিক্রুটমেন্ট (RRB)',
            count: getCount('competitive-exams', 'railway-rrb'),
          },
          {
            id: 'ssc-central',
            label: 'SSC CHSL & CGL',
            labelBn: 'স্টাফ সিলেকশন কমিশন (SSC)',
            count: getCount('competitive-exams', 'ssc-central'),
          },
        ],
      },
      {
        id: 'bengali-literature',
        label: 'Bengali Literature & Fiction',
        labelBn: 'বাংলা সাহিত্য ও উপন্যাস',
        count: getCount('bengali-literature'),
        subCategories: [
          {
            id: 'detective-feluda',
            label: 'Feluda Detective Series',
            labelBn: 'ফেলুদা সমগ্র - সত্যজিৎ রায়',
            count: getCount('bengali-literature', 'detective-feluda'),
          },
          {
            id: 'detective-byomkesh',
            label: 'Byomkesh Samagra',
            labelBn: 'ব্যোমকেশ সমগ্র - শরদিন্দু',
            count: getCount('bengali-literature', 'detective-byomkesh'),
          },
          {
            id: 'tagore-poetry',
            label: 'Rabindranath Tagore Collection',
            labelBn: 'রবীন্দ্র সাহিত্য ও সঞ্চয়িতা',
            count: getCount('bengali-literature', 'tagore-poetry'),
          },
          {
            id: 'historical-novels',
            label: 'Classics & Modern Novels',
            labelBn: 'ধ্রুপদী ও আধুনিক উপন্যাস',
            count: getCount('bengali-literature', 'historical-novels'),
          },
        ],
      },
      {
        id: 'school-madhyamik-hs',
        label: 'School (Madhyamik & HS)',
        labelBn: 'স্কুল (মাধ্যমিক ও উচ্চমাধ্যমিক)',
        count: getCount('school-madhyamik-hs'),
        subCategories: [
          {
            id: 'madhyamik-10',
            label: 'Madhyamik 10th (WBBSE)',
            labelBn: 'মাধ্যমিক দশম শ্রেণি (WBBSE)',
            count: getCount('school-madhyamik-hs', 'madhyamik-10'),
          },
          {
            id: 'hs-12',
            label: 'Higher Secondary 12th (WBCHSE)',
            labelBn: 'উচ্চমাধ্যমিক দ্বাদশ শ্রেণি (WBCHSE)',
            count: getCount('school-madhyamik-hs', 'hs-12'),
          },
        ],
      },
    ];
  }, [queryParam]);

  // Compute subCategoryLabel for active chips (Task 11)
  const subCategoryLabel = useMemo(() => {
    if (!filterState.subCategory) return undefined;
    for (const cat of hierarchyCategories) {
      const sub = cat.subCategories.find((s) => s.id === filterState.subCategory);
      if (sub) {
        return isBengali ? sub.labelBn : sub.label;
      }
    }
    return filterState.subCategory;
  }, [filterState.subCategory, hierarchyCategories, isBengali]);

  // Count active filters
  const activeFiltersCount =
    (filterState.category && filterState.category !== 'all' ? 1 : 0) +
    (filterState.subCategory ? 1 : 0) +
    filterState.authors.length +
    filterState.publishers.length +
    filterState.formats.length +
    filterState.conditions.length +
    filterState.languages.length +
    (filterState.minRating > 0 ? 1 : 0) +
    (filterState.discountRange !== undefined ? 1 : 0) +
    (filterState.minPrice !== undefined || filterState.maxPrice !== undefined ? 1 : 0);

  const handleClearAllFilters = () => {
    const defaultState: FilterState = {
      category: 'all',
      subCategory: undefined,
      authors: [],
      publishers: [],
      formats: [],
      conditions: [],
      languages: [],
      minRating: 0,
      minPrice: undefined,
      maxPrice: undefined,
      discountRange: undefined,
    };
    setFilterState(defaultState);
    syncFiltersToUrl(defaultState, sortBy, viewMode);
  };

  const handleRemoveFilterChip = (
    type: 'category' | 'subCategory' | 'author' | 'publisher' | 'format' | 'condition' | 'language' | 'rating' | 'price' | 'discount',
    val?: string
  ) => {
    const next: FilterState = { ...filterState };
    if (type === 'category') {
      next.category = 'all';
      next.subCategory = undefined;
    } else if (type === 'subCategory') {
      next.subCategory = undefined;
    } else if (type === 'price') {
      next.minPrice = undefined;
      next.maxPrice = undefined;
    } else if (type === 'discount') {
      next.discountRange = undefined;
    } else if (type === 'author' && val) {
      next.authors = next.authors.filter((a) => a !== val);
    } else if (type === 'publisher' && val) {
      next.publishers = next.publishers.filter((p) => p !== val);
    } else if (type === 'format' && val) {
      next.formats = next.formats.filter((f) => f !== val);
    } else if (type === 'condition' && val) {
      next.conditions = next.conditions.filter((c) => c !== val);
    } else if (type === 'language' && val) {
      next.languages = next.languages.filter((l) => l !== val);
    } else if (type === 'rating') {
      next.minRating = 0;
    }
    handleFilterChange(next);
  };

  const handleAddToCart = (book: BookProduct) => {
    const activeDeal = getActiveDealForBook(book.bookId);
    addItem({
      id: `cart-${book.id}`,
      bookId: book.bookId,
      title: book.title,
      titleBn: book.titleBn,
      author: book.author,
      price: activeDeal ? activeDeal.dealPrice : book.price,
      mrp: activeDeal ? activeDeal.mrp : book.mrp,
      quantity: 1,
      maxQuantity: activeDeal ? activeDeal.maxPerCustomer || 1 : undefined,
    });

    setAddedBooks((prev) => ({ ...prev, [book.id]: true }));
    setTimeout(() => {
      setAddedBooks((prev) => ({ ...prev, [book.id]: false }));
    }, 1500);
  };

  // Hook for Smart Auto Scroll-to-Top on filter or sort change (Task 6)
  useScrollToResults({
    containerId: 'search-results-main',
    triggerDeps: [filterState, sortBy],
  });

  return (
    <>
      <SearchResultsLayout
        sidebar={
          <DesktopFacetSidebar
            facetGroups={facetGroups}
            hierarchyCategories={hierarchyCategories}
            filterState={filterState}
            onFilterChange={handleFilterChange}
            onClearAll={handleClearAllFilters}
            hasActiveFilters={activeFiltersCount > 0}
            isBengali={isBengali}
          />
        }
        header={
          <ResultSummaryHeader
            query={queryParam}
            categoryName={
              filterState.category !== 'all'
                ? facetGroups[0]?.options.find((o) => o.id === filterState.category)?.labelBn || filterState.category
                : undefined
            }
            totalResults={filteredBooks.length}
            displayedResults={filteredBooks.length}
            sortBy={sortBy}
            onSortChange={handleSortChange}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            isBengali={isBengali}
          />
        }
        activeChips={
          <ActiveFilterChips
            filterState={filterState}
            facetGroups={facetGroups}
            subCategoryLabel={subCategoryLabel}
            onRemoveFilter={handleRemoveFilterChip}
            onClearAll={handleClearAllFilters}
            isBengali={isBengali}
          />
        }
      >
        {/* Main Products Display (Grid vs List View - Task 2) */}
        {filteredBooks.length > 0 ? (
          viewMode === 'grid' ? (
            /* Adaptive Grid View (4 cols lg, 3 cols md, 2 cols mobile) */
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {filteredBooks.map((book) => {
                const activeDeal = getActiveDealForBook(book.bookId);
                const displayPrice = activeDeal ? activeDeal.dealPrice : book.price;
                const displayMrp = activeDeal ? activeDeal.mrp : book.mrp;
                const isAdded = addedBooks[book.id];
                const inWish = isInWishlist(book.bookId);

                return (
                  <div
                    key={book.id}
                    className="bg-white rounded-xl border border-gray-200 hover:border-amber-400 hover:shadow-md transition-all duration-200 flex flex-col p-3 sm:p-4 relative group"
                  >
                    {/* Badge */}
                    {activeDeal ? (
                      <div className="absolute top-2.5 left-2.5 z-10">
                        <AmazonDealBadge
                          dealType={activeDeal.dealType}
                          discountPercentage={activeDeal.discountPercentage}
                        />
                      </div>
                    ) : book.badge ? (
                      <span className="absolute top-2.5 left-2.5 z-10 bg-[#f08804] text-white text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded shadow-2xs">
                        {book.badge}
                      </span>
                    ) : null}

                    {/* Wishlist Button */}
                    <button
                      type="button"
                      onClick={() => toggleWishlistItem(book.bookId)}
                      aria-label={inWish ? 'উইশলিস্ট থেকে মুছুন' : 'উইশলিস্টে যুক্ত করুন'}
                      className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full bg-white/90 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors shadow-2xs cursor-pointer"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${
                          inWish ? 'text-red-500 fill-red-500' : ''
                        }`}
                      />
                    </button>

                    {/* Book Cover Placeholder Frame */}
                    <div className="w-full h-36 sm:h-48 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg flex flex-col items-center justify-center p-3 mb-3 border border-amber-100/70 relative overflow-hidden group-hover:scale-[1.02] transition-transform">
                      <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-amber-600/70 mb-2" />
                      <span className="text-[10px] sm:text-[11px] font-bold text-center text-gray-800 line-clamp-2 px-1">
                        {isBengali ? book.titleBn : book.title}
                      </span>
                      <span className="text-[9px] text-gray-500 mt-1 truncate max-w-full">
                        {book.publisher}
                      </span>
                    </div>

                    {/* Category & Rating */}
                    <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-gray-500 mb-1">
                      <span className="font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded text-[9px] truncate max-w-[90px]">
                        {book.categoryName}
                      </span>
                      <div className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{book.rating}</span>
                        <span className="text-gray-400 text-[10px]">
                          ({isBengali ? toBengaliNumerals(book.reviewsCount) : book.reviewsCount})
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-gray-900 text-xs sm:text-sm leading-snug line-clamp-2 mb-1 group-hover:text-amber-700 transition-colors">
                      {isBengali ? book.titleBn : book.title}
                    </h3>

                    {/* Author */}
                    <p className="text-[11px] text-gray-500 mb-2 truncate">
                      {isBengali ? 'লেখক: ' : 'By: '}
                      <span className="font-medium text-gray-800">{book.author}</span>
                    </p>

                    {/* Pricing & Cart Block */}
                    <div className="mt-auto pt-2 border-t border-gray-100">
                      <div className="flex items-baseline gap-1.5 sm:gap-2">
                        <span className={`text-sm sm:text-base font-black ${activeDeal ? 'text-[#cc0c39]' : 'text-gray-950'}`}>
                          {formatINR(displayPrice, language)}
                        </span>
                        <span className="text-[11px] text-gray-400 line-through">
                          {formatINR(displayMrp, language)}
                        </span>
                        <span className={`text-[10px] font-bold ${activeDeal ? 'text-[#cc0c39]' : 'text-green-700'}`}>
                          {activeDeal ? `${toBengaliNumerals(activeDeal.discountPercentage)}% ছাড়` : `${book.discount} ছাড়`}
                        </span>
                      </div>

                      {/* Fast Delivery Note */}
                      <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-emerald-700 mt-1">
                        <Zap className="w-3 h-3 text-amber-500 fill-amber-400 shrink-0" />
                        <span className="truncate">
                          {isBengali ? 'মালদা টাউনে দ্রুত ডেলিভারি' : 'Fast Malda Dispatch'}
                        </span>
                      </div>

                      {/* 1-Click Add to Cart Button */}
                      <button
                        type="button"
                        onClick={() => handleAddToCart(book)}
                        className={`w-full mt-2.5 py-1.5 sm:py-2 px-2 rounded-md font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isAdded
                            ? 'bg-green-600 text-white shadow-xs'
                            : 'bg-[#ffd814] hover:bg-[#f7ca00] active:bg-[#f0b800] text-gray-950 border border-[#fcd200]'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>{isBengali ? 'যুক্ত হয়েছে' : 'Added'}</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>{isBengali ? 'কার্টে যোগ করুন' : 'Add to Cart'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Amazon-Style Horizontal List View (Task 2) */
            <div className="flex flex-col gap-3.5">
              {filteredBooks.map((book) => {
                const activeDeal = getActiveDealForBook(book.bookId);
                const displayPrice = activeDeal ? activeDeal.dealPrice : book.price;
                const displayMrp = activeDeal ? activeDeal.mrp : book.mrp;
                const displaySavings = displayMrp - displayPrice;
                const isAdded = addedBooks[book.id];
                const inWish = isInWishlist(book.bookId);

                return (
                  <div
                    key={book.id}
                    className="bg-white rounded-xl border border-gray-200 hover:border-amber-400 hover:shadow-md transition-all duration-200 p-4 flex flex-col sm:flex-row gap-4 items-start relative group"
                  >
                    {/* Left: Book Cover Image Frame */}
                    <div className="w-full sm:w-40 h-44 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg shrink-0 flex flex-col items-center justify-center p-3 border border-amber-100 relative overflow-hidden group-hover:scale-[1.02] transition-transform">
                      {activeDeal ? (
                        <div className="absolute top-2 left-2 z-10">
                          <AmazonDealBadge
                            dealType={activeDeal.dealType}
                            discountPercentage={activeDeal.discountPercentage}
                          />
                        </div>
                      ) : book.badge ? (
                        <span className="absolute top-2 left-2 z-10 bg-[#f08804] text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-2xs">
                          {book.badge}
                        </span>
                      ) : null}
                      <BookOpen className="w-12 h-12 text-amber-600/70 mb-2" />
                      <span className="text-[11px] font-bold text-center text-gray-800 line-clamp-2 px-1">
                        {isBengali ? book.titleBn : book.title}
                      </span>
                    </div>

                    {/* Middle: Details & Information */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-[10px]">
                          {book.categoryName}
                        </span>
                        {book.binding && (
                          <span className="text-[10px] font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                            {book.binding === 'paperback' ? 'Paperback' : 'Hardcover'}
                          </span>
                        )}
                        {book.edition && (
                          <span className="text-[10px] text-gray-500">
                            • {book.edition}
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-gray-900 text-base leading-snug group-hover:text-amber-700 transition-colors">
                        {isBengali ? book.titleBn : book.title}
                      </h3>

                      <p className="text-xs text-gray-600">
                        {isBengali ? 'লেখক: ' : 'By: '}
                        <span className="font-semibold text-gray-800">{book.author}</span>
                        <span className="text-gray-400 mx-1.5">|</span>
                        {isBengali ? 'প্রকাশনী: ' : 'Publisher: '}
                        <span className="text-gray-700">{book.publisher}</span>
                      </p>

                      <div className="flex items-center gap-1.5 pt-1">
                        <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          <span>{book.rating}</span>
                        </div>
                        <span className="text-xs text-gray-400">
                          ({isBengali ? toBengaliNumerals(book.reviewsCount) : book.reviewsCount} {isBengali ? 'গ্রাহক রিভিউ' : 'reviews'})
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1 text-xs text-emerald-700 font-medium">
                        <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                        <span>
                          {isBengali
                            ? 'মালদা টাউন ও উত্তরবঙ্গে দ্রুত হোম ডেলিভারি উপলব্ধ'
                            : 'Fast home delivery available in Malda Town'}
                        </span>
                      </div>
                    </div>

                    {/* Right: Pricing Block & Action Button */}
                    <div className="w-full sm:w-48 sm:border-l sm:border-gray-100 sm:pl-4 pt-3 sm:pt-0 flex flex-col justify-between self-stretch">
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className={`text-xl font-black ${activeDeal ? 'text-[#cc0c39]' : 'text-gray-950'}`}>
                            {formatINR(displayPrice, language)}
                          </span>
                          <span className="text-xs text-gray-400 line-through">
                            {formatINR(displayMrp, language)}
                          </span>
                        </div>
                        <div className={`text-xs font-bold mt-0.5 ${activeDeal ? 'text-[#cc0c39]' : 'text-green-700'}`}>
                          {activeDeal
                            ? 'সীমিত সময়ের ফ্ল্যাশ ডিল মূল্য!'
                            : `${book.discount} ছাড় (সঞ্চয়: ${formatINR(displaySavings, language)})`}
                        </div>

                        <div className="text-[11px] text-gray-500 mt-2 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                          <span>{isBengali ? 'কাউন্টারে স্টকে রয়েছে' : 'In Stock'}</span>
                        </div>
                      </div>

                      <div className="pt-4 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAddToCart(book)}
                          className={`flex-1 py-2 px-3 rounded-md font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            isAdded
                              ? 'bg-green-600 text-white shadow-xs'
                              : 'bg-[#ffd814] hover:bg-[#f7ca00] active:bg-[#f0b800] text-gray-950 border border-[#fcd200]'
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>{isBengali ? 'যুক্ত হয়েছে' : 'Added'}</span>
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span>{isBengali ? 'কার্টে যোগ করুন' : 'Add to Cart'}</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleWishlistItem(book.bookId)}
                          aria-label={inWish ? 'উইশলিস্ট থেকে মুছুন' : 'উইশলিস্টে যুক্ত করুন'}
                          className="p-2 rounded-md border border-gray-200 hover:bg-gray-50 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Heart
                            className={`w-4 h-4 ${inWish ? 'text-red-500 fill-red-500' : ''}`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* Empty / Zero-Result Recovery State */
          <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-12 text-center max-w-xl mx-auto space-y-5 my-6">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-2xs">
              <Package className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                {isBengali
                  ? `নির্বাচিত ফিল্টারে কোনো বই খুঁজে পাওয়া যায়নি`
                  : `No books matched the selected filters`}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
                {isBengali
                  ? 'ফিল্টারের পরিধি শিথিল করুন অথবা সমস্ত ফিল্টার মুছে পুনরায় চেষ্টা করুন।'
                  : 'Try relaxing your filter criteria or reset all filters to browse all catalog items.'}
              </p>
            </div>

            {/* Reset Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-lg shadow transition-colors cursor-pointer inline-flex items-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isBengali ? 'সমস্ত ফিল্টার রিসেট করুন' : 'Reset All Filters'}</span>
              </button>
            </div>

            {/* WhatsApp Book Request Option */}
            <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-left bg-gray-50 p-3.5 rounded-xl">
              <div>
                <p className="text-xs font-bold text-gray-800">
                  {isBengali ? 'কাঙ্ক্ষিত বইটি খুঁজে পাচ্ছেন না?' : 'Looking for a specific book?'}
                </p>
                <p className="text-[11px] text-gray-500">
                  {isBengali
                    ? 'আমাদের জানান, মালদা স্টোর থেকে অবিলম্বে সংগ্রহ করে দেব।'
                    : 'WhatsApp our team, and we will source it for you immediately.'}
                </p>
              </div>

              <a
                href="https://wa.me/919800123456?text=Hello%20M.M%20Book%20House,%20I%20am%20looking%20for%20a%20book"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>{isBengali ? 'WhatsApp অনুরোধ' : 'WhatsApp Request'}</span>
              </a>
            </div>
          </div>
        )}
      </SearchResultsLayout>

      {/* Mobile Sticky Bottom Sort & Filter Action Bar (Task 3) */}
      <MobileSortFilterBar
        sortBy={sortBy}
        onSortChange={handleSortChange}
        onOpenFilterDrawer={() => setIsMobileDrawerOpen(true)}
        activeFiltersCount={activeFiltersCount}
        isBengali={isBengali}
      />

      {/* Amazon-Style Dual-Pane Mobile Filter Drawer (Task 4 & 5) */}
      <MobileDualPaneDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        facetGroups={facetGroups}
        hierarchyCategories={hierarchyCategories}
        filterState={filterState}
        onFilterChange={handleFilterChange}
        matchingCount={filteredBooks.length}
        onApply={() => setIsMobileDrawerOpen(false)}
        isBengali={isBengali}
      />

      {/* Spacing padding at bottom for mobile sticky bar */}
      <div className="h-16 md:hidden" />
    </>
  );
}

function SearchLoadingSkeleton() {
  return (
    <div className="max-w-[1500px] mx-auto px-4 py-6 min-h-[75vh] animate-pulse">
      <div className="h-4 w-48 bg-gray-200 rounded mb-4" />
      <div className="h-20 bg-gray-200 rounded-xl mb-6" />
      <div className="flex gap-6">
        <div className="hidden md:block w-64 h-96 bg-gray-200 rounded-xl shrink-0" />
        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-72 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchLoadingSkeleton />}>
      <SearchResultsContent />
    </Suspense>
  );
}
