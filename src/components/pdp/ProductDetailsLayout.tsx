'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DetailedBookProduct } from '@/types/pdp';
import { useLanguage } from '@/hooks/useLanguage';
import { formatINR, toBengaliNumerals } from '@/lib/utils/currency';
import { buildBookAngleAssets } from '@/lib/pdp/bookAssetPipeline';
import { ProductBreadcrumb } from './ProductBreadcrumb';
import { ProductImageGallery } from './ProductImageGallery';
import { ProductTitleHeader } from './ProductTitleHeader';
import { AuthorPublisherLinks } from './AuthorPublisherLinks';
import { ProductRatingSummary } from './ProductRatingSummary';
import { useCart } from '@/hooks/useCartStore';
import { useBuyNow } from '@/hooks/useBuyNow';
import { PincodeDeliveryWidget } from './PincodeDeliveryWidget';
import {
  ShoppingCart,
  Zap,
  Truck,
  RotateCcw,
  ShieldCheck,
  MapPin,
  Heart,
  Gift,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface ProductDetailsLayoutProps {
  book: DetailedBookProduct;
  breadcrumbSlot?: React.ReactNode;
  gallerySlot?: React.ReactNode;
  centerSlot?: React.ReactNode;
  buyBoxSlot?: React.ReactNode;
  lookInsideSlot?: React.ReactNode;
  bottomSectionsSlot?: React.ReactNode;
  className?: string;
}

/**
 * Task 1: Desktop Amazon 3-Column Layout Framework
 *
 * - Left Column (5 cols): Image Gallery & Look Inside (Task 3, 4, 5, 6)
 * - Center Column (4 cols): Title, Author, Ratings, Specs & Description (Task 8, 9, 10)
 * - Right Column (3 cols): Sticky Purchase Buy Box
 * - Responsive: Clean vertical flow on Mobile, 2-col on tablet, 3-col on desktop
 */
export const ProductDetailsLayout: React.FC<ProductDetailsLayoutProps> = ({
  book,
  breadcrumbSlot,
  gallerySlot,
  centerSlot,
  buyBoxSlot,
  lookInsideSlot,
  bottomSectionsSlot,
  className = '',
}) => {
  const { language } = useLanguage();
  const isBengali = language === 'bn';
  const { addItem } = useCart();
  const { executeBuyNow } = useBuyNow();

  // Local state for default interactions
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isGiftWrap, setIsGiftWrap] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  // Build multi-angle asset list using Task 6 asset pipeline
  const angleAssets = buildBookAngleAssets(book);

  const handleAddToCart = () => {
    addItem({
      id: book.id,
      bookId: book.bookId,
      title: book.title,
      titleBn: book.titleBn,
      author: book.author,
      price: book.price,
      mrp: book.mrp,
      quantity: selectedQuantity,
      coverImage: book.coverImage,
    });
    setIsAddedToCart(true);
    setTimeout(() => setIsAddedToCart(false), 2500);
  };

  const savingsAmount = book.mrp - book.price;

  return (
    <div className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 ${className}`}>
      {/* Breadcrumb Navigation (Task 7) */}
      <div className="mb-4">
        {breadcrumbSlot || (
          <ProductBreadcrumb
            category={book.category}
            categoryName={book.categoryName}
            subCategory={book.subCategory}
            subCategoryName={book.subCategoryName}
            bookTitle={book.title}
            bookTitleBn={book.titleBn}
          />
        )}
      </div>

      {/* 3-Column Amazon Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ============================================================ */}
        {/* COLUMN 1 (LEFT, 5 Cols): Image Gallery & Look Inside          */}
        {/* ============================================================ */}
        <div className="lg:col-span-5 w-full">
          {gallerySlot || (
            <div className="sticky top-24">
              <ProductImageGallery
                assets={angleAssets}
                bookTitle={book.title}
                badge={book.badge}
                discount={book.discount}
                isMaldaPrime={book.isMaldaPrime}
                lookInsideSlot={lookInsideSlot}
              />
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* COLUMN 2 (CENTER, 4 Cols): Title, Metadata, Specs, Bio       */}
        {/* ============================================================ */}
        <div className="lg:col-span-4 w-full space-y-5">
          {centerSlot || (
            <>
              {/* Title & Edition Header (Task 8) */}
              <ProductTitleHeader
                title={book.title}
                titleBn={book.titleBn}
                edition={book.edition}
                binding={book.binding}
                condition={book.condition}
                badge={book.badge}
                recommendedBadge={book.recommendedBadge}
              />

              {/* Author & Publisher Links (Task 9) */}
              <AuthorPublisherLinks
                author={book.author}
                authorBn={book.authorBn}
                publisher={book.publisher}
                publisherBn={book.publisherBn}
                publicationYear={book.specifications?.publicationYear}
              />

              {/* Star Rating Summary & Smooth Scroll (Task 10) */}
              <ProductRatingSummary
                rating={book.rating}
                reviewsCount={book.reviewsCount}
              />

              <hr className="border-gray-200" />

              {/* Pricing & Savings Block */}
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-red-600">
                    -{book.discount || '25%'}
                  </span>
                  <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
                    {formatINR(book.price, language)}
                  </span>
                </div>

                <div className="text-xs text-gray-500 flex items-center gap-2">
                  <span>M.R.P.:</span>
                  <span className="line-through">{formatINR(book.mrp, language)}</span>
                </div>

                {savingsAmount > 0 && (
                  <div className="text-xs font-semibold text-emerald-700">
                    {isBengali
                      ? `সাশ্রয়: ${formatINR(savingsAmount, language)} (সমস্ত ট্যাক্স সহ)`
                      : `You Save: ${formatINR(savingsAmount, language)} (Inclusive of all taxes)`}
                  </div>
                )}
              </div>

              <hr className="border-gray-200" />

              {/* Book Specifications Grid */}
              {book.specifications && (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    {isBengali ? 'বইয়ের বিবরণ ও স্পেসিফিকেশন' : 'Product Details'}
                  </h3>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div>
                      <span className="text-gray-500 block">ISBN-13:</span>
                      <span className="font-semibold text-gray-800 font-mono">
                        {book.specifications.isbn13}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">
                        {isBengali ? 'মোট পৃষ্ঠা:' : 'Pages:'}
                      </span>
                      <span className="font-semibold text-gray-800">
                        {isBengali
                          ? toBengaliNumerals(book.specifications.pages)
                          : book.specifications.pages}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">
                        {isBengali ? 'ভাষা:' : 'Language:'}
                      </span>
                      <span className="font-semibold text-gray-800">
                        {isBengali
                          ? book.specifications.languageBn || book.specifications.language
                          : book.specifications.language}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">
                        {isBengali ? 'বাঁধাই:' : 'Binding:'}
                      </span>
                      <span className="font-semibold text-gray-800 uppercase">
                        {book.binding || 'Paperback'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Expandable Rich Description */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  {isBengali ? 'বইয়ের পরিচিতি ও সারসংক্ষেপ' : 'About this Book'}
                </h3>
                <p className={`text-sm text-gray-700 leading-relaxed ${isDescExpanded ? '' : 'line-clamp-4'}`}>
                  {isBengali ? (book.descriptionBn || book.description) : book.description}
                </p>

                <button
                  onClick={() => setIsDescExpanded((prev) => !prev)}
                  className="text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline flex items-center gap-1 transition-colors"
                >
                  {isDescExpanded ? (
                    <>
                      <span>{isBengali ? 'কম দেখুন' : 'Show less'}</span>
                      <ChevronUp className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      <span>{isBengali ? '+ আরও বিস্তারিত পড়ুন' : '+ Read more'}</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* ============================================================ */}
        {/* COLUMN 3 (RIGHT, 3 Cols): Sticky Purchase Buy Box            */}
        {/* ============================================================ */}
        <div className="lg:col-span-3 w-full">
          {buyBoxSlot || (
            <div className="sticky top-24 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
              {/* Buy Box Price */}
              <div>
                <span className="text-2xl font-bold text-gray-900">
                  {formatINR(book.price, language)}
                </span>
                <span className="text-xs text-gray-500 block mt-0.5">
                  {isBengali ? 'সমস্ত ট্যাক্স অন্তর্ভুক্ত' : 'Inclusive of all taxes'}
                </span>
              </div>

              {/* Module 8: Pincode & SLA Delivery Calculator */}
              <div className="border-t border-b border-gray-100 py-2">
                <PincodeDeliveryWidget bookPrice={book.price} compact={true} />
              </div>

              {/* Stock Status */}
              <div className="space-y-1">
                <div className="text-sm font-bold text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 fill-emerald-100 text-emerald-600" />
                  <span>{isBengali ? 'স্টকে আছে (In Stock)' : 'In Stock'}</span>
                </div>

                {book.inStoreMaldaStock && book.inStoreMaldaStock > 0 && (
                  <div className="text-xs text-amber-800 bg-amber-50 px-2 py-1 rounded flex items-center gap-1 border border-amber-200/60">
                    <MapPin className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                    <span>
                      {isBengali
                        ? `নেতাজি সুভাষ রোড দোকানে ${toBengaliNumerals(book.inStoreMaldaStock)} কপি মজুত`
                        : `${book.inStoreMaldaStock} copies ready at NS Road store`}
                    </span>
                  </div>
                )}
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="pdp-qty-select" className="font-medium text-gray-700">
                  {isBengali ? 'পরিমাণ (Qty):' : 'Quantity:'}
                </label>
                <select
                  id="pdp-qty-select"
                  value={selectedQuantity}
                  onChange={(e) => setSelectedQuantity(Number(e.target.value))}
                  className="rounded-md border border-gray-300 py-1 px-2.5 bg-gray-50 font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {[1, 2, 3, 4, 5, 10].map((num) => (
                    <option key={num} value={num}>
                      {isBengali ? toBengaliNumerals(num) : num}
                    </option>
                  ))}
                </select>
              </div>

              {/* Primary Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={handleAddToCart}
                  className="w-full py-2.5 px-4 rounded-full bg-amber-400 hover:bg-amber-500 text-gray-950 font-semibold text-sm shadow-xs transition-all flex items-center justify-center gap-2 active:scale-98"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>
                    {isAddedToCart
                      ? isBengali
                        ? '✓ কার্টে যোগ হয়েছে'
                        : '✓ Added to Cart'
                      : isBengali
                      ? 'কার্টে যোগ করুন'
                      : 'Add to Cart'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    executeBuyNow({
                      book,
                      quantity: selectedQuantity,
                    })
                  }
                  className="w-full py-2.5 px-4 rounded-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold text-sm shadow-xs transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-white" />
                  <span>{isBengali ? 'এখনই কিনুন (Buy Now)' : 'Buy Now'}</span>
                </button>
              </div>

              {/* Gift Options */}
              <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isGiftWrap}
                  onChange={(e) => setIsGiftWrap(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <Gift className="w-3.5 h-3.5 text-gray-400" />
                <span>{isBengali ? 'উপহার মোড়ক যোগ করুন' : 'Add gift wrapping'}</span>
              </label>

              {/* Trust & Guarantee Badges */}
              <div className="border-t border-gray-100 pt-3 space-y-2 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{isBengali ? '১০০% অরিজিনাল বই গ্যারান্টি' : '100% Original Guarantee'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-sky-600 flex-shrink-0" />
                  <span>{isBengali ? '৭ দিনের সহজ রিটার্ন নীতি' : '7 Days Easy Return'}</span>
                </div>
              </div>

              {/* Add to Wishlist */}
              <button
                onClick={() => setIsWishlisted((prev) => !prev)}
                className="w-full text-center text-xs font-medium text-gray-600 hover:text-amber-700 hover:underline flex items-center justify-center gap-1.5 pt-2 border-t border-gray-100 transition-colors"
              >
                <Heart
                  className={`w-3.5 h-3.5 ${
                    isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'
                  }`}
                />
                <span>
                  {isWishlisted
                    ? isBengali
                      ? 'উইশলিস্টে সংরক্ষিত'
                      : 'Saved in Wish List'
                    : isBengali
                    ? 'পছন্দের তালিকায় রাখুন (Wish List)'
                    : 'Add to Wish List'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Sections Slot (Frequently Bought Together, Reviews, Author Bio, TOC, etc.) */}
      {bottomSectionsSlot && <div className="mt-12">{bottomSectionsSlot}</div>}
    </div>
  );
};
