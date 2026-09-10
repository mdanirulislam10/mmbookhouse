'use client';

import React from 'react';
import {
  Store,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Navigation,
  Sparkles,
  Phone,
  Eye,
  BadgePercent,
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { MALDA_STORE_INFO, computePickupReadyTime } from '@/lib/data/pincodeData';

export interface BopisPickupCardProps {
  isSelected?: boolean;
  onSelect?: () => void;
  className?: string;
  bookPrice?: number;
}

/**
 * Task 24: BOPIS (Buy Online, Pick Up In Store) Benefit Card
 * "স্টোর পিকআপ নির্বাচন করলে জিরো শিপিং ফি ও জিরো ওয়েটিং বেনিফিট কার্ড"
 */
export const BopisPickupCard: React.FC<BopisPickupCardProps> = ({
  isSelected = false,
  onSelect,
  className = '',
  bookPrice = 0,
}) => {
  const { isBengali } = useLanguage();
  const readyEstimate = computePickupReadyTime();

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        isSelected
          ? 'bg-gradient-to-br from-amber-50 via-white to-orange-50/60 border-amber-500 ring-2 ring-amber-300 shadow-md'
          : 'bg-white border-amber-300/90 hover:border-amber-400 hover:shadow-xs'
      } ${className}`}
      data-testid="bopis-pickup-card"
    >
      {/* Header with Store & Zero Shipping Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 px-4 py-2.5 text-white flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Store className="w-4 h-4 shrink-0 text-amber-100" />
          <span className="font-bold text-xs sm:text-sm truncate">
            {isBengali ? 'স্টোর সেলফ-পিকআপ (BOPIS)' : 'Store Self-Pickup (BOPIS)'}
          </span>
        </div>

        <span className="text-[11px] font-black uppercase tracking-wider bg-white text-amber-900 px-2 py-0.5 rounded-full shrink-0 shadow-2xs">
          {isBengali ? '১০০% ফ্রি' : '100% Free'}
        </span>
      </div>

      <div className="p-4 space-y-3.5">
        {/* Readiness Tag */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-xs font-bold text-amber-950">
              {MALDA_STORE_INFO.storeNameBn}
            </span>
          </div>

          {onSelect && (
            <button
              type="button"
              onClick={onSelect}
              className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                isSelected
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
              }`}
            >
              {isSelected
                ? isBengali
                  ? '✓ নির্বাচিত'
                  : '✓ Selected'
                : isBengali
                ? 'পিকআপ বাছুন'
                : 'Choose Pickup'}
            </button>
          )}
        </div>

        {/* Ready by Schedule */}
        <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs flex items-center gap-2 text-amber-950 font-semibold">
          <Clock className="w-4 h-4 text-amber-700 shrink-0" />
          <div className="leading-snug">
            <span>
              {isBengali
                ? readyEstimate.readyTextBn
                : readyEstimate.readyTextEn}
            </span>
            <span className="text-gray-500 font-normal block text-[10px]">
              {isBengali
                ? readyEstimate.readySubtextBn
                : readyEstimate.readySubtextEn}
            </span>
          </div>
        </div>

        {/* 4 Core BOPIS Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {/* Benefit 1: Zero Shipping Fee */}
          <div className="flex items-start gap-2 p-2 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
            <BadgePercent className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-emerald-900 font-bold block text-[11px] sm:text-xs">
                {isBengali ? 'জিরো শিপিং ফি (₹০)' : 'Zero Shipping Fee (₹0)'}
              </strong>
              <p className="text-[10px] text-gray-600">
                {isBengali
                  ? 'ডেলিভারি চার্জ সম্পূর্ণ বাঁচান'
                  : 'Save full standard courier fee'}
              </p>
            </div>
          </div>

          {/* Benefit 2: Zero Waiting / Skip the Line */}
          <div className="flex items-start gap-2 p-2 rounded-xl bg-sky-50/60 border border-sky-200/80">
            <Sparkles className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-sky-950 font-bold block text-[11px] sm:text-xs">
                {isBengali ? 'জিরো ওয়েটিং (নো লাইন)' : 'Zero Waiting (Skip Queue)'}
              </strong>
              <p className="text-[10px] text-gray-600">
                {isBengali
                  ? 'আগে থেকেই পার্সেল প্যাক থাকবে'
                  : 'Pre-packed express counter pickup'}
              </p>
            </div>
          </div>

          {/* Benefit 3: Touch & Inspect Book */}
          <div className="flex items-start gap-2 p-2 rounded-xl bg-purple-50/60 border border-purple-200/80">
            <Eye className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-purple-950 font-bold block text-[11px] sm:text-xs">
                {isBengali ? 'বই দেখে যাচাইয়ের সুযোগ' : 'Inspect Book in Hand'}
              </strong>
              <p className="text-[10px] text-gray-600">
                {isBengali
                  ? 'কাউন্টারে পাতা ও বাইন্ডিং দেখে নিন'
                  : 'Verify print & binding before taking'}
              </p>
            </div>
          </div>

          {/* Benefit 4: Instant Counter Exchange */}
          <div className="flex items-start gap-2 p-2 rounded-xl bg-orange-50/60 border border-orange-200/80">
            <ShieldCheck className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-orange-950 font-bold block text-[11px] sm:text-xs">
                {isBengali ? 'তাত্ক্ষণিক কাউন্টার সমাধান' : 'Instant Counter Support'}
              </strong>
              <p className="text-[10px] text-gray-600">
                {isBengali
                  ? 'অন্য বই অদল-বদল করার সহজ সুবিধা'
                  : 'Easy swap with other editions onsite'}
              </p>
            </div>
          </div>
        </div>

        {/* Store Address & Contact Row */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-600 flex-wrap gap-2">
          <span>{MALDA_STORE_INFO.storeAddressBn}</span>

          <div className="flex items-center gap-3 font-semibold">
            <a
              href={`tel:${MALDA_STORE_INFO.phone}`}
              className="inline-flex items-center gap-1 text-gray-700 hover:text-gray-900"
            >
              <Phone className="w-3 h-3 text-emerald-600" />
              <span>{MALDA_STORE_INFO.phoneDisplay}</span>
            </a>

            <a
              href={MALDA_STORE_INFO.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-amber-800 hover:text-amber-950 font-bold underline"
            >
              <Navigation className="w-3 h-3 text-amber-700" />
              <span>{isBengali ? 'ম্যাপ দেখুন' : 'Directions'}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
