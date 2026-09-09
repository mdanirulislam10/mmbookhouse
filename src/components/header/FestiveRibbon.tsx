'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { useFestiveTheme } from '@/hooks/useFestiveTheme';
import { useLanguage } from '@/hooks/useLanguage';

interface FestiveRibbonProps {
  className?: string;
  onClick?: () => void;
}

/**
 * Module 2 (Task 45): Festive Offer & Seasonal Promotional Ribbon
 *
 * Displays a vibrant festive promotional banner ribbon in the header
 * during cultural festivals (Durga Puja, Eid, Malda District Book Fair).
 * 1-click navigates to festive deals & discount offers.
 */
export const FestiveRibbon: React.FC<FestiveRibbonProps> = ({
  className = '',
  onClick,
}) => {
  const router = useRouter();
  const { isFestive, currentConfig } = useFestiveTheme();
  const { isBengali } = useLanguage();

  if (!isFestive) {
    return null;
  }

  const ribbonText = isBengali ? currentConfig.ribbonBn : currentConfig.ribbonEn;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push('/deals');
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={ribbonText}
      title={ribbonText}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold shadow-sm transition-all duration-300 transform hover:scale-105 select-none cursor-pointer ${currentConfig.ribbonBg} ${className}`}
    >
      <Sparkles className="w-3.5 h-3.5 animate-spin-slow shrink-0" />
      <span className="leading-none whitespace-nowrap tracking-wide">
        {ribbonText}
      </span>
    </button>
  );
};
