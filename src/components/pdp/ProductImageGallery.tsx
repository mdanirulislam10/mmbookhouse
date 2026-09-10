'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { BookAngleAsset, DetailedBookProduct } from '@/types/pdp';
import { useLanguage } from '@/hooks/useLanguage';
import { buildBookAngleAssets } from '@/lib/pdp/bookAssetPipeline';
import { ImageMagnifier } from './ImageMagnifier';
import { MobileImageCarousel } from './MobileImageCarousel';
import { MobileImageLightbox } from './MobileImageLightbox';
import { useWishlistStore, useWishlistActions } from '@/hooks/useWishlistStore';
import { LookInsideRibbon } from './LookInsideRibbon';
import {
  Sparkles,
  Zap,
  Maximize2,
  Heart,
  Search,
} from 'lucide-react';

export interface ProductImageGalleryProps {
  book?: DetailedBookProduct;
  assets?: BookAngleAsset[];
  bookTitle?: string;
  badge?: string;
  discount?: string;
  isMaldaPrime?: boolean;
  lookInsideSlot?: React.ReactNode;
  onOpenLookInside?: () => void;
  className?: string;
}

/**
 * Task 3: Desktop Vertical Thumbnail Strip + Large Preview Frame
 *
 * - Left: Vertical thumbnail strip (front cover, back cover, spine, TOC, sample)
 * - Right: Large preview frame with floating magnifier lens zoom (Task 4)
 * - Fast hover/click switching with visual active ring
 * - Integrated mobile carousel fallback (Task 2) & full-screen lightbox (Task 5)
 * - Multi-angle pipeline (Task 6)
 */
