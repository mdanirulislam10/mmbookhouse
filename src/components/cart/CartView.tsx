'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Home,
  CheckCircle2,
  X,
  RotateCcw,
} from 'lucide-react';
import { useCart } from '@/hooks/useCartStore';
import { useLanguage } from '@/hooks/useLanguage';
import { getCartDictionary } from '@/lib/i18n/cartDictionary';
import { formatINR } from '@/lib/utils/currency';
import { CartOrderSummary } from './CartOrderSummary';
import { CartEmptyState } from './CartEmptyState';
import { CartItemCard } from './CartItemCard';
import { SavedForLaterSection } from './SavedForLaterSection';
import { CartCrossSell } from './CartCrossSell';

export const CartView: React.FC = () => {
  const [isMounted, setIsMounted] = useState(false);

  const {
    items,
    selectedItems,
    selectedCount,
    selectedSubtotal,
    isAllSelected,
    removeItem,
    updateQuantity,
    saveForLater,
    toggleItemSelect,
    selectAllItems,
    lastDeletedItem,
    undoRemoveItem,
    clearLastDeletedItem,
  } = useCart();
  const { language, isBengali } = useLanguage();
  const dict = getCartDictionary(language);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Hydration fallback skeleton
  if (!isMounted) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-pulse">
        {/* Breadcrumb Skeleton */}
        <div className="h-4 bg-gray-200 rounded w-48 mb-6" />
        {/* 2-Column Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200 h-96" />
            <div className="bg-white rounded-lg p-6 border border-gray-200 h-40" />
          </div>
          <div className="lg:col-span-4">
            <div className="bg-white rounded-lg p-6 border border-gray-200 h-72" />
          </div>
        </div>
      </div>
    );
  }

  const isEmpty = items.length === 0;

  return (
    <div className="min-h-[75vh] bg-[#eaeded] py-4 sm:py-6 font-bengali">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Task 11: Accessible Breadcrumbs Navigation */}
        <nav
          aria-label={dict.breadcrumbs.ariaLabel}
          className="flex items-center gap-1.5 text-xs text-gray-600 mb-4 select-none"
        >
          <Link
            href="/"
            className="flex items-center gap-1 hover:text-amber-800 transition-colors font-medium"
          >
            <Home className="w-3.5 h-3.5 text-gray-500" />
            <span>{dict.breadcrumbs.home}</span>
          </Link>
          <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />
          <span className="font-semibold text-gray-900" aria-current="page">
            {dict.breadcrumbs.cart}
          </span>
        </nav>

        {/* Task 14: Delete Item with Smooth Fade-out & Undo Banner */}
        {lastDeletedItem && (
          <div
            role="status"
            aria-live="polite"
            className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded-lg flex items-center justify-between text-xs sm:text-sm text-amber-950 shadow-2xs animate-fadeIn"
          >
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="truncate">
                {isBengali
                  ? `"${lastDeletedItem.item.titleBn || lastDeletedItem.item.title}" বইটি কার্ট থেকে সরানো হয়েছে।`
                  : `"${lastDeletedItem.item.title}" was removed from your cart.`}
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-2">
              <button
                type="button"
                onClick={() => undoRemoveItem()}
                className="font-bold text-amber-800 hover:text-amber-950 underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isBengali ? 'পূর্বাবস্থায় ফিরিয়ে আনুন (Undo)' : 'Undo'}</span>
              </button>
              <button
                type="button"
                onClick={() => clearLastDeletedItem()}
                aria-label="Dismiss banner"
                className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Empty Cart Handling */}
        {isEmpty ? (
          <div className="py-4">
            <CartEmptyState />
          </div>
        ) : (
          /* Amazon Classic 2-Column Responsive Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: lg:col-span-8 */}
            <div className="lg:col-span-8 space-y-6">
              {/* Main Shopping Cart Container */}
              <section
                aria-label={dict.pageTitle}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6"
              >
                {/* Header Row: Title and Price Label */}
                <div className="flex items-baseline justify-between pb-3 border-b border-gray-200">
                  <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                      {dict.pageTitle}
                    </h1>
                    {/* Task 15: Select / Deselect All Items Control */}
                    <div className="mt-2 flex items-center gap-2">
                      <label className="inline-flex items-center gap-2 text-xs sm:text-sm text-indigo-700 hover:text-indigo-900 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={(e) => selectAllItems(e.target.checked)}
                          className="rounded border-gray-300 text-amber-500 focus:ring-amber-400 cursor-pointer"
                        />
                        <span>{isAllSelected ? dict.deselectAll : dict.selectAll}</span>
                      </label>
                    </div>
                  </div>

                  {/* Desktop Price Header */}
                  <span className="hidden sm:block text-sm font-semibold text-gray-500 uppercase tracking-wider">
                    {dict.priceHeader}
                  </span>
                </div>

                {/* Active Cart Items List (Task 12: Full Line Item Card) */}
                <div className="divide-y divide-gray-200">
                  {items.map((item) => (
                    <CartItemCard
                      key={item.id}
                      item={item}
                      isSelected={item.isSelected !== false}
                      onToggleSelect={(id, selected) => toggleItemSelect(id, selected)}
                      onUpdateQuantity={(id, quantity) => updateQuantity(id, quantity)}
                      onRemove={(id) => removeItem(id)}
                      onSaveForLater={(id) => saveForLater(id)}
                    />
                  ))}
                </div>

                {/* Subtotal Footer inside Left Card */}
                <div className="pt-4 mt-2 border-t border-gray-200 text-right">
                  <p className="text-base sm:text-lg text-gray-800">
                    <span className="font-normal">{dict.orderSummary.subtotal(selectedCount)}</span>{' '}
                    <span className="font-bold text-gray-950 font-mono">
                      {formatINR(selectedSubtotal, language)}
                    </span>
                  </p>
                </div>
              </section>

              {/* Task 24: Unlimited Capacity "Save for Later" Section (savedForLater) */}
              <SavedForLaterSection />

              {/* Task 20: Cross-Sell Recommendations Carousel */}
              <CartCrossSell />
            </div>

            {/* Right Column: lg:col-span-4 Sticky Order Summary */}
            <div className="lg:col-span-4">
              <CartOrderSummary />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartView;
