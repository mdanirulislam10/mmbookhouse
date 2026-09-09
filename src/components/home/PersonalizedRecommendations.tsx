'use client';

import React, { useMemo } from 'react';
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

  // Combine all available books
  const allBooks = useMemo<CarouselProduct[]>(() => {
    return [...WBCS_BESTSELLERS, ...MALDA_STUDENT_FAVORITES, ...UGB_COLLEGE_TEXTBOOKS];
  }, []);

  // Compute recommended books based on history or fallback
  const recommendedItems = useMemo<CarouselProduct[]>(() => {
    if (!hasHistory) {
      // Fallback: Pick top 8 diverse bestsellers for new users
      return [
        WBCS_BESTSELLERS[0],
        MALDA_STUDENT_FAVORITES[0],
        UGB_COLLEGE_TEXTBOOKS[0],
        WBCS_BESTSELLERS[2],
        MALDA_STUDENT_FAVORITES[2],
        UGB_COLLEGE_TEXTBOOKS[1],
        MALDA_STUDENT_FAVORITES[1],
        WBCS_BESTSELLERS[6],
      ];
    }

    // Has history: Prioritize books in the same categories as browsed, or the viewed books
    const categoryMatched = allBooks.filter((book) =>
      categories.includes(book.category) && !bookIds.includes(book.bookId)
    );

    const viewedBooks = allBooks.filter((book) =>
      bookIds.includes(book.bookId)
    );

    const merged = [...viewedBooks, ...categoryMatched];

    // If still less than 6, fill with top-rated
    if (merged.length < 6) {
      const remaining = allBooks.filter((b) => !merged.some((m) => m.bookId === b.bookId));
      return [...merged, ...remaining].slice(0, 10);
    }

    return merged.slice(0, 12);
  }, [hasHistory, categories, bookIds, allBooks]);

  const collection = useMemo<CarouselCollection>(() => {
    if (hasHistory) {
      return {
        id: 'personalized-browsing-collection',
        title: 'Recommended Based on Your Browsing',
        titleBn: 'আপনার সাম্প্রতিক আগ্রহের ভিত্তিতে নির্বাচিত বই',
        subtitleBn: 'আপনার ব্রাউজিং ও পছন্দের বিভাগের ওপর ভিত্তি করে বিশেষ সংকলন',
        viewAllUrl: '/search?category=all',
        badgeTextBn: '🎯 ব্যক্তিগতকৃত রিকমেন্ডেশন',
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

  if (!isInitialized) return null;

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
