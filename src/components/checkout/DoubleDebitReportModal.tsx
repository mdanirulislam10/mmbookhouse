'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  X,
  AlertCircle,
  Copy,
  Check,
  RotateCcw,
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { handleDoubleDebitReport } from '@/lib/services/refundService';

export interface DoubleDebitReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber?: string;
  amount: number;
}

/**
 * Module 13 - Item 36: Smart Double-Debit Reversal Tracker Modal
 * Allows customers to submit their 12-digit bank reference (UTR/RRN)
 * and generates a 24-hour auto-reversal ticket (DDT-XXXXXX).
 */
export const DoubleDebitReportModal: React.FC<DoubleDebitReportModalProps> = ({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  amount,
}) => {
  const { isBengali } = useLanguage();
  const [rrnOrUtr, setRrnOrUtr] = useState('');
  const [duplicatePaymentId, setDuplicatePaymentId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticket, setTicket] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUtr = rrnOrUtr.trim().toUpperCase();

    if (!cleanUtr || cleanUtr.length < 10) {
      setError(
        isBengali
          ? 'অনুগ্রহ করে ব্যাংকের ১২-সংখ্যার UTR বা রেফারেন্স নম্বর দিন।'
          : 'Please enter a valid 12-digit banking UTR or RRN number.'
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    setTimeout(() => {
      setIsSubmitting(false);
      const generatedTicket = handleDoubleDebitReport({
        orderId,
        originalPaymentId: `pay_orig_${orderId.slice(0, 8)}`,
        duplicatePaymentId: duplicatePaymentId || `pay_dupe_${Date.now()}`,
        amount,
        rrnOrUtr: cleanUtr,
      });
      setTicket(generatedTicket);
    }, 800);
  };

  const handleCopyTicket = () => {
    if (ticket && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(ticket.ticket_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ddt-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full sm:max-w-lg bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 px-5 sm:px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 id="ddt-modal-title" className="font-black text-sm sm:text-base leading-tight">
                {isBengali ? 'ডাবল ডেবিট সহায়তা ও রিভার্সাল ট্র্যাকার' : 'Double Debit Reversal Tracker'}
              </h3>
              <p className="text-[11px] text-amber-100 font-mono">
                {orderNumber || `#${orderId}`}
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
          {ticket ? (
            <div className="space-y-4 animate-fade-in text-center py-3">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h4 className="font-black text-base text-gray-900 dark:text-zinc-100">
                  {isBengali ? 'রিভার্সাল টিকিট তৈরি হয়েছে!' : 'Double Debit Ticket Created!'}
                </h4>
                <p className="text-xs text-gray-600 dark:text-zinc-400 max-w-sm mx-auto">
                  {isBengali
                    ? `আপনার অতিরিক্ত কেটে নেওয়া ₹${amount.toFixed(2)} টাকা আগামী ২৪ ঘণ্টার মধ্যে সরাসরি ব্যাংকে ফেরত পাঠানো হবে।`
                    : `The extra deduction of ₹${amount.toFixed(2)} is queued for auto-reversal within 24 hours.`}
                </p>
              </div>

              {/* Ticket ID Box */}
              <div className="p-3.5 bg-gray-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-between border border-gray-200 dark:border-zinc-700">
                <div className="text-left">
                  <span className="text-[10px] text-gray-500 dark:text-zinc-400 block font-semibold uppercase">
                    {isBengali ? 'টিকিট নম্বর' : 'Ticket ID'}
                  </span>
                  <span className="font-mono font-black text-sm text-gray-900 dark:text-zinc-100">
                    {ticket.ticket_id}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyTicket}
                  className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-xs shadow-md cursor-pointer transition"
              >
                {isBengali ? 'ঠিক আছে — বন্ধ করুন' : 'Done — Close'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl text-xs text-amber-950 dark:text-amber-200 leading-relaxed">
                <p className="font-bold mb-0.5">
                  {isBengali ? 'ভুলবশত দুবার টাকা কেটে নিয়েছে?' : 'Accidentally debited twice?'}
                </p>
                <p className="text-[11px]">
                  {isBengali
                    ? 'চিন্তার কোনো কারণ নেই। আপনার ব্যাংক স্টেটমেন্ট বা মেসেজে থাকা ১২-সংখ্যার UTR বা রেফারেন্স নম্বরটি দিন—সিস্টেম স্বয়ংক্রিয়ভাবে ব্যাংক সেটেলমেন্টের অতিরিক্ত টাকা ২৪ ঘণ্টার মধ্যে রিভার্স করবে।'
                    : 'Don’t worry! Enter the 12-digit UTR or Bank Reference from your second transaction. Our auto-reversal engine guarantees refund within 24 hours.'}
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 block mb-1">
                  {isBengali ? 'দ্বিতীয় লেনদেনের ব্যাংকিং UTR / RRN নম্বর' : '12-Digit Bank UTR / RRN Number'}
                </label>
                <input
                  type="text"
                  maxLength={12}
                  required
                  value={rrnOrUtr}
                  onChange={(e) => {
                    setRrnOrUtr(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase());
                    setError(null);
                  }}
                  placeholder="e.g. 123456789012"
                  className="w-full px-3.5 py-2.5 text-xs font-mono uppercase tracking-wider rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 block mb-1">
                  {isBengali ? 'অতিরিক্ত কাটার পরিমাণ (টাকা)' : 'Debited Amount (₹)'}
                </label>
                <input
                  type="text"
                  readOnly
                  value={`₹${amount.toFixed(2)}`}
                  className="w-full px-3.5 py-2.5 text-xs font-bold rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-100 dark:bg-zinc-800/60 text-gray-700 dark:text-zinc-300 cursor-not-allowed"
                />
              </div>

              {error && (
                <div className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || rrnOrUtr.length < 10}
                className="w-full min-h-[48px] py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <span>{isBengali ? '২৪ ঘণ্টার রিভার্সাল টিকিট জমা দিন ➔' : 'Submit 24-Hr Reversal Ticket ➔'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoubleDebitReportModal;
