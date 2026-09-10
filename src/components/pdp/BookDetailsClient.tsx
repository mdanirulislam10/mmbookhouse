'use client';

import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { DetailedBookProduct } from '@/types/pdp';
import { useLanguage } from '@/hooks/useLanguage';
import { useProductVariants } from '@/hooks/useProductVariants';
import { useDeliveryLocation } from '@/hooks/useDeliveryLocation';

// PDP Components
import { ProductBreadcrumb } from './ProductBreadcrumb';
import { ProductImageGallery } from './ProductImageGallery';
import { LookInsideModal } from './LookInsideModal';
import { EditionBadge } from './EditionBadge';
import { StorePickupBadge } from './StorePickupBadge';
import { TeacherRecommendedBadge } from './TeacherRecommendedBadge';
import { ProductTitleHeader } from './ProductTitleHeader';
import { AuthorPublisherLinks } from './AuthorPublisherLinks';
import { ProductRatingSummary } from './ProductRatingSummary';
import { ProductPriceBlock } from './ProductPriceBlock';
import { PdpSocialProofBlock } from './PdpSocialProofBlock';
import { BindingVariantSelector } from './BindingVariantSelector';
import { UsedBookCard } from './UsedBookCard';
import { PromotionalOfferRibbon } from './PromotionalOfferRibbon';
import { BulkOrderNotice } from './BulkOrderNotice';
import { BookSpecificationsTable } from './BookSpecificationsTable';
import { ExpandableDescription } from './ExpandableDescription';
import { SyllabusAccordion } from './SyllabusAccordion';
import { FrequentlyBoughtTogether } from './FrequentlyBoughtTogether';
import { RelatedProductsCarousel } from './RelatedProductsCarousel';
import { ReviewSummaryCard } from './ReviewSummaryCard';
import { AuthorBioCard } from './AuthorBioCard';
import { TrustBadgesBlock } from './TrustBadgesBlock';
import { SocialShareWidget } from './SocialShareWidget';
import { StickyBuyBox } from './StickyBuyBox';
import { MobileStickyBuyBar } from './MobileStickyBuyBar';
import { ShippingDisruptionBanner } from './ShippingDisruptionBanner';
import { BopisPickupCard } from './BopisPickupCard';
import { MaldaRidersBadge } from './MaldaRidersBadge';
import { ReturnPolicyBadge } from './ReturnPolicyBadge';
import { PackagingGuarantee } from './PackagingGuarantee';
import { RemoteIndiaPostCallout } from './RemoteIndiaPostCallout';
import { DeliveryVsPickupComparison } from './DeliveryVsPickupComparison';

interface BookDetailsClientProps {
  book: DetailedBookProduct;
}

