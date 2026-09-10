'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useBrowsingHistory } from '@/hooks/useBrowsingHistory';
import { ProductCarousel } from './ProductCarousel';
import { CarouselCollection, CarouselProduct } from '@/types/carousel';
import {
  WBCS_BESTSELLERS,
  UGB_COLLEGE_TEXTBOOKS,
  MALDA_STUDENT_FAVORITES
} from '@/lib/data/carouselBooks';
import { Sparkles, Trash2, History } from 'lucide-react';

interface PersonalizedRecommendationsProps {
  className?: string;
}

export function PersonalizedRecommendations({ className = '' }: PersonalizedRecommendationsProps) {
  const { history, bookIds, categories, clearHistory, hasHistory, isInitialized } = useBrowsingHistory();
  const [examPreferences, setExamPreferences] = useState<string[]>([]);

  // Task 32: Synchronize customer's exam preparation goals (WBCS, UGB, Primary TET, etc.)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('mm_user_exam_preferences');
      if (stored) {
        setExamPreferences(JSON.parse(stored));
      }
    } catch {
      // Safe fallback
    }

    const handlePrefChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ preferences?: string[] }>;
      if (customEvent.detail?.preferences) {
        setExamPreferences(customEvent.detail.preferences);
      }
    };

    window.addEventListener('mm_exam_preference_changed', handlePrefChange);
    return () => window.removeEventListener('mm_exam_preference_changed', handlePrefChange);
  }, []);

  // Combine all available books
  const allBooks = useMemo<CarouselProduct[]>(() => {
    return [...WBCS_BESTSELLERS, ...MALDA_STUDENT_FAVORITES, ...UGB_COLLEGE_TEXTBOOKS];
  }, []);

  // Compute recommended books based on exam preferences and browsing history
  const recommendedItems = useMemo<CarouselProduct[]>(() => {
    const examMatched: CarouselProduct[] = [];

    // Prioritize by selected exam target
    if (examPreferences.includes('wbcs')) {
      examMatched.push(...WBCS_BESTSELLERS.slice(0, 4));
    }
    if (examPreferences.includes('ugb')) {
      examMatched.push(...UGB_COLLEGE_TEXTBOOKS.slice(0, 4));
    }
    if (examPreferences.includes('primary_tet') || examPreferences.includes('railway') || examPreferences.includes('ssc_cgl')) {
      examMatched.push(...MALDA_STUDENT_FAVORITES.slice(0, 3));
    }

    if (!hasHistory && examMatched.length === 0) {
      // Fallback: Pick top diverse bestsellers for new users with safe defensive filtering
      return [
        WBCS_BESTSELLERS[0],
        MALDA_STUDENT_FAVORITES[0],
        UGB_COLLEGE_TEXTBOOKS[0],
        WBCS_BESTSELLERS[2],
        MALDA_STUDENT_FAVORITES[2],
        UGB_COLLEGE_TEXTBOOKS[1],
        MALDA_STUDENT_FAVORITES[1],
        WBCS_BESTSELLERS[6],
      ].filter((item): item is CarouselProduct => Boolean(item));
    }

    // Has history: Prioritize viewed books & matched categories
    const viewedBooks = bookIds
      .map((id) => allBooks.find((b) => b.bookId === id))
      .filter(Boolean) as CarouselProduct[];

    const categoryMatched = allBooks.filter((book) =>
      categories.includes(book.category) && !bookIds.includes(book.bookId)
    );

    // Deduplicate merged list: Exam Target Goals first, then Viewed, then Category
    const seenIds = new Set<string>();
    const merged: CarouselProduct[] = [];

    for (const b of [...examMatched, ...viewedBooks, ...categoryMatched]) {
      if (!seenIds.has(b.bookId)) {
        seenIds.add(b.bookId);
        merged.push(b);
      }
    }

    // If still less than 6, fill with top-rated
    if (merged.length < 6) {
      const remaining = allBooks.filter((b) => !seenIds.has(b.bookId));
      return [...merged, ...remaining].slice(0, 10);
    }

    return merged.slice(0, 12);
  }, [hasHistory, categories, bookIds, allBooks, examPreferences]);

  const collection = useMemo<CarouselCollection>(() => {
    const hasExamPref = examPreferences.length > 0;
    if (hasExamPref || hasHistory) {
      return {
        id: 'personalized-browsing-collection',
        title: 'Recommended for Your Studies',
        titleBn: hasExamPref
          ? 'আপনার পরীক্ষার লক্ষ্য ও আগ্রহের ভিত্তিতে নির্বাচিত বই'
          : 'আপনার সাম্প্রতিক আগ্রহের ভিত্তিতে নির্বাচিত বই',
        subtitleBn: hasExamPref
          ? 'আপনার প্রোফাইলে নির্বাচিত লক্ষ্য (WBCS/UGB/TET) অনুযায়ী বিশেষ সুপারিশ'
          : 'আপনার ব্রাউজিং ও পছন্দের বিভাগের ওপর ভিত্তি করে বিশেষ সংকলন',
        viewAllUrl: '/search?category=all',
        badgeTextBn: hasExamPref ? '🎯 আপনার পরীক্ষার লক্ষ্য' : '🎯 ব্যক্তিগতকৃত রিকমেন্ডেশন',
        items: recommendedItems,
      };
    }

    return {
      id: 'trending-discover-collection',
      title: 'Trending Books for Malda Students',
      titleBn: 'ট্রেন্ডিং ও সর্বাধিক প্রশংসিত বইয়ের সংকলন',
      subtitleBn: 'মালদার শিক্ষার্থীদের মধ্যে বর্তমানে সর্বাধিক চাহিদাসম্পন্ন পাঠ্য ও সহায়ক বই',
      viewAllUrl: '/trending',
      badgeTextBn: '🔥 হট ট্রেন্ডিং',
      items: recommendedItems,
    };
  }, [hasHistory, recommendedItems]);

  return (
    <div className={`relative ${className}`}>
      {/* Optional Top Mini Toolbar when history is present */}
      {hasHistory && (
        <div className="flex items-center justify-between px-2 pb-1 text-xs text-gray-500">
          <span className="flex items-center gap-1 font-medium text-amber-800">
            <History className="w-3.5 h-3.5" />
            <span>আপনার পূর্ববর্তী ব্রাউজিং অনুসারে সাজানো</span>
          </span>
          <button
            onClick={clearHistory}
            className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-rose-600 transition-colors"
            title="ব্রাউজিং হিস্ট্রি মুছুন"
          >
            <Trash2 className="w-3 h-3" />
            <span>হিস্ট্রি ক্লিয়ার করুন</span>
          </button>
        </div>
      )}

      {/* Render Carousel */}
      <ProductCarousel collection={collection} />
    </div>
  );
}
