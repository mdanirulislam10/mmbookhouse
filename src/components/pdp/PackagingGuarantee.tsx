'use client';

import React, { useState } from 'react';
import {
  CloudRain,
  ShieldCheck,
  Package,
  Layers,
  Sparkles,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

export interface PackagingGuaranteeProps {
  compact?: boolean;
  showLayers?: boolean;
  className?: string;
}

/**
 * Task 29: Waterproof Bubble Packaging Guarantee Badge
 * "🌧️ ১০০% ওয়াটারপ্রুফ ও বাবল র‍্যাপড প্যাকেজিং"
 * "বৃষ্টি বা পরিবহনে বই থাকবে একদম নতুনের মতো সুরক্ষিত"
 */
export const PackagingGuarantee: React.FC<PackagingGuaranteeProps> = ({
  compact = false,
  showLayers = true,
  className = '',
}) => {
  const { isBengali } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`rounded-xl border transition-all ${
        compact
          ? 'p-2.5 bg-blue-50/60 border-blue-200'
          : 'p-3.5 bg-gradient-to-r from-blue-50/80 via-white to-cyan-50/50 border-blue-200/90 hover:border-blue-300 shadow-2xs'
      } ${className}`}
      data-testid="packaging-guarantee"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="p-1.5 rounded-xl bg-blue-600 text-white shrink-0 shadow-2xs mt-0.5">
            <CloudRain className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-blue-950 text-xs sm:text-sm">
                {isBengali
                  ? '🌧️ ১০০% ওয়াটারপ্রুফ ও বাবল র‍্যাপড প্যাকেজিং'
                  : '🌧️ 100% Waterproof & Bubble-Wrapped Packaging'}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 border border-blue-200">
                {isBengali ? 'নিরাপত্তা গ্যারান্টি' : 'Safe Transit'}
              </span>
            </div>

            <p className="text-[11px] sm:text-xs text-gray-600 mt-0.5 leading-relaxed">
              {isBengali
                ? 'বৃষ্টি বা কুরিয়ার পরিবহনে বই থাকবে ভাঁজহীন ও সম্পূর্ণ নতুনের মতো সুরক্ষিত।'
                : 'Zero moisture, rain or transit edge damage — your book arrives factory fresh.'}
            </p>
          </div>
        </div>

        {showLayers && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[11px] font-bold text-blue-700 hover:text-blue-900 inline-flex items-center gap-0.5 shrink-0 cursor-pointer pt-0.5"
            title={isBengali ? '৩ স্তরের প্যাকেজিং দেখুন' : 'View 3-layer protection'}
          >
            <span className="hidden sm:inline">
              {isBengali ? '৩টি স্তর' : '3-Layers'}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>
        )}
      </div>

      {/* 3-Layer Protective Breakdown */}
      {showLayers && isExpanded && (
        <div className="mt-3 pt-2.5 border-t border-blue-100 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs animate-in fade-in duration-150">
          <div className="p-2 rounded-lg bg-white/90 border border-blue-100 shadow-2xs">
            <div className="flex items-center gap-1.5 font-bold text-blue-900 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>{isBengali ? 'স্তর ১: সিলড পাউচ' : 'Layer 1: Sealed Pouch'}</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {isBengali
                ? 'বর্ষা ও আর্দ্রতা রোধে ওয়াটারপ্রুফ ইনার পলি'
                : '100% moisture & water sealed inner poly'}
            </p>
          </div>

          <div className="p-2 rounded-lg bg-white/90 border border-blue-100 shadow-2xs">
            <div className="flex items-center gap-1.5 font-bold text-blue-900 text-[11px]">
              <Layers className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>{isBengali ? 'স্তর ২: বাবল র‍্যাপ' : 'Layer 2: Bubble Cushion'}</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {isBengali
                ? 'বইয়ের কোণ ও বাইন্ডিং রক্ষায় কুশনিং'
                : 'Heavy shock-absorbing corner protection'}
            </p>
          </div>

          <div className="p-2 rounded-lg bg-white/90 border border-blue-100 shadow-2xs">
            <div className="flex items-center gap-1.5 font-bold text-blue-900 text-[11px]">
              <Package className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>{isBengali ? 'স্তর ৩: টেম্পার প্রুফ' : 'Layer 3: Security Seal'}</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {isBengali
                ? 'হেভি-ডিউটি কুরিয়ার ব্যাগ ও সিকিউরিটি টেপ'
                : 'Heavy-duty tear-resistant tamper bag'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
