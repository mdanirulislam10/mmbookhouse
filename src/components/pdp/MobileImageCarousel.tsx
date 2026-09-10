'use client';

import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { BookAngleAsset } from '@/types/pdp';
import { useLanguage } from '@/hooks/useLanguage';
import { toBengaliNumerals } from '@/lib/utils/currency';
import { Sparkles, Zap, Maximize2 } from 'lucide-react';

export interface MobileImageCarouselProps {
  assets: BookAngleAsset[];
  onImageClick?: (index: number) => void;
  badge?: string;
  discount?: string;
  isMaldaPrime?: boolean;
  lookInsideSlot?: React.ReactNode;
  className?: string;
}

/**
 * Task 2: Mobile Touch-Swipeable Image Carousel
 *
 * - Smooth touch swipe gestures (left/right)
 * - Dots indicator for active image slide
 * - Thumbnail bar at bottom for quick tap selection
 * - Angle label badges (Front, Back, Spine, TOC)
 * - Discount, Prime & Bestseller badges
 * - Tap to open mobile pinch-to-zoom lightbox
 */
export const MobileImageCarousel: React.FC<MobileImageCarouselProps> = ({
  assets,
  onImageClick,
  badge,
  discount,
  isMaldaPrime,
  lookInsideSlot,
  className = '',
}) => {
  const { language } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);

  // Swipe tracking refs
  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);
  const touchCurrentXRef = useRef<number>(0);
  const isSwipingRef = useRef<boolean>(false);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
      touchCurrentXRef.current = e.touches[0].clientX;
      isSwipingRef.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isSwipingRef.current || e.touches.length !== 1) return;
    touchCurrentXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isSwipingRef.current) return;
    isSwipingRef.current = false;

    const deltaX = touchCurrentXRef.current - touchStartXRef.current;
    const deltaY = (e.changedTouches[0]?.clientY ?? touchStartYRef.current) - touchStartYRef.current;

    // Only swipe if horizontal motion exceeds threshold and is greater than vertical motion
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        // Next slide
        setActiveIndex((prev) => (prev < assets.length - 1 ? prev + 1 : 0));
      } else {
        // Previous slide
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : assets.length - 1));
      }
    }
  };

  const activeAsset = assets[activeIndex] || assets[0];
  const angleLabel = language === 'bn' ? activeAsset?.labelBn : activeAsset?.label;
  const currentNumStr = language === 'bn' ? toBengaliNumerals(activeIndex + 1) : String(activeIndex + 1);
  const totalNumStr = language === 'bn' ? toBengaliNumerals(assets.length) : String(assets.length);

  return (
    <div className={`w-full flex flex-col items-center select-none ${className}`}>
      {/* Main Carousel Viewport */}
      <div
        className="relative w-full aspect-[3/4] max-h-[440px] bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Top-Left Badges Stack */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 items-start pointer-events-none">
          {discount && (
            <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded-md shadow-sm">
              {discount}
            </span>
          )}
          {badge && (
            <span className="px-2 py-0.5 bg-amber-500 text-white text-[11px] font-semibold rounded-md shadow-sm flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {badge}
            </span>
          )}
          {isMaldaPrime && (
            <span className="px-2 py-0.5 bg-sky-600 text-white text-[10px] font-semibold rounded-md shadow-sm flex items-center gap-1">
              <Zap className="w-3 h-3 fill-white" />
              {language === 'bn' ? 'মালদা প্রাইম' : 'Malda Prime'}
            </span>
          )}
        </div>

        {/* Top-Right Look Inside Slot or Expand Button */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
          {lookInsideSlot}
          <button
            onClick={() => onImageClick?.(activeIndex)}
            className="p-2 rounded-full bg-white/90 hover:bg-white text-gray-700 shadow-md backdrop-blur-sm border border-gray-200 transition-transform active:scale-95"
            aria-label={language === 'bn' ? 'বড় করে দেখুন' : 'Expand full screen'}
          >
            <Maximize2 className="w-4 h-4 text-gray-700" />
          </button>
        </div>

        {/* Sliding Image Container */}
        <div
          className="flex w-full h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {assets.map((asset, idx) => (
            <div
              key={asset.id}
              onClick={() => onImageClick?.(idx)}
              className="relative w-full h-full flex-shrink-0 flex items-center justify-center p-6 cursor-zoom-in"
              role="button"
              tabIndex={0}
              aria-label={language === 'bn' ? `${asset.labelBn} বড় করে দেখুন` : `View ${asset.label}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onImageClick?.(idx);
                }
              }}
            >
              <Image
                src={asset.url}
                alt={language === 'bn' ? asset.altTextBn : asset.altText}
                fill
                sizes="(max-width: 768px) 90vw, 400px"
                className="object-contain p-2 transition-transform duration-200"
                priority={idx === 0}
              />
            </div>
          ))}
        </div>

        {/* Bottom Left Angle Badge & Counter */}
        <div className="absolute bottom-3 left-3 z-10 px-2.5 py-1 bg-gray-900/75 backdrop-blur-sm text-white text-xs font-medium rounded-full pointer-events-none shadow-sm flex items-center gap-1.5">
          <span>{angleLabel}</span>
          <span className="text-gray-400">•</span>
          <span className="text-amber-300 font-mono">
            {currentNumStr} / {totalNumStr}
          </span>
        </div>
      </div>

      {/* Dots Indicator */}
      {assets.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {assets.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`h-2 rounded-full transition-all duration-200 ${
                idx === activeIndex
                  ? 'w-6 bg-amber-600'
                  : 'w-2 bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {/* Thumbnail Bar for Mobile Quick Tap */}
      {assets.length > 1 && (
        <div className="flex items-center gap-2 mt-3 overflow-x-auto w-full px-2 py-1 scrollbar-none justify-center">
          {assets.map((asset, idx) => {
            const isSelected = idx === activeIndex;
            return (
              <button
                key={asset.id}
                onClick={() => setActiveIndex(idx)}
                className={`relative w-12 h-16 rounded-lg overflow-hidden border-2 bg-white flex-shrink-0 transition-all ${
                  isSelected
                    ? 'border-amber-500 ring-2 ring-amber-400/40 shadow-sm scale-105'
                    : 'border-gray-200 opacity-70 hover:opacity-100'
                }`}
                aria-label={`Select ${asset.label}`}
              >
                <Image
                  src={asset.url}
                  alt={asset.label}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
