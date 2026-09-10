'use client';

import React, { useState } from 'react';
import { Heart, Check } from 'lucide-react';
import { useWishlistStore } from '@/hooks/useWishlistStore';
import { useLanguage } from '@/hooks/useLanguage';

export type WishlistButtonVariant = 'floating' | 'button' | 'icon';

interface WishlistButtonProps {
  bookId: string;
  variant?: WishlistButtonVariant;
  className?: string;
  showText?: boolean;
}

export const WishlistButton: React.FC<WishlistButtonProps> = ({
  bookId,
  variant = 'button',
  className = '',
  showText = true,
}) => {
  const { isBengali } = useLanguage();
  const isInWishlist = useWishlistStore((state) => state.isInWishlist(bookId));
  const toggleItem = useWishlistStore((state) => state.toggleItem);
  const [justToggled, setJustToggled] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem(bookId);
    setJustToggled(true);
    setTimeout(() => setJustToggled(false), 1200);
  };

  // 1. Floating round button (e.g. on top of product image)
  if (variant === 'floating') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={
          isInWishlist
            ? isBengali
              ? 'উইশলিস্ট থেকে বাদ দিন'
              : 'Remove from Wish List'
            : isBengali
              ? 'উইশলিস্টে যোগ করুন'
              : 'Add to Wish List'
        }
        title={
          isInWishlist
            ? isBengali
              ? 'উইশলিস্টে যুক্ত আছে'
              : 'Saved in Wish List'
            : isBengali
              ? 'উইশলিস্টে রাখুন'
              : 'Add to Wish List'
        }
        className={`group relative flex items-center justify-center w-10 h-10 rounded-full bg-white/90 backdrop-blur-md shadow-md hover:bg-white hover:shadow-lg border border-neutral-200 transition-all duration-200 active:scale-90 focus:outline-none focus:ring-2 focus:ring-amber-500 ${className}`}
      >
        <Heart
          className={`w-5 h-5 transition-all duration-300 ${
            isInWishlist
              ? 'fill-rose-500 text-rose-500 scale-110'
              : 'text-neutral-600 group-hover:text-rose-500'
          } ${justToggled ? 'animate-ping duration-300' : ''}`}
        />
        {/* Subtle tooltip on hover */}
        <span className="sr-only">
          {isInWishlist ? 'Remove from Wish List' : 'Add to Wish List'}
        </span>
      </button>
    );
  }

  // 2. Icon-only compact variant
  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={isInWishlist ? 'Remove from Wish List' : 'Add to Wish List'}
        className={`p-2 rounded-full hover:bg-neutral-100 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 active:scale-95 ${className}`}
      >
        <Heart
          className={`w-5 h-5 transition-colors ${
            isInWishlist ? 'fill-rose-500 text-rose-500' : 'text-neutral-500 hover:text-rose-500'
          }`}
        />
      </button>
    );
  }

  // 3. Amazon Classic Buy Box Wishlist Button / Link
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={
        isInWishlist
          ? isBengali
            ? 'পছন্দের তালিকা থেকে বাদ দিন'
            : 'Remove from Wish List'
          : isBengali
            ? 'পছন্দের তালিকায় রাখুন'
            : 'Add to Wish List'
      }
      className={`w-full py-2 px-3 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 flex items-center justify-center gap-2 border active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-amber-500 ${
        isInWishlist
          ? 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100 shadow-xs'
          : 'bg-white border-neutral-300 text-neutral-800 hover:bg-neutral-50 hover:border-neutral-400 shadow-xs'
      } ${className}`}
    >
      {isInWishlist ? (
        <>
          <Heart className="w-4 h-4 fill-rose-500 text-rose-500 shrink-0" />
          {showText && (
            <span className="truncate">
              {isBengali ? 'উইশলিস্টে যুক্ত আছে ✓' : 'Added to Wish List ✓'}
            </span>
          )}
        </>
      ) : (
        <>
          <Heart className="w-4 h-4 text-neutral-600 group-hover:text-rose-500 shrink-0" />
          {showText && (
            <span className="truncate">
              {isBengali ? 'পছন্দের তালিকায় রাখুন' : 'Add to Wish List'}
            </span>
          )}
        </>
      )}
    </button>
  );
};

export default WishlistButton;
