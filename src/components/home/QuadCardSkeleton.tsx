import React from 'react';

/**
 * Task 19: Zero-CLS Shimmer Skeleton for 4-in-1 Quad Category Cards
 * Matches exact dimensions and margins to eliminate Cumulative Layout Shift
 */
export const QuadCardSkeleton: React.FC = () => {
  return (
    <div
      className="bg-white rounded-lg p-4 sm:p-5 border border-gray-200 shadow-sm flex flex-col justify-between h-full animate-pulse"
      aria-hidden="true"
    >
      {/* Skeleton Header */}
      <div className="mb-3 space-y-2">
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
      </div>

      {/* 2x2 Grid Skeletons */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 my-auto">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="space-y-1.5">
            <div className="aspect-[4/3] w-full rounded-md bg-gray-200 border border-gray-100" />
            <div className="h-3 bg-gray-200 rounded w-4/5" />
          </div>
        ))}
      </div>

      {/* Skeleton Footer Link */}
      <div className="mt-3.5 pt-2.5 border-t border-gray-100">
        <div className="h-4 bg-sky-100 rounded w-1/3" />
      </div>
    </div>
  );
};
