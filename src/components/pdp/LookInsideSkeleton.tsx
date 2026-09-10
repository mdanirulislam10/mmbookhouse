'use client';

import React from 'react';

interface LookInsideSkeletonProps {
  twoPageSpread?: boolean;
  className?: string;
}

/**
 * Task 20: Preview Loading Shimmer Skeleton
 * Renders an authentic book-shaped dual or single page skeleton with spine shadow
 * and subtle animated shimmer bars while WebP image stream buffers.
 */
export const LookInsideSkeleton: React.FC<LookInsideSkeletonProps> = ({
  twoPageSpread = false,
  className = '',
}) => {
  return (
    <div
      className={`relative w-full max-w-4xl mx-auto flex items-center justify-center p-4 select-none ${className}`}
      aria-label="Loading preview page content..."
    >
      <div
        className={`w-full bg-[#fdfbf7] rounded-lg shadow-2xl border border-neutral-300 overflow-hidden flex ${
          twoPageSpread ? 'flex-row' : 'flex-col max-w-lg'
        }`}
        style={{ minHeight: '560px' }}
      >
        {/* Left Page (or Sole Page) */}
        <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between relative">
          {/* Shimmer Bar Header */}
          <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-6">
            <div className="h-3 w-32 bg-neutral-200 rounded animate-pulse" />
            <div className="h-3 w-12 bg-neutral-200 rounded animate-pulse" />
          </div>

          {/* Title and Body Placeholders */}
          <div className="space-y-4 my-auto">
            <div className="h-6 w-3/4 bg-neutral-300 rounded animate-pulse mb-6" />
            <div className="h-3.5 w-full bg-neutral-200 rounded animate-pulse" />
            <div className="h-3.5 w-11/12 bg-neutral-200 rounded animate-pulse" />
            <div className="h-3.5 w-full bg-neutral-200 rounded animate-pulse" />
            <div className="h-3.5 w-4/5 bg-neutral-200 rounded animate-pulse" />

            <div className="py-4">
              <div className="h-28 w-full bg-neutral-100 border border-dashed border-neutral-300 rounded-md animate-pulse flex items-center justify-center">
                <div className="h-4 w-40 bg-neutral-200 rounded" />
              </div>
            </div>

            <div className="h-3.5 w-full bg-neutral-200 rounded animate-pulse" />
            <div className="h-3.5 w-9/12 bg-neutral-200 rounded animate-pulse" />
          </div>

          {/* Shimmer Footer */}
          <div className="flex items-center justify-between border-t border-neutral-200 pt-3 mt-6">
            <div className="h-2.5 w-24 bg-neutral-200 rounded animate-pulse" />
            <div className="h-3 w-6 bg-neutral-200 rounded animate-pulse" />
            <div className="h-2.5 w-20 bg-neutral-200 rounded animate-pulse" />
          </div>
        </div>

        {/* Realistic Book Spine Center Shadow (Two-page mode only) */}
        {twoPageSpread && (
          <>
            <div
              className="w-4 bg-gradient-to-r from-neutral-300/60 via-neutral-400/80 to-neutral-300/60 shrink-0 shadow-inner"
              aria-hidden="true"
            />
            {/* Right Page */}
            <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between relative bg-[#faf7f0]">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-6">
                <div className="h-3 w-16 bg-neutral-200 rounded animate-pulse" />
                <div className="h-3 w-28 bg-neutral-200 rounded animate-pulse" />
              </div>

              <div className="space-y-4 my-auto">
                <div className="h-5 w-2/3 bg-neutral-300 rounded animate-pulse mb-4" />
                <div className="h-3.5 w-full bg-neutral-200 rounded animate-pulse" />
                <div className="h-3.5 w-full bg-neutral-200 rounded animate-pulse" />
                <div className="h-3.5 w-5/6 bg-neutral-200 rounded animate-pulse" />

                <div className="h-32 w-full bg-neutral-200/60 rounded-md animate-pulse my-4" />

                <div className="h-3.5 w-full bg-neutral-200 rounded animate-pulse" />
                <div className="h-3.5 w-3/4 bg-neutral-200 rounded animate-pulse" />
              </div>

              <div className="flex items-center justify-between border-t border-neutral-200 pt-3 mt-6">
                <div className="h-2.5 w-20 bg-neutral-200 rounded animate-pulse" />
                <div className="h-3 w-6 bg-neutral-200 rounded animate-pulse" />
                <div className="h-2.5 w-24 bg-neutral-200 rounded animate-pulse" />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
