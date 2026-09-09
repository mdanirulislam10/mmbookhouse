import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { User, Package, MapPin, Shield, Clock, ChevronRight, Home, PhoneCall, Mail, BookOpen, Settings } from 'lucide-react';

export const metadata: Metadata = {
  title: 'আপনার অ্যাকাউন্ট ও সেটিংস | M.M Book House Malda',
  description: 'M.M Book House Malda গ্রাহক অ্যাকাউন্ট। অর্ডার হিস্ট্রি, ডেলিভারি ঠিকানা, সংরক্ষিত বই ও নিরাপত্তা সেটিংস।',
  keywords: ['অ্যাকাউন্ট', 'My Account', 'M.M Book House Account', 'গ্রাহক প্রোফাইল'],
};

export default function AccountPage() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8 min-h-[75vh] font-bengali">
      {/* Breadcrumb */}
      <nav aria-label="ব্রেডক্রাম্ব" className="flex items-center gap-1.5 text-xs text-gray-500 mb-4 select-none">
        <Link href="/" className="hover:text-amber-600 flex items-center gap-1">
          <Home className="w-3.5 h-3.5" />
          <span>হোম</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="font-bold text-gray-900">আপনার অ্যাকাউন্ট</span>
      </nav>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#131921] via-[#1e2a38] to-[#232f3e] text-white rounded-2xl p-6 sm:p-8 mb-8 border border-amber-500/20 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-amber-400 text-gray-950 flex items-center justify-center font-black text-2xl shadow-md shrink-0">
              <User className="w-8 h-8" />
            </div>
            <div>
              <div className="text-xs text-amber-400 font-semibold uppercase tracking-wider">সম্মানিত গ্রাহক ড্যাশবোর্ড</div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                স্বাগতম, <span className="text-amber-400">এম.এম বুক হাউস গ্রাহক</span>
              </h1>
              <p className="text-xs text-gray-300 mt-1">
                মালদা ও উত্তরবঙ্গের শিক্ষার্থীদের বিশ্বস্ত বইয়ের সঙ্গী
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/orders"
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-gray-950 text-xs font-bold rounded-lg shadow transition-colors flex items-center gap-1.5"
            >
              <Package className="w-4 h-4" />
              <span>আপনার অর্ডারসমূহ</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Account Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Orders Card */}
        <Link
          href="/orders"
          className="bg-white rounded-xl border border-gray-200 p-6 hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between group"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-1 group-hover:text-amber-600 transition-colors">
              আপনার সমস্ত অর্ডার
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              চলতি অর্ডারের লাইভ ট্র্যাকিং, পূর্ববর্তী বইয়ের রসিদ ও ইনভয়েস ডাউনলোড করুন।
            </p>
          </div>
          <span className="text-xs font-bold text-amber-600 mt-4 flex items-center gap-1">
            <span>অর্ডার দেখুন</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </Link>

        {/* Address Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-1">
              ডেলিভারি ঠিকানা
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-3">
              মালদা শহর ও জেলার যে কোনো ব্লকের জন্য আপনার সংরক্ষিত শিপিং ঠিকানা।
            </p>
            <div className="text-xs bg-gray-50 border border-gray-200 p-2.5 rounded text-gray-700">
              📍 নেতাজি সুভাষ রোড, ইংলিশ বাজার, মালদা - ৭৩২১০১
            </div>
          </div>
          <span className="text-xs font-semibold text-gray-400 mt-4">
            কাউন্টার পিকআপ ও হোম ডেলিভারি সক্রিয়
          </span>
        </div>

        {/* Security & Support Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-1">
              লগইন ও নিরাপত্তা
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-3">
              মোবাইল নম্বর ও ইমেইল ভেরিফিকেশন, পাসওয়ার্ড ও অ্যাকাউন্ট সুরক্ষা।
            </p>
            <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
              <span>✓ মোবাইল ভেরিফাইড সুরক্ষা সক্রিয়</span>
            </div>
          </div>
          <Link
            href="/support"
            className="text-xs font-bold text-blue-600 hover:underline mt-4 flex items-center gap-1"
          >
            <span>সহায়তা কেন্দ্রের সাথে যোগাযোগ</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
