'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useCampaignController } from '@/hooks/useCampaignController';
import { useBannerAnalytics } from '@/hooks/useBannerAnalytics';
import {
  Sparkles,
  ArrowRight,
  X,
  Calendar,
  Gift
} from 'lucide-react';

interface CampaignBannerProps {
  className?: string;
}

export function CampaignBanner({ className = '' }: CampaignBannerProps) {
  const { activeCampaign, dismissCampaign, hasActiveCampaign } = useCampaignController();
  const { trackImpression, trackClick } = useBannerAnalytics();

  useEffect(() => {
    if (activeCampaign) {
      trackImpression(activeCampaign.id, activeCampaign.nameBn);
    }
  }, [activeCampaign, trackImpression]);

  if (!hasActiveCampaign || !activeCampaign) return null;

  const { theme } = activeCampaign;

  const handleCtaClick = () => {
    trackClick(activeCampaign.id, activeCampaign.nameBn);
  };

  return (
    <aside
      aria-label={activeCampaign.nameBn}
      className={`relative overflow-hidden rounded-xl bg-gradient-to-r ${theme.gradient} text-white shadow-md p-4 sm:p-5 ${className}`}
    >
      {/* Decorative festive overlay dots/pattern */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Content & Badges */}
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border shadow-xs ${theme.badgeBg}`}
            >
              <Sparkles className="w-3 h-3 flex-shrink-0" />
              <span>{theme.badgeText}</span>
            </span>

            {theme.urgencyTextBn && (
              <span className="text-[11px] text-amber-200/90 font-medium flex items-center gap-1">
                <Calendar className="w-3 h-3 flex-shrink-0" />
                <span>{theme.urgencyTextBn}</span>
              </span>
            )}
          </div>

          <h3 className="text-base sm:text-lg md:text-xl font-black font-bengali tracking-tight leading-snug">
            {theme.bannerHeadingBn}
          </h3>

          <p className="text-xs sm:text-sm text-amber-100 font-bengali leading-relaxed">
            {theme.bannerSubheadingBn}
          </p>
        </div>

        {/* Right: CTA Button & Dismiss Control */}
        <div className="flex items-center gap-3 self-start md:self-center flex-shrink-0">
          <Link
            href={theme.ctaLink}
            onClick={handleCtaClick}
            className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-bold text-xs sm:text-sm text-gray-950 bg-[#ffd814] hover:bg-[#f7ca00] active:bg-[#f0b800] shadow-sm flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
          >
            <span>{theme.ctaTextBn}</span>
            <ArrowRight className="w-4 h-4 flex-shrink-0" />
          </Link>

          {/* Dismiss Button */}
          <button
            onClick={dismissCampaign}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors focus:outline-hidden"
            title="ব্যানারটি বন্ধ করুন"
            aria-label="ক্যাম্পেইন ব্যানার বন্ধ করুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
