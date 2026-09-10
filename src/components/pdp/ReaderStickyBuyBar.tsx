'use client';

import React from 'react';
import { formatINR, toBengaliNumerals } from '@/lib/utils/currency';
import { useLanguage } from '@/hooks/useLanguage';
import { ShoppingCart, Zap, X, Maximize2, Minimize2, CheckCircle2 } from 'lucide-react';
import { DetailedBookProduct } from '@/types/pdp';
import { useCartStore } from '@/hooks/useCartStore';
import { useBuyNow } from '@/hooks/useBuyNow';

interface ReaderStickyBuyBarProps {
  book: Partial<DetailedBookProduct>;
  onBuyNow?: () => void;
  onAddToCart?: () => void;
  onClose: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  className?: string;
}

/**
 * Task 17: In-Reader Sticky Purchase Bar
 * Positioned permanently at the top of the Look Inside reader modal.
 * Readers inspecting sample pages can immediately order or add to cart
 * without losing their reading context.
 */
export const ReaderStickyBuyBar: React.FC<ReaderStickyBuyBarProps> = ({
  book,
  onBuyNow,
  onAddToCart,
  onClose,
  isFullscreen = false,
  onToggleFullscreen,
  className = '',
}) => {
  const { isBengali, language } = useLanguage();

  const price = book.price || 380;
  const mrp = book.mrp || 500;
  const discount =
    book.discount ||
    (mrp > price ? `${Math.round(((mrp - price) / mrp) * 100)}%` : '');
  const inStock = book.inStock ?? true;
  const stockCount = book.inStoreMaldaStock || book.stockQuantity || 4;

  const { addItem, triggerBounce } = useCartStore();
  const { executeBuyNow } = useBuyNow();

  const handleBuyNow = () => {
    if (onBuyNow) {
      onBuyNow();
    } else {
      executeBuyNow({
        book: book as DetailedBookProduct,
        quantity: 1,
        customPrice: price,
        customMrp: mrp,
      });
    }
  };

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart();
    } else {
      const bookId = book.bookId || book.id || 'preview-book';
      addItem({
        id: `cart-${bookId}`,
        bookId: String(bookId),
        title: String(book.title || 'Book'),
        titleBn: String(book.titleBn || book.title || 'বই'),
        author: String(book.author || 'Author'),
        price: Number(price),
        mrp: Number(mrp),
        quantity: 1,
        coverImage: book.coverImage || undefined,
      });
      triggerBounce();
    }
  };

  return (
    <header
      className={`sticky top-0 left-0 right-0 z-40 bg-neutral-900/95 backdrop-blur-md text-white border-b border-neutral-800 px-3 sm:px-5 py-2.5 shadow-md flex items-center justify-between gap-3 font-sans ${className}`}
      aria-label="Look Inside Reader Header & Purchase Bar"
    >
      {/* Left: Book Meta Preview */}
      <div className="flex items-center gap-3 min-w-0 max-w-[40%] sm:max-w-[45%]">
        <div className="hidden sm:block text-xs uppercase font-bold tracking-widest text-[#febd69] shrink-0 font-bengali">
          🔍 {isBengali ? 'ভেতরের পাতা' : 'Look Inside'}
        </div>
        <div className="min-w-0">
          <h2
            className="text-xs sm:text-sm font-semibold truncate text-neutral-100"
            title={book.title || ''}
          >
            {isBengali && book.titleBn ? book.titleBn : book.title || 'বইয়ের প্রিভিউ'}
          </h2>
          <div className="hidden md:flex items-center gap-2 text-[11px] text-neutral-400 font-bengali">
            <span>{book.authorBn || book.author || 'M.M Research'}</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              {inStock
                ? isBengali
                  ? `মালদা স্টোরে মজুত (${toBengaliNumerals(stockCount)} কপি)`
                  : `In Stock (${stockCount} copies)`
                : isBengali
                ? 'আউট অব স্টক'
                : 'Out of stock'}
            </span>
          </div>
        </div>
      </div>

      {/* Center/Right: Pricing & Instant Purchase Buttons */}
      <div className="flex items-center gap-2 sm:gap-3 ml-auto">
        {/* Price & Savings Pill */}
        <div className="text-right shrink-0">
          <div className="flex items-baseline justify-end gap-1.5">
            <span className="text-sm sm:text-base font-extrabold text-[#febd69] font-bengali">
              {formatINR(price, language)}
            </span>
            {mrp > price && (
              <span className="hidden sm:inline text-[11px] text-neutral-400 line-through font-bengali">
                {formatINR(mrp, language)}
              </span>
            )}
          </div>
          {discount && (
            <div className="hidden sm:block text-[10px] font-bold text-red-400 font-bengali">
              {discount} {isBengali ? 'ছাড়' : 'OFF'}
            </div>
          )}
        </div>

        {/* Add to Cart button (visible on larger screens) */}
        <button
          type="button"
          onClick={handleAddToCart}
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#ffd814] hover:bg-[#f7ca00] active:bg-[#f0b800] text-neutral-950 text-xs font-semibold rounded-full transition-colors shadow-xs"
          title={isBengali ? 'কার্টে যোগ করুন' : 'Add to Cart'}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>{isBengali ? 'কার্ট' : 'Cart'}</span>
        </button>

        {/* Instant Buy Now Button (Signature Amazon Orange Button) */}
        <button
          type="button"
          onClick={handleBuyNow}
          className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 bg-[#ffa41c] hover:bg-[#f08804] active:bg-[#e47911] text-neutral-950 text-xs sm:text-sm font-bold rounded-full transition-transform active:scale-95 shadow-md hover:shadow-lg font-bengali"
          title={isBengali ? 'এখনই কিনুন' : 'Buy Now'}
        >
          <Zap className="w-3.5 h-3.5 fill-current shrink-0" />
          <span>{isBengali ? 'এখনই কিনুন' : 'Buy Now'}</span>
        </button>

        {/* Fullscreen Toggle Button */}
        {onToggleFullscreen && (
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors"
            title={isFullscreen ? 'ফুলস্ক্রিন থেকে বের হন' : 'ফুলস্ক্রিন রিডার মোড'}
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors"
          title={isBengali ? 'রিডার বন্ধ করুন' : 'Close reader'}
          aria-label="Close Look Inside Modal"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
