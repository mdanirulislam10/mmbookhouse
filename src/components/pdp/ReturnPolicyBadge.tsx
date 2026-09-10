'use client';

import React, { useState } from 'react';
import {
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  X,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { toBengaliNumerals } from '@/lib/utils/currency';

export interface ReturnPolicyBadgeProps {
  days?: number;
  compact?: boolean;
  className?: string;
}

/**
 * Task 27: 7 Days Easy Return & Replacement Guarantee Badge
 * "৭ দিনের সহজ রিটার্ন ও প্রতিস্থাপন নিশ্চয়তা ব্যাজ"
 * "৭ দিনের মধ্যে সহজে রিটার্ন বা ত্রুটিপূর্ণ বই বদলের গ্যারান্টি"
 */
export const ReturnPolicyBadge: React.FC<ReturnPolicyBadgeProps> = ({
  days = 7,
  compact = false,
  className = '',
}) => {
  const { isBengali } = useLanguage();
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  const daysDisplay = isBengali ? `${toBengaliNumerals(days)} দিন` : `${days} Days`;

  return (
    <>
      <div
        className={`rounded-xl border transition-all select-none ${
          compact
            ? 'p-2 bg-sky-50/70 border-sky-200'
            : 'p-3 bg-gradient-to-r from-sky-50/80 via-white to-blue-50/40 border-sky-200/90 hover:border-sky-300 shadow-2xs'
        } ${className}`}
        data-testid="return-policy-badge"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <div className="p-1 rounded-md bg-sky-100 text-sky-700 shrink-0 mt-0.5">
              <RotateCcw className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-sky-950 text-xs sm:text-sm">
                  {isBengali
                    ? `${toBengaliNumerals(days)} দিনের সহজ প্রতিস্থাপন গ্যারান্টি`
                    : `${days}-Day Easy Replacement Guarantee`}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-sky-100 text-sky-800">
                  {isBengali ? '১০০% নিশ্চিত' : '100% Assured'}
                </span>
              </div>

              <p className="text-[11px] sm:text-xs text-gray-600 mt-0.5 leading-relaxed">
                {isBengali
                  ? 'পৃষ্ঠা মিসিং, ছাপা অস্পষ্ট বা বাইন্ডিং ত্রুটি থাকলে সহজে ফ্রি বদল।'
                  : 'Free replacement if you receive misprinted, damaged or wrong book.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowPolicyModal(true)}
            className="text-[11px] font-bold text-sky-700 hover:text-sky-900 hover:underline shrink-0 cursor-pointer pt-0.5"
            title={isBengali ? 'রিটার্ন পলিসির নিয়মাবলী' : 'Return Policy Details'}
          >
            {isBengali ? 'নিয়মাবলী' : 'Policy'}
          </button>
        </div>
      </div>

      {/* Return Policy Explanatory Modal */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-sky-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-sky-100 text-sky-800">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-gray-900">
                    {isBengali
                      ? '৭ দিনের সহজ প্রতিস্থাপন পলিসি'
                      : '7-Day Easy Replacement Policy'}
                  </h3>
                  <span className="text-xs text-gray-500">M.M Book House Malda</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPolicyModal(false)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-gray-700 space-y-2.5 leading-relaxed">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  {isBengali
                    ? 'বই হাতে পাওয়ার ৭ দিনের মধ্যে যেকোনো ছাপার ত্রুটি, পাতা উল্টাপাল্টা বা কুরিয়ারে ক্ষতিগ্রস্ত বইয়ের সম্পূর্ণ ফ্রি রিপ্লেসমেন্ট দেওয়া হয়।'
                    : 'Get 100% free replacement within 7 days of delivery for missing pages, printing errors, or transit damage.'}
                </span>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  {isBengali
                    ? 'মালদা শহরের কাস্টমাররা নেতাজি সুভাষ রোড দোকানে সরাসরি এসে মুহূর্তে নতুন কপি বদল করে নিতে পারবেন।'
                    : 'Malda town customers can walk directly into our NS Road showroom for instant counter replacement.'}
                </span>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  {isBengali
                    ? 'অন্যান্য জেলার ক্ষেত্রে আমাদের হোয়াটসঅ্যাপ হেল্পলাইনে (9733085000) ছবি পাঠালে ডোরস্টেপ পিকআপ ও নতুন কপি পাঠিয়ে দেওয়া হবে।'
                    : 'For other districts, share parcel photos via WhatsApp (9733085000) to schedule doorstep return & exchange.'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPolicyModal(false)}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                {isBengali ? 'বুঝেছি' : 'Got it'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
