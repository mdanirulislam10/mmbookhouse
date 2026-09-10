'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { X, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { BookAngleAsset } from '@/types/pdp';
import { useLanguage } from '@/hooks/useLanguage';
import { toBengaliNumerals } from '@/lib/utils/currency';

export interface MobileImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  images: BookAngleAsset[];
  initialIndex?: number;
  bookTitle: string;
}

/**
 * Task 5: Mobile Full-Screen Lightbox Pinch-to-Zoom
 *
 * - Full-screen dark backdrop
 * - Multi-touch pinch-to-zoom (up to 4x)
 * - Double-tap zoom toggle (1x <-> 2.5x)
 * - Touch pan/drag when zoomed in
 * - Horizontal swipe navigation when scale is 1x
 * - Thumbnail bar & image index counter
 */
export const MobileImageLightbox: React.FC<MobileImageLightboxProps> = ({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
  bookTitle,
}) => {
  const { language } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Touch tracking refs
  const initialDistanceRef = useRef<number | null>(null);
  const initialScaleRef = useRef<number>(1);
  const touchStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastTapTimeRef = useRef<number>(0);
  const isDraggingRef = useRef(false);

  // Sync index on open
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setScale(1);
      setPosition({ x: 0, y: 0 });
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialIndex]);

  // Reset zoom & pan when image changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [currentIndex]);

  // Keyboard navigation & escape listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        goToPrev();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length]);

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.75, 4));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(prev - 0.75, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Double tap handler
  const handleDoubleTap = (clientX: number, clientY: number) => {
    const now = Date.now();
    if (now - lastTapTimeRef.current < 300) {
      // Toggle zoom
      if (scale > 1) {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      } else {
        setScale(2.5);
      }
      lastTapTimeRef.current = 0;
    } else {
      lastTapTimeRef.current = now;
    }
  };

  // Multi-touch gestures
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      // Pinch started
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const distance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      initialDistanceRef.current = distance;
      initialScaleRef.current = scale;
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
      isDraggingRef.current = true;
      handleDoubleTap(touch.clientX, touch.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && initialDistanceRef.current !== null) {
      // Pinch in progress
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const ratio = currentDist / initialDistanceRef.current;
      const newScale = Math.min(Math.max(initialScaleRef.current * ratio, 1), 4);
      setScale(newScale);
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
    } else if (e.touches.length === 1 && isDraggingRef.current && scale > 1) {
      // Pan zoomed image
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartPosRef.current.x;
      const deltaY = touch.clientY - touchStartPosRef.current.y;

      setPosition((prev) => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));

      touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length < 2) {
      initialDistanceRef.current = null;
    }

    if (e.touches.length === 0) {
      isDraggingRef.current = false;

      // If at 1x, check for swipe navigation
      if (scale === 1 && e.changedTouches.length > 0) {
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchStartPosRef.current.x;
        const deltaY = touch.clientY - touchStartPosRef.current.y;

        if (Math.abs(deltaX) > 60 && Math.abs(deltaY) < 80) {
          if (deltaX < 0) {
            goToNext();
          } else {
            goToPrev();
          }
        }
      }
    }
  };

  if (!isOpen || images.length === 0) return null;

  const currentAsset = images[currentIndex] || images[0];
  const angleLabel = language === 'bn' ? currentAsset.labelBn : currentAsset.label;
  const currentNumStr = language === 'bn' ? toBengaliNumerals(currentIndex + 1) : String(currentIndex + 1);
  const totalNumStr = language === 'bn' ? toBengaliNumerals(images.length) : String(images.length);

  return (
    <div
      className="fixed inset-0 z-[9999] bg-neutral-950/98 backdrop-blur-md flex flex-col justify-between select-none animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Image Lightbox"
    >
      {/* Top Controls Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-900/80 border-b border-neutral-800 text-white z-10">
        <div className="flex flex-col max-w-[60%]">
          <span className="text-xs text-amber-400 font-medium tracking-wide">
            {angleLabel} ({currentNumStr} / {totalNumStr})
          </span>
          <span className="text-sm font-semibold truncate text-neutral-200">
            {bookTitle}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {scale > 1 && (
            <button
              onClick={handleResetZoom}
              className="p-2 rounded-full hover:bg-neutral-800 text-neutral-300 transition-colors"
              title={language === 'bn' ? 'জুম রিসেট' : 'Reset Zoom'}
              aria-label="Reset Zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleZoomOut}
            disabled={scale <= 1}
            className="p-2 rounded-full hover:bg-neutral-800 disabled:opacity-40 text-neutral-300 transition-colors"
            title={language === 'bn' ? 'জুম কমান' : 'Zoom Out'}
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            onClick={handleZoomIn}
            disabled={scale >= 4}
            className="p-2 rounded-full hover:bg-neutral-800 disabled:opacity-40 text-neutral-300 transition-colors"
            title={language === 'bn' ? 'জুম বাড়ান' : 'Zoom In'}
            aria-label="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="p-2 ml-1 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white transition-colors"
            title={language === 'bn' ? 'বন্ধ করুন' : 'Close'}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        className="relative flex-1 flex items-center justify-center overflow-hidden touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Navigation Arrows for Tablet / Desktop */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrev}
              className="absolute left-3 z-10 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white border border-neutral-700 backdrop-blur-sm transition-all shadow-lg"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-3 z-10 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white border border-neutral-700 backdrop-blur-sm transition-all shadow-lg"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Scaled/Panned Image Container */}
        <div
          className="relative w-full h-full max-w-4xl max-h-[80vh] flex items-center justify-center transition-transform duration-100 ease-out"
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            cursor: scale > 1 ? 'grab' : 'zoom-in',
          }}
        >
          <Image
            src={currentAsset.url}
            alt={language === 'bn' ? currentAsset.altTextBn : currentAsset.altText}
            fill
            sizes="100vw"
            className="object-contain p-2"
            priority
          />
        </div>

        {/* Pinch / Double-tap helper badge */}
        {scale === 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/70 backdrop-blur-sm text-neutral-300 text-xs rounded-full pointer-events-none">
            {language === 'bn' ? 'চিমটি কেটে বা ডাবল-ট্যাপ করে জুম করুন' : 'Pinch or double-tap to zoom'}
          </div>
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      {images.length > 1 && (
        <div className="px-4 py-3 bg-neutral-900/90 border-t border-neutral-800 z-10">
          <div className="flex items-center justify-center gap-2 overflow-x-auto py-1">
            {images.map((img, idx) => {
              const isSelected = idx === currentIndex;
              return (
                <button
                  key={img.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative w-12 h-16 rounded-md overflow-hidden border-2 transition-all flex-shrink-0 ${
                    isSelected
                      ? 'border-amber-400 ring-2 ring-amber-400/40 scale-105'
                      : 'border-neutral-700 opacity-60 hover:opacity-100'
                  }`}
                  aria-label={`Jump to image ${idx + 1}`}
                >
                  <Image
                    src={img.url}
                    alt={img.label}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
