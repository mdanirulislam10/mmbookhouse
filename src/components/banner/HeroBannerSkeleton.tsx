import React from 'react';

/**
 * Task 19: Zero-CLS Hero Banner Skeleton
 * Replicates the exact responsive aspect ratio (4:3 mobile, 16:9 tablet, 16:7 desktop)
 */
export const HeroBannerSkeleton: React.FC = () => {
  return (
    <div
      className="relative w-full max-w-[1400px] mx-auto overflow-hidden rounded-b-xl shadow-md bg-[#eaeded]"
      aria-hidden="true"
    >
      {/* Task 19 & 49: Pure Zero-CLS Aspect Container with Containment */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] md:aspect-[16/7] overflow-hidden contain-paint bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900 animate-pulse">
        {/* Shimmer gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />

        {/* Content placeholders */}
        <div className="relative z-10 h-full w-full max-w-[1400px] mx-auto px-4 sm:px-8 md:px-12 py-6 sm:py-8 flex flex-col justify-center">
          <div className="max-w-xl space-y-3 sm:space-y-4">
            <div className="h-5 sm:h-6 w-28 bg-white/20 rounded-full" />
            <div className="h-8 sm:h-12 w-4/5 bg-white/25 rounded-md" />
            <div className="h-4 sm:h-5 w-3/5 bg-white/20 rounded-md" />
            <div className="h-9 sm:h-10 w-36 bg-amber-400/40 rounded-lg pt-2" />
          </div>
        </div>

        {/* Bottom Fade placeholder */}
        <div className="absolute inset-x-0 bottom-0 h-28 sm:h-36 md:h-48 bg-gradient-to-t from-[#eaeded] via-[#eaeded]/75 to-transparent pointer-events-none" />
      </div>
    </div>
  );
};
