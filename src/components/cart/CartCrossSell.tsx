'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, BookOpen, Star, Sparkles } from 'lucide-react';
import { BOOKS_CATALOG } from '@/lib/data/booksCatalog';
import { useCart, useCartActions } from '@/hooks/useCartStore';
import { useLanguage } from '@/hooks/useLanguage';
import { formatINR, toBengaliNumerals } from '@/lib/utils/currency';

interface CartCrossSellProps {
  className?: string;
}

export const CartCrossSell: React.FC<CartCrossSellProps> = ({ className = '' }) => {
  const { items } = useCart();
  const { addItem } = useCartActions();
  const { language, isBengali } = useLanguage();

  const cartBookIds = new Set(items.map((i) => i.bookId));

  // Find 4 relevant books not currently in cart
  const crossSellBooks = BOOKS_CATALOG.filter(
    (book) => !cartBookIds.has(book.bookId) && !cartBookIds.has(book.id)
  ).slice(0, 4);

  if (crossSellBooks.length === 0) return null;

  return (
    <section
      aria-label={
        isBengali
          ? 'আপনার কার্টের বইগুলোর সাথে পাঠকেরা আরও যা কিনেছেন'
          : 'Customers who bought items in your cart also bought'
      }
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 ${className}`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h3 className="text-base sm:text-lg font-bold text-gray-900">
            {isBengali
              ? 'আপনার কার্টের বইগুলোর সাথে পাঠকেরা আরও যা কিনেছেন'
              : 'Customers who bought items in your cart also bought'}
          </h3>
        </div>
        <span className="text-xs text-gray-500 hidden sm:inline">
          {isBengali ? 'জনপ্রিয় সুপারিশ' : 'Recommended'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {crossSellBooks.map((book) => {
          const title = isBengali ? book.titleBn || book.title : book.title;
          const author = isBengali ? book.authorBn || book.author : book.author;
          const hasSavings = book.mrp > book.price;
          const discountPercent = hasSavings
            ? Math.round(((book.mrp - book.price) / book.mrp) * 100)
            : 0;

          return (
            <div
              key={book.id}
              className="flex flex-col justify-between p-3 rounded-lg border border-gray-100 hover:border-amber-300 hover:shadow-xs transition-all bg-gray-50/40 group"
            >
              <div>
                <Link
                  href={`/book/${book.slug || book.bookId}`}
                  className="block relative w-full h-36 bg-amber-50/60 rounded overflow-hidden mb-2.5 border border-amber-100/80"
                >
                  {book.coverImage ? (
                    <Image
                      src={book.coverImage}
                      alt={title}
                      fill
                      sizes="(max-width: 640px) 100vw, 200px"
                      className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-amber-700">
                      <BookOpen className="w-8 h-8 opacity-60" />
                    </div>
                  )}
                </Link>

                <Link
                  href={`/book/${book.slug || book.bookId}`}
                  className="block group-hover:text-amber-800 transition-colors"
                >
                  <h4 className="text-xs font-bold text-gray-900 line-clamp-2 leading-tight">
                    {title}
                  </h4>
                  <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                    {author}
                  </p>
                </Link>

                <div className="mt-1.5 flex items-center gap-1 text-[11px] text-amber-600 font-medium">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{book.rating || 4.8}</span>
                </div>

                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-sm font-bold text-gray-950 font-mono">
                    {formatINR(book.price, language)}
                  </span>
                  {hasSavings && (
                    <>
                      <span className="text-[11px] text-gray-400 line-through font-mono">
                        {formatINR(book.mrp, language)}
                      </span>
                      <span className="text-[10px] font-bold text-red-700 bg-red-50 px-1 rounded">
                        -{discountPercent}%
                      </span>
                    </>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  addItem({
                    id: `cart-${book.bookId}-${Date.now().toString(36)}`,
                    bookId: book.bookId,
                    title: book.title,
                    titleBn: book.titleBn,
                    author: book.author,
                    price: book.price,
                    mrp: book.mrp,
                    coverImage: book.coverImage,
                    quantity: 1,
                  })
                }
                className="mt-3 w-full py-1.5 px-2 bg-[#ffd814] hover:bg-[#f7ca00] active:bg-[#f0b800] text-gray-950 text-xs font-bold rounded-md border border-[#fcd200] shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>{isBengali ? 'কার্টে যোগ করুন' : 'Add to Cart'}</span>
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default CartCrossSell;
