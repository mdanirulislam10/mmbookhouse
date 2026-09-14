'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  CreditCard,
  Banknote,
  PhoneCall,
  Clock,
  CheckCircle2,
  X,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import {
  generateRecoveryOptions,
  getPaymentHelplineDetails,
  getFailureGracePeriodRemainingSeconds,
} from '@/lib/services/paymentRecoveryService';

export interface PaymentFailureRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  amount: number;
  phone?: string;
  errorCode?: string;
  onRetryUpi: () => void;
  onTryCard: () => void;
  onConvertToCod: () => void;
}

export const PaymentFailureRecoveryModal: React.FC<PaymentFailureRecoveryModalProps> = ({
  isOpen,
  onClose,
  orderId,
  amount,
  phone,
  errorCode,
  onRetryUpi,
  onTryCard,
  onConvertToCod,
}) => {
  const { isBengali } = useLanguage();
  const recoveryState = generateRecoveryOptions(orderId, amount, phone, errorCode);
  const helpline = getPaymentHelplineDetails();
  const [secondsRemaining, setSecondsRemaining] = useState(
    getFailureGracePeriodRemainingSeconds(orderId) || 180
  );

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="failure-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full sm:max-w-lg bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-5 sm:px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h3 id="failure-modal-title" className="font-black text-sm sm:text-base leading-tight">
                {isBengali ? 'পেমেন্ট সম্পন্ন হয়নি' : 'Payment Incomplete'}
              </h3>
              <p className="text-[11px] text-red-100 font-mono">
                {isBengali ? 'অর্ডার:' : 'Order:'} #{orderId} • ₹{amount.toFixed(2)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Friendly Bank Error Notice (Item 30) */}
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl text-amber-950 dark:text-amber-200 text-xs">
            <p className="font-bold mb-0.5 flex items-center gap-1.5">
              <span>{isBengali ? 'ব্যাংকিং আপডেট ও পরামর্শ:' : 'Bank Notice & Advice:'}</span>
            </p>
            <p className="leading-relaxed">{recoveryState.last_error_message}</p>
          </div>

          {/* Cart Preserved & Grace Period Timer (Item 31 & 34) */}
          <div className="flex items-center justify-between p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="font-black text-xs sm:text-sm text-emerald-950 dark:text-emerald-200">
                  {isBengali ? 'কার্টের বইগুলো সম্পূর্ণ অক্ষত রয়েছে' : 'Your cart is completely preserved'}
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  {isBengali ? 'ব্যাংক থেকে কোনো টাকা কাটা হয়নি' : 'Zero deduction from your account'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700 shadow-2xs shrink-0">
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
              <span className="font-mono font-black text-xs text-zinc-800 dark:text-zinc-200">
                {formatTimer(secondsRemaining)}
              </span>
            </div>
          </div>

          {/* 3 Recovery Options (Item 32) */}
          <div className="space-y-2.5">
            <p className="text-xs font-black text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
              {isBengali ? 'সহজ ৩টি উপায়ে পেমেন্ট সম্পন্ন করুন:' : '3 Simple Ways to Complete Payment:'}
            </p>

            {/* Option 1: Retry Alternate UPI */}
            {recoveryState.suggested_options.includes('retry_upi') && (
              <button
                type="button"
                onClick={onRetryUpi}
                className="w-full flex items-center justify-between p-3.5 bg-blue-50/80 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-2xl text-left transition active:scale-98 cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-xs sm:text-sm text-blue-950 dark:text-blue-200 block">
                      {isBengali ? '১. বিকল্প UPI অ্যাপ দিয়ে চেষ্টা করুন' : '1. Try Alternate UPI App'}
                    </span>
                    <span className="text-[11px] text-blue-700 dark:text-blue-300">
                      {isBengali ? 'PhonePe, Google Pay বা Paytm' : 'PhonePe, Google Pay or Paytm'}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 shrink-0">
                  {isBengali ? 'চেষ্টা করুন ➔' : 'Retry ➔'}
                </span>
              </button>
            )}

            {/* Option 2: Try Debit / Credit Card */}
            {recoveryState.suggested_options.includes('try_card') && (
              <button
                type="button"
                onClick={onTryCard}
                className="w-full flex items-center justify-between p-3.5 bg-indigo-50/80 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 rounded-2xl text-left transition active:scale-98 cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-xs sm:text-sm text-indigo-950 dark:text-indigo-200 block">
                      {isBengali ? '২. ডেবিট বা ক্রেডিট কার্ড দিয়ে পে করুন' : '2. Pay via Debit or Credit Card'}
                    </span>
                    <span className="text-[11px] text-indigo-700 dark:text-indigo-300">
                      {isBengali ? 'RuPay, Visa, Mastercard ও নেটব্যাংকিং' : 'RuPay, Visa, Mastercard or NetBanking'}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                  {isBengali ? 'কার্ডে যান ➔' : 'Use Card ➔'}
                </span>
              </button>
            )}

            {/* Option 3: Convert to COD (Item 32) */}
            {recoveryState.suggested_options.includes('convert_to_cod') && (
              <button
                type="button"
                onClick={onConvertToCod}
                className="w-full flex items-center justify-between p-3.5 bg-emerald-50/80 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-left transition active:scale-98 cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-xs sm:text-sm text-emerald-950 dark:text-emerald-200 block">
                      {isBengali ? '৩. ক্যাশ অন ডেলিভারিতে রূপান্তর করুন' : '3. Switch to Cash on Delivery (COD)'}
                    </span>
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                      {isBengali ? 'বই হাতে পেয়ে মূল্য পরিশোধ করুন' : 'Pay when parcel arrives at your doorstep'}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                  {isBengali ? 'সিওডি করুন ➔' : 'Switch ➔'}
                </span>
              </button>
            )}
          </div>

          {/* Automated WhatsApp Recovery Link (Item 33) */}
          {recoveryState.whatsapp_recovery_link && (
            <a
              href={recoveryState.whatsapp_recovery_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full min-h-[46px] py-3 px-4 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-2xl text-xs sm:text-sm font-black shadow-md transition active:scale-98 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>
                {isBengali ? 'হোয়াটসঅ্যাপে ১-ক্লিক পে-লিঙ্ক পাঠান' : 'Send 1-Click Pay Link to WhatsApp'}
              </span>
            </a>
          )}

          {/* 1-Tap Helpline Call Button (Item 40) */}
          <div className="pt-2 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between text-xs shrink-0">
            <span className="text-gray-500 dark:text-zinc-400">
              {isBengali ? 'পেমেন্টে কোনো সমস্যা?' : 'Need instant help?'}
            </span>
            <a
              href={helpline.dialerUrl}
              className="flex items-center gap-1.5 text-red-600 dark:text-red-400 hover:underline font-bold"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>{helpline.displayPhone}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailureRecoveryModal;
