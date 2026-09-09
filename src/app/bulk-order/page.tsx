'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Building2, GraduationCap, PhoneCall, CheckCircle2, Send, FileText, Percent, Truck, MessageSquare } from 'lucide-react';

export default function BulkOrderPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    institutionName: '',
    contactPerson: '',
    phone: '',
    email: '',
    bookList: '',
    estimatedQuantity: '50-100',
    pincode: '732101',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newQuote = {
      id: `quote-${Date.now()}`,
      ...formData,
      createdAt: new Date().toISOString(),
    };
    try {
      const existing = JSON.parse(localStorage.getItem('mm_bulk_order_quotes') || '[]');
      localStorage.setItem('mm_bulk_order_quotes', JSON.stringify([newQuote, ...existing]));
    } catch {
      // LocalStorage fallback
    }
    setIsSubmitted(true);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8 min-h-[75vh]">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#232f3e] to-[#131921] text-white rounded-2xl p-6 sm:p-10 mb-8 border border-amber-500/20 shadow-xl">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
            <GraduationCap className="w-4 h-4 text-amber-400" />
            <span>প্রাতিষ্ঠানিক ও বিটুইবি সার্ভিস</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white mb-3">
            স্কুল, কোচিং ও লাইব্রেরি <span className="text-amber-400">বাল্ক বুকিং</span>
          </h1>
          <p className="text-sm text-gray-300 leading-relaxed">
            মালদা জেলা ও সমগ্র পশ্চিমবঙ্গের শিক্ষা প্রতিষ্ঠান, কোচিং সেন্টার এবং লাইব্রেরির জন্য বিশেষ পাইকারি ছাড় ও জিএসটি ইনভয়েস সহ সরাসরি বই সরবরাহের সুবিধা।
          </p>
        </div>

        {/* Value Props */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-400/10 text-amber-400 flex items-center justify-center shrink-0">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm">সর্বোচ্চ প্রাতিষ্ঠানিক ছাড়</div>
              <div className="text-xs text-gray-400">২৫% থেকে ৪০% পর্যন্ত স্পেশাল ডিসকাউন্ট</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-400/10 text-emerald-400 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm">অফিসিয়াল GST ইনভয়েস</div>
              <div className="text-xs text-gray-400">অডিট ও ট্যাক্স কমপ্লায়েন্ট বিলিং</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-400/10 text-blue-400 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm">দ্রুত বাল্ক ডেলিভারি</div>
              <div className="text-xs text-gray-400">মালদা ও উত্তরবঙ্গে নিরাপদ পার্সেল</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Quotation Form & Helpline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Container */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 sm:p-8 shadow-sm">
          {isSubmitted ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">
                কোটেশন অনুরোধ সফলভাবে জমা হয়েছে!
              </h2>
              <p className="text-sm text-gray-600 max-w-md mx-auto mb-6">
                ধন্যবাদ! আমাদের প্রাতিষ্ঠানিক সেলস টিম আপনার সাথে শীঘ্রই ({formData.phone || 'দেওয়া নম্বরে'}) যোগাযোগ করে সেরা কোটেশন ও ছাড়ের তালিকা পাঠাবে।
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
                <a
                  href={`https://wa.me/919733000000?text=${encodeURIComponent(
                    `নমস্কার M.M Book House! আমি ${formData.institutionName} (দায়িত্বপ্রাপ্ত ব্যক্তি: ${formData.contactPerson}, ফোন: ${formData.phone}) থেকে একটি বাল্ক কোটেশন অনুরোধ পাঠিয়েছি। বইয়ের বিবরণ: ${formData.bookList}, আনুমানিক সংখ্যা: ${formData.estimatedQuantity}, পিনকোড: ${formData.pincode}। অনুগ্রহ করে সেরা ছাড়ের কোটেশন দিন।`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded shadow transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>হোয়াটসঅ্যাপে সরাসরি কোটেশন পাঠান (1-Click)</span>
                </a>
                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#232f3e] hover:bg-[#131921] text-white text-xs font-bold rounded shadow transition-colors"
                >
                  আরেকটি কোটেশন পাঠান
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-lg font-black text-gray-900 mb-1 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-600" />
                <span>স্পেশাল কোটেশন অনুরোধ ফর্ম (Request-a-Quote)</span>
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                ফর্মটি পূরণ করুন; আমাদের এক্সিকিউটিভ ২ ঘণ্টার মধ্যে অফিসিয়াল কোটেশন নিয়ে যোগাযোগ করবেন।
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    শিক্ষা প্রতিষ্ঠান / কোচিং সেন্টারের নাম *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: মালদা আদর্শ হাই স্কুল / সাকসেস পয়েন্ট"
                    value={formData.institutionName}
                    onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                    className="w-full text-xs p-2.5 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    দায়িত্বপ্রাপ্ত ব্যক্তির নাম *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: প্রধান শিক্ষক / শিক্ষক / লাইব্রেরিয়ান"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full text-xs p-2.5 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    মোবাইল নম্বর (হোয়াটসঅ্যাপ সহ) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="যেমন: 9800123456"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full text-xs p-2.5 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    আনুমানিক বইয়ের সংখ্যা (Quantity)
                  </label>
                  <select
                    value={formData.estimatedQuantity}
                    onChange={(e) => setFormData({ ...formData, estimatedQuantity: e.target.value })}
                    className="w-full text-xs p-2.5 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                  >
                    <option value="25-50">২৫ – ৫০ কপি</option>
                    <option value="50-100">৫০ – ১০০ কপি</option>
                    <option value="100-250">১০০ – ২৫০ কপি</option>
                    <option value="250+">২৫০+ কপি (মেগা বাল্ক)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  প্রয়োজনীয় বইয়ের তালিকা বা বিবরণ *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="যেমন: মাধ্যমিক টেস্ট পেপার ৫০ কপি, WBCS প্রিলিমস গাইড ৩০ কপি ইত্যাদি..."
                  value={formData.bookList}
                  onChange={(e) => setFormData({ ...formData, bookList: e.target.value })}
                  className="w-full text-xs p-2.5 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-gray-950 font-bold text-sm rounded shadow transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>কোটেশন অনুরোধ জমা দিন (Submit Request)</span>
              </button>
            </form>
          )}
        </div>

        {/* Direct Contact Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between h-fit">
          <div>
            <h3 className="text-sm font-black text-gray-900 mb-3 flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-amber-600" />
              <span>জরুরি সহায়তা ও সরাসরি যোগাযোগ</span>
            </h3>
            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              সরাসরি বইয়ের দোকান থেকে কোটেশন বা জরুরি অর্ডারের জন্য আমাদের বাল্ক সেলস ডেস্কে কল করুন:
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <div className="text-xs text-gray-500 mb-1">সরাসরি কল করুন:</div>
              <a
                href="tel:+919800123456"
                className="text-lg font-black text-amber-600 hover:underline block"
              >
                +91 98001 23456
              </a>
              <div className="text-[11px] text-gray-500 mt-1">সকাল ১০টা থেকে রাত ৯টা পর্যন্ত খোলা</div>
            </div>
            <div className="text-xs text-gray-600">
              <span className="font-bold text-gray-900">কাউন্টার ঠিকানা:</span> নেতাজি সুভাষ রোড, ইংলিশ বাজার, মালদা - ৭৩২১০১ (পশ্চিমবঙ্গ)
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <Link
              href="/"
              className="text-xs font-bold text-amber-700 hover:underline flex items-center justify-center"
            >
              ← হোমপেজে ফিরে যান
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
