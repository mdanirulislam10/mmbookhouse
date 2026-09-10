'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  User,
  Package,
  MapPin,
  Heart,
  LogOut,
  FileText,
  Shield,
  Compass,
  Download,
  Clock,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useLanguage } from '@/hooks/useLanguage';
import { useWishlistCount } from '@/hooks/useWishlistStore';
import { performCompleteSignOut } from '@/lib/auth/signOutHelper';
import { toBengaliNumerals } from '@/lib/utils/currency';
import { getHeaderDictionary } from '@/lib/i18n/headerDictionary';
import { UserAvatar } from './UserAvatar';

interface AccountFlyoutProps {
  className?: string;
}

export const AccountFlyout: React.FC<AccountFlyoutProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isLoggedIn, fullName, email, avatarUrl, loginAsDemo, logout } = useAuthSession();
  const { language } = useLanguage();
  const wishlistCount = useWishlistCount();
  const dict = getHeaderDictionary(language);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Smooth hover open/close with slight debounce
  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 250);
  };

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSignInClick = () => {
    loginAsDemo();
    setIsOpen(false);
  };

  const handleSignOutClick = () => {
    setIsOpen(false);
    performCompleteSignOut('/');
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onBlur={(e) => {
        if (!containerRef.current?.contains(e.relatedTarget as Node)) {
          setIsOpen(false);
        }
      }}
      className={`relative ${className}`}
    >
      {/* Trigger Button (Task 17 & 39) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isLoggedIn ? `${dict.account.accountAndLists}: ${dict.account.helloUser(fullName)}` : `${dict.account.accountAndLists}: ${dict.account.helloGuest}`}
        aria-expanded={isOpen}
        className="amazon-nav-box group flex items-center gap-1.5 leading-tight text-left select-none text-white focus:outline-none cursor-pointer"
      >
        {isLoggedIn && (
          <UserAvatar avatarUrl={avatarUrl} name={fullName} size="sm" />
        )}
        <div className="flex flex-col leading-tight">
          <span className="text-[11px] text-gray-300 font-normal tracking-tight truncate max-w-[120px]">
            {isLoggedIn ? dict.account.helloUser(fullName.split(' ')[0]) : dict.account.helloGuest}
          </span>
          <span className="text-xs font-bold text-white flex items-center gap-0.5 tracking-tight group-hover:text-amber-300">
            <span>{dict.account.accountAndLists}</span>
            <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </span>
        </div>
      </button>

      {/* Flyout Card with Amazon Arrow Pointer */}
      {isOpen && (
        <div
          role="region"
          aria-label={dict.account.accountAndLists}
          className="absolute right-0 top-full mt-2 w-80 sm:w-[440px] bg-white rounded-xl shadow-2xl border border-gray-200 text-gray-900 z-[95] overflow-hidden animate-in fade-in zoom-in-95 duration-150 select-none font-bengali"
        >
          {/* Top Arrow Pointer (Aligned with trigger) */}
          <div className="absolute -top-1.5 right-10 w-3 h-3 bg-white border-t border-l border-gray-200 rotate-45" />

          {/* Conditional View: Logged Out (Task 18) vs Logged In (Task 19) */}
          {!isLoggedIn ? (
            /* =========================================================================
             * Task 18 & 42: Logged-Out / Guest View
             * ========================================================================= */
            <div className="p-4 space-y-3">
              {/* Sign In CTA Button (Task 41) */}
              <div className="text-center space-y-2 pb-3 border-b border-gray-100">
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="block w-full py-2.5 px-4 bg-[#ffd814] hover:bg-[#f7ca00] active:bg-[#f0b800] text-gray-950 font-bold rounded-lg border border-[#fcd200] shadow-xs text-xs transition-all text-center cursor-pointer"
                >
                  {dict.account.signInBtn}
                </Link>
                <div className="flex items-center justify-between text-[11px] text-gray-600 px-1">
                  <span>
                    {dict.account.newCustomer}{' '}
                    <Link
                      href="/login"
                      onClick={() => setIsOpen(false)}
                      className="text-blue-700 hover:text-amber-700 font-bold hover:underline cursor-pointer"
                    >
                      {dict.account.startHere}
                    </Link>
                  </span>
                  <button
                    type="button"
                    onClick={handleSignInClick}
                    className="text-[10px] text-gray-500 hover:text-gray-900 underline cursor-pointer"
                  >
                    ডেমো লগইন
                  </button>
                </div>
              </div>

              {/* 2-Column Links */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                {/* Left Column: Lists */}
                <div className="space-y-1.5 border-r border-gray-100 pr-3">
                  <span className="text-xs font-bold text-gray-900 block pb-1 border-b border-gray-100">
                    {dict.account.yourLists}
                  </span>
                  <Link
                    href="/wishlist"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between text-xs text-gray-700 hover:text-amber-600 hover:underline py-0.5"
                  >
                    <span className="flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <span>{dict.account.favoritesWishlist}</span>
                    </span>
                    {wishlistCount > 0 && (
                      <span className="text-[10px] bg-red-50 text-red-600 font-bold px-1.5 py-0.2 rounded-full border border-red-200">
                        {language === 'bn' ? toBengaliNumerals(wishlistCount) : wishlistCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/wishlist"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-1.5 text-xs text-gray-700 hover:text-amber-600 hover:underline py-0.5"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>{dict.account.savedBooks}</span>
                  </Link>
                  <Link
                    href="/categories"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-1.5 text-xs text-gray-700 hover:text-amber-600 hover:underline py-0.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span>সিলেবাস ও ক্যাটাগরি ব্রাউজ</span>
                  </Link>
                </div>

                {/* Right Column: Account */}
                <div className="space-y-1.5 pl-1">
                  <span className="text-xs font-bold text-gray-900 block pb-1 border-b border-gray-100">
                    {dict.account.yourAccount}
                  </span>
                  <Link
                    href="/account"
                    onClick={() => setIsOpen(false)}
                    className="block text-xs text-gray-700 hover:text-amber-600 hover:underline py-0.5"
                  >
                    {dict.account.yourAccount}
                  </Link>
                  <Link
                    href="/orders"
                    onClick={() => setIsOpen(false)}
                    className="block text-xs text-gray-700 hover:text-amber-600 hover:underline py-0.5"
                  >
                    {dict.account.yourOrders}
                  </Link>
                  <Link
                    href="/help"
                    onClick={() => setIsOpen(false)}
                    className="block text-xs text-gray-700 hover:text-amber-600 hover:underline py-0.5"
                  >
                    {dict.account.customerSupport}
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            /* =========================================================================
             * Task 19 & 42: Logged-In Personalized View
             * ========================================================================= */
            <div className="p-4 space-y-3">
              {/* Header Greeting (Task 19 & 39) */}
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <UserAvatar avatarUrl={avatarUrl} name={fullName} size="md" />
                <div className="flex-1 truncate">
                  <div className="text-xs font-bold text-gray-900 truncate">
                    {dict.account.helloUser(fullName)}
                  </div>
                  <div className="text-[11px] text-gray-500 truncate">{email}</div>
                </div>
              </div>

              {/* 2-Column Personalized Links */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                {/* Left Column: Lists & Saved */}
                <div className="space-y-1.5 border-r border-gray-100 pr-3 text-xs">
                  <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                    <span className="font-bold text-gray-900">
                      {dict.account.yourLists}
                    </span>
                    <Link
                      href="/wishlist"
                      onClick={() => setIsOpen(false)}
                      className="text-[10px] font-semibold text-blue-700 hover:text-amber-600 hover:underline"
                    >
                      নতুন উইশলিস্ট +
                    </Link>
                  </div>
                  <Link
                    href="/wishlist"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between text-gray-700 hover:text-amber-600 hover:underline py-0.5"
                  >
                    <span className="flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <span>{dict.account.favoritesWishlist}</span>
                    </span>
                    {wishlistCount > 0 && (
                      <span className="text-[10px] bg-red-50 text-red-600 font-bold px-1.5 py-0.2 rounded-full border border-red-200">
                        {language === 'bn' ? toBengaliNumerals(wishlistCount) : wishlistCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/wishlist"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-1.5 text-gray-700 hover:text-amber-600 hover:underline py-0.5"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>{dict.account.savedBooks}</span>
                  </Link>
                  <Link
                    href="/history"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-1.5 text-gray-700 hover:text-amber-600 hover:underline py-0.5"
                  >
                    <Clock className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                    <span>{dict.account.recentBrowsed}</span>
                  </Link>
                  <Link
                    href="/categories"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-1.5 text-gray-700 hover:text-amber-600 hover:underline py-0.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span>সিলেবাস ও আইডিয়া তালিকা</span>
                  </Link>
                </div>

                {/* Right Column: Account Management */}
                <div className="space-y-1.5 pl-1 text-xs">
                  <span className="font-bold text-gray-900 block pb-1 border-b border-gray-100">
                    {dict.account.yourAccount}
                  </span>
                  <Link
                    href="/account"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-1.5 text-gray-700 hover:text-amber-600 hover:underline py-0.5"
                  >
                    <User className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                    <span>{dict.account.profileSettings}</span>
                  </Link>
                  <Link
                    href="/orders"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-1.5 text-gray-700 hover:text-amber-600 hover:underline py-0.5"
                  >
                    <Package className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>{dict.account.ordersAndTracking}</span>
                  </Link>
                  <Link
                    href="/account?tab=exams"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-1.5 text-gray-700 hover:text-amber-600 hover:underline py-0.5"
                  >
                    <Compass className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>পরীক্ষার প্রস্তুতি ও লক্ষ্য</span>
                  </Link>
                  <Link
                    href="/account?tab=business"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-1.5 text-gray-700 hover:text-amber-600 hover:underline py-0.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>বিজনেস জিএসটি ও চালান</span>
                  </Link>
                  <Link
                    href="/account?tab=data"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-1.5 text-gray-700 hover:text-amber-600 hover:underline py-0.5"
                  >
                    <Download className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>১-ক্লিক ডেটা এক্সপোর্ট (DPDP)</span>
                  </Link>
                </div>
              </div>

              {/* Sign Out Action Button */}
              <div className="pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleSignOutClick}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded text-xs font-bold text-red-700 hover:bg-red-50 hover:text-red-800 transition-colors border border-red-200 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{dict.account.signOut}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
