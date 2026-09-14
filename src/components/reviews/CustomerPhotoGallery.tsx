'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Star, Camera } from 'lucide-react';
import { CustomerPhoto } from '@/types/reviews';

export interface GalleryPhotoItem extends CustomerPhoto {
  review_id?: string;
  user_name?: string;
  rating?: number;
  review_headline?: string;
}

export interface CustomerPhotoGalleryProps {
  photos: GalleryPhotoItem[];
  title?: string;
  maxInitialDisplay?: number;
  className?: string;
}

export const CustomerPhotoGallery: React.FC<CustomerPhotoGalleryProps> = ({
  photos,
  title = 'কাস্টমারদের তোলা ছবি (Customer Photos)',
  maxInitialDisplay = 6,
  className = '',
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const isOpen = selectedIndex !== null;
  const currentPhoto = isOpen && photos[selectedIndex] ? photos[selectedIndex] : null;

  const handleOpen = (index: number) => {
    setSelectedIndex(index);
  };

  const handleClose = useCallback(() => {
    setSelectedIndex(null);
  }, []);

  const handleNext = useCallback(() => {
    if (selectedIndex === null) return;
    setSelectedIndex((prev) => (prev !== null && prev < photos.length - 1 ? prev + 1 : 0));
  }, [selectedIndex, photos.length]);

  const handlePrev = useCallback(() => {
    if (selectedIndex === null) return;
    setSelectedIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : photos.length - 1));
  }, [selectedIndex, photos.length]);

  // Handle keyboard events (ESC, Left, Right)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose, handleNext, handlePrev]);

  if (!photos || photos.length === 0) {
    return null;
  }

  const visiblePhotos = photos.slice(0, maxInitialDisplay);
  const remainingCount = photos.length - maxInitialDisplay;

  return (
    <section className={`my-6 ${className}`} aria-label="Customer Photo Gallery">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <Camera className="w-5 h-5 text-emerald-600" />
          <span>{title}</span>
          <span className="text-xs font-normal text-gray-500">({photos.length}টি ছবি)</span>
        </h3>
      </div>

      {/* Horizontal thumbnail slider / grid */}
      <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300">
        {visiblePhotos.map((photo, index) => {
          const isLastVisible = index === maxInitialDisplay - 1 && remainingCount > 0;
          return (
            <button
              key={photo.id || `photo-${index}`}
              type="button"
              onClick={() => handleOpen(index)}
              className="relative flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border border-gray-200 hover:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition group"
              aria-label={`View customer photo ${index + 1} of ${photos.length}`}
            >
              <img
                src={photo.thumbnail_url || photo.url}
                alt={photo.caption || `Customer photo ${index + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                loading="lazy"
              />
              {isLastVisible && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-medium text-sm">
                  +{remainingCount}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Lightbox Modal */}
      {isOpen && currentPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-label="Photo Lightbox"
        >
          {/* Backdrop Click */}
          <div className="absolute inset-0" onClick={handleClose} />

          <div className="relative z-10 max-w-3xl w-full bg-gray-900 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Lightbox Header */}
            <div className="flex items-center justify-between p-3.5 bg-gray-800/90 text-white border-b border-gray-700">
              <span className="text-sm font-medium">
                ছবি {selectedIndex! + 1} / {photos.length}
              </span>
              <button
                type="button"
                onClick={handleClose}
                className="p-1 rounded-full hover:bg-gray-700 text-gray-300 hover:text-white transition focus:outline-none"
                aria-label="Close Lightbox"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Image Stage */}
            <div className="relative flex-1 flex items-center justify-center bg-black min-h-[300px] sm:min-h-[450px] overflow-hidden">
              <img
                src={currentPhoto.url}
                alt={currentPhoto.caption || 'Full size customer photo'}
                className="max-h-[60vh] max-w-full object-contain select-none"
              />

              {/* Prev Button */}
              {photos.length > 1 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 transition focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  aria-label="Previous Image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              {/* Next Button */}
              {photos.length > 1 && (
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 transition focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  aria-label="Next Image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Photo Footer with Review Context */}
            <div className="p-3.5 bg-gray-800 text-gray-200 border-t border-gray-700 text-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-white">{currentPhoto.user_name || 'ভেরিফাইড পাঠক'}</span>
                {typeof currentPhoto.rating === 'number' && (
                  <div className="flex items-center gap-1 text-amber-400">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span className="font-medium text-xs">{currentPhoto.rating}.0</span>
                  </div>
                )}
              </div>
              {currentPhoto.caption && (
                <p className="text-gray-300 text-xs mt-1">{currentPhoto.caption}</p>
              )}
              {currentPhoto.review_headline && (
                <p className="text-xs text-gray-400 italic mt-0.5">
                  &ldquo;{currentPhoto.review_headline}&rdquo;
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
