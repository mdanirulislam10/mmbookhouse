'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, Banknote, CreditCard, Landmark, ShieldCheck, Lock, CheckCircle2, Sparkles, AlertCircle, Info } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { PaymentMethodType, GstBillingDetails } from '@/types/checkout';
import { getPreferredPaymentMethod, savePreferredPaymentMethod } from '@/lib/services/buyNowService';
import { evaluateCodEligibility, getPrepaidIncentiveBanner } from '@/lib/services/codRiskService';
import { GstBillingForm } from './GstBillingForm';

export interface PaymentMethodSelectorProps {
  selectedMethod?: PaymentMethodType;
  onSelectMethod: (method: PaymentMethodType) => void;
  finalPayable: number;
  useGstInvoice: boolean;
  onToggleUseGst: (enabled: boolean) => void;
  gstDetails?: GstBillingDetails;
  onChangeGstDetails: (details: GstBillingDetails, isValid: boolean) => void;
  onPlaceOrder: () => void;
  isSubmitting?: boolean;
  className?: string;
}

/**
 * Module 12 & 13: Amazon Payment Method Selector & Final Ordering Trigger (Step 3)
 * 
 * Features:
 * - 4 Payment Channels: UPI, COD, Card, NetBanking (Item 25).
 * - Mobile-first 48px+ thumb touch targets with high visual contrast.
 * - RuPay & UPI 0% Surcharge Guaranteed Badge (Item 4).
 * - Transparent COD handling charge ₹35 display (Item 14).
 * - Strict ₹2,500 COD hard cap protection (Item 13).
 * - Total ₹65 Prepaid Incentive Ribbon (Item 20).
 * - GST Institutional Billing Integration (Item 27).
 * - Amazon Classic Golden Button (Item 28).
 */
