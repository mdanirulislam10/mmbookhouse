'use client';

import React, { useState } from 'react';
import { ShieldCheck, RotateCcw, Banknote, Truck, ChevronRight, X, Info } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

export interface TrustBadgeItem {
  id: string;
  icon: React.ElementType;
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  accentColor: string;
}

const TRUST_BADGES: TrustBadgeItem[] = [
  {
    id: 'original',
    icon: ShieldCheck,
    title: '100% Original Book',
    titleBn: '১০০% আসল বই',
    description: 'Sourced directly from authorized publishers. Guaranteed authentic copies with genuine holographic seals.',
    descriptionBn: 'সরাসরি অনুমোদিত প্রকাশনী থেকে সংগৃহীত। জেনুইন হলোগ্রাম ও প্রামাণ্য সংস্করণ নিশ্চিত।',
    accentColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  },
  {
    id: 'return',
    icon: RotateCcw,
    title: '7 Days Replacement',
    titleBn: '৭ দিনের সহজ রিটার্ন',
    description: 'Hassle-free replacement if damaged, misprinted, or missing pages. No questions asked return assistance.',
    descriptionBn: 'ছেঁড়া, মিসপ্রিন্ট বা পৃষ্ঠা গায়েব থাকলে ৭ দিনের ভেতর সহজ পরিবর্তন ও রিটার্ন সুবিধা।',
    accentColor: 'text-sky-700 bg-sky-50 border-sky-200',
  },
  {
    id: 'cod',
    icon: Banknote,
    title: 'Cash on Delivery',
    titleBn: 'ক্যাশ অন ডেলিভারি',
    description: 'Pay safely upon doorstep delivery anywhere across Malda district and West Bengal.',
    descriptionBn: 'বই হাতে পেয়ে নিশ্চিন্তে মূল্য পরিশোধের সুবিধা (মালদা ও সমগ্র পশ্চিমবঙ্গ জুড়ে)।',
    accentColor: 'text-amber-700 bg-amber-50 border-amber-200',
  },
  {
    id: 'delivery',
    icon: Truck,
    title: 'Fast Malda Delivery',
    titleBn: 'মালদা সুপারফাস্ট ডেলিভারি',
    description: 'Same-day delivery within Malda Town (English Bazar, Mangalbari) and 24-48h for all blocks.',
    descriptionBn: 'মালদা শহরে সেম-ডে ডেলিভারি এবং জেলার সমস্ত ব্লকে ২৪-৪৮ ঘণ্টার মধ্যে হোম ডেলিভারি।',
    accentColor: 'text-indigo-700 bg-indigo-50 border-indigo-200',
  },
];

interface TrustBadgesBlockProps {
  className?: string;
  layout?: 'grid' | 'row';
}

export const TrustBadgesBlock: React.FC<TrustBadgesBlockProps> = ({
  className = '',
  layout = 'grid',
}) => {
  const { isBengali } = useLanguage();
  const [activeModalBadge, setActiveModalBadge] = useState<TrustBadgeItem | null>(null);

  return (
    <div className={`py-3 font-sans ${className}`}>
      {/* 4-Item Amazon Badges Layout */}
      <div
        className={
          layout === 'grid'
            ? 'grid grid-cols-2 sm:grid-cols-4 gap-2 text-center'
            : 'flex items-center justify-between gap-2 overflow-x-auto pb-1 text-center scrollbar-none'
        }
      >
        {TRUST_BADGES.map((badge) => {
          const Icon = badge.icon;
          return (
            <button
              key={badge.id}
              type="button"
              onClick={() => setActiveModalBadge(badge)}
              className="group flex flex-col items-center p-2 rounded-lg hover:bg-neutral-50 transition-colors focus:outline-none focus:ring-1 focus:ring-amber-500 text-left sm:text-center w-full"
            >
              {/* Circular Icon Wrapper */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border mb-1.5 transition-transform group-hover:scale-105 ${badge.accentColor}`}
              >
                <Icon className="w-5 h-5" />
              </div>

              {/* Title */}
              <span className="text-xs font-semibold text-neutral-800 leading-tight group-hover:text-amber-700 line-clamp-2">
                {isBengali ? badge.titleBn : badge.title}
              </span>

              {/* Subtle Learn more hint */}
              <span className="text-[10px] text-sky-700 font-medium mt-0.5 inline-flex items-center gap-0.5">
                {isBengali ? 'বিস্তারিত' : 'Learn more'}
                <ChevronRight className="w-2.5 h-2.5" />
              </span>
            </button>
          );
        })}
      </div>

      {/* Policy Detail Micro Modal */}
      {activeModalBadge && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setActiveModalBadge(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-5 border border-neutral-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center border ${activeModalBadge.accentColor}`}
                >
                  <activeModalBadge.icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-neutral-900 text-sm sm:text-base">
                    {isBengali ? activeModalBadge.titleBn : activeModalBadge.title}
                  </h4>
                  <p className="text-xs text-neutral-500">M.M Book House Malda Trust Policy</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalBadge(null)}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 focus:outline-none"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="pt-3 text-sm text-neutral-600 leading-relaxed">
              <p>{isBengali ? activeModalBadge.descriptionBn : activeModalBadge.description}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-100 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModalBadge(null)}
                className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-md shadow-xs"
              >
                {isBengali ? 'বুঝেছি' : 'Got it'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrustBadgesBlock;
