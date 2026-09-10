'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DetailedBookProduct, LookInsideSamplePage } from '@/types/pdp';
import { ReaderStickyBuyBar } from './ReaderStickyBuyBar';
import { SamplePagesStream } from './SamplePagesStream';
import { MobileLookInsideReader } from './MobileLookInsideReader';
import { generateBookPageSvgFallback } from '@/lib/services/lookInsideService';

interface LookInsideModalProps {
  book: DetailedBookProduct;
  isOpen: boolean;
  onClose: () => void;
  onBuyNow?: () => void;
  onAddToCart?: () => void;
}

export const LookInsideModal: React.FC<LookInsideModalProps> = ({
  book,
  isOpen,
  onClose,
  onBuyNow,
  onAddToCart,
}) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Keyboard shortcut listener (ESC to close)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
      setIsFullscreen(false);
      setCurrentPageIndex(0);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  // Resolve or generate comprehensive sample pages
  const resolvedSamplePages: LookInsideSamplePage[] =
    book.lookInside?.samplePages && book.lookInside.samplePages.length > 0
      ? book.lookInside.samplePages
      : [
          {
            pageNumber: 1,
            title: 'প্রচ্ছদ ও শিরোনাম (Cover)',
            type: 'cover',
            imageUrl: book.coverImage || '/images/books/wbcs-manual.webp',
          },
          {
            pageNumber: 2,
            title: 'ভূমিকা ও লেখকের বার্তা (Preface)',
            type: 'preface',
            imageUrl: generateBookPageSvgFallback(
              { pageNumber: 2, title: 'ভূমিকা ও লেখকের বার্তা' },
              book.titleBn || book.title,
              book.authorBn || book.author
            ),
          },
          {
            pageNumber: 3,
            title: 'পূর্ণাঙ্গ সূচিপত্র ও সিলেবাস (Table of Contents)',
            type: 'toc',
            imageUrl: generateBookPageSvgFallback(
              { pageNumber: 3, title: 'পূর্ণাঙ্গ সূচিপত্র ও সিলেবাস বিশ্লেষণ' },
              book.titleBn || book.title,
              book.authorBn || book.author
            ),
          },
          {
            pageNumber: 4,
            title: 'প্রথম অধ্যায়: সিলেবাস ও বিষয়ভিত্তিক নমুনা পাঠ (Sample Chapter)',
            type: 'sample',
            imageUrl: generateBookPageSvgFallback(
              { pageNumber: 4, title: 'প্রথম অধ্যায়: নমুনা পাঠ ও প্রশ্নাবলি' },
              book.titleBn || book.title,
              book.authorBn || book.author
            ),
          },
        ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-2 md:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none overflow-hidden"
      onContextMenu={(e) => e.preventDefault()}
      role="dialog"
      aria-modal="true"
      aria-label="Look Inside Reader"
    >
      <div
        className={`relative w-full ${
          isFullscreen
            ? 'h-screen max-w-none rounded-none'
            : 'max-w-5xl h-[94vh] sm:h-[90vh] rounded-none sm:rounded-2xl'
        } bg-[#141414] text-white overflow-hidden flex flex-col border border-neutral-800 shadow-2xl transition-all duration-200`}
      >
        {/* Task 17: Top In-Reader Sticky Purchase Bar with real actions */}
        <ReaderStickyBuyBar
          book={book}
          onClose={onClose}
          onBuyNow={onBuyNow}
          onAddToCart={onAddToCart}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        />

        {/* Central Reading Canvas */}
        <div className="flex-1 min-h-0 w-full relative flex flex-col overflow-hidden">
          {/* Desktop Mode: Task 13 & 15 Multi-Page Sample Stream with Section Pills */}
          <div className="hidden md:flex flex-col h-full w-full">
            <SamplePagesStream
              pages={resolvedSamplePages}
              currentPageIndex={currentPageIndex}
              onSelectPageIndex={setCurrentPageIndex}
              book={book}
              viewMode="single"
            />
          </div>

          {/* Mobile Mode: Task 16 Horizontal Swipe & Continuous Strip Reader */}
          <div className="md:hidden flex-1 h-full w-full">
            <MobileLookInsideReader
              pages={resolvedSamplePages}
              initialPageIndex={currentPageIndex}
              book={book}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
