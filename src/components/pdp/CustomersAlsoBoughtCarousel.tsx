'use client';

import React, { useRef } from 'react';
import { BundleItem } from '../../types/bundle';
import { ChevronLeft, ChevronRight, Star, ShoppingBag, BookOpen } from 'lucide-react';

export interface CustomersAlsoBoughtCarouselProps {
  items: BundleItem[];
  title?: string;
  titleBn?: string;
  onAddToCart?: (item: BundleItem) => void;
  locale?: 'en' | 'bn';
}

export const CustomersAlsoBoughtCarousel: React.FC<CustomersAlsoBoughtCarouselProps> = ({
  items,
  title = 'Customers who bought this item also bought',
  titleBn = 'ক্রেতারা এই বইটির সাথে আরও যা কিনেছেন',
  onAddToCart,
  locale = 'bn',
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const isBn = locale === 'bn';

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm my-8">
      {/* Header with Nav Arrows */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-slate-900">
            {isBn ? titleBn : title}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isBn
              ? 'অন্যান্য পাঠকদের পছন্দের সর্বাধিক বিক্রিত বই'
              : 'Popular related titles purchased by other readers'}
          </p>
        </div>

        {/* Desktop Carousel Scroll Arrows */}
        <div className="hidden sm:flex items-center gap-1.5">
          <button
            onClick={() => scroll('left')}
            className="p-1.5 rounded-full border border-slate-300 hover:bg-slate-100 text-slate-700 transition active:scale-95"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-1.5 rounded-full border border-slate-300 hover:bg-slate-100 text-slate-700 transition active:scale-95"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Scroll Container (Items 35, 48) */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent snap-x snap-mandatory"
        style={{ scrollbarWidth: 'thin' }}
      >
        {items.map((book) => {
          const discountPercent = Math.round(
            ((book.unit_mrp - book.unit_selling_price) / book.unit_mrp) * 100
          );

          return (
            <div
              key={book.product_id}
              className="min-w-[160px] sm:min-w-[190px] max-w-[190px] snap-start bg-slate-50/60 hover:bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-between transition-all duration-200 hover:shadow-md group"
            >
              {/* Cover Image & SEO Link (Item 48) */}
              <a
                href={`/books/${book.product_id}`}
                className="block relative overflow-hidden rounded-lg bg-white border border-slate-100 aspect-[3/4] mb-2.5"
                title={`${book.title} - M.M. Book House`}
              >
                <img
                  src={book.cover_image_url}
                  alt={book.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  loading="lazy"
                />
                {discountPercent > 0 && (
                  <span className="absolute top-1.5 left-1.5 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                    {discountPercent}% {isBn ? 'ছাড়' : 'OFF'}
                  </span>
                )}
              </a>

              {/* Title & Details */}
              <div className="flex-1">
                <a
                  href={`/books/${book.product_id}`}
                  className="text-xs font-bold text-slate-900 hover:text-blue-600 line-clamp-2 leading-snug transition-colors"
                  title={book.title}
                >
                  {book.title}
                </a>

                {book.title_bn && (
                  <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                    {book.title_bn}
                  </p>
                )}

                {book.author && (
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    {book.author}
                  </p>
                )}

                {/* Rating */}
                <div className="flex items-center gap-1 mt-1.5">
                  <div className="flex text-amber-400">
                    <Star className="w-3 h-3 fill-amber-400" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-700">
                    {book.rating || '4.8'}
                  </span>
                  {book.total_reviews && (
                    <span className="text-[9px] text-slate-400">
                      ({book.total_reviews})
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1.5 mt-2">
                  <span className="text-sm font-black text-slate-900 font-mono">
                    ₹{book.unit_selling_price.toFixed(0)}
                  </span>
                  {book.unit_mrp > book.unit_selling_price && (
                    <span className="text-[10px] text-slate-400 line-through font-mono">
                      ₹{book.unit_mrp.toFixed(0)}
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Add To Cart Button */}
              {onAddToCart && (
                <button
                  onClick={() => onAddToCart(book)}
                  className="mt-3 w-full py-1.5 px-2 bg-white hover:bg-blue-600 text-slate-700 hover:text-white border border-slate-300 hover:border-blue-600 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm active:scale-95"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  {isBn ? 'ব্যাগে যোগ করুন' : 'Add to Cart'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
