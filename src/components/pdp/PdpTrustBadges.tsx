'use client';

import React from 'react';
import { ShieldCheck, RotateCcw, Banknote, Truck } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface PdpTrustBadgesProps {
  className?: string;
}

export const PdpTrustBadges: React.FC<PdpTrustBadgesProps> = ({ className = '' }) => {
  const { isBengali } = useLanguage();

  const badges = [
    {
      icon: ShieldCheck,
      title: isBengali ? '১০০% অরিজিনাল' : '100% Genuine',
      subtitle: isBengali ? 'সরাসরি প্রকাশনী থেকে' : 'Direct Publisher',
    },
    {
      icon: RotateCcw,
      title: isBengali ? '৭ দিনের রিটার্ন' : '7 Days Return',
      subtitle: isBengali ? 'সহজ প্রতিস্থাপন' : 'Hassle-Free Replacement',
    },
    {
      icon: Banknote,
      title: isBengali ? 'ক্যাশ অন ডেলিভারি' : 'Pay on Delivery',
      subtitle: isBengali ? 'COD উপলব্ধ' : 'Cash or UPI',
    },
    {
      icon: Truck,
      title: isBengali ? 'মালদা ফাস্ট সার্ভিস' : 'Malda Express',
      subtitle: isBengali ? 'দ্রুত হোম ডেলিভারি' : 'Superfast Dispatch',
    },
  ];

  return (
    <div
      className={`grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 rounded-2xl bg-gray-50/80 border border-gray-200/90 ${className}`}
    >
      {badges.map((b, i) => {
        const Icon = b.icon;
        return (
          <div
            key={i}
            className="flex flex-col items-center text-center p-2 rounded-xl bg-white border border-gray-100 shadow-2xs hover:border-amber-200 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-1.5">
              <Icon className="w-4 h-4 stroke-[2.2]" />
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-gray-900 leading-tight">
              {b.title}
            </span>
            <span className="text-[9px] sm:text-[10px] text-gray-500 mt-0.5">
              {b.subtitle}
            </span>
          </div>
        );
      })}
    </div>
  );
};
