'use client';

import React from 'react';

/**
 * Task 18: Elegant Gray Shimmer Skeleton Loader for Category Mega Drawer
 * Prevents blank flashes, layout shifts (Zero CLS), and maintains premium feel during network delays.
 */
export const DrawerSkeleton: React.FC = () => {
  return (
    <div className="py-2 animate-pulse select-none" aria-busy="true" aria-label="বিভাগসমূহ লোড হচ্ছে...">
      {/* Section 1 Skeleton: ডিজিটাল কন্টেন্ট */}
      <div className="border-b border-gray-200 dark:border-slate-700/60 pb-3 mb-2 px-6">
        <div className="h-3.5 w-32 bg-gray-200 dark:bg-slate-700 rounded mb-3 mt-2" />
        <div className="space-y-2.5">
          <div className="flex items-center gap-3 py-1">
            <div className="w-4 h-4 bg-gray-200 dark:bg-slate-700 rounded-sm shrink-0" />
            <div className="h-3 w-48 bg-gray-200 dark:bg-slate-700 rounded" />
          </div>
          <div className="flex items-center gap-3 py-1">
            <div className="w-4 h-4 bg-gray-200 dark:bg-slate-700 rounded-sm shrink-0" />
            <div className="h-3 w-40 bg-gray-200 dark:bg-slate-700 rounded" />
          </div>
        </div>
      </div>

      {/* Section 2 Skeleton: বিভাগ অনুযায়ী বই (Shop by Department) */}
      <div className="border-b border-gray-200 dark:border-slate-700/60 pb-3 mb-2 px-6">
        <div className="h-3.5 w-40 bg-gray-200 dark:bg-slate-700 rounded mb-3 mt-2" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-4 h-4 bg-gray-200 dark:bg-slate-700 rounded-sm shrink-0" />
                <div
                  className="h-3 bg-gray-200 dark:bg-slate-700 rounded"
                  style={{ width: `${60 + (i % 3) * 15}%` }}
                />
              </div>
              <div className="w-3 h-3 bg-gray-200 dark:bg-slate-700 rounded-sm shrink-0 ml-2" />
            </div>
          ))}
        </div>
      </div>

      {/* Section 3 Skeleton: ট্রেন্ডিং ও অফার */}
      <div className="border-b border-gray-200 dark:border-slate-700/60 pb-3 mb-2 px-6">
        <div className="h-3.5 w-28 bg-gray-200 dark:bg-slate-700 rounded mb-3 mt-2" />
        <div className="space-y-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-gray-200 dark:bg-slate-700 rounded-sm shrink-0" />
                <div className="h-3 w-36 bg-gray-200 dark:bg-slate-700 rounded" />
              </div>
              {i % 2 === 0 && <div className="h-3 w-8 bg-gray-200 dark:bg-slate-700 rounded" />}
            </div>
          ))}
        </div>
      </div>

      {/* Section 4 Skeleton: সহায়তা ও সেটিংস */}
      <div className="pb-4 px-6">
        <div className="h-3.5 w-32 bg-gray-200 dark:bg-slate-700 rounded mb-3 mt-2" />
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 py-1">
              <div className="w-4 h-4 bg-gray-200 dark:bg-slate-700 rounded-sm shrink-0" />
              <div className="h-3 w-32 bg-gray-200 dark:bg-slate-700 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
