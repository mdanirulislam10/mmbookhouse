import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, XCircle, ShieldCheck, FileText, ArrowLeft, ExternalLink, Printer } from 'lucide-react';
import { verifyInvoiceAsync } from '@/lib/services/invoiceStorageService';

interface PageProps {
  params: Promise<{
    invoice_number: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { invoice_number } = await params;
  return {
    title: `ইনভয়েস যাচাইকরণ #${invoice_number} | M.M Book House Malda`,
    description: `Official GST Rule 46 verification certificate for invoice #${invoice_number}`,
  };
}

export default async function VerifyInvoicePage({ params }: PageProps) {
  const { invoice_number } = await params;
  const result = await verifyInvoiceAsync(invoice_number);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl mx-auto">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              M.M BOOK HOUSE
            </h1>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mt-1">
              Malda, West Bengal • Official GST Tax Portal
            </p>
          </Link>
        </div>

        {/* Verification Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {result.verified ? (
            <div>
              {/* Verified Header Banner */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-8 text-center text-white">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-md mb-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-100" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black">
                  অফিশিয়াল GST ট্যাক্স ইনভয়েস ভেরিফায়েড
                </h2>
                <p className="text-xs sm:text-sm text-emerald-100 mt-1">
                  Statutory Rule 46 Tax Invoice Authenticity Confirmed
                </p>
              </div>

              {/* Certificate Body */}
              <div className="p-6 sm:p-8 space-y-6">
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
                  <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">ইনভয়েস নম্বর (Invoice No):</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">{result.invoice_number}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">অর্ডার নম্বর (Order Ref):</span>
                    <span className="font-mono font-bold text-slate-800">#{result.order_id}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">ইস্যু তারিখ (Issue Date):</span>
                    <span className="font-medium text-slate-800">{result.invoice_date}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">বিক্রেতা (Registered Seller):</span>
                    <span className="font-bold text-slate-900">{result.seller_trade_name}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">বিক্রেতা GSTIN (State 19):</span>
                    <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {result.seller_gstin}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">শুল্ক কোড (HSN Code):</span>
                    <span className="font-semibold text-slate-800">{result.hsn_classification}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">পেমেন্ট স্ট্যাটাস (Status):</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                        result.payment_status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {result.payment_status === 'PAID' ? '✔ PAID ONLINE' : '⏳ CASH ON DELIVERY'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1">
                    <span className="text-slate-700 font-bold">মোট প্রদেয় মূল্য (Total Payable):</span>
                    <span className="text-lg font-black text-slate-950">
                      ₹{Number(result.total_payable_amount || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Cryptographic Hash Seal */}
                <div className="rounded-lg bg-emerald-50/70 border border-emerald-200 p-3 text-[11px] text-slate-700 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>ডিজিটাল অডিট ও ক্রিপ্টোগ্রাফিক সিল (SHA-256 Tamper-Proof):</span>
                  </div>
                  <p className="font-mono text-[10px] break-all text-slate-600 bg-white/70 p-2 rounded border border-emerald-200">
                    {result.sha256_hash}
                  </p>
                  <p className="text-[10px] text-slate-500 pt-1">
                    ✔ এই ইনভয়েসটি কেন্দ্রীয় ভারত সরকারের জিএসটি আইন (CGST Act, 2017) অনুযায়ী বৈধ এবং সেন্ট্রাল রেজিস্টারে সংরক্ষিত।
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Link
                    href={`/invoices/${result.invoice_number}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-bold text-white hover:bg-slate-800 transition shadow"
                  >
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span>সম্পূর্ণ ইনভয়েস দেখুন (View Full Invoice)</span>
                  </Link>

                  {result.order_id && (
                    <a
                      href={`/api/orders/${result.order_id}/invoice?format=html`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
                    >
                      <Printer className="w-4 h-4 text-slate-500" />
                      <span>প্রিন্ট রসিদ</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* Failed Verification Header */}
              <div className="bg-rose-600 px-6 py-8 text-center text-white">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-md mb-3">
                  <XCircle className="w-10 h-10 text-rose-100" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black">
                  ইনভয়েস যাচাইকরণ ব্যর্থ হয়েছে
                </h2>
                <p className="text-xs sm:text-sm text-rose-100 mt-1">
                  Invalid or Unverified Invoice Reference
                </p>
              </div>

              {/* Failed Body */}
              <div className="p-6 sm:p-8 space-y-6 text-center">
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  দুঃখিত, <span className="font-mono font-bold text-slate-900">{invoice_number}</span> নম্বরের কোনো বৈধ জিএসটি ইনভয়েস আমাদের রেজিস্ট্রি বা ডেটাবেসে খুঁজে পাওয়া যায়নি।
                </p>

                <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-xs text-amber-800 text-left space-y-1">
                  <p className="font-bold">সম্ভাব্য কারণসমূহ:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-700">
                    <li>ইনভয়েস নম্বরটি ভুল বা অসম্পূর্ণ হতে পারে।</li>
                    <li>অর্ডারটি এখনও প্রক্রিয়াকরণ পর্যায়ে রয়েছে।</li>
                    <li>কিউআর কোড স্ক্যানিং লিংক ত্রুটিপূর্ণ হতে পারে।</li>
                  </ul>
                </div>

                <div className="pt-2">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-xs font-bold text-white hover:bg-slate-800 transition shadow"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>প্রধান পেজে ফিরে যান (Home)</span>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-400 mt-6 space-y-1">
          <p>© {new Date().getFullYear()} M.M Book House Malda. সর্বস্বত্ব সংরক্ষিত।</p>
          <p>নেতাজি সুভাষ রোড, ইংরেজবাজার, মালদা - ৭৩২১০১ | হেল্পলাইন: +৯১ ৯৭৩৩০ ৮৫০০০</p>
        </div>
      </div>
    </div>
  );
}
