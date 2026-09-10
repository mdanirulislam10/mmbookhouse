'use client';

import React, { useState, useEffect } from 'react';
import { LookInsideSamplePage, DetailedBookProduct } from '@/types/pdp';
import { useLanguage } from '@/hooks/useLanguage';
import {
  getOptimizedPageUrl,
  getPageThumbnailUrl,
  preloadAdjacentPages,
  generateBookPageSvgFallback,
} from '@/lib/services/lookInsideService';
import { LookInsideSkeleton } from './LookInsideSkeleton';
import { WatermarkOverlay } from './WatermarkOverlay';
import { BookOpen, ListTree, FileText, Image as ImageIcon, ChevronRight } from 'lucide-react';
import { toBengaliNumerals } from '@/lib/utils/currency';

interface SamplePagesStreamProps {
  pages: LookInsideSamplePage[];
  currentPageIndex: number;
  onSelectPageIndex: (index: number) => void;
  book?: Partial<DetailedBookProduct>;
  viewMode?: 'single' | 'double' | 'continuous';
  className?: string;
}

/**
 * Task 13: Multi-Page Sample Preview Stream
 *
 * Renders categorized book stream including:
 * 1. Cover (প্রচ্ছদ ও শিরোনাম)
 * 2. Preface (ভূমিকা ও লেখকের বার্তা)
 * 3. Table of Contents / TOC (সূচিপত্র ও সিলেবাস)
 * 4. Sample Chapter 1 (নির্বাচিত অধ্যায় পাঠ)
 *
 * Features section navigation pills, thumbnail strip, lazy loading, and SVG fallback resilience.
 */
