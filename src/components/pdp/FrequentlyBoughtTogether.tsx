'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Plus, Check, ShoppingCart, Sparkles } from 'lucide-react';
import { DetailedBookProduct } from '@/types/pdp';
import { formatINR, toBengaliNumerals } from '@/lib/utils/currency';
import { useLanguage } from '@/hooks/useLanguage';
import { useCartStore } from '@/hooks/useCartStore';

interface CompanionItem {
  id: string;
  bookId: string;
  title: string;
  titleBn: string;
  price: number;
  mrp: number;
  coverImage?: string;
  slug: string;
  author?: string;
}

interface FrequentlyBoughtTogetherProps {
  currentBook: DetailedBookProduct;
  className?: string;
}

import { DETAILED_BOOKS_CATALOG } from '@/lib/data/pdpCatalog';

const STATIC_FALLBACK_COMPANIONS: CompanionItem[] = [
  {
    id: 'comp-1',
    bookId: 'book-wbcs-scanner-2026',
    title: 'WBCS Scanner Prelims & Mains Solved Papers 2026',
    titleBn: 'WBCS স্ক্যানার প্রিলিমিনারি ও মেইনস সলভড পেপারস (২০২৬)',
    price: 455,
    mrp: 650,
    coverImage: '/images/books/wbcs-scanner.webp',
    slug: 'wbcs-scanner-prelims-mains-solved-papers-2026',
  },
  {
    id: 'comp-2',
    bookId: 'book-wbcs-current-affairs-2026',
    title: 'WBCS Prelims Current Affairs & West Bengal Yearbook 2026',
    titleBn: '২০২৬ WBCS প্রিলিমস কারেন্ট অ্যাফেয়ার্স ও পশ্চিমবঙ্গ ইয়ারবুক',
    price: 240,
    mrp: 320,
    coverImage: '/images/books/wbcs-scanner.webp',
    slug: 'wbcs-current-affairs-yearbook-2026',
  },
];

