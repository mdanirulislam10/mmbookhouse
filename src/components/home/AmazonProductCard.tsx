'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CarouselProduct } from '@/types/carousel';
import { useCart } from '@/hooks/useCartStore';
import { useBrowsingHistory } from '@/hooks/useBrowsingHistory';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { getAdaptiveImageUrl } from '@/lib/utils/adaptiveImage';
import { getActiveDealForBook } from '@/lib/data/flashDeals';
import { AmazonDealBadge } from '@/components/deals/AmazonDealBadge';
import { AmazonRibbonBadge } from './AmazonRibbonBadge';
import { formatINR, toBengaliNumerals } from '@/lib/utils/currency';
import {
  Star,
  ShoppingCart,
  Check,
  Eye,
  Sparkles
} from 'lucide-react';

interface AmazonProductCardProps {
  product: CarouselProduct;
  onQuickView: (product: CarouselProduct) => void;
  className?: string;
}

export function AmazonProductCard({
  product,
  onQuickView,
  className = '',
}: AmazonProductCardProps) {
  const { addItem, triggerBounce } = useCart();
  const { recordView } = useBrowsingHistory();
  const { isSlowConnection, saveData } = useNetworkStatus();
  const [isAdded, setIsAdded] = useState(false);

  // Audit Point 4: Synchronize live deal pricing and badges with Deal of the Day engine
  const activeDeal = getActiveDealForBook(product.bookId);
  const isDealActive = !!activeDeal;
  const currentPrice = isDealActive ? activeDeal.dealPrice : product.price;
  const currentMrp = isDealActive ? activeDeal.mrp : product.mrp;
  const currentDiscount = isDealActive ? activeDeal.discountPercentage : product.discountPercent;
  const maxAllowedQty = isDealActive ? 1 : undefined;

  // Task 34: 1-Click "Add to Cart" Quick Action
  const handleQuickAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    addItem({
      id: `cart-${product.bookId}`,
      bookId: product.bookId,
      title: product.title,
      titleBn: product.titleBn,
      author: product.authorBn || product.author,
      price: currentPrice,
      mrp: currentMrp,
      quantity: 1,
      maxQuantity: maxAllowedQty,
      coverImage: product.coverImage,
    });

    recordView(product.bookId, product.category);
    triggerBounce();
    setIsAdded(true);

    setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  // Audit Point 2: Open quick view on thumbnail click (desktop + mobile)
  const handleOpenQuickView = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    recordView(product.bookId, product.category);
    onQuickView(product);
  };

  return (
    <article
      className={`group relative flex flex-col justify-between bg-white rounded-xl border border-gray-200/90 hover:border-amber-400/80 p-3 sm:p-3.5 shadow-xs hover:shadow-md transition-all duration-200 ${className}`}
    >
      {/* Top Part: Cover, Badges, Title, Ratings & Prices */}
      <div className="space-y-2.5">
        {/* Point 1: Book Cover Thumbnail with Quick View Trigger (Audit Point 2) */}
        <div
          onClick={handleOpenQuickView}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleOpenQuickView(e as unknown as React.MouseEvent);
            }
          }}
          aria-label={`${product.titleBn} এর কুইক প্রিভিউ খুলুন`}
          className="relative aspect-[3/4] w-full rounded-lg overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center cursor-pointer select-none focus:outline-hidden focus:ring-2 focus:ring-amber-500"
        >
          <Image
            src={getAdaptiveImageUrl(product.coverImage, { width: 240, isSlowConnection, saveData })}
            alt={product.titleBn}
            fill
            sizes="(max-width: 640px) 180px, (max-width: 1024px) 220px, 240px"
            className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
          />

          {/* Audit Point 4 & Task 36: Deal Badge OR Amazon #1 Best Seller Signature Folded Ribbon */}
          {isDealActive ? (
            <div className="absolute top-2 left-2 z-10">
              <AmazonDealBadge
                discountPercentage={activeDeal.discountPercentage}
                dealType={activeDeal.dealType}
                isExpired={false}
              />
            </div>
          ) : (
            product.badgeBn && (
              <div className="absolute top-0 left-0 z-10">
                <AmazonRibbonBadge
                  variant={
                    product.badgeBn.includes('বেস্টসেলার') || product.badge === '#1 Best Seller'
                      ? 'bestseller'
                      : product.badgeBn.includes('মালদা')
                      ? 'local_popular'
                      : 'top_choice'
                  }
                  textBn={product.badgeBn}
                  textEn={product.badge}
                />
              </div>
            )
          )}

          {/* Discount Percentage Badge when not in deal mode */}
          {!isDealActive && product.discountPercent > 0 && (
            <div className="absolute top-2 right-2 z-10 bg-[#cc0c39] text-white font-extrabold text-[10px] px-1.5 py-0.5 rounded shadow-xs">
              -{toBengaliNumerals(product.discountPercent)}%
            </div>
          )}

          {/* Task 35 Trigger: Quick View Pill (visible on hover on desktop, accessible on mobile) */}
          <button
            onClick={handleOpenQuickView}
            aria-label={`${product.titleBn} এর দ্রুত বিবরণী দেখুন`}
            className="absolute inset-x-2.5 bottom-2 z-10 py-1.5 px-2 rounded-full bg-white/95 hover:bg-white text-gray-900 font-bold text-[10px] sm:text-[11px] shadow-md border border-gray-200/90 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 max-sm:opacity-95 transition-all duration-200 transform translate-y-1 group-hover:translate-y-0 backdrop-blur-xs"
          >
            <Eye className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <span>এক নজরে দেখুন</span>
          </button>
        </div>

        {/* Point 2: Book Title (2-line clamp) */}
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-gray-900 font-bengali line-clamp-2 leading-snug group-hover:text-amber-800 transition-colors min-h-[2.4rem]">
            <Link
              href={`/search?query=${encodeURIComponent(product.titleBn)}`}
              title={product.titleBn}
              className="hover:underline"
            >
              {product.titleBn}
            </Link>
          </h3>

          {/* Point 3: Author & Publisher */}
          <p className="text-[11px] text-gray-500 font-bengali line-clamp-1 mt-0.5" title={`${product.authorBn} • ${product.publisherBn}`}>
            {product.authorBn} • <span className="text-gray-400">{product.publisherBn}</span>
          </p>
        </div>

        {/* Point 4: Star Rating & Review Count */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <div className="flex items-center text-amber-500">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${
                  i < Math.floor(product.rating)
                    ? 'fill-current text-amber-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-[11px] font-bold text-gray-800 font-mono">
            {toBengaliNumerals(product.rating)}
          </span>
          <span className="text-[10px] text-gray-500">
            ({toBengaliNumerals(product.reviewsCount)})
          </span>
        </div>

        {/* Point 5 & 6: Selling Price & Strikethrough MRP with Discount */}
        <div className="space-y-0.5 pt-1 border-t border-gray-100">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base sm:text-lg font-black text-gray-950 font-sans tracking-tight">
              {formatINR(currentPrice)}
            </span>
            {currentMrp > currentPrice && (
              <span className="text-[11px] text-gray-400 line-through">
                {formatINR(currentMrp)}
              </span>
            )}
          </div>
          {currentMrp > currentPrice && (
            <div className="text-[10px] font-bold text-[#cc0c39]">
              {isDealActive ? '🔥 লিমিটেড টাইম ডিল প্রাইস' : `${toBengaliNumerals(currentDiscount)}% ছাড়ের অফার`}
            </div>
          )}
        </div>
      </div>

      {/* Task 34: 1-Click "Add to Cart" Quick Action Button */}
      <div className="pt-3 mt-2">
        <button
          onClick={handleQuickAddToCart}
          className={`w-full py-1.5 px-3 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-[0.98] ${
            isAdded
              ? 'bg-emerald-600 text-white border border-emerald-700 animate-pulse'
              : 'bg-[#ffd814] hover:bg-[#f7ca00] active:bg-[#f0b800] text-gray-950 border border-[#fcd200]'
          }`}
          aria-label={`${product.titleBn} কার্টে যোগ করুন`}
        >
          {isAdded ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>যোগ হয়েছে ✓</span>
            </>
          ) : (
            <>
              <ShoppingCart className="w-3.5 h-3.5 text-gray-900" />
              <span>কার্টে যোগ করুন</span>
            </>
          )}
        </button>
      </div>
    </article>
  );
}
