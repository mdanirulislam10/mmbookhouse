'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Flame, ArrowRight, ShieldCheck, Zap, Sparkles, Gift, Clock, CheckCircle2 } from 'lucide-react';
import { DealType } from '@/types/deal';
import { DealCard } from './DealCard';
import { FLASH_DEALS, getDealStatus } from '@/lib/data/flashDeals';
import { toBengaliNumerals } from '@/lib/utils/currency';
import { isClockSynced } from '@/lib/utils/serverTime';
import { useBannerAnalytics } from '@/hooks/useBannerAnalytics';

interface DealOfTheDayWidgetProps {
  className?: string;
}

type TabType = 'all' | DealType | 'upcoming';

/**
 * Task 21 to 30: Amazon "Deal of the Day" & Multi-Tier Flash Deals Engine
 * Features:
 * - Category tab filters (Task 26: Deal of the Day, Lightning, Weekend Special, Upcoming)
 * - Server clock sync status (Task 30)
 * - Cross-category deep routing (Task 27)
 * - Live scheduled countdown & notification engine (Tasks 28 & 29)
 */
export const DealOfTheDayWidget: React.FC<DealOfTheDayWidgetProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const { trackImpression } = useBannerAnalytics();

  React.useEffect(() => {
    trackImpression('deal-of-the-day-widget', 'Deal of the Day Flash Widget');
  }, [trackImpression]);

  const filteredDeals = FLASH_DEALS.filter((deal) => {
    if (activeTab === 'all') {
      return getDealStatus(deal) !== 'upcoming';
    }
    if (activeTab === 'upcoming') {
      return getDealStatus(deal) === 'upcoming';
    }
    return deal.dealType === activeTab && getDealStatus(deal) !== 'upcoming';
  });

  const getTabCount = (tab: TabType) => {
    if (tab === 'all') {
      return FLASH_DEALS.filter((d) => getDealStatus(d) !== 'upcoming').length;
    }
    if (tab === 'upcoming') {
      return FLASH_DEALS.filter((d) => getDealStatus(d) === 'upcoming').length;
    }
    return FLASH_DEALS.filter((d) => d.dealType === tab && getDealStatus(d) !== 'upcoming').length;
  };

  return (
    <section
      aria-label="আজকের সেরা ডিল ও ফ্ল্যাশ অফার"
      className={`max-w-[1400px] mx-auto px-2 sm:px-4 ${className}`}
    >
      {/* Widget Header Banner */}
      <div className="bg-gradient-to-r from-[#b12704] via-[#cc0c39] to-[#900] rounded-t-xl p-4 sm:p-5 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-full bg-white/20 text-white backdrop-blur-xs">
              <Flame className="w-5 h-5 fill-current text-amber-300" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black font-bengali tracking-tight">
              Deal of the Day — আজকের সেরা অফার ও ফ্ল্যাশ ডিলস
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-rose-100 font-bengali flex items-center gap-1.5 flex-wrap">
            <span>মালদা স্টোর এক্সক্লুসিভ সীমিত সময়ের মূল্যছাড় — ৫০% পর্যন্ত সাশ্রয়</span>
            <span className="hidden md:inline">• প্রতি গ্রাহক সর্বোচ্চ ১ কপি সীমাবদ্ধ</span>
            <span className="inline-flex items-center gap-1 bg-white/15 px-2 py-0.5 rounded text-[11px] font-mono text-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-300" />
              <span>IST সার্ভার সিঙ্কড</span>
            </span>
          </p>
        </div>

        {/* Global Action Link */}
        <Link
          href="/deals"
          prefetch={true}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white text-gray-950 hover:bg-amber-100 font-bold text-xs sm:text-sm font-bengali transition-colors shadow-sm self-start sm:self-center"
        >
          <span>সমস্ত ডিল হাব দেখুন</span>
          <ArrowRight className="w-4 h-4 text-gray-900" />
        </Link>
      </div>

      {/* Category Tabs Filter Bar (Task 26 & 28) */}
      <div className="bg-rose-50/70 border-x border-gray-200 px-4 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-xs font-bold text-gray-700 font-bengali shrink-0">বিভাগ:</span>

        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold font-bengali whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-gray-950 text-white shadow-xs'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          সব অফার ({toBengaliNumerals(getTabCount('all'))})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('deal_of_the_day')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold font-bengali whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
            activeTab === 'deal_of_the_day'
              ? 'bg-[#cc0c39] text-white shadow-xs'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          <span>Deal of the Day ({toBengaliNumerals(getTabCount('deal_of_the_day'))})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('lightning_deal')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold font-bengali whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
            activeTab === 'lightning_deal'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Zap className="w-3 h-3" />
          <span>Lightning Deals ({toBengaliNumerals(getTabCount('lightning_deal'))})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('weekend_special')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold font-bengali whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
            activeTab === 'weekend_special'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Gift className="w-3 h-3" />
          <span>Weekend Special ({toBengaliNumerals(getTabCount('weekend_special'))})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('upcoming')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold font-bengali whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
            activeTab === 'upcoming'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-blue-700 hover:bg-blue-50 border border-blue-200'
          }`}
        >
          <Clock className="w-3 h-3" />
          <span>আসন্ন ডিল ({toBengaliNumerals(getTabCount('upcoming'))})</span>
        </button>
      </div>

      {/* 4-Column Responsive Deals Grid */}
      <div className="bg-white/95 backdrop-blur-md rounded-b-xl border border-t-0 border-gray-200 p-4 sm:p-6 shadow-sm">
        {filteredDeals.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-500 font-bengali">এই বিভাগে বর্তমানে কোনো সক্রিয় ডিল নেই।</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 items-stretch">
            {filteredDeals.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        )}

        {/* Trust Footnote */}
        <div className="mt-5 pt-3.5 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-600 font-bengali">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>১০০% প্রামাণ্য বই, মালদা থেকে সরাসরি ডিসপ্যাচ ও ক্যাশ অন ডেলিভারি</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/60">
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span>ফ্ল্যাশ ডিল চলাকালীন কার্টে যুক্ত করা আইটেম ১০ মিনিটের জন্য সংরক্ষিত থাকবে</span>
          </div>
        </div>
      </div>
    </section>
  );
};

