'use client';

import React, { useMemo } from 'react';
import { QrCode, Smartphone, X, ShieldCheck, Banknote, Sparkles } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { generateDigitalCodCollectionData } from '@/lib/services/codRiskService';
import { generateUpiQrSvg } from '@/lib/services/upiPaymentService';

export interface DigitalCodQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber?: string;
  amount: number;
}

/**
 * Module 13 - Item 16: Cashless Digital COD Dynamic QR Modal
 * Generates doorstep UPI QR for delivery rider collection without physical cash.
 */
export const DigitalCodQrModal: React.FC<DigitalCodQrModalProps> = ({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  amount,
}) => {
  const { isBengali } = useLanguage();

  const dcodData = useMemo(() => {
    return generateDigitalCodCollectionData(orderNumber || orderId, amount);
  }, [orderNumber, orderId, amount]);

  const qrSvg = useMemo(() => {
    return generateUpiQrSvg(dcodData.upiUri, 220);
  }, [dcodData.upiUri]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dcod-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full sm:max-w-md bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-5 sm:px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold shrink-0">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h3 id="dcod-modal-title" className="font-black text-sm sm:text-base leading-tight">
                {isBengali ? 'ক্যাশলেস ডিজিটাল সিওডি (Digital COD)' : 'Doorstep Digital COD QR'}
              </h3>
              <p className="text-[11px] text-emerald-100 font-mono">
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
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 text-center">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-left">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-zinc-400 block">
                {isBengali ? 'ডেলিভারির সময় প্রদেয়' : 'Due at Doorstep'}
              </span>
              <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                ₹{amount.toFixed(2)}
              </span>
            </div>
            <span className="bg-white dark:bg-zinc-800 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-700 shadow-2xs">
              {isBengali ? 'নগদ টাকা ছাড়া' : 'Cashless'}
            </span>
          </div>

          {/* QR Code */}
          <div className="p-4 bg-gray-50 dark:bg-zinc-800/60 rounded-2xl border border-gray-200 dark:border-zinc-700 inline-block shadow-inner">
            <div
              className="p-3 bg-white rounded-xl shadow-md border border-gray-100 inline-block"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
          </div>

          <div className="space-y-1 max-w-xs mx-auto">
            <h4 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-zinc-100">
              {isBengali ? 'ডেলিভারির সময় স্ক্যান করে পে করুন' : 'Scan to Pay upon Arrival'}
            </h4>
            <p className="text-[11px] text-gray-600 dark:text-zinc-400 leading-relaxed">
              {isBengali
                ? 'পার্সেল নিয়ে কুরিয়ার কর্মী পৌঁছালে ক্যাশ না থাকলে আপনি এই কিউআর PhonePe, GPay বা Paytm দিয়ে স্ক্যান করে পেমেন্ট করতে পারবেন।'
                : 'When delivery rider arrives at your doorstep, scan this QR using any UPI app to pay without cash.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-xs shadow-md cursor-pointer transition"
          >
            {isBengali ? 'ঠিক আছে' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DigitalCodQrModal;