export const SamplePagesStream: React.FC<SamplePagesStreamProps> = ({
  pages,
  currentPageIndex,
  onSelectPageIndex,
  book,
  viewMode = 'single',
  className = '',
}) => {
  const { isBengali } = useLanguage();
  const [loadedPages, setLoadedPages] = useState<Record<number, boolean>>({});
  const [failedPages, setFailedPages] = useState<Record<number, boolean>>({});

  const currentPage = pages[currentPageIndex] || pages[0];

  // Preload adjacent pages on current page change
  useEffect(() => {
    preloadAdjacentPages(pages, currentPageIndex, 2);
  }, [pages, currentPageIndex]);

  const handleImageLoaded = (idx: number) => {
    setLoadedPages((prev) => ({ ...prev, [idx]: true }));
  };

  const handleImageError = (idx: number) => {
    setFailedPages((prev) => ({ ...prev, [idx]: true }));
  };

  const getSectionIcon = (page: LookInsideSamplePage) => {
    const type = page.type || '';
    const title = page.title?.toLowerCase() || '';

    if (type === 'cover' || title.includes('cover') || title.includes('প্রচ্ছদ')) {
      return <ImageIcon className="w-3.5 h-3.5" />;
    }
    if (type === 'preface' || title.includes('preface') || title.includes('ভূমিকা')) {
      return <FileText className="w-3.5 h-3.5" />;
    }
    if (type === 'toc' || title.includes('content') || title.includes('সূচিপত্র') || title.includes('syllabus')) {
      return <ListTree className="w-3.5 h-3.5" />;
    }
    return <BookOpen className="w-3.5 h-3.5" />;
  };

  if (!pages || pages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-neutral-400 font-bengali">
        <BookOpen className="w-12 h-12 text-neutral-500 mb-3" />
        <p className="text-base font-semibold text-neutral-200">
          {isBengali
            ? 'এই বইটির নমুনা পাতা শীঘ্রই যুক্ত করা হবে।'
            : 'Sample pages for this book will be available shortly.'}
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full w-full select-none ${className}`}>
      {/* Top Section Navigator Pills */}
      <div className="shrink-0 flex items-center gap-1.5 overflow-x-auto py-2 px-3 sm:px-6 bg-neutral-900/60 border-b border-neutral-800 scrollbar-none">
        {pages.map((page, idx) => {
          const isActive = idx === currentPageIndex;
          return (
            <button
              key={page.pageNumber || idx}
              type="button"
              onClick={() => onSelectPageIndex(idx)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 shrink-0 ${
                isActive
                  ? 'bg-[#007185] text-white font-bold shadow-xs ring-1 ring-cyan-400'
                  : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700 hover:text-white'
              }`}
            >
              {getSectionIcon(page)}
              <span>
                {isBengali
                  ? `পাতা ${toBengaliNumerals(page.pageNumber)}`
                  : `Page ${page.pageNumber}`}
              </span>
              <span className="hidden sm:inline text-[10px] opacity-75 truncate max-w-[120px]">
                {page.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Preview Viewing Area */}
      <div className="relative flex-1 overflow-auto flex items-center justify-center p-3 sm:p-6 bg-neutral-950/70">
        <div className="relative max-w-2xl w-full mx-auto my-auto shadow-2xl rounded-sm overflow-hidden bg-[#faf8f5]">
          {/* Piracy & Copy Protection Watermark */}
          <WatermarkOverlay
            bookTitle={book?.title || 'M.M Book House'}
            storeName="M.M Book House Malda"
          />

          {/* Shimmer skeleton while image loads */}
          {!loadedPages[currentPageIndex] && !failedPages[currentPageIndex] && (
            <div className="absolute inset-0 z-10 bg-[#faf8f5] flex items-center justify-center">
              <LookInsideSkeleton twoPageSpread={false} />
            </div>
          )}

          {/* Realistic Page Container */}
          <div className="relative min-h-[500px] flex items-center justify-center">
            {failedPages[currentPageIndex] ? (
              // Fallback SVG rendering if target image 404s
              <img
                src={generateBookPageSvgFallback(
                  currentPage,
                  book?.title || 'WBCS Manual 2026',
                  book?.author || 'M.M Research Team'
                )}
                alt={currentPage.title}
                className="w-full h-auto max-h-[80vh] object-contain shadow-inner pointer-events-none select-none"
                draggable={false}
              />
            ) : (
              // Optimized WebP Image Stream
              <img
                src={getOptimizedPageUrl(currentPage.imageUrl, { width: 900 })}
                alt={currentPage.title}
                onLoad={() => handleImageLoaded(currentPageIndex)}
                onError={() => handleImageError(currentPageIndex)}
                className={`w-full h-auto max-h-[82vh] object-contain transition-opacity duration-300 pointer-events-none select-none ${
                  loadedPages[currentPageIndex] ? 'opacity-100' : 'opacity-0'
                }`}
                draggable={false}
              />
            )}
          </div>

          {/* Page Info Strip at Bottom of Reader Sheet */}
          <div className="py-2 px-4 bg-neutral-100/90 border-t border-neutral-300 flex items-center justify-between text-xs text-neutral-600 font-bengali">
            <span className="font-semibold text-neutral-800 truncate max-w-[70%]">
              {currentPage.title}
            </span>
            <span className="font-mono text-[11px] text-neutral-500 shrink-0">
              {isBengali
                ? `পাতা ${toBengaliNumerals(currentPage.pageNumber)} / ${toBengaliNumerals(pages.length)}`
                : `Page ${currentPage.pageNumber} of ${pages.length}`}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Thumbnail Filmstrip */}
      <div className="shrink-0 bg-neutral-900 border-t border-neutral-800 py-2.5 px-3 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-3 overflow-x-auto scrollbar-none py-1">
          {pages.map((page, idx) => {
            const isCurrent = idx === currentPageIndex;
            return (
              <button
                key={page.pageNumber || idx}
                type="button"
                onClick={() => onSelectPageIndex(idx)}
                className={`relative shrink-0 rounded overflow-hidden border-2 transition-all duration-200 group ${
                  isCurrent
                    ? 'border-[#febd69] scale-105 shadow-md ring-2 ring-[#ffa41c]/40'
                    : 'border-neutral-700 opacity-60 hover:opacity-100 hover:border-neutral-500'
                }`}
                style={{ width: '48px', height: '64px' }}
                title={page.title}
              >
                <img
                  src={
                    failedPages[idx]
                      ? generateBookPageSvgFallback(page, book?.title)
                      : getPageThumbnailUrl(page.imageUrl, 120)
                  }
                  alt={`Thumbnail ${page.pageNumber}`}
                  className="w-full h-full object-cover pointer-events-none"
                  draggable={false}
                  onError={() => handleImageError(idx)}
                />
                <span className="absolute bottom-0 left-0 right-0 bg-neutral-950/80 text-[10px] text-center text-neutral-200 font-mono py-0.5">
                  {page.pageNumber}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
