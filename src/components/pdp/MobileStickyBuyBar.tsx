'use client';

import React, { useState } from 'react';
import { ShoppingCart, Zap, Check, Bell } from 'lucide-react';
import { DetailedBookProduct } from '@/types/pdp';
import { formatINR } from '@/lib/utils/currency';
import { useLanguage } from '@/hooks/useLanguage';
import { useCartStore } from '@/hooks/useCartStore';
import { useBuyNow } from '@/hooks/useBuyNow';
import { StockNotifyModal } from './StockNotifyModal';

interface MobileStickyBuyBarProps {
  book: DetailedBookProduct;
  selectedFormat?: 'paperback' | 'hardcover' | 'bundle';
  isUsedSelected?: boolean;
}

export const MobileStickyBuyBar: React.FC<MobileStickyBuyBarProps> = ({
  book,
  selectedFormat = 'paperback',
  isUsedSelected = false,
}) => {
  const { isBengali, language } = useLanguage();
  const { addItem, triggerBounce } = useCartStore();
  const { executeBuyNow, isProcessing: isBuyNowProcessing } = useBuyNow();

  const [isAdded, setIsAdded] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);

  const variant = book.variants?.find((v) => v.format === selectedFormat);
  const currentPrice = isUsedSelected
    ? book.usedBookOption?.price || book.price
    : variant
    ? variant.price
    : book.price;
  const currentMrp = isUsedSelected
    ? book.usedBookOption?.mrp || book.mrp
    : variant
    ? variant.mrp
    : book.mrp;

  const currentStock = isUsedSelected
    ? 1
    : variant
    ? variant.stockQuantity
    : book.stockQuantity ?? (book.inStock ? 8 : 0);

  const isOutOfStock = !book.inStock || currentStock === 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem({
      id: isUsedSelected
        ? `cart-used-${book.bookId}`
        : `cart-${book.bookId}-${selectedFormat}`,
      bookId: book.bookId,
      title: `${book.title}${isUsedSelected ? ' (Used)' : ''}`,
      titleBn: `${book.titleBn}${isUsedSelected ? ' (ব্যবহৃত)' : ''}`,
      author: book.author,
      price: currentPrice,
      mrp: currentMrp,
      quantity: 1,
      coverImage: book.coverImage,
    });
    triggerBounce();
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1600);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    executeBuyNow({
      book,
      quantity: 1,
      format: selectedFormat,
      condition: isUsedSelected ? 'used' : 'new',
      customPrice: currentPrice,
      customMrp: currentMrp,
    });
  };

  return (
    <>
      <aside
        aria-label="মোবাইল পারচেজ অ্যাকশন বার"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-300 p-2.5 sm:px-4 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] flex items-center justify-between gap-3 safe-area-bottom"
      >
        {/* Price & Savings on Left */}
        <div className="shrink-0 leading-tight">
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-black text-[#b12704]">
              {formatINR(currentPrice, language)}
            </span>
            <span className="text-[11px] text-gray-400 line-through">
              {formatINR(currentMrp, language)}
            </span>
          </div>
          <span className={`text-[10px] font-bold block ${isOutOfStock ? 'text-red-600' : 'text-emerald-700'}`}>
            {isOutOfStock
              ? (isBengali ? 'স্টক শেষ' : 'Out of Stock')
              : (isBengali ? 'ইন-স্টক • ফ্রি ডেলিভারি' : 'In Stock • Free Delivery')}
          </span>
        </div>

        {/* Buttons on Right */}
        <div className="flex items-center gap-2 flex-1 max-w-[280px]">
          {isOutOfStock ? (
            <button
              type="button"
              onClick={() => setShowStockModal(true)}
              className="flex-1 py-2 px-3 rounded-lg font-bold text-xs bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{isBengali ? 'হোয়াটসঅ্যাপে জানান' : 'Notify Me'}</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleAddToCart}
                className={`flex-1 py-2 px-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs ${
                  isAdded
                    ? 'bg-green-600 text-white'
                    : 'bg-[#ffd814] active:bg-[#f0b800] text-gray-950 border border-[#fcd200]'
                }`}
              >
                {isAdded ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>{isBengali ? 'যোগ হয়েছে' : 'Added'}</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>{isBengali ? 'কার্ট' : 'Cart'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={isBuyNowProcessing}
                className="flex-1 py-2 px-2.5 rounded-lg font-black text-xs flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs bg-[#ffa41c] active:bg-[#f07c00] text-gray-950 border border-[#e39016]"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>{isBengali ? 'এখনই কিনুন' : 'Buy Now'}</span>
              </button>
            </>
          )}
        </div>
      </aside>

      <StockNotifyModal
        book={book}
        isOpen={showStockModal}
        onClose={() => setShowStockModal(false)}
      />
    </>
  );
};
