'use client';

import React, { useState, useMemo } from 'react';
import { ProductBundle, BundleItem } from '../../types/bundle';
import { calculateBundlePricing } from '../../lib/services/bundlePricingService';
import type { DetailedBookProduct } from '../../types/pdp';
import { Plus, Check, ShoppingBag, Eye, Sparkles, AlertCircle } from 'lucide-react';

export interface FrequentlyBoughtTogetherProps {
  bundle?: ProductBundle;
  currentBook?: DetailedBookProduct;
  activeCartItemIds?: string[];
  onAddToCart?: (selectedItemIds: string[], bundleId: string) => void;
  onQuickPreview?: (item: BundleItem) => void;
  locale?: 'en' | 'bn';
  isLoading?: boolean;
}

export const FrequentlyBoughtTogether: React.FC<FrequentlyBoughtTogetherProps> = ({
  bundle,
  currentBook,
  activeCartItemIds = [],
  onAddToCart,
  onQuickPreview,
  locale = 'bn',
  isLoading = false,
}) => {
  const resolvedBundle = useMemo<ProductBundle | null>(() => {
    if (bundle) return bundle;
    if (currentBook) {
      const primaryItem: BundleItem = {
        product_id: currentBook.id,
        title: currentBook.title,
        title_bn: currentBook.titleBn,
        author: currentBook.author,
        cover_image_url: currentBook.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c',
        unit_mrp: currentBook.mrp || currentBook.price * 1.2,
        unit_selling_price: currentBook.price,
        is_primary: true,
        is_in_stock: currentBook.inStock !== false,
        stock_quantity: currentBook.stockQuantity ?? 15,
        rating: currentBook.rating || 4.8,
        total_reviews: currentBook.reviewsCount || 35,
      };

      const compItem: BundleItem = {
        product_id: `${currentBook.id}-solution-guide`,
        title: `${currentBook.title} - Question Bank & Solved Papers`,
        title_bn: `${currentBook.titleBn || currentBook.title} প্রশ্নব্যাংক ও সমাধান`,
        author: 'Ray & Martin Experts',
        cover_image_url: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a',
        unit_mrp: Math.round(currentBook.price * 0.7),
        unit_selling_price: Math.round(currentBook.price * 0.55),
        is_primary: false,
        is_in_stock: true,
        stock_quantity: 20,
        rating: 4.9,
        total_reviews: 88,
      };

      return {
        id: `bundle-${currentBook.id}`,
        primary_product_id: currentBook.id,
        title: 'Frequently Bought Together Combo',
        title_bn: 'একত্রে সেরা কম্বো অফার',
        items: [primaryItem, compItem],
        discount_type: 'PERCENTAGE',
        discount_value: 10,
        bundle_source: 'ALGORITHMIC',
        priority_score: 80,
        is_active: true,
        created_at: new Date().toISOString(),
      };
    }
    return null;
  }, [bundle, currentBook]);

  // Available in-stock items
  const availableItems = useMemo(
    () => (resolvedBundle ? resolvedBundle.items.filter((it) => it.is_in_stock && it.stock_quantity > 0) : []),
    [resolvedBundle]
  );

  // Default all in-stock items checked
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(() =>
    availableItems.map((it) => it.product_id)
  );

  const [isAdding, setIsAdding] = useState(false);

  // Real-time zero-lag pricing calculation (Item 13)
  const pricing = useMemo(() => {
    if (!resolvedBundle) return null;
    return calculateBundlePricing({
      bundle: resolvedBundle,
      selectedItemIds,
      activeCartItemIds,
      locale,
    });
  }, [resolvedBundle, selectedItemIds, activeCartItemIds, locale]);

  const toggleItem = (productId: string) => {
    setSelectedItemIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const handleAddBundle = async () => {
    if (!pricing || pricing.selected_item_ids.length === 0) return;
    setIsAdding(true);
    try {
      if (onAddToCart) {
        await onAddToCart(pricing.selected_item_ids, resolvedBundle?.id || 'bundle');
      }
    } finally {
      setIsAdding(false);
    }
  };

  // Zero Layout Shift Skeleton Loader (Item 19)
  if (isLoading) {
    return (
      <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-6 animate-pulse my-8 min-h-[260px]">
        <div className="h-6 w-48 bg-slate-200 rounded mb-4"></div>
        <div className="flex gap-4 mb-4">
          <div className="w-24 h-32 bg-slate-200 rounded"></div>
          <div className="w-24 h-32 bg-slate-200 rounded"></div>
          <div className="w-24 h-32 bg-slate-200 rounded"></div>
        </div>
        <div className="h-4 w-72 bg-slate-200 rounded"></div>
      </div>
    );
  }

  if (!resolvedBundle || !pricing || availableItems.length < 2) {
    return null; // Don't render FBT if less than 2 items are available
  }

  const isBn = locale === 'bn';

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow my-8">
      {/* Title & Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500 fill-amber-400" />
          <h2 className="text-lg md:text-xl font-bold text-slate-900">
            {isBn ? 'প্রায়ই একসাথে কেনা হয়' : 'Frequently bought together'}
          </h2>
        </div>

        {resolvedBundle.discount_value > 0 && (
          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-300 rounded-full">
            {resolvedBundle.discount_type === 'PERCENTAGE'
              ? `${resolvedBundle.discount_value}% কম্বো ছাড়`
              : `ফ্ল্যাট ₹${resolvedBundle.discount_value} কম্বো সেভিংস`}
          </span>
        )}
      </div>

      {/* Main Grid: Images + Connector + Price Box */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
        {/* Horizontal Book Covers with Plus (+) Connectors (Item 12, 15) */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          {availableItems.map((item, idx) => {
            const isSelected = selectedItemIds.includes(item.product_id);
            const isInCart = activeCartItemIds.includes(item.product_id);

            return (
              <React.Fragment key={item.product_id}>
                {/* Book Thumbnail Card */}
                <div
                  onClick={() => toggleItem(item.product_id)}
                  className={`relative group cursor-pointer transition-all duration-200 rounded-lg p-1.5 border-2 ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/40 shadow-sm'
                      : 'border-slate-200 opacity-50 grayscale hover:grayscale-0 hover:opacity-80'
                  }`}
                >
                  <div className="w-20 h-28 sm:w-24 sm:h-32 rounded overflow-hidden bg-slate-100 flex items-center justify-center relative">
                    <img
                      src={item.cover_image_url}
                      alt={item.title}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform"
                    />
                    {/* Primary Badge */}
                    {item.is_primary && (
                      <span className="absolute top-1 left-1 bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                        {isBn ? 'মূল বই' : 'This Item'}
                      </span>
                    )}

                    {/* Quick Preview Button */}
                    {onQuickPreview && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickPreview(item);
                        }}
                        className="absolute bottom-1 right-1 bg-black/70 hover:bg-black text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title={isBn ? 'বইটির বিবরণ দেখুন' : 'Quick Preview'}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Checked status tick mark */}
                  <div
                    className={`absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs ${
                      isSelected ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>

                {/* Plus (+) Connector between items */}
                {idx < availableItems.length - 1 && (
                  <div className="flex items-center justify-center text-slate-400 font-bold px-1">
                    <Plus className="w-5 h-5" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Pricing Summary & Action Box (Item 13, 14, 17) */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl min-w-[260px] flex flex-col justify-center">
          <div className="text-xs text-slate-500 font-semibold mb-1">
            {isBn ? 'নির্বাচিত বইগুলোর মোট মূল্য:' : 'Total Price:'}
          </div>

          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-black text-slate-900 font-mono">
              ₹{pricing.final_payable_amount.toFixed(0)}
            </span>
            {pricing.total_mrp > pricing.final_payable_amount && (
              <span className="text-sm text-slate-400 line-through font-mono">
                ₹{pricing.total_mrp.toFixed(0)}
              </span>
            )}
          </div>

          {pricing.total_savings > 0 && (
            <div className="text-xs font-bold text-emerald-700 mb-3 flex items-center gap-1">
              <span>{isBn ? 'আপনার মোট সাশ্রয়:' : 'Total Savings:'}</span>
              <span className="font-mono bg-emerald-100 px-1.5 py-0.5 rounded">
                ₹{pricing.total_savings.toFixed(0)}
              </span>
            </div>
          )}

          {/* Add Bundle Button (Item 14) */}
          <button
            onClick={handleAddBundle}
            disabled={pricing.item_count === 0 || isAdding}
            className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-98 ${
              pricing.item_count > 0
                ? 'bg-amber-400 hover:bg-amber-500 text-slate-900 shadow-amber-200'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            {pricing.button_label}
          </button>
        </div>
      </div>

      {/* Checkboxes List Section (Item 9, 10, 18, 40) */}
      <div className="space-y-2.5 pt-2 border-t border-slate-100">
        {availableItems.map((item) => {
          const isSelected = selectedItemIds.includes(item.product_id);
          const isInCart = activeCartItemIds.includes(item.product_id);

          return (
            <div
              key={item.product_id}
              className="flex items-start gap-2.5 text-xs text-slate-800 hover:text-slate-900 select-none cursor-pointer"
              onClick={() => toggleItem(item.product_id)}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => {}} // Handled by parent div
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />

              <div className="flex-1 leading-snug">
                {item.is_primary ? (
                  <span className="font-bold text-slate-900">
                    {isBn ? 'মূল বই (This item): ' : 'This item: '}
                  </span>
                ) : null}

                <span className={item.is_primary ? 'font-semibold text-slate-900' : 'text-slate-700'}>
                  {item.title}
                  {item.title_bn ? ` (${item.title_bn})` : ''}
                </span>

                <span className="font-mono font-bold text-slate-900 ml-1.5">
                  ₹{item.unit_selling_price.toFixed(0)}
                </span>

                {item.unit_mrp > item.unit_selling_price && (
                  <span className="text-slate-400 line-through font-mono text-[11px] ml-1">
                    ₹{item.unit_mrp.toFixed(0)}
                  </span>
                )}

                {/* Deduplication Guard Indicator (Item 40) */}
                {isInCart && (
                  <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                    {isBn ? 'ইতিমধ্যে ব্যাগে আছে' : 'Already in Cart'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
