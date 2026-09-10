'use client';

import React from 'react';
import { Gift, Sparkles, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface PromotionalOfferRibbonProps {
  bonusOffer?: {
    title: string;
    titleBn: string;
    description: string;
  };
  className?: string;
}

export const PromotionalOfferRibbon: React.FC<PromotionalOfferRibbonProps> = ({
  bonusOffer,
  className = '',
}) => {
  const { isBengali } = useLanguage();

  if (!bonusOffer) return null;

  return (
    <div
      className={`p-3 sm:p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/15 border border-amber-300 text-xs text-amber-950 flex items-start gap-3 shadow-2xs ${className}`}
    >
      <div className="p-1.5 rounded-lg bg-amber-500 text-white shrink-0 mt-0.5 shadow-2xs">
        <Gift className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-gray-900 text-xs sm:text-sm">
            {isBengali ? bonusOffer.titleBn : bonusOffer.title}
          </span>
          <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 uppercase">
            {isBengali ? 'ফ্রি বোনাস' : 'FREE BONUS'}
          </span>
        </div>
        <p className="text-[11px] sm:text-xs text-gray-700 leading-snug">
          {bonusOffer.description}
        </p>
      </div>
    </div>
  );
};