export const BookDetailsClient: React.FC<BookDetailsClientProps> = ({ book }) => {
  const { isBengali } = useLanguage();
  const { location, setFulfillmentMode } = useDeliveryLocation();
  const isStorePickupSelected = location.fulfillmentMode === 'pickup';

  // Tasks 28-29: Optimistic URL query-synced variant & condition manager (?format=...&condition=...)
  const {
    activeFormat: selectedFormat,
    activeCondition: selectedCondition,
    selectFormat: handleFormatChange,
    selectCondition: handleConditionChange,
    isUsed: isUsedSelected,
    currentPrice: activePrice,
    currentMrp: activeMrp,
  } = useProductVariants({
    product: book,
  });

  // Look Inside Modal state (Task 12)
  const [isLookInsideOpen, setIsLookInsideOpen] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 space-y-6 pb-24 lg:pb-12">
      {/* 1. Breadcrumb Navigation (Task 7) */}
      <ProductBreadcrumb book={book} />

      {/* Weather & Shipping Disruption Alert Banner */}
      <ShippingDisruptionBanner />

      {/* 2. Amazon Classic 3-Column Layout Framework (Task 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* ================================================================= */}
        {/* LEFT COLUMN: Image Gallery & Look Inside & Share (5 Cols)          */}
        {/* ================================================================= */}
        <div className="lg:col-span-5 space-y-4">
          <ProductImageGallery
            book={book}
            onOpenLookInside={() => setIsLookInsideOpen(true)}
          />

          <div className="flex items-center justify-between gap-3 pt-2">
            <SocialShareWidget book={book} />
          </div>
        </div>

        {/* ================================================================= */}
        {/* CENTER COLUMN: Core Book Metadata & Rich Information (4 Cols)      */}
        {/* ================================================================= */}
        <div className="lg:col-span-4 space-y-4">
          {/* Header Badges: Category & Edition */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              {book.categoryName}
            </span>

            <EditionBadge
              edition={book.specifications?.edition || book.edition}
              publicationYear={book.specifications?.publicationYear}
            />
          </div>

          {/* Task 8: Structured Title Header & Variant Badges */}
          <ProductTitleHeader
            title={book.title}
            titleBn={book.titleBn}
            binding={selectedFormat}
            condition={selectedCondition}
            badge={book.badge}
          />

          {/* Task 45: Teacher & WBCS Topper Recommended Badge */}
          {book.recommendedBadge && (
            <TeacherRecommendedBadge badgeText={book.recommendedBadge} />
          )}

          {/* Task 9: Hyperlinked Author & Publisher Metadata */}
          <AuthorPublisherLinks
            author={book.author}
            authorBn={book.authorBn}
            publisher={book.publisher}
            publisherBn={book.publisherBn}
            publicationYear={book.specifications?.publicationYear}
            role={isBengali ? 'লেখক' : 'Author'}
          />

          {/* Task 10: Star Rating Summary & Smooth Scroll Tracker */}
          <ProductRatingSummary
            rating={book.rating}
            reviewsCount={book.reviewsCount || 128}
            questionsCount={(book as unknown as { questionsCount?: number }).questionsCount || 18}
            reviewSectionId="customer-reviews"
          />

          {/* Task 44: Malda Offline Store Live Counter Stock Pill */}
          {book.inStoreMaldaStock && book.inStoreMaldaStock > 0 && (
            <StorePickupBadge stockCount={book.inStoreMaldaStock} />
          )}

          {/* Amazon Pricing & Savings Block (Task 23) */}
          <ProductPriceBlock
            price={activePrice}
            mrp={activeMrp}
            discount={book.discount}
          />

          {/* Module 8 (Tasks 41-46): Social Proof, Flash Deal Countdown & Savings Highlight Block */}
          <PdpSocialProofBlock
            book={book}
            activePrice={activePrice}
            activeMrp={activeMrp}
            className="pt-1"
          />

          {/* Task 30: Bonus Gift & Mock Test Access Ribbon */}
          {book.bonusOffer && (
            <PromotionalOfferRibbon bonusOffer={book.bonusOffer} />
          )}

          {/* Task 21: Binding Variant Selector (Paperback vs Hardcover) */}
          {book.variants && book.variants.length > 1 && (
            <BindingVariantSelector
              variants={book.variants}
              selectedFormat={selectedFormat}
              onSelectFormat={(f) => {
                handleFormatChange(f);
              }}
            />
          )}

          {/* Task 22: Used Book Option Card */}
          {book.usedBookOption && book.usedBookOption.isAvailable && (
            <UsedBookCard
              usedOption={book.usedBookOption}
              isSelected={isUsedSelected}
              onSelectUsed={() => handleConditionChange(isUsedSelected ? 'new' : 'used')}
            />
          )}

          {/* Task 27: Bulk Order Notice for Coaching & Institutions */}
          <BulkOrderNotice
            bookTitle={book.title}
            bookTitleBn={book.titleBn}
            isbn={book.specifications?.isbn13 || book.specifications?.isbn10}
          />

          {/* Key Quick Highlights */}
          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/80 space-y-1.5 text-xs text-gray-700">
            <span className="font-bold text-gray-900 block mb-1">
              {isBengali ? 'বইয়ের প্রধান আকর্ষণ:' : 'Book Highlights:'}
            </span>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                {isBengali
                  ? 'বিগত ১৫ বছরের পূর্ণাঙ্গ প্রশ্নপত্র ও ওএমআর মডেল টেস্ট'
                  : 'Previous 15 years solved papers with OMR model mocks'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                {isBengali
                  ? 'মালদা ও উত্তরবঙ্গের শিক্ষার্থীদের জন্য বিশেষ রেফারেন্স নোট'
                  : 'Special regional notes and maps for North Bengal candidates'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                {isBengali
                  ? '৭০ GSM প্রিমিয়াম হাই-হোয়াইট রিডিং পেপার'
                  : '70 GSM premium high-white non-glare paper'}
              </span>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* RIGHT COLUMN: Sticky Buy Box & Local Assurance (3 Cols)            */}
        {/* ================================================================= */}
        <div className="lg:col-span-3 lg:sticky lg:top-24 space-y-3.5">
          <StickyBuyBox
            book={book}
            selectedFormat={selectedFormat}
            isUsedSelected={isUsedSelected}
          />

          {/* Local Assurance & BOPIS Fast Pickup (Tasks 23 & 24) */}
          <BopisPickupCard
            bookPrice={activePrice}
            isSelected={isStorePickupSelected}
            onSelect={() => setFulfillmentMode(isStorePickupSelected ? 'delivery' : 'pickup')}
          />
          <MaldaRidersBadge />
          <ReturnPolicyBadge />
          <PackagingGuarantee />
          <RemoteIndiaPostCallout bookTitle={isBengali ? book.titleBn : book.title} />
        </div>
      </div>

      {/* Home Delivery vs Store Pickup Comparison */}
      <DeliveryVsPickupComparison bookPrice={activePrice} />

      {/* 3. Amazon 4-Component Interactive Trust Badges Row (Task 39) */}
      <TrustBadgesBlock />

      {/* 4. Frequently Bought Together Combo Bundle (Task 34) */}
      <FrequentlyBoughtTogether currentBook={book} />

      {/* 5. Related Products & Syllabus Recommendations Carousel (Task 35) */}
      <RelatedProductsCarousel currentBook={book} />

      {/* 6. Chapter-wise Syllabus & Paper Weightage Accordion (Task 42) */}
      <SyllabusAccordion
        chapters={book.tableOfContents}
        bookTitle={book.title}
        categoryName={book.categoryName}
      />

      {/* 7. Product Specifications Metadata Table (Task 24) */}
      {book.specifications && (
        <BookSpecificationsTable
          specs={book.specifications}
          binding={selectedFormat}
        />
      )}

      {/* 8. Expandable Book Description (Task 25) */}
      <ExpandableDescription
        description={book.description}
        descriptionBn={book.descriptionBn}
      />

      {/* 9. About the Author Card (Task 26) */}
      <AuthorBioCard
        authorBio={book.authorBio}
        authorName={book.author}
        currentBookId={book.bookId}
      />

      {/* 10. Amazon Classic 5-Star Rating Distribution & Verified Reviews (Task 41) */}
      <ReviewSummaryCard book={book} />

      {/* 11. Look Inside Reader Modal (Tasks 11-20) */}
      <LookInsideModal
        book={book}
        isOpen={isLookInsideOpen}
        onClose={() => setIsLookInsideOpen(false)}
      />

      {/* 12. Mobile Sticky Bottom Purchase Bar (Task 32) */}
      <MobileStickyBuyBar
        book={book}
        selectedFormat={selectedFormat}
        isUsedSelected={isUsedSelected}
      />
    </div>
  );
};
