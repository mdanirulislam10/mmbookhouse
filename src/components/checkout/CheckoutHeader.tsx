'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, ArrowLeft, HelpCircle } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { Logo } from '@/components/header/Logo';
import { CheckoutStep } from '@/types/checkout';

export interface CheckoutHeaderProps {
  itemCount?: number;
  currentStep?: CheckoutStep;
  returnUrl?: string;
  isBuyNow?: boolean;
}

/**
 * Module 12 - Task 2: Amazon Distraction-Free Checkout Header
 * 
 * Features:
 * - Distraction-Free Architecture: Strips navigation menus, mega-drawers, search bars,
 *   and promotional links to eliminate checkout leaks and cart abandonment (Item 1).
 * - 256-Bit SSL Security Shield Badge: Instills instant bank-grade transaction confidence (Item 2).
 * - Step Indicator & Item Counter: Displays current progress (e.g. "Checkout (2 items)").
 * - Safe Return Link: "Cancel and return to cart/product" link for seamless escape (Item 18).
 */
export const CheckoutHeader: React.FC<CheckoutHeaderProps> = ({
  itemCount = 1,
  currentStep = 1,
  returnUrl = '/cart',
  isBuyNow = false,
}) => {
  const { isBengali } = useLanguage();

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-xs select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
        {/* Left: Minimal Logo & Safe Return Trigger */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href={returnUrl}
            className="p-1.5 -ml-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            title={isBengali ? 'কেনাকাটায় ফিরে যান' : 'Return to cart'}
            aria-label={isBengali ? 'কেনাকাটায় ফিরে যান' : 'Return to cart'}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          {/* Logo styled on dark container or clean standalone */}
          <div className="bg-[#131921] px-2.5 py-1.5 rounded-lg flex items-center shadow-xs">
            <Logo className="scale-90 origin-left" />
          </div>

          {/* Return link for desktop */}
          <Link
            href={returnUrl}
            className="hidden md:inline-flex items-center text-xs font-semibold text-gray-500 hover:text-emerald-700 hover:underline transition-colors"
          >
            {isBengali
              ? isBuyNow
                ? '← বইয়ের পাতায় ফিরে যান'
                : '← কার্ট পেজে ফিরে যান'
              : isBuyNow
              ? '← Return to book page'
              : '← Return to cart'}
          </Link>
        </div>

        {/* Center: Checkout Title & Dynamic Step Pill */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-2xl font-black tracking-tight text-gray-900">
              {isBengali ? 'চেকআউট' : 'Checkout'}
            </h1>
            {itemCount > 0 && (
              <span className="text-xs sm:text-sm font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                {isBengali ? `${itemCount}টি বই` : `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
              </span>
            )}
          </div>

          {/* Micro Step Status Dots */}
          <div className="hidden sm:flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-gray-500">
            <span className={currentStep >= 1 ? 'text-emerald-700 font-bold' : ''}>
              {isBengali ? '১. ঠিকানা' : '1. Address'}
            </span>
            <span className="text-gray-300">›</span>
            <span className={currentStep >= 2 ? 'text-emerald-700 font-bold' : ''}>
              {isBengali ? '২. ডেলিভারি' : '2. Delivery'}
            </span>
            <span className="text-gray-300">›</span>
            <span className={currentStep >= 3 ? 'text-emerald-700 font-bold' : ''}>
              {isBengali ? '৩. পেমেন্ট' : '3. Payment'}
            </span>
          </div>
        </div>

        {/* Right: 100% Secure 256-Bit SSL Encryption Shield Badge */}
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2.5 sm:px-3.5 py-1.5 rounded-full shadow-xs">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
            <div className="text-left leading-none">
              <div className="flex items-center gap-1">
                <span className="text-[11px] sm:text-xs font-black tracking-wide text-emerald-950">
                  {isBengali ? '১০০% নিরাপদ লেনদেন' : '100% SECURE'}
                </span>
                <Lock className="w-3 h-3 text-emerald-700 hidden sm:inline" />
              </div>
              <p className="text-[9px] sm:text-[10px] text-emerald-700 font-medium hidden sm:block">
                {isBengali ? '২৫৬-বিট SSL এনক্রিপশন' : '256-Bit SSL Encryption'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Micro Progress Bar */}
      <div className="sm:hidden w-full bg-gray-100 h-1">
        <div
          className="bg-emerald-600 h-1 transition-all duration-300 ease-out"
          style={{ width: `${(currentStep / 3) * 100}%` }}
        />
      </div>
    </header>
  );
};

export default CheckoutHeader;
