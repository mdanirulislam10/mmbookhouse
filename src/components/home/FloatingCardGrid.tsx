'use client';

import React, { useState } from 'react';
import { QuadCategoryCard } from './QuadCategoryCard';
import { SpotlightAuthCard } from './SpotlightAuthCard';
import { QuadCardSkeleton } from './QuadCardSkeleton';
import { CURATED_QUAD_CARDS } from '@/lib/data/quadCards';
import { Layers, User, BookCheck, Eye } from 'lucide-react';

interface FloatingCardGridProps {
  className?: string;
  isLoading?: boolean;
}

export const FloatingCardGrid: React.FC<FloatingCardGridProps> = ({
  className = '',
  isLoading: initialLoading = false,
}) => {
  // Mode toggle for 4th card: 'auth' (Spotlight Sign-in / User Hub) vs 'school' (School Test Papers)
  const [fourthCardMode, setFourthCardMode] = useState<'auth' | 'school'>('auth');
  const [showSkeletonDemo, setShowSkeletonDemo] = useState(initialLoading);

  return (
    <section
      aria-label="অ্যামাজন সিগনেচার ভাসমান কার্ড গ্রিড"
      className={`relative z-10 -mt-16 sm:-mt-24 md:-mt-32 max-w-[1400px] mx-auto px-2 sm:px-4 ${className}`}
    >
      {/* Visual Architectural Control Header (Tasks 11 & 16) */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 px-2 text-xs text-gray-700">
        <div className="flex items-center gap-1.5 bg-white/85 backdrop-blur-md px-3 py-1 rounded-full border border-gray-200/80 shadow-xs">
          <Layers className="w-3.5 h-3.5 text-amber-600" />
          <span className="font-bengali font-semibold text-[11px] sm:text-xs text-gray-900">
            অ্যামাজন ভাসমান কোয়াড গ্রিড (ভাগ ৪: কাজ ১৬–২০)
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-md p-1 rounded-lg border border-gray-200 shadow-xs">
          {/* Skeleton Toggle for Verification (Task 19) */}
          <button
            onClick={() => setShowSkeletonDemo(!showSkeletonDemo)}
            className={`px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold font-bengali transition-all flex items-center gap-1 cursor-pointer ${
              showSkeletonDemo
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="কাজ ১৯: স্কেলিটন প্রিভিউ টগল করুন"
          >
            <Eye className="w-3 h-3" />
            <span>{showSkeletonDemo ? 'লাইভ কার্ড দেখুন' : 'স্কেলিটন প্রিভিউ'}</span>
          </button>

          {/* 4th Card Slot View Switcher (Task 13 & 14) */}
          <button
            onClick={() => setFourthCardMode('auth')}
            className={`px-2.5 py-0.5 rounded text-[10px] sm:text-[11px] font-bold font-bengali transition-all flex items-center gap-1 cursor-pointer ${
              fourthCardMode === 'auth' && !showSkeletonDemo
                ? 'bg-amber-500 text-gray-950 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="৪র্থ কার্ডে সাইন-ইন ও স্পটলাইট ভিউ দেখুন"
          >
            <User className="w-3 h-3" />
            <span>স্পটলাইট প্রম্পট</span>
          </button>
          <button
            onClick={() => setFourthCardMode('school')}
            className={`px-2.5 py-0.5 rounded text-[10px] sm:text-[11px] font-bold font-bengali transition-all flex items-center gap-1 cursor-pointer ${
              fourthCardMode === 'school' && !showSkeletonDemo
                ? 'bg-amber-500 text-gray-950 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="৪র্থ কার্ডে মাধ্যমিক ও উচ্চমাধ্যমিক টেস্ট পেপারস দেখুন"
          >
            <BookCheck className="w-3 h-3" />
            <span>স্কুল টেস্ট পেপারস</span>
          </button>
        </div>
      </div>

      {/* Task 16 & 19: Multi-Device Responsive Grid (Mobile 1-col, Tablet 2-col, Desktop 4-col) */}
      {showSkeletonDemo ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 items-stretch">
          <QuadCardSkeleton />
          <QuadCardSkeleton />
          <QuadCardSkeleton />
          <QuadCardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 items-stretch">
          {/* Card 1: WBCS & Civil Services Collection */}
          <QuadCategoryCard block={CURATED_QUAD_CARDS[0]} priority={true} />

          {/* Card 2: College Semester 1-6 Guides (UGB / CU / NEP 2020) */}
          <QuadCategoryCard block={CURATED_QUAD_CARDS[1]} priority={true} />

          {/* Card 3: Up to 50% Off Dhamaka Deals */}
          <QuadCategoryCard block={CURATED_QUAD_CARDS[2]} />

          {/* Card 4: Dynamic Spotlight Auth Card (Task 14) OR School Test Papers (Task 13) */}
          {fourthCardMode === 'auth' ? (
            <SpotlightAuthCard />
          ) : (
            <QuadCategoryCard block={CURATED_QUAD_CARDS[3]} />
          )}
        </div>
      )}

      {/* Secondary Quick Banner for School Test Papers if Auth Card is active */}
      {!showSkeletonDemo && fourthCardMode === 'auth' && (
        <div className="mt-4 p-3 bg-white/95 backdrop-blur-md rounded-lg border border-gray-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded font-bengali">
              মাধ্যমিক ও উচ্চমাধ্যমিক ২০২৬
            </span>
            <span className="text-xs text-gray-800 font-bold font-bengali">
              ABTA, WBTA, ছায়া ও রায় অ্যান্ড মার্টিন টেস্ট পেপারস ও প্রশ্নবিচিত্রা এখন স্টোরে মজুত
            </span>
          </div>
          <button
            onClick={() => setFourthCardMode('school')}
            className="text-xs font-bold text-sky-700 hover:text-amber-700 font-bengali underline flex items-center gap-1 cursor-pointer"
          >
            ৪র্থ কার্ডে টেস্ট পেপারস গ্রিড দেখুন →
          </button>
        </div>
      )}
    </section>
  );
};
