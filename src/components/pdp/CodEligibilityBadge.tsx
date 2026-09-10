'use client';

import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Banknote,
  Info,
  CreditCard,
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useDeliveryLocation } from '@/hooks/useDeliveryLocation';
import { lookupPincodeServiceability, DEFAULT_PINCODE } from '@/lib/data/pincodeData';
import { formatINR } from '@/lib/utils/currency';

export interface CodEligibilityBadgeProps {
  pincode?: string;
  isCodAvailable?: boolean;
  codHandlingFee?: number;
  compact?: boolean;
  showHandlingFeeNotice?: boolean;
  className?: string;
}

/**
 * Module 8:
 * - Task 21 (COD Eligibility): "✔ Cash on Delivery eligible" / "অনলাইন পেমেন্ট আবশ্যক"
 * - Task 22 (COD Handling Fee): "ক্যাশ অন ডেলিভারির ক্ষেত্রে কুরিয়ার হ্যান্ডলিং চার্জ ₹৩০ প্রযোজ্য"
 */
export const CodEligibilityBadge: React.FC<CodEligibilityBadgeProps> = ({
  pincode: propPincode,
  isCodAvailable: propIsCodAvailable,
  codHandlingFee: propCodHandlingFee,
  compact = false,
  showHandlingFeeNotice = true,
  className = '',
}) => {
  const { isBengali } = useLanguage();
  const { location } = useDeliveryLocation();

  const activePincode = propPincode || location.pincode || DEFAULT_PINCODE;
  const serviceInfo = lookupPincodeServiceability(activePincode);

  const isEligible =
    propIsCodAvailable !== undefined
      ? propIsCodAvailable
      : serviceInfo.isCodAvailable;

  const handlingFee =
    propCodHandlingFee !== undefined
      ? propCodHandlingFee
      : serviceInfo.codHandlingFee;

  const isMaldaLocal = activePincode.startsWith('732');

  // Case 1: COD Eligible
  if (isEligible) {
    return (
      <div
        className={`rounded-xl border transition-all ${
          compact
            ? 'p-2 bg-emerald-50/70 border-emerald-200'
            : 'p-3 bg-gradient-to-r from-emerald-50/80 via-white to-emerald-50/40 border-emerald-300/80 shadow-2xs'
        } ${className}`}
        data-testid="cod-eligibility-badge"
      >
        <div className="flex items-start gap-2">
          <div className="p-1 rounded-md bg-emerald-100/90 text-emerald-700 shrink-0 mt-0.5">
            <CheckCircle2 className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-emerald-900 text-xs sm:text-sm">
                {isBengali
                  ? '✔ ক্যাশ অন ডেলিভারি (COD) উপলব্ধ'
                  : '✔ Cash on Delivery eligible'}
              </span>
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                {activePincode}
              </span>
            </div>

            <p className="text-[11px] sm:text-xs text-gray-600 mt-0.5 leading-relaxed">
              {isBengali
                ? 'বই হাতে পেয়ে নগদ বা ইউপিআই (UPI)-তে মূল্য পরিশোধ করুন।'
                : 'Pay with cash or UPI at the doorstep upon parcel arrival.'}
            </p>

            {/* Task 22: COD Handling Fee Transparency */}
            {showHandlingFeeNotice && (
              <div className="mt-2 pt-2 border-t border-emerald-200/60 text-[11px]">
                {handlingFee > 0 ? (
                  <div className="flex items-start gap-1.5 text-amber-900 bg-amber-50/80 p-2 rounded-lg border border-amber-200">
                    <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block">
                        {isBengali
                          ? `ক্যাশ অন ডেলিভারির ক্ষেত্রে কুরিয়ার হ্যান্ডলিং চার্জ ${formatINR(handlingFee, 'bn')} প্রযোজ্য`
                          : `Courier handling charge of ${formatINR(handlingFee, 'en')} applies on Cash on Delivery`}
                      </span>
                      <span className="text-gray-600 block text-[10px] mt-0.5">
                        {isBengali
                          ? '💡 অনলাইন পেমেন্টে (UPI / কার্ড) এই চার্জ সম্পূর্ণ ফ্রি!'
                          : '💡 Pay online via UPI or Card to save this handling charge!'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-emerald-800">
                    <Banknote className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      {isMaldaLocal
                        ? isBengali
                          ? 'মালদা শহরে ক্যাশ অন ডেলিভারিতে কোনো হ্যান্ডলিং চার্জ নেই (সম্পূর্ণ ফ্রি ₹০)'
                          : 'Zero COD handling fee across Malda Town (FREE ₹0)'
                        : isBengali
                        ? 'এই অর্ডারে কোনো অতিরিক্ত COD হ্যান্ডলিং চার্জ নেই (₹০)'
                        : 'Zero COD handling charge on this order (₹0)'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Case 2: COD Not Available (Online Payment Mandatory)
  return (
    <div
      className={`rounded-xl border transition-all ${
        compact
          ? 'p-2 bg-amber-50/80 border-amber-300'
          : 'p-3 bg-gradient-to-r from-amber-50/90 via-white to-orange-50/50 border-amber-300 shadow-2xs'
      } ${className}`}
      data-testid="cod-ineligible-badge"
    >
      <div className="flex items-start gap-2">
        <div className="p-1 rounded-md bg-amber-100 text-amber-800 shrink-0 mt-0.5">
          <AlertCircle className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-amber-950 text-xs sm:text-sm">
              {isBengali ? 'অনলাইন পেমেন্ট আবশ্যক' : 'Online Payment Required'}
            </span>
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
              {activePincode}
            </span>
          </div>

          <p className="text-[11px] sm:text-xs text-gray-700 mt-1 leading-relaxed">
            {isBengali
              ? 'এই পিনকোডে সাধারণ কুরিয়ারের ক্যাশ অন ডেলিভারি (COD) সাময়িকভাবে অনুপলব্ধ। অর্ডার নিশ্চিত করতে UPI, ডেবিট/ক্রেডিট কার্ড বা নেট ব্যাংকিং-এ পেমেন্ট করুন।'
              : 'Cash on Delivery (COD) is temporarily unavailable for this pincode. Please pay online via UPI, Debit/Credit Card, or NetBanking.'}
          </p>

          <div className="mt-2 flex items-center gap-2 text-[10px] text-gray-500 font-medium">
            <CreditCard className="w-3.5 h-3.5 text-gray-400" />
            <span>
              {isBengali
                ? 'UPI (GPay / PhonePe / Paytm), ডেবিট কার্ড ও নেটব্যাংকিং ১০০% সুরক্ষিত'
                : 'UPI (GPay, PhonePe, Paytm), Debit Card & NetBanking 100% Secured'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
