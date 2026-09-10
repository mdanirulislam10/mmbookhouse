'use client';

import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import {
  Building,
  GraduationCap,
  MessageCircle,
  Percent,
  CheckCircle2,
  FileCheck2,
} from 'lucide-react';

interface BulkOrderNoticeProps {
  bookTitle: string;
  bookTitleBn?: string;
  isbn?: string;
  whatsappNumber?: string;
  className?: string;
}

export const BulkOrderNotice: React.FC<BulkOrderNoticeProps> = ({
  bookTitle,
  bookTitleBn,
  isbn,
  whatsappNumber = '919733000000',
  className = '',
}) => {
  const { isBengali } = useLanguage();

  const title = isBengali && bookTitleBn ? bookTitleBn : bookTitle;

  // Compose WhatsApp message prefill
  const waMessage = isBengali
    ? `নমস্কার, আমি M.M Book House Malda থেকে "${title}"${
        isbn ? ` (ISBN: ${isbn})` : ''
      } বইটির বাল্ক / পাইকারি অর্ডারের (১০+ কপি) স্পেশাল ছাড় ও ডেলিভারির বিষয়ে জানতে চাই।`
    : `Hello, I would like to inquire about wholesale bulk order discounts (10+ copies) for "${title}"${
        isbn ? ` (ISBN: ${isbn})` : ''
      } from M.M Book House Malda.`;

  const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(waMessage)}`;

  return (
    <aside
      className={`my-4 p-4 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50/80 via-blue-50/50 to-indigo-50/80 font-sans ${className}`}
      aria-label="Bulk Wholesale Inquiry for Coaching and Institutions"
    >
      <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
        {/* Left info column */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-indigo-600 text-white shrink-0">
              <GraduationCap className="w-4 h-4" />
            </span>
            <h4 className="text-sm sm:text-base font-bold text-indigo-950 flex items-center gap-1.5">
              <span>{isBengali ? 'কোচিং সেন্টার, স্কুল ও লাইব্রেরি বাল্ক অর্ডার' : 'Coaching & Library Wholesale Bulk Order'}</span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-semibold">
                {isBengali ? 'পাইকারি ছাড়' : 'Wholesale Rates'}
              </span>
            </h4>
          </div>

          <p className="text-xs sm:text-sm text-indigo-900 leading-relaxed pl-7">
            {isBengali
              ? '১০টি বা তদূর্ধ্ব বইয়ের অর্ডারে অতিরিক্ত পাইকারি ছাড় ও সরাসরি দ্রুত কুরিয়ারের জন্য আমাদের হোয়াটসঅ্যাপে যোগাযোগ করুন।'
              : 'Order 10 or more copies to unlock special wholesale institution rates, GST invoice, and priority logistics.'}
          </p>

          {/* Tiered discounts pill row */}
          <div className="flex items-center gap-2 flex-wrap pl-7 pt-1 text-xs">
            <span className="inline-flex items-center gap-1 bg-white/90 text-indigo-900 font-medium px-2 py-0.5 rounded border border-indigo-200 shadow-2xs">
              <Percent className="w-3 h-3 text-indigo-600" />
              {isBengali ? '১০+ কপি: অতিরিক্ত ৫% ছাড়' : '10+ copies: Extra 5% OFF'}
            </span>
            <span className="inline-flex items-center gap-1 bg-white/90 text-indigo-900 font-medium px-2 py-0.5 rounded border border-indigo-200 shadow-2xs">
              <Percent className="w-3 h-3 text-indigo-600" />
              {isBengali ? '২৫+ কপি: অতিরিক্ত ১০% ছাড়' : '25+ copies: Extra 10% OFF'}
            </span>
            <span className="inline-flex items-center gap-1 bg-white/90 text-indigo-900 font-medium px-2 py-0.5 rounded border border-indigo-200 shadow-2xs">
              <Building className="w-3 h-3 text-indigo-600" />
              {isBengali ? '৫০+ কপি: প্রাতিষ্ঠানিক মূল্য' : '50+ copies: Direct Wholesale'}
            </span>
          </div>

          {/* GST Invoice note */}
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-600 pl-7 pt-0.5">
            <FileCheck2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              {isBengali
                ? 'অনুমোদিত GST ইনভয়েস ও প্রাতিষ্ঠানিক ক্যাশ মেমো প্রদান করা হয়'
                : 'Official GST Invoice & Institutional Cash Memo provided'}
            </span>
          </div>
        </div>

        {/* WhatsApp CTA button */}
        <div className="w-full sm:w-auto shrink-0 flex sm:flex-col justify-end items-stretch sm:items-end pt-2 sm:pt-0">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors group cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-emerald-100 text-emerald-600 group-hover:scale-110 transition-transform" />
            <span>{isBengali ? 'WhatsApp-এ জানুন' : 'Inquire on WhatsApp'}</span>
          </a>
          <span className="hidden sm:inline-block text-[11px] text-indigo-700/80 text-right mt-1 font-medium">
            {isBengali ? '১০ মিনিটে উত্তর পাবেন' : 'Usually replies in 10 mins'}
          </span>
        </div>
      </div>
    </aside>
  );
};

export default BulkOrderNotice;
