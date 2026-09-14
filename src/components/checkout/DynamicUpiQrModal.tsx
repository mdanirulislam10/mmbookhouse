'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  QrCode,
  Smartphone,
  Copy,
  Check,
  ShieldCheck,
  Clock,
  ExternalLink,
  X,
  AlertCircle,
  Loader2,
  KeyRound,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { generateUpiIntentData } from '@/lib/services/upiPaymentService';

export interface DynamicUpiQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  amount: number;
  onPaymentSuccess?: (paymentId: string, utr?: string) => void;
  expirySeconds?: number;
}

export const DynamicUpiQrModal: React.FC<DynamicUpiQrModalProps> = ({
  isOpen,
  onClose,
  orderId,
  amount,
  onPaymentSuccess,
  expirySeconds = 300, // 5 minutes
}) => {
  const { isBengali } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(expirySeconds);
  const [activeTab, setActiveTab] = useState<'apps' | 'qr' | 'utr'>('apps');

  // Tranquil Verifying Screen state (Item 23)
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyingMessage, setVerifyingMessage] = useState<string>('');
  const [pollingError, setPollingError] = useState<string | null>(null);

  // Manual UTR input state (Item 37)
  const [manualUtr, setManualUtr] = useState('');
  const [utrSubmitting, setUtrSubmitting] = useState(false);
  const [utrError, setUtrError] = useState<string | null>(null);

  // Generate UPI Intent Details (Item 2 & 3)
  const upiDetails = useMemo(() => {
    return generateUpiIntentData({
      orderId,
      amount,
    });
  }, [orderId, amount]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen) return;
    setSecondsLeft(expirySeconds);
    setIsVerifying(false);
    setPollingError(null);
    setManualUtr('');
    setUtrError(null);

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, expirySeconds]);

  // Poll server for payment confirmation (Item 23 & 27)
  const pollPaymentStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/checkout/payment-status?orderId=${encodeURIComponent(orderId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.isConfirmed) {
          setIsVerifying(false);
          if (onPaymentSuccess) {
            onPaymentSuccess(data.paymentId || `pay_upi_${Date.now()}`, data.utr);
          }
          return true;
        } else if (data.isFailed) {
          setIsVerifying(false);
          setPollingError(
            isBengali
              ? 'ব্যাংক থেকে পেমেন্ট বাতিল করা হয়েছে। অনুগ্রহ করে অন্য মেথড দিয়ে চেষ্টা করুন।'
              : 'Payment was declined by your bank. Please try an alternate method.'
          );
          return true;
        }
      }
    } catch {
      // Non-blocking network error on polling
    }
    return false;
  }, [orderId, onPaymentSuccess, isBengali]);

  // Active polling loop while in Tranquil Verifying state
  useEffect(() => {
    if (!isOpen || !isVerifying) return;

    let attempts = 0;
    const maxAttempts = 24; // 24 * 2.5s = 60s max active poll

    const interval = setInterval(async () => {
      attempts += 1;
      const isDone = await pollPaymentStatus();
      if (isDone || attempts >= maxAttempts) {
        clearInterval(interval);
        if (attempts >= maxAttempts && isVerifying) {
          setIsVerifying(false);
          setPollingError(
            isBengali
              ? 'ব্যাংক থেকে তাৎক্ষণিক সংকেত পাওয়া যায়নি। আপনি যদি টাকা দিয়ে থাকেন, তবে নিচে ১২-সংখ্যার UTR নম্বর লিখে নিশ্চিত করুন।'
              : 'Bank signal is taking longer than expected. If amount was deducted, please enter your 12-digit UTR below.'
          );
          setActiveTab('utr');
        }
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [isOpen, isVerifying, pollPaymentStatus, isBengali]);

  // App switch detection: When student returns to browser after PhonePe/GPay (Item 2)
  useEffect(() => {
    if (!isOpen) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isVerifying) {
        // Returned from another app
        setIsVerifying(true);
        setVerifyingMessage(
          isBengali
            ? 'আপনার ইউপিআই অ্যাপ থেকে পেমেন্ট নিশ্চিত করা হচ্ছে, অনুগ্রহ করে ব্রাউজার রিফ্রেশ করবেন না...'
            : 'Verifying payment from your UPI app with bank... Please do not refresh.'
        );
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isOpen, isVerifying, isBengali]);

  // Copy VPA handler
  const handleCopyVpa = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(upiDetails.vpa);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {}
  };

  // Submit manual UTR verification (Item 37)
  const handleManualUtrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = manualUtr.trim().toUpperCase();
    if (!/^[A-Za-z0-9]{12}$/.test(clean)) {
      setUtrError(
        isBengali
          ? '১২-সংখ্যার সঠিক ভারতীয় ব্যাংকিং UTR / RRN নম্বর প্রদান করুন (যেমন: 123456789012)'
          : 'Please enter a valid 12-digit alphanumeric Indian banking UTR / RRN'
      );
      return;
    }

    setUtrSubmitting(true);
    setUtrError(null);

    try {
      const res = await fetch('/api/checkout/verify-utr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          utr: clean,
          amount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to verify UTR');
      }

      setUtrSubmitting(false);
      if (onPaymentSuccess) {
        onPaymentSuccess(data.paymentId, data.utr);
      }
    } catch (err: any) {
      setUtrSubmitting(false);
      setUtrError(err?.message || 'UTR verification failed. Please check the reference number.');
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upi-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full sm:max-w-lg bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header with Emerald Gradient */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-5 sm:px-6 py-4 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-xs">
              <QrCode className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h3 id="upi-modal-title" className="font-black text-sm sm:text-base leading-tight">
                {isBengali ? 'ইউপিআই ও কিউআর পেমেন্ট' : 'Fast UPI & QR Payment'}
              </h3>
              <p className="text-[11px] text-emerald-100/90 font-mono">
                {isBengali ? 'অর্ডার:' : 'Order:'} #{orderId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-full hover:bg-white/20 active:bg-white/30 transition-colors text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Price & Timer Bar */}
          <div className="flex items-center justify-between p-3.5 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800/60">
            <div>
              <span className="text-[11px] font-bold text-gray-500 dark:text-zinc-400 block uppercase tracking-wider">
                {isBengali ? 'মোট প্রদেয় মূল্য' : 'Amount to Pay'}
              </span>
              <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                ₹{amount.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center gap-2 text-right bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-700/60 shadow-2xs">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-pulse" />
              <div>
                <span className="text-[10px] text-gray-500 dark:text-zinc-400 block font-semibold">
                  {isBengali ? 'অবশিষ্ট সময়' : 'Expires in'}
                </span>
                <span className="font-mono font-black text-xs text-gray-800 dark:text-zinc-200">
                  {formatTimer(secondsLeft)}
                </span>
              </div>
            </div>
          </div>

          {/* Polling / User Warning Notice */}
          {pollingError && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{pollingError}</span>
            </div>
          )}

          {/* Tranquil Verifying Screen (Item 23) */}
          {isVerifying ? (
            <div className="py-8 px-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 text-center space-y-4 animate-fade-in">
              <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-ping" />
                <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg">
                  <Loader2 className="w-7 h-7 animate-spin" />
                </div>
              </div>

              <div className="space-y-1.5 max-w-sm mx-auto">
                <h4 className="font-black text-sm text-gray-900 dark:text-zinc-100">
                  {isBengali ? 'পেমেন্ট ব্যাংক থেকে নিশ্চিত করা হচ্ছে...' : 'Verifying Payment with Bank...'}
                </h4>
                <p className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed">
                  {verifyingMessage ||
                    (isBengali
                      ? 'আপনার পেমেন্ট ব্যাংক থেকে নিশ্চিত করা হচ্ছে, অনুগ্রহ করে ব্রাউজার রিফ্রেশ করবেন না...'
                      : 'Verifying payment with your bank... Please do not refresh.')}
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsVerifying(false)}
                  className="text-xs font-bold text-gray-500 hover:text-gray-700 dark:text-zinc-400 underline py-1 px-3 cursor-pointer"
                >
                  {isBengali ? 'বন্ধ করে অন্যভাবে পে করুন' : 'Cancel & Choose Alternate'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsVerifying(false);
                    setActiveTab('utr');
                  }}
                  className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-white dark:bg-zinc-800 border border-emerald-300 dark:border-emerald-700 py-1.5 px-3 rounded-lg shadow-2xs hover:bg-emerald-50 cursor-pointer"
                >
                  {isBengali ? '১২-ডিজিট UTR দিয়ে তাৎক্ষণিক ভেরিফাই করুন ➔' : 'Enter 12-digit UTR ➔'}
                </button>
              </div>
            </div>
          ) : secondsLeft === 0 ? (
            /* Expired Screen */
            <div className="p-5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400 mx-auto" />
              <p className="font-bold text-red-900 dark:text-red-300 text-sm">
                {isBengali ? 'কিউআর কোডের মেয়াদ শেষ হয়েছে' : 'UPI QR Code Expired'}
              </p>
              <p className="text-xs text-red-600 dark:text-red-400">
                {isBengali
                  ? 'নিরাপত্তা কারণে ৫ মিনিট পর কিউআর নিষ্ক্রিয় হয়। অনুগ্রহ করে পুনরায় পেমেন্ট শুরু করুন।'
                  : 'For security, the dynamic QR expires in 5 minutes. Please retry.'}
              </p>
            </div>
          ) : (
            <>
              {/* Navigation Tabs for Mobile Ease: Apps | Dynamic QR | Enter UTR */}
              <div className="flex p-1 bg-gray-100 dark:bg-zinc-800/80 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveTab('apps')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'apps'
                      ? 'bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                      : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>{isBengali ? 'মোবাইল অ্যাপস' : 'UPI Apps'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('qr')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'qr'
                      ? 'bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                      : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>{isBengali ? 'কিউআর স্ক্যান' : 'Scan QR'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('utr')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'utr'
                      ? 'bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                      : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{isBengali ? 'UTR যাচাই' : 'Enter UTR'}</span>
                </button>
              </div>

              {/* TAB 1: Mobile Direct Intent Buttons (Item 2 & 9) */}
              {activeTab === 'apps' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-gray-800 dark:text-zinc-200 uppercase tracking-wider">
                      {isBengali ? 'মোবাইলে ইনস্টল থাকা অ্যাপ নির্বাচন করুন:' : 'Tap to Pay Directly via App:'}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                      {isBengali ? '০% সারচার্জ' : '0% Fee'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2">
                    {/* PhonePe */}
                    <a
                      href={upiDetails.app_schemes.phonepe}
                      onClick={() => {
                        setTimeout(() => setIsVerifying(true), 1200);
                      }}
                      className="flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-950 dark:text-purple-200 rounded-2xl font-bold text-xs sm:text-sm border border-purple-200 dark:border-purple-800 transition active:scale-98 shadow-2xs cursor-pointer min-h-[52px]"
                    >
                      <div className="w-8 h-8 rounded-xl bg-[#5f259f] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                        Pe
                      </div>
                      <div className="text-left leading-tight">
                        <span className="block font-bold">PhonePe</span>
                        <span className="text-[10px] text-purple-700 dark:text-purple-300 font-normal">
                          {isBengali ? '১-ট্যাপ পেমেন্ট' : 'Fast App Switch'}
                        </span>
                      </div>
                    </a>

                    {/* Google Pay */}
                    <a
                      href={upiDetails.app_schemes.gpay}
                      onClick={() => {
                        setTimeout(() => setIsVerifying(true), 1200);
                      }}
                      className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-950 dark:text-blue-200 rounded-2xl font-bold text-xs sm:text-sm border border-blue-200 dark:border-blue-800 transition active:scale-98 shadow-2xs cursor-pointer min-h-[52px]"
                    >
                      <div className="w-8 h-8 rounded-xl bg-white border border-blue-200 text-blue-600 flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                        G
                      </div>
                      <div className="text-left leading-tight">
                        <span className="block font-bold">Google Pay</span>
                        <span className="text-[10px] text-blue-700 dark:text-blue-300 font-normal">
                          Tez UPI
                        </span>
                      </div>
                    </a>

                    {/* Paytm */}
                    <a
                      href={upiDetails.app_schemes.paytm}
                      onClick={() => {
                        setTimeout(() => setIsVerifying(true), 1200);
                      }}
                      className="flex items-center gap-3 p-3 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/50 text-sky-950 dark:text-sky-200 rounded-2xl font-bold text-xs sm:text-sm border border-sky-200 dark:border-sky-800 transition active:scale-98 shadow-2xs cursor-pointer min-h-[52px]"
                    >
                      <div className="w-8 h-8 rounded-xl bg-[#002e6e] text-white flex items-center justify-center font-black text-[10px] shrink-0 shadow-xs">
                        Paytm
                      </div>
                      <div className="text-left leading-tight">
                        <span className="block font-bold">Paytm UPI</span>
                        <span className="text-[10px] text-sky-700 dark:text-sky-300 font-normal">
                          Instant App
                        </span>
                      </div>
                    </a>

                    {/* Other UPI / CRED / BHIM */}
                    <a
                      href={upiDetails.app_schemes.generic}
                      onClick={() => {
                        setTimeout(() => setIsVerifying(true), 1200);
                      }}
                      className="flex items-center gap-3 p-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-950 dark:text-emerald-200 rounded-2xl font-bold text-xs sm:text-sm border border-emerald-200 dark:border-emerald-800 transition active:scale-98 shadow-2xs cursor-pointer min-h-[52px]"
                    >
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                        UPI
                      </div>
                      <div className="text-left leading-tight">
                        <span className="block font-bold">CRED / Any UPI</span>
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-normal">
                          BHIM, Amazon Pay
                        </span>
                      </div>
                    </a>
                  </div>

                  {/* Manual verify trigger button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setIsVerifying(true)}
                      className="w-full min-h-[46px] py-2.5 px-4 bg-gray-900 hover:bg-black text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer transition active:scale-98"
                    >
                      <span>{isBengali ? 'পেমেন্ট সম্পন্ন হয়েছে — স্ট্যাটাস চেক করুন ➔' : 'I Completed Payment — Check Status ➔'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: Dynamic QR Scan (Item 3) */}
              {activeTab === 'qr' && (
                <div className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-zinc-800/60 rounded-2xl border border-gray-200 dark:border-zinc-700 space-y-3 animate-fade-in">
                  <div className="p-3 bg-white rounded-2xl shadow-md border border-gray-100">
                    {upiDetails.qr_svg_data ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={upiDetails.qr_svg_data}
                        alt="Dynamic UPI QR Code"
                        width={210}
                        height={210}
                        className="rounded-lg"
                      />
                    ) : (
                      <div className="w-[210px] h-[210px] bg-gray-100 flex items-center justify-center">
                        <QrCode className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-center text-gray-600 dark:text-zinc-300 max-w-xs font-medium leading-relaxed">
                    {isBengali
                      ? 'ল্যাপটপ বা অন্য কোনো ফোন থেকে GPay, PhonePe বা Paytm দিয়ে ৩ সেকেন্ডে স্ক্যান করুন।'
                      : 'Scan with any UPI App on your phone to complete payment in 3 seconds.'}
                  </p>

                  <button
                    type="button"
                    onClick={() => setIsVerifying(true)}
                    className="w-full min-h-[44px] py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer transition"
                  >
                    <span>{isBengali ? 'স্ক্যান সম্পন্ন — পেমেন্ট নিশ্চিত করুন ➔' : 'Scanned & Paid — Confirm Order ➔'}</span>
                  </button>
                </div>
              )}

              {/* TAB 3: 12-Digit Indian Banking UTR / RRN Submission (Item 37) */}
              {activeTab === 'utr' && (
                <form onSubmit={handleManualUtrSubmit} className="space-y-3 animate-fade-in">
                  <div className="p-3 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-900 dark:text-blue-200">
                    <p className="font-bold mb-0.5">
                      {isBengali ? '১২-সংখ্যার UTR বা রেফারেন্স নম্বর কী?' : 'What is 12-Digit UTR?'}
                    </p>
                    <p className="text-[11px] leading-snug">
                      {isBengali
                        ? 'আপনার পেমেন্ট অ্যাপে (PhonePe/GPay) সফল পেমেন্টের নিচে ১২ সংখ্যার UTR / UPI Ref No থাকে। এটি দিলে চোখের পলকে অর্ডার ভেরিফাই হবে।'
                        : 'Every successful UPI transfer shows a 12-digit UTR/RRN number on PhonePe/GPay receipt. Enter it to verify instantly.'}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 block mb-1">
                      {isBengali ? '১২-ডিজিট ব্যাংকিং UTR / RRN নম্বর' : '12-Digit Banking UTR Number'}
                    </label>
                    <input
                      type="text"
                      maxLength={12}
                      required
                      value={manualUtr}
                      onChange={(e) => {
                        setManualUtr(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase());
                        setUtrError(null);
                      }}
                      placeholder="123456789012"
                      className="w-full px-3 py-2.5 text-sm font-mono tracking-widest uppercase rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {utrError && (
                    <div className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{utrError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={utrSubmitting || manualUtr.length < 12}
                    className="w-full min-h-[46px] py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition active:scale-98"
                  >
                    {utrSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{isBengali ? 'যাচাই করা হচ্ছে...' : 'Verifying UTR...'}</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{isBengali ? 'UTR নিশ্চিত করুন ও অর্ডার সম্পন্ন করুন' : 'Confirm UTR & Place Order'}</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Copy VPA Box */}
              <div className="flex items-center justify-between p-2.5 bg-gray-100/80 dark:bg-zinc-800/80 rounded-xl text-xs">
                <div className="flex items-center gap-1.5 text-gray-600 dark:text-zinc-400">
                  <span className="font-semibold">UPI VPA:</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-zinc-200 select-all">
                    {upiDetails.vpa}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyVpa}
                  className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 hover:underline font-bold cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {/* Footer Security Badges (Item 4 & 42) */}
          <div className="pt-2 border-t border-gray-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-500 dark:text-zinc-400 shrink-0">
            <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>0% Surcharge • RuPay & UPI Verified</span>
            </div>
            <div className="font-mono">NPCI 256-Bit SSL Encrypted</div>
          </div>
        </div>
      </div>
    </div>
  );
};
