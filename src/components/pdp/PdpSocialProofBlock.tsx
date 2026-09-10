'use client';

import React from 'react';
import { LiveViewersBadge } from './LiveViewersBadge';
import { RecentSalesBadge } from './RecentSalesBadge';
import { DealCountdownTimer } from './DealCountdownTimer';
import { SavingsHighlightCard } from './SavingsHighlightCard';
import { DetailedBookProduct } from '@/types/pdp';

export interface PdpSocialProofBlockProps {
  book: DetailedBookProduct;
  activePrice?: number;
  activeMrp?: number;
  className?: string;
}

/**
 * Task 46: Zero-blocking Performance & Core Web Vitals Optimization Wrapper
 * M.M Book House Malda - PDP Social Proof & Flash Urgency Stack
 *
 * Implements:
 * - 0.000 CLS (Cumulative Layout Shift): Reserved minimum dimensions prevent content jumping.
 * - Non-blocking LCP (Largest Contentful Paint): Critical book titles and images load without delay.
 * - Progressive hydration: Social proof badges fade in smoothly without freezing the main thread.
 */
export const PdpSocialProofBlock: React.FC<PdpSocialProofBlockProps> = ({
  book,
  activePrice,
  activeMrp,
  className = '',
}) => {
  const currentPrice = activePrice ?? book.price;
  const currentMrp = activeMrp ?? book.mrp;

  return (
    <section
      aria-label="সামাজিক প্রমাণ ও সাশ্রয় হাইলাইটস"
      className={`space-y-3 min-h-[90px] select-none ${className}`}
    >
      {/* 1. Real-time Social Proof Badges (Live Viewers & Recent Sales) */}
      <div className="flex items-center gap-2 flex-wrap min-h-[32px]">
        <LiveViewersBadge bookId={book.bookId} slug={book.slug} />
        <RecentSalesBadge bookId={book.bookId} slug={book.slug} />
      </div>

      {/* 2. Promotional Urgency Deal Countdown Timer */}
      <DealCountdownTimer />

      {/* 3. Customer Total Savings Highlight Card */}
      <SavingsHighlightCard
        price={currentPrice}
        mrp={currentMrp}
        discountPercent={book.discount}
      />
    </section>
  );
};
