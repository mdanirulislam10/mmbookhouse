'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Flame, Clock, ShieldCheck, Tag, Sparkles, Zap, Gift, CheckCircle2, RefreshCw } from 'lucide-react';
import { DealCard } from '@/components/deals/DealCard';
import { FLASH_DEALS, getDealStatus } from '@/lib/data/flashDeals';
import { DealType } from '@/types/deal';
import { toBengaliNumerals } from '@/lib/utils/currency';
import { syncServerTime, isClockSynced } from '@/lib/utils/serverTime';

type FilterType = 'all' | DealType | 'upcoming';

export default function DealsPage() {
  const [selectedType, setSelectedType] = useState<FilterType>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [serverSynced, setServerSynced] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    syncServerTime().then(() => {
      setServerSynced(isClockSynced());
    });
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await syncServerTime();
    setServerSynced(isClockSynced());
    setTimeout(() => setIsSyncing(false), 500);
  };

  // Distinct category list from deals
  const categories = [
    { id: 'all', label: 'সব ক্যাটাগরি' },
    { id: 'wbcs', label: 'WBCS স্পেশাল' },
    { id: 'college', label: 'কলেজ সহায়িকা' },
    { id: 'literature', label: 'উইকএন্ড সাহিত্য' },
    { id: 'school', label: 'মাধ্যমিক টেস্ট পেপার' },
  ];

  const filteredDeals = FLASH_DEALS.filter((deal) => {
    // Deal Type Filter
    const status = getDealStatus(deal);
    if (selectedType === 'upcoming') {
      if (status !== 'upcoming') return false;
    } else if (selectedType !== 'all') {
      if (deal.dealType !== selectedType || status === 'upcoming') return false;
    }

    // Category Filter
    if (selectedCategory !== 'all' && deal.category !== selectedCategory) {
      return false;
    }

    return true;
  });

  const getDealTypeCount = (type: FilterType) => {
    if (type === 'all') return FLASH_DEALS.length;
    if (type === 'upcoming') return FLASH_DEALS.filter((d) => getDealStatus(d) === 'upcoming').length;
    return FLASH_DEALS.filter((d) => d.dealType === type && getDealStatus(d) !== 'upcoming').length;
  };

  return (
    <div className="max-w-[1500px] mx-auto px-4 py-6 min-h-[80vh]">
      {/* 1. Hero Deals Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#131921] via-[#1f2a37] to-[#232f3e] text-white p-6 sm:p-8 mb-8 border border-amber-500/30 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/30 border border-red-500/40 text-red-300 text-xs font-bold uppercase tracking-wider mb-3 font-bengali">
              <Flame className="w-4 h-4 text-red-400 animate-pulse" />
              <span>ফ্ল্যাশ সেল ও আজকের লাইভ ডিলস হাব</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight font-bengali">
              M.M Book House <span className="text-amber-400">Deal of the Day & Flash Hub</span>
            </h1>
            <p className="text-sm text-gray-300 mt-2 max-w-xl font-bengali">
              মালদা স্টোর এক্সক্লুসিভ সীমিত সময়ের বাছাইকৃত WBCS, কলেজ সেমিস্টার, মাধ্যমিক ও ক্লাসিক সাহিত্যের বইয়ে ৩৫% থেকে ৫০% পর্যন্ত আকর্ষণীয় ছাড়!
            </p>
          </div>

          {/* Task 30: Real-time Server Clock Sync Card */}
          <div className="bg-black/50 border border-white/10 rounded-xl p-4 text-center shrink-0 min-w-[240px] backdrop-blur-md">
            <div className="text-[11px] text-gray-400 font-semibold tracking-wider flex items-center justify-center gap-1.5 mb-1 font-bengali">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>সার্ভার ক্লক স্ট্যাটাস</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-sm font-bengali my-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{serverSynced ? 'IST সার্ভার টাইম সিঙ্কড' : 'সিঙ্ক করা হচ্ছে...'}</span>
            </div>
            <p className="text-[10px] text-gray-400 font-bengali">
              টাইম-জোন: Asia/Kolkata (+05:30)
            </p>
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="mt-2 text-[11px] text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 cursor-pointer font-bengali"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>টাইম পুনরায় সিঙ্ক করুন</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Deals Type Filter Tabs (Task 26) */}
      <div className="space-y-3 mb-6">
        {/* Deal Types Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-2 font-bengali">
            <Tag className="w-3.5 h-3.5 text-amber-600" />
            <span>ডিল অফার:</span>
          </span>

          <button
            type="button"
            onClick={() => setSelectedType('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold font-bengali whitespace-nowrap transition-all cursor-pointer ${
              selectedType === 'all'
                ? 'bg-[#232f3e] text-white shadow-xs'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            সব অফার ({toBengaliNumerals(getDealTypeCount('all'))})
          </button>

          <button
            type="button"
            onClick={() => setSelectedType('deal_of_the_day')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold font-bengali whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedType === 'deal_of_the_day'
                ? 'bg-[#cc0c39] text-white shadow-xs'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Deal of the Day ({toBengaliNumerals(getDealTypeCount('deal_of_the_day'))})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedType('lightning_deal')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold font-bengali whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedType === 'lightning_deal'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Lightning Deals ({toBengaliNumerals(getDealTypeCount('lightning_deal'))})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedType('weekend_special')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold font-bengali whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedType === 'weekend_special'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Weekend Special ({toBengaliNumerals(getDealTypeCount('weekend_special'))})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedType('upcoming')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold font-bengali whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedType === 'upcoming'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-blue-700 hover:bg-blue-50 border border-blue-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>আসন্ন ডিল ({toBengaliNumerals(getDealTypeCount('upcoming'))})</span>
          </button>
        </div>

        {/* Category Secondary Filter Bar (Task 27) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <span className="text-xs font-bold text-gray-600 shrink-0 mr-1 font-bengali">
            ক্যাটাগরি:
          </span>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-md text-xs font-semibold font-bengali transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Flash Deals Book Grid (Tasks 21–30) */}
      {filteredDeals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center my-8">
          <p className="text-base text-gray-600 font-bengali">
            নির্বাচিত ফিল্টারের অধীনে বর্তমানে কোনো ডিল অফার নেই।
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedType('all');
              setSelectedCategory('all');
            }}
            className="mt-4 px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-500 font-bold text-xs text-gray-950 font-bengali transition-colors"
          >
            ফিল্টার রিসেট করুন
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {filteredDeals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      )}

      {/* 4. Trust & Delivery Guarantee */}
      <div className="bg-amber-50/60 border border-amber-200/60 rounded-xl p-6 text-center text-gray-800 max-w-2xl mx-auto">
        <ShieldCheck className="w-8 h-8 text-amber-600 mx-auto mb-2" />
        <h4 className="font-bold text-sm text-gray-900 mb-1 font-bengali">
          ১০০% অরিজিনাল বই ও মালদা কাউন্টার থেকে দ্রুততম ডেলিভারি
        </h4>
        <p className="text-xs text-gray-600 font-bengali">
          মালদা শহরের মধ্যে ২৪ ঘণ্টার মধ্যে হোম ডেলিভারি অথবা নেতাজি সুভাষ রোড কাউন্টার থেকে বিনামূল্যে সরাসরি সংগ্রহ করুন।
        </p>
      </div>
    </div>
  );
}

