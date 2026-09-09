'use client';

import React from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useWishlistCount, useWishlistAnimation } from '@/hooks/useWishlistStore';
import { useLanguage } from '@/hooks/useLanguage';
import { toBengaliNumerals } from '@/lib/utils/currency';

interface WishlistHeaderButtonProps {
  className?: string;
}

/**
 * Module 2 (Task 40): Optional Wishlist Quick Heart Counter Icon
 *
 * Prominently provides quick access to saved books in the desktop header,
 * with real-time counter badge and micro-bounce animation on item additions.
 */
export const WishlistHeaderButton: React.FC<WishlistHeaderButtonProps> = ({ className = '' }) => {
  const count = useWishlistCount();
  const isAnimating = useWishlistAnimation();
  const { isBengali } = useLanguage();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const ariaLabel = isBengali
    ? `সংরক্ষিত পছন্দের বইসমূহ, মোট ${toBengaliNumerals(count)}টি বই`
    : `Your Wishlist, ${count} saved items`;

  return (
    <Link
      href="/wishlist"
      aria-label={ariaLabel}
      title={ariaLabel}
      className={`amazon-nav-box group flex items-center gap-1 py-1 px-2 text-white hover:text-amber-300 transition-colors select-none ${className}`}
    >
      <div className="relative flex items-center justify-center">
        <Heart
          className={`w-5 h-5 transition-all duration-200 ${
            count > 0 ? 'text-red-400 group-hover:text-red-300 fill-red-400/20' : 'text-gray-300 group-hover:text-white'
          } ${isAnimating ? 'scale-135 text-red-500 fill-red-500 animate-bounce' : ''}`}
        />

        {/* Counter Badge */}
        {isMounted && count > 0 && (
          <span
            className={`absolute -top-1.5 -right-2 bg-[#f08804] text-gray-950 text-[10px] font-black min-w-[1rem] h-[1rem] px-0.5 rounded-full flex items-center justify-center shadow-2xs transition-transform duration-200 ${
              isAnimating ? 'scale-125' : 'scale-100'
            }`}
          >
            {isBengali ? toBengaliNumerals(count) : count}
          </span>
        )}
      </div>

      <div className="hidden 2xl:flex flex-col text-left leading-none ml-0.5">
        <span className="text-[10px] text-gray-300 font-normal leading-none">
          {isBengali ? 'পছন্দের' : 'Your'}
        </span>
        <span className="text-xs font-bold leading-tight text-white group-hover:text-amber-300">
          {isBengali ? 'উইশলিস্ট' : 'Wishlist'}
        </span>
      </div>
    </Link>
  );
};
