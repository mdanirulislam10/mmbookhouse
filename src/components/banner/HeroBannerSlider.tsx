'use client';

import React from 'react';
import { HeroBanner, BannerSliderConfig } from '@/types/banner';
import { DEFAULT_HERO_BANNERS } from '@/lib/data/heroBanners';
import { useHeroBanner } from '@/hooks/useHeroBanner';
import { useLanguage } from '@/hooks/useLanguage';
import { useBannerAnalytics } from '@/hooks/useBannerAnalytics';
import { toBengaliNumerals } from '@/lib/utils/currency';
import { HeroBannerSlide } from './HeroBannerSlide';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

interface HeroBannerSliderProps {
  banners?: HeroBanner[];
  config?: BannerSliderConfig;
}

export const HeroBannerSlider: React.FC<HeroBannerSliderProps> = ({
  banners = DEFAULT_HERO_BANNERS,
  config,
}) => {
  const { isBengali } = useLanguage();
  const { trackImpression, trackClick } = useBannerAnalytics();
  const {
    currentIndex,
    totalSlides,
    isPaused,
    isHovered,
    isTouching,
    lastSwipeDirection,
    manualPause,
    setManualPause,
    nextSlide,
    prevSlide,
    goToSlide,
    handleMouseEnter,
    handleMouseLeave,
    handleFocus,
    handleBlur,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
  } = useHeroBanner({ banners, config });

  // Task 45: Track Banner Impression on Slide Change
  const currentBanner = banners[currentIndex];
  React.useEffect(() => {
    if (currentBanner) {
      trackImpression(currentBanner.id, currentBanner.titleBn || currentBanner.title);
    }
  }, [currentBanner, trackImpression]);

  const handleBannerClick = (banner: HeroBanner) => {
    trackClick(banner.id, banner.titleBn || banner.title);
  };

  // Issue 4 Fix: Keyboard Navigation (ArrowLeft / ArrowRight) for WCAG 2.1 AA
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prevSlide();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextSlide();
    }
  };

  if (totalSlides === 0) return null;

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label="হোমপেজ হিরো ব্যানার ক্যারোজেল"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="relative w-full max-w-[1400px] mx-auto overflow-hidden rounded-b-xl shadow-md bg-[#eaeded] group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      {/* Task 1, 49 & Issue 6 Fix: Pure Aspect-Ratio Responsive Container with Containment (Zero CLS) */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] md:aspect-[16/7] overflow-hidden contain-paint">
        {/* Task 2 & Issue 1 Fix: Valid Tailwind transition duration-[400ms] */}
        <div
          className="flex h-full w-full will-change-transform transition-transform duration-[400ms] ease-out"
          style={{
            transform: `translate3d(-${currentIndex * 100}%, 0, 0)`,
          }}
        >
          {banners.map((banner, index) => (
            <HeroBannerSlide
              key={banner.id}
              banner={banner}
              isActive={index === currentIndex}
              isPriority={index === 0}
              onBannerClick={handleBannerClick}
            />
          ))}
        </div>

        {/* Task 10 & Issue 9 Fix: Amazon Signature Bottom Gradient Fade with Valid z-[4] */}
        <div
          className="absolute inset-x-0 bottom-0 h-28 sm:h-36 md:h-48 pointer-events-none bg-gradient-to-t from-[#eaeded] via-[#eaeded]/75 via-35% to-transparent z-[4]"
          aria-hidden="true"
        />

        {/* Task 6 & Issue 9 Fix: Amazon Signature Side Arrows with z-[10] */}
        <button
          onClick={prevSlide}
          aria-label="পূর্ববর্তী ব্যানার স্লাইড"
          className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 w-9 sm:w-12 h-20 sm:h-28 md:h-32 bg-black/30 hover:bg-black/60 text-white rounded-r-md flex items-center justify-center backdrop-blur-xs transition-all border border-l-0 border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer z-[10] opacity-60 group-hover:opacity-100 hover:scale-105 active:scale-95"
        >
          <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8 drop-shadow-md" />
        </button>

        <button
          onClick={nextSlide}
          aria-label="পরবর্তী ব্যানার স্লাইড"
          className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 w-9 sm:w-12 h-20 sm:h-28 md:h-32 bg-black/30 hover:bg-black/60 text-white rounded-l-md flex items-center justify-center backdrop-blur-xs transition-all border border-r-0 border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer z-[10] opacity-60 group-hover:opacity-100 hover:scale-105 active:scale-95"
        >
          <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8 drop-shadow-md" />
        </button>

        {/* Task 6 & Issue 9 Fix: Bottom Indicators & Play/Pause Status with z-[10] */}
        <div className="absolute bottom-3 sm:bottom-6 inset-x-0 flex items-center justify-center gap-2 z-[10]">
          <div className="bg-black/55 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2.5 border border-white/15 shadow-md">
            {/* Auto-Slide Pause / Play Status Toggle */}
            <button
              onClick={() => setManualPause(!manualPause)}
              aria-label={manualPause ? 'স্বয়ংক্রিয় রোটেশন চালু করুন' : 'স্বয়ংক্রিয় রোটেশন বন্ধ করুন'}
              className="p-1 rounded-full text-white/90 hover:text-amber-300 transition-colors cursor-pointer"
              title={isPaused ? 'রোটেশন পজ রয়েছে' : '৫-সেকেন্ড অটো-রোটেশন সক্রিয়'}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 fill-current text-amber-400" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
            </button>

            {/* Expandable Indicator Dots (Task 6) */}
            <div className="flex items-center gap-1.5" role="tablist" aria-label="ব্যানার স্লাইড তালিকা">
              {banners.map((banner, index) => (
                <button
                  key={banner.id}
                  onClick={() => goToSlide(index)}
                  role="tab"
                  aria-selected={index === currentIndex}
                  aria-label={`${banner.titleBn} স্লাইডে যান`}
                  title={banner.titleBn}
                  className={`transition-all duration-300 rounded-full cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-300 ${
                    index === currentIndex
                      ? 'w-7 sm:w-9 h-2 sm:h-2.5 bg-[#febd69] shadow-xs'
                      : 'w-2 sm:w-2.5 h-2 sm:h-2.5 bg-white/40 hover:bg-white/90'
                  }`}
                />
              ))}
            </div>

            {/* Slide Index Counter */}
            <span className="text-[11px] font-mono text-gray-100 font-bold pl-1.5 border-l border-white/20">
              {isBengali ? toBengaliNumerals(currentIndex + 1) : currentIndex + 1} / {isBengali ? toBengaliNumerals(totalSlides) : totalSlides}
            </span>
          </div>
        </div>

        {/* Issue 2 Fix: Live Status Tag for Touch/Hover (Auto-cleared after 2s) */}
        {(isHovered || isTouching || lastSwipeDirection) && (
          <div className="absolute top-3 right-3 z-[10] hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-md bg-black/70 backdrop-blur-md text-white text-[11px] font-semibold border border-white/15 shadow-sm">
            {isHovered && <span>🖱️ মাউস হোভার (পজ)</span>}
            {isTouching && <span>👆 টাচ সক্রিয়</span>}
            {lastSwipeDirection && (
              <span className="text-amber-300 font-mono text-[10px]">
                সোয়াইপ: {lastSwipeDirection === 'left' ? '← বামে (পরবর্তী)' : 'ডানে (পূর্ববর্তী) →'}
              </span>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
