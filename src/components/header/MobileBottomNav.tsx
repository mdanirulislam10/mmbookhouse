'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, Heart, Package, User } from 'lucide-react';
import { useCategoryDrawer } from '@/hooks/useCategoryDrawer';
import { useLanguage } from '@/hooks/useLanguage';
import { useWishlist } from '@/hooks/useWishlistStore';
import { useAuthSession } from '@/hooks/useAuthSession';
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
  const pathname = usePathname();
  const openDrawer = useCategoryDrawer((state) => state.openDrawer);
  const { count: liveWishlistCount } = useWishlist();
  const { language, isBengali } = useLanguage();
  const { isLoggedIn, fullName, avatarUrl } = useAuthSession();
  const dict = getHeaderDictionary(language);

  const activeWishlistCount = propWishlistCount !== undefined ? propWishlistCount : liveWishlistCount;

  const handleCategoriesClick = () => {
    onOpenCategories?.();
    openDrawer();
  };

  const isHomeActive = pathname === '/';
  const isWishlistActive = pathname?.startsWith('/wishlist');
  const isOrdersActive = pathname?.startsWith('/orders');
  const isAccountActive = pathname?.startsWith('/account') || pathname?.startsWith('/login');

  // Customer initials fallback for "You" tab
  const getInitials = () => {
    if (fullName) {
      const parts = fullName.trim().split(/\s+/);
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return fullName.slice(0, 2).toUpperCase();
    }
    return 'ME';
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
          className={`flex flex-col items-center justify-center p-1.5 min-w-[56px] transition-colors cursor-pointer ${
            isHomeActive ? 'text-amber-400 font-bold' : 'text-gray-300 hover:text-white'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{dict.mobileNav.home}</span>
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
          className={`relative flex flex-col items-center justify-center p-1.5 min-w-[56px] transition-colors cursor-pointer ${
            isWishlistActive ? 'text-amber-400 font-bold' : 'text-gray-300 hover:text-white'
          }`}
        >
          <div className="relative">
            <Heart className="w-5 h-5" />
            {activeWishlistCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-amber-500 text-gray-950 text-[9px] font-black min-w-[0.9rem] h-[0.9rem] px-0.5 rounded-full flex items-center justify-center animate-pulse">
                {isBengali ? toBengaliNumerals(activeWishlistCount) : activeWishlistCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium mt-0.5">{dict.mobileNav.wishlist}</span>
        </Link>

        {/* 4. Orders */}
        <Link
          href="/orders"
          className={`flex flex-col items-center justify-center p-1.5 min-w-[56px] transition-colors cursor-pointer ${
            isOrdersActive ? 'text-amber-400 font-bold' : 'text-gray-300 hover:text-white'
          }`}
        >
          <Package className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5">{dict.mobileNav.orders}</span>
        </Link>

        {/* 5. Amazon-style "You" (আপনি) Tab with Auth Sync */}
        <Link
          href={isLoggedIn ? '/account' : '/login?redirect=/account'}
          aria-label={isLoggedIn ? (isBengali ? 'আপনার অ্যাকাউন্ট' : 'Your Account') : (isBengali ? 'সাইন ইন করুন' : 'Sign In')}
          className={`flex flex-col items-center justify-center p-1.5 min-w-[56px] transition-colors cursor-pointer ${
            isAccountActive ? 'text-amber-400 font-bold' : 'text-gray-300 hover:text-white'
          }`}
        >
          <div className="relative flex items-center justify-center">
            {isLoggedIn ? (
              <div className="relative">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={fullName || 'You'}
                    className="w-5 h-5 rounded-full object-cover border border-amber-400"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-400/50 flex items-center justify-center text-[9px] font-bold">
                    {getInitials()}
                  </div>
                )}
                {/* Live Online Badge */}
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-[#131921]" />
              </div>
            ) : (
              <User className="w-5 h-5" />
            )}
          </div>
          <span className="text-[10px] font-medium mt-0.5">
            {isLoggedIn ? (isBengali ? 'আপনি' : 'You') : (isBengali ? 'লগইন' : 'Sign in')}
          </span>
        </Link>
      </div>
    </nav>
  );
};
