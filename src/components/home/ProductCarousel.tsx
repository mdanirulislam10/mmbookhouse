'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { CarouselCollection, CarouselProduct } from '@/types/carousel';
import { AmazonProductCard } from './AmazonProductCard';
import { QuickViewModal } from './QuickViewModal';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  BookOpen
} from 'lucide-react';

interface ProductCarouselProps {
  collection: CarouselCollection;
  className?: string;
}

export function ProductCarousel({ collection, className = '' }: ProductCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<CarouselProduct | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  // Task 32: Smart scroll bounds checker
  const updateScrollBounds = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    // Allow 10px threshold for browser rounding
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    updateScrollBounds();

    const handleScroll = () => {
      window.requestAnimationFrame(updateScrollBounds);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    // Handle responsive window or container resize
    const resizeObserver = new ResizeObserver(() => {
      updateScrollBounds();
    });
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, [updateScrollBounds, collection.items]);

  // Task 32: Smart Page Jump Navigation (3-4 books smooth scroll per click)
  const handleScrollJump = (direction: 'left' | 'right') => {
    const container = containerRef.current;
    if (!container) return;

    // Jump by ~75% of viewport width which moves roughly 3 to 4 books
    const jumpDistance = container.clientWidth * 0.75;
    container.scrollBy({
      left: direction === 'left' ? -jumpDistance : jumpDistance,
      behavior: 'smooth',
    });
  };

  const handleOpenQuickView = (product: CarouselProduct) => {
    setSelectedProduct(product);
    setIsQuickViewOpen(true);
  };

  const handleCloseQuickView = () => {
    setIsQuickViewOpen(false);
    setSelectedProduct(null);
  };

  return (
    <section
      aria-label={collection.titleBn}
      className={`relative bg-white rounded-xl border border-gray-200/90 shadow-xs p-4 sm:p-5 space-y-3.5 ${className}`}
    >
      {/* Header: Title, Subtitle, Badge & View All Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-lg md:text-xl font-extrabold text-gray-900 font-bengali flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <span>{collection.titleBn}</span>
            </h2>
            {collection.badgeTextBn && (
              <span className="text-[11px] font-bold text-amber-900 bg-amber-100/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>{collection.badgeTextBn}</span>
              </span>
            )}
          </div>
          {collection.subtitleBn && (
            <p className="text-xs text-gray-500 font-bengali">
              {collection.subtitleBn}
            </p>
          )}
        </div>

        {/* View All Link */}
        <Link
          href={collection.viewAllUrl}
          className="group inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-blue-700 hover:text-amber-800 transition-colors w-fit self-start sm:self-auto"
        >
          <span>সবগুলো দেখুন</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Relative Carousel Container with Floating Navigation Arrows */}
      <div className="relative group/carousel">
        {/* Task 32: Left Navigation Button (Desktop) */}
        {canScrollLeft && (
          <button
            onClick={() => handleScrollJump('left')}
            aria-label="পূর্ববর্তী বইগুলো দেখুন"
            className="hidden sm:flex absolute -left-2 sm:-left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/95 hover:bg-white text-gray-800 hover:text-gray-950 shadow-xl border border-gray-300/80 items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-all duration-200 active:scale-95 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:opacity-100"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}

        {/* Task 31: Horizontal Product Row Container */}
        <div
          ref={containerRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-2 px-1 focus:outline-hidden"
          tabIndex={0}
          role="region"
          aria-label={`${collection.titleBn} বইয়ের তালিকা`}
        >
          {collection.items.map((product) => (
            <div
              key={product.id}
              className="w-[185px] sm:w-[210px] md:w-[230px] flex-shrink-0 snap-start"
            >
              <AmazonProductCard
                product={product}
                onQuickView={handleOpenQuickView}
                className="h-full"
              />
            </div>
          ))}

          {/* End of row: "View All" Card */}
          <div className="w-[150px] sm:w-[170px] flex-shrink-0 snap-start flex items-center justify-center">
            <Link
              href={collection.viewAllUrl}
              className="w-full h-full min-h-[300px] rounded-xl border-2 border-dashed border-gray-200 hover:border-amber-400 bg-gray-50 hover:bg-amber-50/50 p-4 flex flex-col items-center justify-center gap-2 text-center transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-gray-200 group-hover:border-amber-400 flex items-center justify-center text-gray-700 group-hover:text-amber-700 transition-colors">
                <ArrowRight className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-gray-800 group-hover:text-amber-800 font-bengali">
                আরও {collection.titleBn} দেখুন
              </span>
              <span className="text-[11px] text-gray-500">
                সকল ক্যাটালগ →
              </span>
            </Link>
          </div>
        </div>

        {/* Task 32: Right Navigation Button (Desktop) */}
        {canScrollRight && (
          <button
            onClick={() => handleScrollJump('right')}
            aria-label="পরবর্তী বইগুলো দেখুন"
            className="hidden sm:flex absolute -right-2 sm:-right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/95 hover:bg-white text-gray-800 hover:text-gray-950 shadow-xl border border-gray-300/80 items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-all duration-200 active:scale-95 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:opacity-100"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}
      </div>

      {/* Task 35: Lightbox Quick View Modal */}
      <QuickViewModal
        product={selectedProduct}
        isOpen={isQuickViewOpen}
        onClose={handleCloseQuickView}
      />
    </section>
  );
}
