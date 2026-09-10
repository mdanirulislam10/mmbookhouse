'use client';

import React, { useState, useEffect } from 'react';
import { Gift, Sparkles, Check, EyeOff } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { GiftOptionsState } from '@/types/pdp';

interface GiftOptionsWidgetProps {
  value?: GiftOptionsState;
  onChange?: (state: GiftOptionsState) => void;
  className?: string;
}

export const GiftOptionsWidget: React.FC<GiftOptionsWidgetProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const { isBengali } = useLanguage();

  const [hasGiftOptions, setHasGiftOptions] = useState<boolean>(value?.hasGiftOptions ?? false);
  const [recipientName, setRecipientName] = useState<string>(value?.recipientName ?? '');
  const [giftMessage, setGiftMessage] = useState<string>(value?.giftMessage ?? '');
  const [hidePriceOnInvoice, setHidePriceOnInvoice] = useState<boolean>(
    value?.hidePriceOnInvoice ?? true
  );
  const [giftWrapType, setGiftWrapType] = useState<'standard' | 'festive' | 'none'>(
    value?.giftWrapType ?? 'standard'
  );

  // Sync state upward when internal state changes
  useEffect(() => {
    if (onChange) {
      onChange({
        hasGiftOptions,
        recipientName: hasGiftOptions ? recipientName : undefined,
        giftMessage: hasGiftOptions ? giftMessage : undefined,
        hidePriceOnInvoice: hasGiftOptions ? hidePriceOnInvoice : undefined,
        giftWrapType: hasGiftOptions ? giftWrapType : 'none',
      });
    }
  }, [hasGiftOptions, recipientName, giftMessage, hidePriceOnInvoice, giftWrapType, onChange]);

  const maxChars = 200;
  const remainingChars = maxChars - giftMessage.length;

  return (
    <div
      className={`border border-amber-200/80 bg-amber-50/40 rounded-lg p-3 text-xs sm:text-sm font-sans transition-all ${className}`}
    >
      {/* Primary Toggle Header */}
      <label className="flex items-center gap-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={hasGiftOptions}
          onChange={(e) => setHasGiftOptions(e.target.checked)}
          className="w-4 h-4 rounded border-neutral-300 text-amber-600 focus:ring-amber-500 transition-colors"
        />
        <div className="flex items-center gap-1.5 font-medium text-neutral-800">
          <Gift className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            {isBengali ? 'উপহার হিসেবে পাঠাতে চান? (Add Gift Options)' : 'Add Gift Options'}
          </span>
        </div>
      </label>

      {/* Expandable Customization Container */}
      {hasGiftOptions && (
        <div className="mt-3 pt-3 border-t border-amber-200/60 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
          {/* 1. Hide price checkbox */}
          <label className="flex items-start gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hidePriceOnInvoice}
              onChange={(e) => setHidePriceOnInvoice(e.target.checked)}
              className="mt-0.5 rounded border-neutral-300 text-amber-600 focus:ring-amber-500"
            />
            <div className="text-xs text-neutral-700 leading-snug">
              <span className="font-semibold text-neutral-900 inline-flex items-center gap-1">
                <EyeOff className="w-3.5 h-3.5 text-neutral-500" />
                {isBengali ? 'মূল্য গোপন ইনভয়েস' : 'Hide prices on packing slip'}
              </span>
              <p className="text-neutral-500 text-[11px] mt-0.5">
                {isBengali
                  ? 'ডেলিভারি চালানে বা প্যাকিং স্লিপে বইয়ের মূল্য লেখা থাকবে না।'
                  : 'Recipient will not see prices on the included delivery dispatch note.'}
              </p>
            </div>
          </label>

          {/* 2. Recipient Name Input */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
              {isBengali ? 'প্রাপকের নাম (কার জন্য উপহার?):' : 'Recipient Name:'}
            </label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder={isBengali ? 'উদা: রাহুল সরকার' : 'e.g., Rahul Sarkar'}
              maxLength={60}
              className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          {/* 3. Custom Gift Message */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-700 mb-1">
              <span>{isBengali ? 'কাস্টম শুভেচ্ছা বার্তা:' : 'Personalized Gift Message:'}</span>
              <span
                className={`text-[10px] ${remainingChars < 20 ? 'text-amber-700 font-bold' : 'text-neutral-400'}`}
              >
                {remainingChars} {isBengali ? 'অক্ষর বাকি' : 'left'}
              </span>
            </div>
            <textarea
              rows={2}
              value={giftMessage}
              onChange={(e) => setGiftMessage(e.target.value.slice(0, maxChars))}
              placeholder={
                isBengali
                  ? 'উদা: শুভ জন্মদিন ভাই! ডাব্লুবিসিএস পরীক্ষায় তোমার সর্বোচ্চ সাফল্যের জন্য শুভকামনা।'
                  : 'e.g., Happy Birthday! Wishing you all the very best for your upcoming civil services exam.'
              }
              className="w-full p-2 bg-white border border-neutral-300 rounded text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 resize-none"
            />
          </div>

          {/* 4. Gift Ribbon / Wrap Options */}
          <div>
            <span className="block text-[11px] font-semibold text-neutral-700 mb-1.5">
              {isBengali ? 'উপহারের মোড়ক (Gift Packaging):' : 'Gift Packaging:'}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGiftWrapType('standard')}
                className={`p-2 rounded border text-left transition-all ${
                  giftWrapType === 'standard'
                    ? 'border-amber-600 bg-amber-100/70 text-amber-900 font-semibold ring-1 ring-amber-600'
                    : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span>{isBengali ? 'ফ্রি রিবার্ন ও ট্যাগ' : 'Festive Ribbon'}</span>
                  {giftWrapType === 'standard' && <Check className="w-3.5 h-3.5 text-amber-700" />}
                </div>
                <span className="text-[10px] text-emerald-700 font-bold mt-0.5 block">
                  {isBengali ? 'বিনামূল্যে (FREE)' : 'Free'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setGiftWrapType('festive')}
                className={`p-2 rounded border text-left transition-all ${
                  giftWrapType === 'festive'
                    ? 'border-amber-600 bg-amber-100/70 text-amber-900 font-semibold ring-1 ring-amber-600'
                    : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span>{isBengali ? 'গোল্ডেন গিফট পেপার' : 'Premium Wrap'}</span>
                  {giftWrapType === 'festive' && <Check className="w-3.5 h-3.5 text-amber-700" />}
                </div>
                <span className="text-[10px] text-neutral-600 mt-0.5 block">+₹২৫ (Special)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GiftOptionsWidget;
