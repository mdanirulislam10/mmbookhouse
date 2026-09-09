'use client';

import React from 'react';
import Link from 'next/link';
import { Home, LayoutGrid, Heart, Package, User } from 'lucide-react';
import { useCategoryDrawer } from '@/hooks/useCategoryDrawer';
import { useLanguage } from '@/hooks/useLanguage';
import { useWishlist } from '@/hooks/useWishlistStore';
import { toBengaliNumerals } from '@/lib/utils/currency';
import { getHeaderDictionary } from '@/lib/i18n/headerDictionary';

interface MobileBottomNavProps {
  onOpenCategories?: () => void;
  wishlistCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  onOpenCategories,
  wishlistCount: propWishlistCount,
}) => {
  const openDrawer = useCategoryDrawer((state) => state.openDrawer);
  const { count: liveWishlistCount } = useWishlist();
  const { language, isBengali } = useLanguage();
  const dict = getHeaderDictionary(language);

  const activeWishlistCount = propWishlistCount !== undefined ? propWishlistCount : liveWishlistCount;

  const handleCategoriesClick = () => {
    onOpenCategories?.();
    openDrawer();
  };

  return (
    <nav
      role="navigation"
      aria-label="মোবাইল কুইক নেভিগেশন"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#131921] border-t border-[#232f3e] md:hidden px-2 pt-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] shadow-lg select-none"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* 1. Home */}
        <Link
          href="/"
          className="flex flex-col items-center justify-center p-1.5 min-w-[56px] text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">{dict.mobileNav.home}</span>
        </Link>

        {/* 2. Categories Drawer (Hooked up to useCategoryDrawer) */}
        <button
          type="button"
          onClick={handleCategoriesClick}
          aria-label="সকল বইয়ের বিভাগ ও ড্রয়ার মেনু খুলুন"
          className="flex flex-col items-center justify-center p-1.5 min-w-[56px] text-gray-300 hover:text-white transition-colors cursor-pointer"
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5">{dict.mobileNav.categories}</span>
        </button>

        {/* 3. Wishlist (with Counter Badge) */}
        <Link
          href="/wishlist"
          className="relative flex flex-col items-center justify-center p-1.5 min-w-[56px] text-gray-300 hover:text-white transition-colors cursor-pointer"
        >
          <div className="relative">
            <Heart className="w-5 h-5" />
            {activeWishlistCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-amber-500 text-gray-950 text-[9px] font-black min-w-[0.9rem] h-[0.9rem] px-0.5 rounded-full flex items-center justify-center">
                {isBengali ? toBengaliNumerals(activeWishlistCount) : activeWishlistCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium mt-0.5">{dict.mobileNav.wishlist}</span>
        </Link>

        {/* 4. Orders */}
        <Link
          href="/orders"
          className="flex flex-col items-center justify-center p-1.5 min-w-[56px] text-gray-300 hover:text-white transition-colors cursor-pointer"
        >
          <Package className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5">{dict.mobileNav.orders}</span>
        </Link>

        {/* 5. Profile */}
        <Link
          href="/account"
          className="flex flex-col items-center justify-center p-1.5 min-w-[56px] text-gray-300 hover:text-white transition-colors cursor-pointer"
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5">{dict.mobileNav.profile}</span>
        </Link>
      </div>
    </nav>
  );
};