export const FrequentlyBoughtTogether: React.FC<FrequentlyBoughtTogetherProps> = ({
  currentBook,
  className = '',
}) => {
  const { isBengali, language } = useLanguage();
  const { addItem, triggerBounce } = useCartStore();

  const primaryItem: CompanionItem = {
    id: currentBook.id,
    bookId: currentBook.bookId,
    title: currentBook.title,
    titleBn: currentBook.titleBn,
    price: currentBook.price,
    mrp: currentBook.mrp,
    coverImage: currentBook.coverImage || '/images/books/wbcs-manual.webp',
    slug: currentBook.slug,
  };

  // Dynamically resolve relevant companions from the catalog
  const catalogCompanions: CompanionItem[] = React.useMemo(() => {
    const currentId = currentBook.bookId || currentBook.id;
    const sameCatOrAuthor = DETAILED_BOOKS_CATALOG.filter(
      (b) =>
        b.bookId !== currentId &&
        b.id !== currentId &&
        (b.category === currentBook.category || b.author === currentBook.author)
    );

    const pool = sameCatOrAuthor.length >= 2
      ? sameCatOrAuthor
      : [
          ...sameCatOrAuthor,
          ...DETAILED_BOOKS_CATALOG.filter(
            (b) => b.bookId !== currentId && b.id !== currentId && !sameCatOrAuthor.includes(b)
          ),
        ];

    const chosen = pool.slice(0, 2).map((b) => ({
      id: b.id,
      bookId: b.bookId,
      title: b.title,
      titleBn: b.titleBn,
      price: b.price,
      mrp: b.mrp,
      coverImage: b.coverImage || '/images/books/wbcs-manual.webp',
      slug: b.slug,
      author: b.author,
    }));

    return chosen.length > 0 ? chosen : STATIC_FALLBACK_COMPANIONS.filter((c) => c.bookId !== currentId);
  }, [currentBook]);

  const validCompanions = catalogCompanions.slice(0, 2);
  const allItems = [primaryItem, ...validCompanions];

  const [selectedIds, setSelectedIds] = useState<string[]>(
    allItems.map((i) => i.id)
  );

  React.useEffect(() => {
    setSelectedIds(allItems.map((i) => i.id));
  }, [currentBook.bookId, currentBook.id]);

  const [isAdded, setIsAdded] = useState(false);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.length > 1
          ? prev.filter((item) => item !== id)
          : prev
        : [...prev, id]
    );
  };

  const selectedItems = allItems.filter((item) => selectedIds.includes(item.id));
  const totalPrice = selectedItems.reduce((acc, curr) => acc + curr.price, 0);
  const totalMrp = selectedItems.reduce((acc, curr) => acc + curr.mrp, 0);
  const totalSavings = Math.max(0, totalMrp - totalPrice);

  const handleAddAllToCart = () => {
    selectedItems.forEach((item) => {
      addItem({
        id: `cart-${item.bookId}`,
        bookId: item.bookId,
        title: item.title,
        titleBn: item.titleBn,
        author: item.author || currentBook.author || 'M.M Book House',
        price: item.price,
        mrp: item.mrp,
        quantity: 1,
        coverImage: item.coverImage,
      });
    });

    triggerBounce();
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  if (validCompanions.length === 0) return null;

  return (
    <section
      id="frequently-bought-together"
      aria-label="প্রায়শই একসাথে কেনা কম্বো বান্ডেল"
      className={`bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 md:p-8 shadow-xs ${className}`}
    >
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
        <Sparkles className="w-5 h-5 text-amber-600" />
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">
          {isBengali
            ? 'প্রায়শই একসাথে কেনা হয় (সুপার সেভার কম্বো)'
            : 'Frequently Bought Together'}
        </h2>
      </div>

      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-6">
        {/* Book Covers Row with Plus Signs */}
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-center">
          {allItems.map((item, idx) => {
            const isSelected = selectedIds.includes(item.id);

            return (
              <React.Fragment key={item.id}>
                {idx > 0 && (
                  <span className="text-gray-400 font-black text-lg sm:text-xl shrink-0">
                    +
                  </span>
                )}

                <div
                  onClick={() => toggleSelection(item.id)}
                  className={`relative p-2 rounded-xl border-2 transition-all cursor-pointer bg-amber-50/20 text-center w-24 sm:w-28 ${
                    isSelected
                      ? 'border-amber-500 shadow-2xs'
                      : 'border-gray-200 opacity-40 grayscale'
                  }`}
                >
                  <div className="relative w-full h-32 sm:h-36 mb-1.5">
                    <Image
                      src={item.coverImage || '/images/books/wbcs-manual.webp'}
                      alt={item.title}
                      fill
                      sizes="112px"
                      className="object-contain p-1"
                    />
                  </div>

                  <span className="text-[10px] font-bold text-gray-900 block truncate">
                    {isBengali ? item.titleBn : item.title}
                  </span>

                  <span className="text-xs font-black text-[#b12704] block mt-0.5">
                    {formatINR(item.price, language)}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Combo Total & Add Action Box */}
        <div className="w-full lg:w-72 bg-gradient-to-br from-amber-50/60 to-orange-50/50 p-4 rounded-xl border border-amber-200 space-y-3 shrink-0">
          <div>
            <span className="text-xs text-gray-600 font-medium">
              {isBengali
                ? `নির্বাচিত ${toBengaliNumerals(selectedItems.length)}টি বইয়ের মোট মূল্য:`
                : `Total for ${selectedItems.length} selected books:`}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-[#b12704]">
                {formatINR(totalPrice, language)}
              </span>
              <span className="text-xs text-gray-400 line-through">
                {formatINR(totalMrp, language)}
              </span>
            </div>
            {totalSavings > 0 && (
              <p className="text-xs font-bold text-emerald-800 mt-0.5">
                {isBengali
                  ? `একসাথে কিনে সাশ্রয়: ${formatINR(totalSavings, language)}`
                  : `Combo Savings: ${formatINR(totalSavings, language)}`}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleAddAllToCart}
            className={`w-full py-2.5 px-3 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
              isAdded
                ? 'bg-green-600 text-white'
                : 'bg-[#ffd814] hover:bg-[#f7ca00] active:bg-[#f0b800] text-gray-950 border border-[#fcd200]'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{isBengali ? 'কার্টে যুক্ত হয়েছে!' : 'Added to Cart!'}</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span>
                  {isBengali
                    ? `সবগুলো (${toBengaliNumerals(selectedItems.length)}) কার্টে যোগ করুন`
                    : `Add all ${selectedItems.length} to Cart`}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Checkboxes List */}
      <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5 text-xs text-gray-700">
        {allItems.map((item, idx) => {
          const isSelected = selectedIds.includes(item.id);
          return (
            <label
              key={item.id}
              className="flex items-center gap-2 cursor-pointer hover:text-amber-800"
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleSelection(item.id)}
                className="w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500 cursor-pointer"
              />
              <span className="font-semibold text-gray-900">
                {idx === 0
                  ? (isBengali ? 'এই বইটি: ' : 'This item: ')
                  : ''}
                {isBengali ? item.titleBn : item.title}
              </span>
              <span className="text-gray-400">—</span>
              <span className="font-bold text-[#b12704]">
                {formatINR(item.price, language)}
              </span>
            </label>
          );
        })}
      </div>
    </section>
  );
};
