'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Bookmark,
  BookmarkCheck,
  BookOpen,
  LayoutGrid,
  List,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Clock,
  Trash2,
} from 'lucide-react';
import { useCartStore, useSavedForLaterItems, useSavedForLaterCount } from '@/hooks/useCartStore';
import { useLanguage } from '@/hooks/useLanguage';
import { getCartDictionary } from '@/lib/i18n/cartDictionary';
import { formatINR, toBengaliNumerals } from '@/lib/utils/currency';
import { MoveToCartAction } from './MoveToCartAction';
import { SavedForLaterItem } from '@/types/cart';

export interface SavedForLaterSectionProps {
  className?: string;
}

/**
 * Module 10 (Task 24): Unlimited Capacity "Save for Later" Section UI
 *
 * Provides:
 * - Clean Amazon-style container header with dynamic count
 * - Unlimited capacity responsive grid / list layout that scales effortlessly
 * - Rich book cards displaying cover, bilingual titles, author, binding, pricing, discount, stock badge
 * - 1-Click <MoveToCartAction /> and delete controls
 * - Friendly, informative empty state explaining the feature benefits
 */
export const SavedForLaterSection: React.FC<SavedForLaterSectionProps> = ({ className = '' }) => {
  const savedItems = useSavedForLaterItems();
  const savedCount = useSavedForLaterCount();
  const clearSavedItems = useCartStore((state) => state.clearSavedItems);
  const { language, isBengali } = useLanguage();
  const dict = getCartDictionary(language);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const hasItems = savedItems.length > 0;

  return (
    <section
      aria-label={dict.savedForLater.title}
      className={`bg-white dark:bg-[#1f2937] rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 overflow-hidden font-bengali transition-colors ${className}`}
    >
      {/* Container Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Bookmark className="w-4 h-4 fill-amber-600/30" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <span>
                  {isBengali
                    ? `পরবর্তীতে কেনার জন্য সংরক্ষিত`
                    : 'Saved for Later'}
                </span>
                {hasItems && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200">
                    {isBengali ? `${toBengaliNumerals(savedCount)}টি বই` : `${savedCount} ${savedCount === 1 ? 'item' : 'items'}`}
                  </span>
                )}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {isBengali
                  ? 'কার্ট থেকে সাময়িকভাবে সরিয়ে রাখা বইসমূহ। যেকোনো সময় এক ক্লিকে সক্রিয় কার্টে ফিরিয়ে আনা যাবে।'
                  : 'Items put aside from your cart. You can move them back to your active cart whenever you are ready.'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Toolbar: Grid/List switch and Clear All */}
        {hasItems && (
          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-gray-200/70 dark:bg-gray-700 rounded-lg p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-label={isBengali ? 'গ্রিড ভিউ' : 'Grid view'}
                title={isBengali ? 'গ্রিড ভিউ' : 'Grid view'}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-label={isBengali ? 'লিস্ট ভিউ' : 'List view'}
                title={isBengali ? 'লিস্ট ভিউ' : 'List view'}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Clear All Confirmation / Button */}
            {showClearConfirm ? (
              <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/40 p-1 rounded-lg border border-rose-200 dark:border-rose-800 text-xs">
                <span className="text-[11px] text-rose-700 dark:text-rose-300 px-1 font-medium">
                  {isBengali ? 'সব মুছবেন?' : 'Clear all?'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    clearSavedItems();
                    setShowClearConfirm(false);
                  }}
                  className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded text-[11px] transition-colors cursor-pointer"
                >
                  {isBengali ? 'হ্যাঁ' : 'Yes'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="px-2 py-0.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded text-[11px] transition-colors cursor-pointer"
                >
                  {isBengali ? 'না' : 'No'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-rose-600 dark:text-gray-400 dark:hover:text-rose-400 px-2 py-1 rounded transition-colors cursor-pointer"
                title={isBengali ? 'সমস্ত সংরক্ষিত আইটেম মুছুন' : 'Clear all saved items'}
              >
                <Trash2 className="w-3 h-3" />
                <span className="hidden sm:inline">{isBengali ? 'সব মুছুন' : 'Clear all'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Body */}
      <div className="p-4 sm:p-6">
        {!hasItems ? (
          /* Friendly Empty State */
          <div className="py-8 px-4 text-center max-w-xl mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-center justify-center mx-auto mb-4 shadow-2xs">
              <BookmarkCheck className="w-7 h-7 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
              {isBengali
                ? 'আপনার সংরক্ষিত তালিকায় বর্তমানে কোনো বই নেই'
                : 'No books saved for later'}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
              {isBengali
                ? 'শপিং কার্ট পর্যালোচনা করার সময় কোনো বই সাময়িকভাবে সরিয়ে রাখতে চান? প্রতিটি বইয়ের নিচে "পরে কিনুন" বাটনে ক্লিক করুন। বইগুলো এখানে নিরাপদে জমা থাকবে এবং সক্রিয় কার্ট সাবটোটাল তৎক্ষণাৎ আপডেট হবে।'
                : 'Want to put a book on hold while reviewing your cart? Simply click "Save for later" under any item. It will stay safe here without affecting your checkout subtotal.'}
            </p>

            {/* Value Proposition Perks */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 text-left">
              <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 dark:text-gray-200">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>{isBengali ? 'আনলিমিটেড সংরক্ষণ' : 'Unlimited Storage'}</span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                  {isBengali ? 'যত ইচ্ছা বই সেভ করে রাখুন' : 'Save as many books as you like'}
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 dark:text-gray-200">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>{isBengali ? '১-ক্লিকে ফিরিয়ে নিন' : '1-Click Restore'}</span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                  {isBengali ? 'যেকোনো মুহূর্তে কার্টে ফেরত' : 'Instant return to active cart'}
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 dark:text-gray-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isBengali ? 'মূল্য ও স্টক ট্র্যাকিং' : 'Stock & Price Track'}</span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                  {isBengali ? 'সর্বদা রিয়েল-টাইম স্টক আপডেট' : 'Live availability status'}
                </p>
              </div>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          /* Unlimited Capacity Responsive Grid Layout */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {savedItems.map((item) => (
              <SavedItemCard key={item.id} item={item} language={language} isBengali={isBengali} />
            ))}
          </div>
        ) : (
          /* Responsive List Layout */
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {savedItems.map((item) => (
              <SavedItemListRow key={item.id} item={item} language={language} isBengali={isBengali} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

// -----------------------------------------------------------------------------
// Subcomponent: SavedItemCard (Grid Mode)
// -----------------------------------------------------------------------------
interface SavedItemCardProps {
  item: SavedForLaterItem;
  language: 'bn' | 'en';
  isBengali: boolean;
}

const SavedItemCard: React.FC<SavedItemCardProps> = ({ item, language, isBengali }) => {
  const isOutOfStock = item.inStock === false;
  const discountPercent =
    item.mrp > item.price ? Math.round(((item.mrp - item.price) / item.mrp) * 100) : 0;

  const displayTitle = isBengali ? item.titleBn || item.title : item.title;
  const displayAuthor = isBengali && item.authorBn ? item.authorBn : item.author;

  return (
    <div className="bg-white dark:bg-gray-800/90 rounded-xl border border-gray-200 dark:border-gray-700 p-3.5 flex flex-col justify-between hover:shadow-md transition-all group">
      <div>
        {/* Cover Image & Badges */}
        <div className="relative w-full h-44 rounded-lg bg-gray-100 dark:bg-gray-700/60 overflow-hidden flex items-center justify-center mb-3 border border-gray-200/80 dark:border-gray-700 shadow-2xs">
          {item.coverImage ? (
            <Image
              src={item.coverImage}
              alt={displayTitle}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-contain p-2 group-hover:scale-103 transition-transform duration-200"
              unoptimized
            />
          ) : (
            <BookOpen className="w-10 h-10 text-gray-400 opacity-60" />
          )}

          {/* Discount Ribbon */}
          {discountPercent > 0 && (
            <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-rose-600 text-white shadow-xs">
              {isBengali ? `${toBengaliNumerals(discountPercent)}% ছাড়` : `${discountPercent}% OFF`}
            </span>
          )}

          {/* Binding Format Badge */}
          {item.binding && (
            <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-900/80 text-white backdrop-blur-xs">
              {item.binding === 'hardcover'
                ? isBengali ? 'হার্ডকভার' : 'Hardcover'
                : isBengali ? 'পেপারব্যাক' : 'Paperback'}
            </span>
          )}
        </div>

        {/* Title and Author */}
        <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug">
          {displayTitle}
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
          {displayAuthor}
        </p>

        {/* Stock Status Badge */}
        <div className="mt-2">
          {isOutOfStock ? (
            <span className="inline-flex items-center text-[11px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
              {isBengali ? 'স্টক শেষ (Out of Stock)' : 'Out of Stock'}
            </span>
          ) : (
            <span className="inline-flex items-center text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
              {isBengali ? 'স্টকে আছে (In Stock)' : 'In Stock'}
            </span>
          )}
        </div>

        {/* Pricing */}
        <div className="flex items-baseline gap-2 mt-2.5">
          <span className="text-base font-bold text-gray-950 dark:text-white font-mono">
            {formatINR(item.price, language)}
          </span>
          {item.mrp > item.price && (
            <span className="text-xs text-gray-400 line-through font-mono">
              {formatINR(item.mrp, language)}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/80 flex flex-col gap-2">
        <MoveToCartAction
          itemId={item.id}
          itemTitle={item.title}
          itemTitleBn={item.titleBn}
          showDeleteButton={true}
          buttonSize="sm"
          className="w-full justify-between"
        />
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Subcomponent: SavedItemListRow (List Mode)
// -----------------------------------------------------------------------------
interface SavedItemListRowProps {
  item: SavedForLaterItem;
  language: 'bn' | 'en';
  isBengali: boolean;
}

const SavedItemListRow: React.FC<SavedItemListRowProps> = ({ item, language, isBengali }) => {
  const isOutOfStock = item.inStock === false;
  const discountPercent =
    item.mrp > item.price ? Math.round(((item.mrp - item.price) / item.mrp) * 100) : 0;

  const displayTitle = isBengali ? item.titleBn || item.title : item.title;
  const displayAuthor = isBengali && item.authorBn ? item.authorBn : item.author;

  return (
    <div className="py-4 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex gap-3 items-start flex-1 min-w-0">
        {/* Cover Thumbnail */}
        <div className="relative w-16 h-20 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
          {item.coverImage ? (
            <Image
              src={item.coverImage}
              alt={displayTitle}
              fill
              sizes="64px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <BookOpen className="w-6 h-6 text-gray-400 opacity-60" />
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
            {displayTitle}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
            {displayAuthor}
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {isOutOfStock ? (
              <span className="text-[10px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200">
                {isBengali ? 'স্টক শেষ' : 'Out of Stock'}
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200">
                {isBengali ? 'স্টকে আছে' : 'In Stock'}
              </span>
            )}

            {item.binding && (
              <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                {item.binding === 'hardcover'
                  ? isBengali ? 'হার্ডকভার' : 'Hardcover'
                  : isBengali ? 'পেপারব্যাক' : 'Paperback'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Price & Action */}
      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
        <div className="text-left sm:text-right">
          <span className="text-base font-bold text-gray-950 dark:text-white font-mono">
            {formatINR(item.price, language)}
          </span>
          {item.mrp > item.price && (
            <div className="flex items-center gap-1.5 sm:justify-end">
              <span className="text-xs text-gray-400 line-through font-mono">
                {formatINR(item.mrp, language)}
              </span>
              <span className="text-[10px] font-bold text-rose-600">
                ({discountPercent}% {isBengali ? 'ছাড়' : 'off'})
              </span>
            </div>
          )}
        </div>

        <MoveToCartAction
          itemId={item.id}
          itemTitle={item.title}
          itemTitleBn={item.titleBn}
          showDeleteButton={true}
          buttonSize="sm"
        />
      </div>
    </div>
  );
};