export const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  book,
  assets: propAssets,
  bookTitle: propTitle,
  badge: propBadge,
  discount: propDiscount,
  isMaldaPrime: propPrime,
  lookInsideSlot,
  onOpenLookInside,
  className = '',
}) => {
  const { language } = useLanguage();
  const isBengali = language === 'bn';

  // Extract assets from book or props
  const assets = propAssets || (book ? buildBookAngleAssets(book) : []);
  const title = propTitle || book?.title || 'Book Details';
  const badge = propBadge || book?.badge;
  const discount = propDiscount || book?.discount;
  const isMaldaPrime = propPrime !== undefined ? propPrime : book?.isMaldaPrime;

  // Wishlist integration
  const { toggleItem: toggleWishlistItem } = useWishlistActions();
  const isInWishlist = useWishlistStore((state) => state.isInWishlist);
  const bookId = book?.bookId || book?.id;
  const inWish = bookId ? isInWishlist(bookId) : false;

  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const activeAsset = assets[activeIndex] || assets[0];

  const handleOpenLightbox = (index?: number) => {
    if (typeof index === 'number') {
      setActiveIndex(index);
    }
    setIsLightboxOpen(true);
  };

  // Render "Look Inside" trigger ribbon/pill if available (Task 11)
  const defaultLookInsideButton = (onOpenLookInside) ? (
    <LookInsideRibbon
      book={book}
      onClick={onOpenLookInside}
      variant="floating-pill"
    />
  ) : null;

  const finalLookInsideSlot = lookInsideSlot || defaultLookInsideButton;

  if (assets.length === 0) {
    return null;
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Mobile View: Touch-swipeable carousel (< md) */}
      <div className="block md:hidden">
        <MobileImageCarousel
          assets={assets}
          badge={badge}
          discount={discount}
          isMaldaPrime={isMaldaPrime}
          lookInsideSlot={finalLookInsideSlot}
          onImageClick={handleOpenLightbox}
        />
      </div>

      {/* Desktop & Tablet View: Vertical Thumbnails + Large Preview (>= md) */}
      <div className="hidden md:flex gap-3.5 items-start w-full relative">
        {/* Left: Vertical Thumbnail Strip */}
        {assets.length > 1 && (
          <div
            className="flex flex-col gap-2.5 flex-shrink-0 w-16 xl:w-20 max-h-[500px] overflow-y-auto no-scrollbar py-1"
            role="tablist"
            aria-label="Book image angles"
          >
            {assets.map((asset, idx) => {
              const isSelected = idx === activeIndex;
              const angleLabel = isBengali ? asset.labelBn : asset.label;

              return (
                <button
                  key={asset.id}
                  onClick={() => setActiveIndex(idx)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  role="tab"
                  aria-selected={isSelected}
                  className={`group relative w-full aspect-[3/4] rounded-lg overflow-hidden border-2 bg-white transition-all duration-150 flex flex-col items-center justify-center p-1 cursor-pointer ${
                    isSelected
                      ? 'border-amber-500 ring-2 ring-amber-400/40 shadow-sm scale-105'
                      : 'border-gray-200 opacity-70 hover:opacity-100 hover:border-gray-300'
                  }`}
                  aria-label={angleLabel}
                >
                  <Image
                    src={asset.url}
                    alt={asset.label}
                    fill
                    sizes="80px"
                    className="object-contain p-1"
                  />
                  <span className="sr-only">{angleLabel}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Right: Large Preview Frame with Magnifier Zoom */}
        <div className="relative flex-1 min-w-0">
          {/* Top Badges */}
          <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 items-start pointer-events-none">
            {discount && (
              <span className="px-2.5 py-1 bg-red-600 text-white text-xs font-bold rounded-md shadow-sm">
                {discount}
              </span>
            )}
            {badge && (
              <span className="px-2.5 py-1 bg-amber-500 text-white text-xs font-semibold rounded-md shadow-sm flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                {badge}
              </span>
            )}
            {isMaldaPrime && (
              <span className="px-2 py-0.5 bg-sky-600 text-white text-[11px] font-semibold rounded-md shadow-sm flex items-center gap-1">
                <Zap className="w-3 h-3 fill-white" />
                {isBengali ? 'মালদা প্রাইম' : 'Malda Prime'}
              </span>
            )}
          </div>

          {/* Top-Right Look Inside Slot, Wishlist & Lightbox Trigger */}
          <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
            {finalLookInsideSlot}

            {bookId && (
              <button
                type="button"
                onClick={() => toggleWishlistItem(bookId)}
                aria-label={inWish ? 'উইশলিস্ট থেকে মুছুন' : 'উইশলিস্টে যুক্ত করুন'}
                className="p-2 rounded-full bg-white/90 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all shadow-sm border border-gray-200/80 cursor-pointer"
              >
                <Heart
                  className={`w-4 h-4 transition-colors ${
                    inWish ? 'text-red-500 fill-red-500' : ''
                  }`}
                />
              </button>
            )}

            <button
              onClick={() => handleOpenLightbox(activeIndex)}
              className="p-2 rounded-full bg-white/90 hover:bg-white text-gray-700 shadow-sm backdrop-blur-sm border border-gray-200 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              title={isBengali ? 'ফুল-স্ক্রিনে বড় করে দেখুন' : 'View full screen'}
              aria-label="Full screen preview"
            >
              <Maximize2 className="w-4 h-4 text-gray-700" />
            </button>
          </div>

          {/* Desktop Floating Magnifier Lens Component (Task 4) */}
          <ImageMagnifier
            src={activeAsset.url}
            zoomSrc={activeAsset.zoomUrl || activeAsset.url}
            alt={isBengali ? activeAsset.altTextBn : activeAsset.altText}
            zoomLevel={2.5}
            priority={activeIndex === 0}
            onImageClick={() => handleOpenLightbox(activeIndex)}
          />

          {/* Angle Indicator Tag */}
          <div className="mt-2 text-center text-xs font-medium text-gray-500">
            {isBengali ? activeAsset.labelBn : activeAsset.label}
          </div>
        </div>
      </div>

      {/* Mobile & Desktop Full-screen Pinch-to-zoom Lightbox (Task 5) */}
      <MobileImageLightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        images={assets}
        initialIndex={activeIndex}
        bookTitle={title}
      />
    </div>
  );
};
