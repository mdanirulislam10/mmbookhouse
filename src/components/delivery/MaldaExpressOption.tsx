'use client';

import React from 'react';
import { Zap, Truck, Check, Sparkles } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { toBengaliNumerals } from '@/lib/services/holidayCalendar';
import { DeliverySpeedOption } from '@/types/delivery';
import { isMaldaTownPincode } from '@/lib/services/slaEngine';

export interface MaldaExpressOptionProps {
  pincode: string;
  selectedOption: DeliverySpeedOption;
  onChange: (option: DeliverySpeedOption) => void;
  isFreeStandardShipping?: boolean;
  className?: string;
}

export const MaldaExpressOption: React.FC<MaldaExpressOptionProps> = ({
  pincode,
  selectedOption,
  onChange,
  isFreeStandardShipping = false,
  className = '',
}) => {
  const { isBengali } = useLanguage();

  // Task 20: Only Malda Municipality urban core is eligible for 2-hour bike rider delivery
  if (!isMaldaTownPincode(pincode)) {
    return null;
  }

  return (
    <div
      aria-label="Malda Express Delivery Options"
      className={`rounded-xl border border-amber-200/90 bg-amber-50/40 p-3 space-y-2.5 text-xs ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="font-bold text-gray-900 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
          <span>{isBengali ? 'মালদা পৌরসভা ডেলিভারি গতি নির্বাচন করুন' : 'Malda Municipality Delivery Speed'}</span>
        </span>
        <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-1.5 py-0.5 rounded">
          {isBengali ? 'লোকাল সুবিধা' : 'Local Advantage'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Option 1: Standard Delivery */}
        <label
          onClick={() => onChange('standard')}
          className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
            selectedOption === 'standard'
              ? 'bg-white border-[#007185] ring-2 ring-[#007185]/20 shadow-xs'
              : 'bg-white/60 border-gray-200 hover:border-gray-300'
          }`}
        >
          <input
            type="radio"
            name="delivery_speed"
            value="standard"
            checked={selectedOption === 'standard'}
            onChange={() => onChange('standard')}
            className="mt-0.5 text-[#007185] focus:ring-[#007185]"
          />
          <div className="min-w-0 flex-1 leading-snug">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900">
                {isBengali ? 'স্ট্যান্ডার্ড ডেলিভারি' : 'Standard Delivery'}
              </span>
              <span className="font-extrabold text-emerald-700">
                {isFreeStandardShipping
                  ? (isBengali ? 'বিনামূল্যে' : 'FREE')
                  : '₹৪০'}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {isBengali
                ? 'আজ সন্ধ্যা বা আগামীকাল বিকেলের মধ্যে'
                : 'Today evening or by tomorrow'}
            </p>
          </div>
        </label>

        {/* Option 2: 2-Hour Super-Express Delivery (+₹30) */}
        <label
          onClick={() => onChange('malda_2hr_express')}
          className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all relative overflow-hidden ${
            selectedOption === 'malda_2hr_express'
              ? 'bg-gradient-to-br from-amber-50 to-orange-50/80 border-orange-500 ring-2 ring-orange-200 shadow-xs'
              : 'bg-white/80 border-amber-300 hover:border-orange-400'
          }`}
        >
          <input
            type="radio"
            name="delivery_speed"
            value="malda_2hr_express"
            checked={selectedOption === 'malda_2hr_express'}
            onChange={() => onChange('malda_2hr_express')}
            className="mt-0.5 text-orange-600 focus:ring-orange-500"
          />
          <div className="min-w-0 flex-1 leading-snug">
            <div className="flex items-center justify-between">
              <span className="font-bold text-orange-950 flex items-center gap-1">
                <span>{isBengali ? '২ ঘণ্টার সুপার-এক্সপ্রেস' : '2-Hour Super Express'}</span>
                <Sparkles className="w-3 h-3 text-orange-500 fill-orange-400" />
              </span>
              <span className="font-extrabold text-orange-700 font-mono">
                +₹{toBengaliNumerals(30)}
              </span>
            </div>
            <p className="text-[11px] text-amber-900 font-medium mt-0.5">
              {isBengali
                ? 'নেতাজি সুভাষ রোড স্টোর থেকে নিজস্ব রাইডারে সরাসরি ২ ঘণ্টার মধ্যে ডেলিভারি'
                : 'Direct rider delivery within 2 hours from NS Road Store'}
            </p>
          </div>
        </label>
      </div>
    </div>
  );
};
