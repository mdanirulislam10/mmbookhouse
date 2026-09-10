'use client';

import React from 'react';
import { ViewMode } from '@/types/catalog-filter';

interface ProductGridSkeletonProps {
  count?: number;
  viewMode?: ViewMode;
}

/**
 * Task 47: Shimmer Loading Skeleton for Product Grid & List Views
 * - Provides non-jarring layout-preserving placeholder cards while filtering or paging
 * - Matches exact dimensions of ProductCard in both Grid and List modes
 */
export const ProductGridSkeleton: React.FC<ProductGridSkeletonProps> = ({
  count = 8,
  viewMode = 'grid',
}) => {
  const items = Array.from({ length: count }, (_, i) => i);

  if (viewMode === 'list') {
    return (
      <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading products">
        {items.map((i) => (
          <div
            key={`skeleton-list-${i}`}
            className="flex flex-col sm:flex-row gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm animate-pulse"
          >
            {/* Cover Image Skeleton */}
            <div className="h-44 w-32 flex-shrink-0 rounded-md bg-gray-200 self-center sm:self-start" />

            {/* Book Details Skeleton */}
            <div className="flex flex-1 flex-col justify-between space-y-3 py-1">
              <div className="space-y-2">
                {/* Title */}
                <div className="h-5 w-3/4 rounded bg-gray-200" />
                {/* Author & Publisher */}
                <div className="h-4 w-1/2 rounded bg-gray-200" />
                {/* Rating & Reviews */}
                <div className="flex items-center gap-2 pt-1">
                  <div className="h-4 w-24 rounded bg-gray-200" />
                  <div className="h-4 w-12 rounded bg-gray-200" />
                </div>
              </div>

              {/* Price & Delivery */}
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <div className="h-6 w-20 rounded bg-gray-200" />
                  <div className="h-4 w-14 rounded bg-gray-200" />
                </div>
                <div className="h-4 w-36 rounded bg-gray-200" />
              </div>

              {/* Button */}
              <div className="h-9 w-36 rounded-md bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Grid Mode Skeleton
  return (
    <div
      className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4"
      aria-busy="true"
      aria-label="Loading products"
    >
      {items.map((i) => (
        <div
          key={`skeleton-grid-${i}`}
          className="flex flex-col rounded-lg border border-gray-200 bg-white p-3 sm:p-4 shadow-sm animate-pulse"
        >
          {/* Cover Aspect Ratio Skeleton */}
          <div className="relative mb-3 aspect-[3/4] w-full rounded-md bg-gray-200" />

          {/* Title Lines */}
          <div className="space-y-1.5 flex-1">
            <div className="h-4 w-full rounded bg-gray-200" />
            <div className="h-4 w-2/3 rounded bg-gray-200" />
          </div>

          {/* Author */}
          <div className="mt-2 h-3.5 w-1/2 rounded bg-gray-200" />

          {/* Rating */}
          <div className="mt-2 flex items-center gap-1.5">
            <div className="h-3.5 w-16 rounded bg-gray-200" />
            <div className="h-3.5 w-8 rounded bg-gray-200" />
          </div>

          {/* Price */}
          <div className="mt-2.5 flex items-baseline gap-2">
            <div className="h-5 w-16 rounded bg-gray-200" />
            <div className="h-3.5 w-12 rounded bg-gray-200" />
          </div>

          {/* Malda Prime Promise */}
          <div className="mt-2 h-4 w-28 rounded bg-gray-200" />

          {/* Add to Cart Button */}
          <div className="mt-3 h-9 w-full rounded-md bg-gray-200" />
        </div>
      ))}
    </div>
  );
};
