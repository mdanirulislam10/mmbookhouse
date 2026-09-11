'use client';

import React from 'react';
import Link from 'next/link';
import {
  Package,
  ShieldCheck,
  MapPin,
  Compass,
  Receipt,
  Download,
  Heart,
  HelpCircle,
  ChevronRight,
  Sparkles,
  Gift,
} from 'lucide-react';
import { useWishlistCount } from '@/hooks/useWishlistStore';
import { toBengaliNumerals } from '@/lib/utils/currency';
import { useLanguage } from '@/hooks/useLanguage';

interface AmazonAccountHubCardsProps {
  onSelectTab: (tab: 'profile' | 'exams' | 'business' | 'security' | 'data' | 'refer') => void;
  onOpenDpdpModal?: () => void;
  className?: string;
}

/**
 * Task 43: Amazon-Style 6-Card (8-Card Dual Grid) Customer Account Dashboard Hub
 * Replicates the classic Amazon "Your Account" grid layout with interactive navigation.
 */
export const AmazonAccountHubCards: React.FC<AmazonAccountHubCardsProps> = ({
  onSelectTab,
  onOpenDpdpModal,
  className = '',
}) => {
  const wishlistCount = useWishlistCount();
  const { language } = useLanguage();

  const formattedWishlistCount =
    language === 'bn' ? toBengaliNumerals(wishlistCount) : wishlistCount;

  return (
    <div className={`space-y-4 font-bengali ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
          <span>আপনার অ্যাকাউন্ট হাব ও সেটিংস</span>
          <span className="text-xs font-semibold text-gray-500 font-normal">
            (অ্যামাজন প্যাটার্ন নেভিগেশন)
          </span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Your Orders */}
        <Link
          href="/orders"
          className="bg-white rounded-2xl border border-gray-200/90 p-5 hover:border-amber-400 hover:shadow-lg transition-all duration-200 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -z-0 pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100/70 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                <Package className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                লাইভ ট্র্যাকিং
              </span>
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-1 group-hover:text-amber-600 transition-colors">
              আপনার সমস্ত অর্ডার
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              বইয়ের বর্তমান ডেলিভারি স্ট্যাটাস ট্র্যাক করুন, চালান দেখুন বা পুনরায় অর্ডার করুন।
            </p>
          </div>
          <div className="pt-4 mt-2 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-amber-600 relative z-10">
            <span>অর্ডার হিস্ট্রি খুলুন</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Card 2: Login & Security */}
        <button
          type="button"
          onClick={() => onSelectTab('security')}
          className="bg-white rounded-2xl border border-gray-200/90 p-5 hover:border-emerald-400 hover:shadow-lg transition-all duration-200 flex flex-col justify-between group cursor-pointer text-left relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-0 pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                ২-স্টেপ ওটিপি
              </span>
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-1 group-hover:text-emerald-600 transition-colors">
              লগইন ও সেশন নিরাপত্তা
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              মোবাইল নম্বর আপডেট, সক্রিয় ডিভাইস তালিকা থেকে রিমোট সাইন-আউট ও সিকিউরিটি লগ।
            </p>
          </div>
          <div className="pt-4 mt-2 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-emerald-700 relative z-10 w-full">
            <span>ডিভাইস ও সিকিউরিটি দেখুন</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Card 3: Saved Addresses */}
        <Link
          href="/account/addresses"
          className="bg-white rounded-2xl border border-gray-200/90 p-5 hover:border-rose-400 hover:shadow-lg transition-all duration-200 flex flex-col justify-between group cursor-pointer text-left relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full -z-0 pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-rose-100/70 text-rose-700 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                <MapPin className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold bg-rose-50 text-rose-800 px-2 py-0.5 rounded-full border border-rose-200">
                মালদা ও হোম ডেলিভারি
              </span>
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-1 group-hover:text-rose-600 transition-colors">
              সংরক্ষিত ডেলিভারি ঠিকানা
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              মালদা শহর ও জেলার বিভিন্ন ব্লকে বই পাঠানোর ঠিকানা এবং নেতাজি সুভাষ রোড পিকআপ পয়েন্ট।
            </p>
          </div>
          <div className="pt-4 mt-2 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-rose-600 relative z-10 w-full">
            <span>ঠিকানা বুক পরিচালনা করুন</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Card 4: Exam Preferences & Targets */}
        <button
          type="button"
          onClick={() => onSelectTab('exams')}
          className="bg-white rounded-2xl border border-gray-200/90 p-5 hover:border-blue-400 hover:shadow-lg transition-all duration-200 flex flex-col justify-between group cursor-pointer text-left relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-0 pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100/70 text-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                <Compass className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold bg-blue-50 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
                WBCS / UGB স্পেশাল
              </span>
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-1 group-hover:text-blue-600 transition-colors">
              পরীক্ষার প্রস্তুতি ও পছন্দসমূহ
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              আপনার লক্ষ্য অনুযায়ী WBCS, গৌড়বঙ্গ বিশ্ববিদ্যালয় বা প্রাইমারি টেটের বই সাজেস্ট করা হবে।
            </p>
          </div>
          <div className="pt-4 mt-2 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-blue-600 relative z-10 w-full">
            <span>পরীক্ষার পছন্দ টিউন করুন</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Card 5: Business GST & ITC Invoices */}
        <button
          type="button"
          onClick={() => onSelectTab('business')}
          className="bg-white rounded-2xl border border-gray-200/90 p-5 hover:border-purple-400 hover:shadow-lg transition-all duration-200 flex flex-col justify-between group cursor-pointer text-left relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full -z-0 pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100/70 text-purple-700 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                <Receipt className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold bg-purple-50 text-purple-800 px-2 py-0.5 rounded-full border border-purple-200">
                B2B ট্যাক্স ক্রেডিট
              </span>
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-1 group-hover:text-purple-600 transition-colors">
              বিজনেস জিএসটি ও চালান
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              কোচিং সেন্টার, কলেজ লাইব্রেরি ও বুকস্টোরের জন্য জিএসটিআইএন ও ইনপুট ট্যাক্স ক্রেডিট (ITC)।
            </p>
          </div>
          <div className="pt-4 mt-2 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-purple-600 relative z-10 w-full">
            <span>জিএসটি বিবরণ পরিচালনা</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Card 6: DPDP Data Portability & Privacy */}
        <button
          type="button"
          onClick={() => onSelectTab('data')}
          className="bg-white rounded-2xl border border-gray-200/90 p-5 hover:border-teal-400 hover:shadow-lg transition-all duration-200 flex flex-col justify-between group cursor-pointer text-left relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50 rounded-bl-full -z-0 pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-teal-100/70 text-teal-700 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                <Download className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold bg-teal-50 text-teal-800 px-2 py-0.5 rounded-full border border-teal-200">
                DPDP Act 2023
              </span>
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-1 group-hover:text-teal-600 transition-colors">
              ১-ক্লিক ডেটা পোর্টাবিলিটি
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              আপনার সমস্ত প্রোফাইল, অর্ডার হিস্ট্রি ও সম্মতির রেকর্ড এক ক্লিকে JSON ও PDF ফরম্যাটে ডাউনলোড।
            </p>
          </div>
          <div className="pt-4 mt-2 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-teal-700 relative z-10 w-full">
            <span>এক্সপোর্ট ও গোপনীয়তা হাব</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Card 7: Wishlist & Favorites */}
        <Link
          href="/wishlist"
          className="bg-white rounded-2xl border border-gray-200/90 p-5 hover:border-red-400 hover:shadow-lg transition-all duration-200 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-full -z-0 pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-red-100/70 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                <Heart className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold bg-red-50 text-red-700 px-2 py-0.5 rounded-full border border-red-200">
                {formattedWishlistCount}টি বই সংরক্ষিত
              </span>
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-1 group-hover:text-red-600 transition-colors">
              আপনার পছন্দের উইশলিস্ট
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              পছন্দের বইগুলো সংরক্ষণ করে রাখুন এবং মূল্য কমলে নোটিফিকেশন অ্যালার্ট পান।
            </p>
          </div>
          <div className="pt-4 mt-2 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-red-600 relative z-10">
            <span>উইশলিস্ট খুলুন</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Card 8: Customer Support & WhatsApp Help */}
        <div className="bg-white rounded-2xl border border-gray-200/90 p-5 hover:border-emerald-500 hover:shadow-lg transition-all duration-200 flex flex-col justify-between group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-0 pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100/70 text-emerald-800 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                <HelpCircle className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                সকাল ৯টা - রাত ৯টা
              </span>
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-1">
              গ্রাহক সহায়তা ও হেল্পলাইন
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-3">
              অর্ডার বা বই সংক্রান্ত যেকোনো প্রয়োজনে আমাদের মালদা বুক হাউস কাউন্টারে সরাসরি যোগাযোগ করুন।
            </p>
            <div className="text-xs bg-gray-50 border border-gray-200 p-2 rounded-xl text-gray-700 flex items-center justify-between">
              <span>📞 +91 98001 23456</span>
              <a
                href="https://wa.me/919800123456"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 font-bold hover:underline"
              >
                WhatsApp Chat →
              </a>
            </div>
          </div>
          <div className="pt-4 mt-2 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-emerald-700 relative z-10">
            <a href="tel:+919800123456" className="hover:underline flex items-center gap-1">
              <span>সরাসরি কল করুন</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Card 9: Refer & Earn Rewards (Task 48 - 3x3 Symmetrical Grid) */}
        <button
          type="button"
          onClick={() => onSelectTab('refer')}
          className="bg-white rounded-2xl border border-gray-200/90 p-5 hover:border-amber-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between group cursor-pointer text-left relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -z-0 pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-gray-950 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <span className="text-[10px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>১০০ রিওয়ার্ড পয়েন্ট</span>
              </span>
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-1 group-hover:text-amber-600 transition-colors">
              রেফার করুন ও পয়েন্ট জিতুন
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              বন্ধুদের আমন্ত্রণ জানিয়ে প্রতি সফল অর্ডারে পান ১০০ রিওয়ার্ড পয়েন্ট যা পরবর্তী বই ক্রয়ে ক্যাশব্যাক।
            </p>
          </div>
          <div className="pt-4 mt-2 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-amber-600 relative z-10 w-full">
            <span>রেফারেল কোড ও পয়েন্ট দেখুন</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>
    </div>
  );
};
