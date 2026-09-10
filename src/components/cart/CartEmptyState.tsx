'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingCart, Flame, Award, BookOpen, ArrowRight, Truck, CheckCircle2, Shield } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { getCartDictionary } from '@/lib/i18n/cartDictionary';

interface CartEmptyStateProps {
  className?: string;
}

export const CartEmptyState: React.FC<CartEmptyStateProps> = ({ className = '' }) => {
  const { language } = useLanguage();
  const dict = getCartDictionary(language);

  return (
    <div
      aria-label={dict.emptyCart.title}
      className={`bg-white rounded-lg border border-gray-200 shadow-sm p-6 sm:p-10 text-center max-w-4xl mx-auto ${className}`}
    >
      {/* Icon Graphic */}
      <div className="mx-auto w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-amber-50 border-2 border-amber-100 flex items-center justify-center text-amber-500 mb-6 shadow-inner">
        <ShoppingCart className="w-12 h-12 sm:w-14 sm:h-14 text-amber-500" strokeWidth={1.5} />
      </div>

      {/* Heading & Description */}
      <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
        {dict.emptyCart.title}
      </h2>
      <p className="text-sm sm:text-base text-gray-600 max-w-lg mx-auto mb-8">
        {dict.emptyCart.subtitle}
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-10">
        <Link
          href="/bestsellers"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#ffd814] hover:bg-[#f7ca00] active:bg-[#f0b800] text-gray-900 font-semibold py-3 px-6 rounded-full shadow-sm text-sm transition-all"
        >
          <Award className="w-4 h-4 text-amber-800" />
          <span>{dict.emptyCart.exploreBestsellers}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>

        <Link
          href="/deals"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-full shadow-sm text-sm transition-all"
        >
          <Flame className="w-4 h-4 text-orange-500" />
          <span>{dict.emptyCart.todaysDeals}</span>
        </Link>

        <Link
          href="/search"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium py-3 px-4 text-sm transition-colors"
        >
          <BookOpen className="w-4 h-4" />
          <span>{dict.emptyCart.continueShopping}</span>
        </Link>
      </div>

      {/* Reassurance Perks Row */}
      <div className="pt-8 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
        <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 border border-gray-100">
          <Truck className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-xs font-medium text-gray-700">{dict.emptyCart.freeDeliveryPerk}</span>
        </div>
        <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 border border-gray-100">
          <Shield className="w-5 h-5 text-blue-600 shrink-0" />
          <span className="text-xs font-medium text-gray-700">{dict.emptyCart.genuineGuaranteePerk}</span>
        </div>
        <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 border border-gray-100">
          <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0" />
          <span className="text-xs font-medium text-gray-700">{dict.emptyCart.fastDispatchPerk}</span>
        </div>
      </div>
    </div>
  );
};

export default CartEmptyState;
