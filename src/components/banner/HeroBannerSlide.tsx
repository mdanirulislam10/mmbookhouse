'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { HeroBanner } from '@/types/banner';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { getAdaptiveImageUrl } from '@/lib/utils/adaptiveImage';
import { BookOpen, ArrowRight } from 'lucide-react';

interface HeroBannerSlideProps {
  banner: HeroBanner;
  isActive: boolean;
  isPriority?: boolean;
  onBannerClick?: (banner: HeroBanner) => void;
}

// Issue 8 Fix: Lightweight Shimmer SVG for smooth blurDataURL loading preview
const shimmerSvg = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#1e293b" offset="20%" />
      <stop stop-color="#334155" offset="50%" />
      <stop stop-color="#1e293b" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#1e293b" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
</svg>`;

const toBase64 = (str: string) =>
  typeof window === 'undefined' ? Buffer.from(str).toString('base64') : window.btoa(str);

const SHIMMER_BLUR_DATA_URL = `data:image/svg+xml;base64,${toBase64(shimmerSvg(700, 475))}`;

export const HeroBannerSlide: React.FC<HeroBannerSlideProps> = ({
  banner,
  isActive,
  isPriority = false,
  onBannerClick,
}) => {
  const shouldPrioritize = isPriority || Boolean(banner.priority);
  const { isSlowConnection, saveData } = useNetworkStatus();

  const effectiveMobileImageUrl = banner.mobileImageUrl
    ? getAdaptiveImageUrl(banner.mobileImageUrl, { width: 768, isSlowConnection, saveData })
    : '';

  const effectiveDesktopImageUrl = banner.imageUrl
    ? getAdaptiveImageUrl(banner.imageUrl, { width: 1400, isSlowConnection, saveData })
    : '';

  return (
    <div
      className={`relative w-full h-full flex-shrink-0 select-none overflow-hidden bg-gradient-to-r ${banner.bgGradient}`}
      role="group"
      aria-roledescription="slide"
      aria-label={banner.titleBn}
      aria-hidden={!isActive}
    >
      {/* Issue 5 Fix: Full-Bleed Clickable Link Overlay (Amazon Pattern) */}
      <Link
        href={banner.targetUrl}
        prefetch={true}
        tabIndex={isActive ? 0 : -1}
        onClick={() => onBannerClick?.(banner)}
        className="absolute inset-0 z-[3] cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-inset"
        aria-label={`${banner.titleBn} - ${banner.ctaTextBn}`}
      />

      {/* Task 7, 8 & Issue 7 Fix: Mobile Optimized Image (<768px) */}
      {effectiveMobileImageUrl && (
        <div className="absolute inset-0 z-0 overflow-hidden md:hidden">
          <Image
            src={effectiveMobileImageUrl}
            alt={banner.titleBn}
            fill
            sizes="100vw"
            priority={shouldPrioritize}
            loading={shouldPrioritize ? 'eager' : 'lazy'}
            fetchPriority={shouldPrioritize ? 'high' : 'auto'}
            placeholder="blur"
            blurDataURL={SHIMMER_BLUR_DATA_URL}
            className="object-cover object-center opacity-40 mix-blend-overlay pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950/95 via-gray-950/80 to-transparent pointer-events-none" />
        </div>
      )}

      {/* Task 7, 8 & Issue 7 Fix: Desktop Optimized Image (>=768px) */}
      {effectiveDesktopImageUrl && (
        <div className={`absolute inset-0 z-0 overflow-hidden ${banner.mobileImageUrl ? 'hidden md:block' : ''}`}>
          <Image
            src={effectiveDesktopImageUrl}
            alt={banner.titleBn}
            fill
            sizes="(max-width: 1200px) 100vw, 1400px"
            priority={shouldPrioritize}
            loading={shouldPrioritize ? 'eager' : 'lazy'}
            fetchPriority={shouldPrioritize ? 'high' : 'auto'}
            placeholder="blur"
            blurDataURL={SHIMMER_BLUR_DATA_URL}
            className="object-cover object-center opacity-35 mix-blend-overlay transition-transform duration-700 group-hover:scale-105 pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950/95 via-gray-950/75 sm:via-gray-950/50 to-transparent pointer-events-none" />
        </div>
      )}

      {/* Issue 9 Fix: Valid Tailwind z-[1] Ambient Glow Patterns */}
      <div className="absolute inset-0 opacity-20 pointer-events-none z-[1]">
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-white blur-3xl" />
        <div className="absolute -bottom-12 -left-12 w-72 h-72 rounded-full bg-amber-400 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] opacity-10" />
      </div>

      {/* Issue 9 Fix: Valid Tailwind z-[2] Main Content Container */}
      <div className="relative z-[2] h-full w-full max-w-[1400px] mx-auto px-4 sm:px-8 md:px-12 py-6 sm:py-8 flex flex-col justify-center">
        <div className="max-w-2xl text-white space-y-2 sm:space-y-3 md:space-y-4">
          {/* Badge */}
          {banner.badgeTextBn && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold tracking-wide shadow-sm border border-white/20 backdrop-blur-xs">
              <span className={`px-2 py-0.5 rounded-full font-extrabold ${banner.badgeColor || 'bg-amber-400 text-gray-950'}`}>
                {banner.badgeTextBn}
              </span>
              <span className="text-gray-200 hidden sm:inline">{banner.badgeText}</span>
            </div>
          )}

          {/* Title */}
          <h2 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight font-bengali drop-shadow-sm">
            {banner.titleBn}
          </h2>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm md:text-base text-amber-200 font-semibold font-bengali leading-snug">
            {banner.subtitleBn}
          </p>

          {/* Short Description */}
          {banner.descriptionBn && (
            <p className="text-[11px] sm:text-xs md:text-sm text-gray-200/90 font-bengali max-w-xl line-clamp-2 sm:line-clamp-3 leading-relaxed">
              {banner.descriptionBn}
            </p>
          )}

          {/* Task 9 & Issue 4 Fix: Call To Action (CTA) with TabIndex Management */}
          <div className="pt-1 sm:pt-2">
            <span
              className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg bg-[#febd69] hover:bg-[#f3a847] text-gray-950 font-bold text-xs sm:text-sm transition-all duration-150 shadow-md hover:shadow-lg group-hover:scale-105 pointer-events-none"
            >
              <span>{banner.ctaTextBn}</span>
              <ArrowRight className="w-4 h-4 text-gray-900 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </div>

        {/* Decorative Floating Graphical Elements on the right */}
        <div className="absolute right-4 sm:right-10 md:right-16 top-1/2 -translate-y-1/2 hidden md:flex flex-col items-center gap-3 pointer-events-none opacity-40 lg:opacity-85 z-[2]">
          <div className="w-28 h-36 lg:w-36 lg:h-48 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl flex flex-col items-center justify-center p-3 text-center text-white transform rotate-3 hover:rotate-0 transition-transform">
            <BookOpen className="w-8 h-8 lg:w-12 lg:h-12 text-amber-300 mb-2" />
            <span className="text-[10px] lg:text-xs font-bold font-bengali">M.M বুক হাউস</span>
            <span className="text-[9px] text-gray-300 font-bengali">মালদা স্পেশাল</span>
          </div>
        </div>
      </div>
    </div>
  );
};
