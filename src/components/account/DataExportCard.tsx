'use client';

import React, { useState } from 'react';
import {
  Download,
  FileJson,
  Printer,
  ShieldCheck,
  CheckCircle2,
  FileText,
  User,
  Package,
  BookOpen,
  MapPin,
  Laptop,
  AlertCircle,
} from 'lucide-react';
import { dataExportService } from '@/lib/auth/dataExportService';
import { useAuthSession } from '@/hooks/useAuthSession';

interface DataExportCardProps {
  userId?: string;
  className?: string;
}

/**
 * Task 39: 1-Click Data Portability / Export Card
 * Implements DPDP Act 2023 Section 11 compliance for customer data portability.
 */
export const DataExportCard: React.FC<DataExportCardProps> = ({
  userId,
  className = '',
}) => {
  const { profile } = useAuthSession();
  const effectiveUserId = userId || profile.id || 'user-demo-sabir';

  const [isDownloadingJson, setIsDownloadingJson] = useState(false);
  const [isPreparingPdf, setIsPreparingPdf] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'info';
    title: string;
    details: string;
  } | null>(null);

  const handleDownloadJson = () => {
    setIsDownloadingJson(true);
    try {
      const result = dataExportService.downloadAsJson(effectiveUserId);
      setToastMessage({
        type: 'success',
        title: 'JSON ডেটা ফাইল ডাউনলোড সফল হয়েছে!',
        details: `ফাইল: ${result.filename} (রেফারেন্স: ${result.exportId})`,
      });
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err: unknown) {
      console.error(err);
      alert('ডেটা ডাউনলোড করতে সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।');
    } finally {
      setIsDownloadingJson(false);
    }
  };

  const handleOpenPrintPdf = () => {
    setIsPreparingPdf(true);
    try {
      const result = dataExportService.openPrintableReport(effectiveUserId);
      if (result.success) {
        setToastMessage({
          type: 'info',
          title: 'প্রিন্ট ও PDF প্রিভিউ উইন্ডো খোলা হয়েছে',
          details: `অফিসিয়াল লেটারহেড ও DPO অডিট সহ রেফারেন্স: ${result.exportId}`,
        });
        setTimeout(() => setToastMessage(null), 5000);
      }
    } catch (err: unknown) {
      console.error(err);
      alert('রিপোর্ট খুলতে সমস্যা হয়েছে। অনুগ্রহ করে পপ-আপ ব্লকার নিষ্ক্রিয় করুন।');
    } finally {
      setIsPreparingPdf(false);
    }
  };

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden font-bengali ${className}`}
    >
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0 text-emerald-300">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-black text-white">
                  ১-ক্লিক ডেটা পোর্টাবিলিটি ও এক্সপোর্ট
                </h3>
                <span className="text-[10px] font-mono font-bold bg-emerald-700/80 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                  DPDP Act 2023 Sec 11
                </span>
              </div>
              <p className="text-xs text-emerald-100/80 mt-1 max-w-xl leading-relaxed">
                আপনার ব্যক্তিগত তথ্যের ওপর পূর্ণ নিয়ন্ত্রণ নিশ্চিত করতে এম.এম বুক হাউস থেকে
                আপনার সমস্ত প্রোফাইল, অর্ডার হিস্ট্রি ও সম্মতির রেকর্ড এক ক্লিকে ডাউনলোড করুন।
              </p>
            </div>
          </div>

          <div className="shrink-0 flex sm:flex-col items-center sm:items-end gap-1.5 text-xs text-emerald-200/80">
            <span className="inline-flex items-center gap-1 bg-emerald-800/60 px-2.5 py-1 rounded-lg text-[11px] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>১০০% ওপেন ও এনক্রিপ্টেড</span>
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Toast Alert */}
        {toastMessage && (
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 animate-fadeIn ${
              toastMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}
          >
            <CheckCircle2
              className={`w-5 h-5 shrink-0 mt-0.5 ${
                toastMessage.type === 'success' ? 'text-emerald-600' : 'text-blue-600'
              }`}
            />
            <div>
              <p className="font-bold text-xs">{toastMessage.title}</p>
              <p className="text-[11px] mt-0.5 opacity-90">{toastMessage.details}</p>
            </div>
          </div>
        )}

        {/* Datasets Breakdown Grid */}
        <div>
          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">
            আপনার এক্সপোর্ট ফাইলের মধ্যে যেসকল তথ্য অন্তর্ভুক্ত থাকবে:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="p-3 bg-gray-50 border border-gray-200/80 rounded-xl flex items-start gap-2.5">
              <User className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs text-gray-900">প্রোফাইল ও মেটাডাটা</p>
                <p className="text-[11px] text-gray-500">
                  নাম, ভেরিফায়েড মোবাইল, বিকল্প ফোন ও নিবন্ধিত ইমেইল।
                </p>
              </div>
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200/80 rounded-xl flex items-start gap-2.5">
              <BookOpen className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs text-gray-900">পরীক্ষার প্রস্তুতি ও লক্ষ্য</p>
                <p className="text-[11px] text-gray-500">
                  WBCS, UGB, Primary TET সহ নির্বাচিত ক্যাটাগরি পছন্দসমূহ।
                </p>
              </div>
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200/80 rounded-xl flex items-start gap-2.5">
              <Package className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs text-gray-900">অর্ডার হিস্ট্রি ও চালান</p>
                <p className="text-[11px] text-gray-500">
                  ক্রয়কৃত বইয়ের শিরোনাম, তারিখ, চালান মূল্য ও ডেলিভারি স্ট্যাটাস।
                </p>
              </div>
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200/80 rounded-xl flex items-start gap-2.5">
              <FileText className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs text-gray-900">বিজনেস জিএসটি (ITC)</p>
                <p className="text-[11px] text-gray-500">
                  প্রতিষ্ঠান বা কোচিং সেন্টারের নিবন্ধিত GSTIN ও প্যান তথ্য।
                </p>
              </div>
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200/80 rounded-xl flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs text-gray-900">সংরক্ষিত ডেলিভারি ঠিকানা</p>
                <p className="text-[11px] text-gray-500">
                  মালদা শহর ও বিভিন্ন ব্লকের সংরক্ষিত শিপিং ঠিকানা।
                </p>
              </div>
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200/80 rounded-xl flex items-start gap-2.5">
              <Laptop className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs text-gray-900">ডিভাইস সেশন ও DPDP অডিট</p>
                <p className="text-[11px] text-gray-500">
                  সক্রিয় লগইন সেশন, আইপি এবং আপনার প্রদত্ত সম্মতির হিস্ট্রি।
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Button Action Bar */}
        <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              ডাউনলোডকৃত ফাইলে আপনার ব্যক্তিগত তথ্য রয়েছে; ফাইলটি সুরক্ষিত রাখুন।
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* JSON Download Button */}
            <button
              type="button"
              onClick={handleDownloadJson}
              disabled={isDownloadingJson}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <FileJson className="w-4 h-4 text-amber-400" />
              <span>{isDownloadingJson ? 'প্রস্তুত হচ্ছে...' : 'JSON ফরম্যাটে ডাউনলোড'}</span>
            </button>

            {/* PDF / Print Report Button */}
            <button
              type="button"
              onClick={handleOpenPrintPdf}
              disabled={isPreparingPdf}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-4 h-4 text-emerald-200" />
              <span>{isPreparingPdf ? 'জেনারেট হচ্ছে...' : 'PDF / প্রিন্ট কপি খুলুন'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
