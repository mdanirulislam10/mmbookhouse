'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Star, ShoppingCart, Check } from 'lucide-react';
import { DetailedBookProduct } from '@/types/pdp';
import { BookProduct } from '@/types/catalog-filter';
import { formatINR } from '@/lib/utils/currency';
import { useLanguage } from '@/hooks/useLanguage';
import { useCartStore } from '@/hooks/useCartStore';
import { DETAILED_BOOKS_CATALOG } from '@/lib/data/pdpCatalog';

interface RelatedProductsCarouselProps {
  currentBook: DetailedBookProduct | BookProduct;
  relatedBooks?: (DetailedBookProduct | BookProduct)[];
  title?: string;
  titleBn?: string;
  className?: string;
}

export const RelatedProductsCarousel: React.FC<RelatedProductsCarouselProps> = ({
  currentBook,
  relatedBooks: propRelatedBooks,
  title,
  titleBn,
  className = '',
}) => {
  const { isBengali, language } = useLanguage();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const addItem = useCartStore((state) => state.addItem);
  const [addedMap, setAddedMap] = useState<Record<string, boolean>>({});

  // 1. Resolve related books (Algorithmic filtering by category / cross-sell)
  const items: (DetailedBookProduct | BookProduct)[] = React.useMemo(() => {
    if (propRelatedBooks && propRelatedBooks.length > 0) {
      return propRelatedBooks;
    }

    const currentId = currentBook.bookId || currentBook.id;
    const sameCat = DETAILED_BOOKS_CATALOG.filter(
      (b) =>
        (b.bookId !== currentId && b.id !== currentId) &&
        (b.category === currentBook.category || b.author === currentBook.author)
    );

    const others = DETAILED_BOOKS_CATALOG.filter(
      (b) =>
        b.bookId !== currentId &&
        b.id !== currentId &&
        !sameCat.some((sc) => (sc.bookId || sc.id) === (b.bookId || b.id))
    );

    return [...sameCat, ...others];
  }, [currentBook, propRelatedBooks]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleQuickAdd = (book: DetailedBookProduct | BookProduct, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const bookId = book.bookId || book.id;
    addItem({
      id: `cart-related-${bookId}`,
      bookId,
      title: book.title,
      titleBn: book.titleBn,
      author: book.author,
      price: book.price,
      mrp: book.mrp,
      quantity: 1,
      coverImage: book.coverImage,
    });

    setAddedMap((prev) => ({ ...prev, [bookId]: true }));
    setTimeout(() => {
      setAddedMap((prev) => ({ ...prev, [bookId]: false }));
    }, 1500);
  };

  if (items.length === 0) return null;

  return (
    <section
      aria-labelledby="related-products-heading"
      className={`bg-white border border-neutral-200/80 rounded-2xl p-4 sm:p-6 shadow-xs font-sans ${className}`}
    >
      {/* Section Header with Left/Right Arrows */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3
            id="related-products-heading"
            className="text-base sm:text-lg font-bold text-neutral-900 leading-tight"
          >
            {isBengali
              ? titleBn || 'এই বইটি কেনা ছাত্রছাত্রীরা আরও যা কিনেছেন'
              : title || 'Customers who bought this item also bought'}
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            {isBengali
              ? 'পশ্চিমবঙ্গ সিভিল সার্ভিস ও প্রতিযোগিতামূলক পরীক্ষার অন্যান্য প্রয়োজনীয় বই'
              : 'Related books and top recommendations for this exam syllabus'}
          </p>
        </div>

        {/* Carousel Navigation Buttons */}
        <div className="hidden sm:flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleScroll('left')}
            className="p-2 rounded-full border border-neutral-300 hover:bg-neutral-100 active:bg-neutral-200 text-neutral-700 transition-colors focus:outline-none"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleScroll('right')}
            className="p-2 rounded-full border border-neutral-300 hover:bg-neutral-100 active:bg-neutral-200 text-neutral-700 transition-colors focus:outline-none"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Scrolling Shelf */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scroll-smooth scrollbar-none snap-x snap-mandatory pb-2 pt-1 -mx-1 px-1"
      >
        {items.map((book) => {
          const bookId = book.bookId || book.id;
          const isAdded = Boolean(addedMap[bookId]);
          const discountPercent =
            book.mrp > book.price ? Math.round(((book.mrp - book.price) / book.mrp) * 100) : 0;

          // Target URL (Canonical PDP route)
          const targetUrl = book.slug
            ? `/book/${book.slug}`
            : `/book/${bookId}`;

          return (
            <div
              key={bookId}
              className="flex-none w-44 sm:w-52 snap-start bg-neutral-50/50 hover:bg-white rounded-xl border border-neutral-200/80 hover:border-neutral-300 hover:shadow-md transition-all duration-200 p-3 flex flex-col justify-between group"
            >
              <div>
                {/* Book Cover Container */}
                <Link href={targetUrl} className="block relative mb-2.5">
                  <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden bg-neutral-200 shadow-xs">
                    {book.coverImage ? (
                      <img
                        src={book.coverImage}
                        alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">
                        Book
                      </div>
                    )}

                    {/* Discount badge */}
                    {discountPercent > 0 && (
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded shadow-2xs">
                        -{discountPercent}%
                      </span>
                    )}
                  </div>
                </Link>

                {/* Title & Author */}
                <Link href={targetUrl} className="block group-hover:text-amber-700 transition-colors">
                  <h4 className="text-xs sm:text-sm font-semibold text-neutral-900 line-clamp-2 leading-snug">
                    {isBengali ? book.titleBn || book.title : book.title}
                  </h4>
                </Link>
                <p className="text-[11px] text-neutral-500 truncate mt-0.5">{book.author}</p>

                {/* Rating */}
                <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  <span className="font-bold text-neutral-800 text-[11px]">{book.rating || 4.8}</span>
                  <span className="text-[10px] text-neutral-400">({book.reviewsCount || 42})</span>
                </div>
              </div>

              {/* Price & Quick Add Button */}
              <div className="mt-3 pt-2 border-t border-neutral-100">
                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className="text-sm font-bold text-neutral-900">
                    {formatINR(book.price, language)}
                  </span>
                  {book.mrp > book.price && (
                    <span className="text-[11px] text-neutral-400 line-through">
                      {formatINR(book.mrp, language)}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={(e) => handleQuickAdd(book, e)}
                  className="w-full py-1.5 px-2 rounded-md text-[11px] font-medium bg-[#ffd814] hover:bg-[#f7ca00] active:bg-[#f0b800] text-neutral-900 shadow-2xs transition-all flex items-center justify-center gap-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {isAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-800" />
                      <span className="font-semibold text-emerald-950">
                        {isBengali ? 'যোগ হলো' : 'Added'}
                      </span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-3 h-3 text-neutral-800" />
                      <span>{isBengali ? 'কার্টে যোগ' : 'Add to Cart'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default RelatedProductsCarousel;