export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onSelectMethod,
  finalPayable,
  useGstInvoice,
  onToggleUseGst,
  gstDetails,
  onChangeGstDetails,
  onPlaceOrder,
  isSubmitting = false,
  className = '',
}) => {
  const { isBengali } = useLanguage();
  const [currentMethod, setCurrentMethod] = useState<PaymentMethodType>(
    selectedMethod || getPreferredPaymentMethod()
  );

  useEffect(() => {
    if (selectedMethod) {
      setCurrentMethod(selectedMethod);
    }
  }, [selectedMethod]);

  const handleSelect = (method: PaymentMethodType) => {
    setCurrentMethod(method);
    savePreferredPaymentMethod(method);
    onSelectMethod(method);
  };

  const codEligibility = evaluateCodEligibility(finalPayable);
  const prepaidBanner = getPrepaidIncentiveBanner(finalPayable);

  // Auto-switch to UPI if cart exceeds COD cap
  useEffect(() => {
    if (currentMethod === 'cod' && !codEligibility.eligible) {
      handleSelect('upi');
    }
  }, [finalPayable, codEligibility.eligible]);

  const paymentOptions: Array<{
    id: PaymentMethodType;
    title: string;
    titleBn: string;
    subtitle: string;
    subtitleBn: string;
    badge?: string;
    badgeBn?: string;
    highlightPill?: string;
    highlightPillBn?: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'upi',
      title: 'UPI (GPay, PhonePe, Paytm, QR Code)',
      titleBn: 'ইউপিআই (PhonePe, GPay, Paytm ও ডাইনামিক QR)',
      subtitle: 'Instant mobile app switch or dynamic QR with zero extra fee',
      subtitleBn: 'মোবাইল থেকে সরাসরি ১-ট্যাপে পে করুন অথবা কিউআর স্ক্যান করুন',
      badge: 'RECOMMENDED',
      badgeBn: 'সবচেয়ে দ্রুত ও নিরাপদ',
      highlightPill: '0% Surcharge',
      highlightPillBn: '০% ফি',
      icon: <Smartphone className="w-5 h-5 text-emerald-600 shrink-0" />,
    },
    {
      id: 'cod',
      title: 'Cash on Delivery (COD)',
      titleBn: 'ক্যাশ অন ডেলিভারি (বই হাতে পেয়ে মূল্য পরিশোধ)',
      subtitle: 'Pay at doorstep with cash or delivery rider UPI QR upon arrival',
      subtitleBn: 'পার্সেল পাওয়ার পর নগদ বা ডেলিভারি বয়ের কিউআর স্ক্যান করে পে করুন',
      highlightPill: '+₹35 Handling Fee',
      highlightPillBn: '+₹৩৫ হ্যান্ডলিং ফি',
      icon: <Banknote className="w-5 h-5 text-amber-600 shrink-0" />,
    },
    {
      id: 'card',
      title: 'Credit or Debit Card (ATM Card)',
      titleBn: 'ক্রেডিট বা ডেবিট কার্ড (ATM Card)',
      subtitle: 'RuPay, Visa, MasterCard • 100% RBI Tokenized Security',
      subtitleBn: 'রুপে, ভিসা, মাস্টারকার্ড • ১০০% নিরাপদ আরবিআই টোকেনাইজড পেমেন্ট',
      highlightPill: 'RBI Tokenized',
      highlightPillBn: 'টোকেনাইজড কার্ড',
      icon: <CreditCard className="w-5 h-5 text-blue-600 shrink-0" />,
    },
    {
      id: 'netbanking',
      title: 'Net Banking (All Indian Banks)',
      titleBn: 'নেট ব্যাংকিং (Net Banking)',
      subtitle: 'SBI, HDFC, ICICI, Axis, PNB, UBI and 50+ banks',
      subtitleBn: 'এসবিআই, এইচডিএফসি, পিএনবি সহ ভারতের সমস্ত শীর্ষস্থানীয় ব্যাংক',
      icon: <Landmark className="w-5 h-5 text-purple-600 shrink-0" />,
    },
  ];

  return (
    <div className={`space-y-5 select-none ${className}`}>
      {/* Prepaid Incentive Ribbon (Item 20) */}
      <div className="p-3.5 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/5 border border-emerald-300 dark:border-emerald-700/60 rounded-2xl flex items-center gap-3 text-xs text-emerald-950 dark:text-emerald-200 shadow-2xs">
        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <Sparkles className="w-4 h-4 animate-pulse" />
        </div>
        <div className="leading-tight">
          <span className="font-black text-emerald-900 dark:text-emerald-300 text-xs sm:text-sm block">
            {isBengali ? 'অনলাইন প্রিপেইড পেমেন্ট সুবিধা' : 'Online Prepaid Payment Benefit'}
          </span>
          <span className="font-medium text-[11px] sm:text-xs text-emerald-800 dark:text-emerald-100">
            {isBengali ? prepaidBanner.bannerText_bn : prepaidBanner.bannerText}
          </span>
        </div>
      </div>

      {/* 4 Payment Channel Cards with Mobile Touch Polish */}
      <div className="space-y-3">
        {paymentOptions.map((opt) => {
          const isCodDisabled = opt.id === 'cod' && !codEligibility.eligible;
          const isSelected = currentMethod === opt.id && !isCodDisabled;

          return (
            <div
              key={opt.id}
              onClick={() => {
                if (!isCodDisabled) handleSelect(opt.id);
              }}
              role="radio"
              aria-checked={isSelected}
              aria-disabled={isCodDisabled}
              tabIndex={isCodDisabled ? -1 : 0}
              onKeyDown={(e) => {
                if ((e.key === ' ' || e.key === 'Enter') && !isCodDisabled) {
                  e.preventDefault();
                  handleSelect(opt.id);
                }
              }}
              className={`relative border-2 rounded-2xl p-4 transition-all duration-200 min-h-[72px] flex items-center ${
                isCodDisabled
                  ? 'border-gray-200 bg-gray-50/80 opacity-60 cursor-not-allowed'
                  : isSelected
                  ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs ring-2 ring-emerald-500/20 cursor-pointer'
                  : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50/50 cursor-pointer'
              }`}
            >
              <div className="flex items-start justify-between gap-3 w-full">
                <div className="flex items-start gap-3.5 w-full">
                  {/* Radio Circle */}
                  <div className="pt-1 shrink-0">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isCodDisabled
                          ? 'border-gray-300 bg-gray-100'
                          : isSelected
                          ? 'border-emerald-600 bg-emerald-600'
                          : 'border-gray-300 bg-white dark:bg-zinc-800'
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>

                  <div className="space-y-1 w-full min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2 font-bold text-sm text-gray-900 dark:text-zinc-100">
                        {opt.icon}
                        <span className="truncate">{isBengali ? opt.titleBn : opt.title}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {opt.badge && (
                          <span className="bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                            {isBengali ? opt.badgeBn : opt.badge}
                          </span>
                        )}

                        {opt.highlightPill && !isCodDisabled && (
                          <span className="bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {isBengali ? opt.highlightPillBn : opt.highlightPill}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 dark:text-zinc-400 leading-snug">
                      {isBengali ? opt.subtitleBn : opt.subtitle}
                    </p>

                    {/* Hard-Cap / Blacklist Alert if COD disabled */}
                    {isCodDisabled && (
                      <div className="mt-2 flex items-start gap-1.5 p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                        <span>{isBengali ? codEligibility.reason_bn : codEligibility.reason}</span>
                      </div>
                    )}

                    {/* Transparent handling fee badge & 4-digit OTP info when COD is selected */}
                    {opt.id === 'cod' && isSelected && !isCodDisabled && (
                      <div className="mt-2 p-2.5 bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200 space-y-1">
                        <div className="flex items-center justify-between font-bold">
                          <span className="flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                            <span>{isBengali ? 'সিওডি হ্যান্ডলিং ফি ও ওটিপি শর্ত' : 'COD Terms & Verification'}</span>
                          </span>
                          <span className="text-amber-700 dark:text-amber-300 font-mono">+₹{codEligibility.handling_fee}</span>
                        </div>
                        <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-snug">
                          {isBengali
                            ? `কুরিয়ার ক্যাশ কালেকশন খরচ বাবদ ₹${codEligibility.handling_fee} ফি যুক্ত হয়েছে। ভুয়া অর্ডার রোধে ৪-সংখ্যার এসএমএস ওটিপি কনফার্মেশন সম্পন্ন হবে।`
                            : `Nominal ₹${codEligibility.handling_fee} courier cash collection fee applies. 4-digit SMS OTP is required.`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* GST Invoice Section (Item 27) */}
      <GstBillingForm
        useGstInvoice={useGstInvoice}
        onToggleUseGst={onToggleUseGst}
        gstDetails={gstDetails}
        onChangeGstDetails={onChangeGstDetails}
      />

      {/* Primary Final Action Button (Item 28) */}
      <div className="pt-4 border-t border-gray-200 dark:border-zinc-800 space-y-3">
        <button
          type="button"
          onClick={onPlaceOrder}
          disabled={isSubmitting}
          className="w-full min-h-[52px] py-3.5 px-6 rounded-full font-black text-sm sm:text-base bg-[#ffd814] hover:bg-[#f7ca00] active:bg-[#f0b800] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-gray-950 border border-[#fcd200] shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all transform active:scale-[0.99]"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
              <span>{isBengali ? 'অর্ডার প্রস্তুত হচ্ছে...' : 'Placing Order...'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-800" />
              <span>
                {isBengali
                  ? `অর্ডার সম্পন্ন ও প্রদেয় মূল্য পরিশোধ করুন (₹${finalPayable.toFixed(2)})`
                  : `Place Your Order and Pay (₹${finalPayable.toFixed(2)})`}
              </span>
            </div>
          )}
        </button>

        {/* Security Footnote */}
        <div className="flex items-center justify-center gap-2 text-center text-[11px] text-gray-500 dark:text-zinc-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>
            {isBengali
              ? 'নিরাপদ ব্যাংকিং ও আরবিআই নিয়মানুযায়ী ১০০% সুরক্ষিত লেনদেন'
              : '100% Safe Banking & RBI Compliant Secure Checkout'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodSelector;
