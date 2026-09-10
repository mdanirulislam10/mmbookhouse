'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { LogIn, UserCheck, ShieldCheck, Truck, BookOpen, Sparkles, ArrowRight } from 'lucide-react';
import { SpotlightUser } from '@/types/quadCard';
import { DEFAULT_MOCK_USER } from '@/lib/data/quadCards';
import { useAuthSession } from '@/hooks/useAuthSession';

interface SpotlightAuthCardProps {
  initialUser?: SpotlightUser;
}

export const SpotlightAuthCard: React.FC<SpotlightAuthCardProps> = ({
  initialUser,
}) => {
  const { isLoggedIn, fullName, email, avatarUrl, toggleAuthStatus } = useAuthSession();

  // If initialUser was explicitly provided, respect it; otherwise bind to real auth session
  const activeUser = initialUser || {
    isLoggedIn,
    name: fullName || 'সাবির আহমেদ',
    phone: email || '+91 98765 43210',
    recentCategory: DEFAULT_MOCK_USER.recentCategory,
  };

  const handleToggleAuth = () => {
    toggleAuthStatus();
  };

  return (
    <div className="bg-white rounded-lg p-4 sm:p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full group/spotlight relative z-0">
      {/* Dynamic Status Pill (Task 41) */}
      <div className="flex items-center justify-between mb-2 select-none">
        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/80">
          {activeUser.isLoggedIn ? 'স্বাগতম গ্রাহক' : 'গ্রাহক অ্যাকাউন্ট সুবিধা'}
        </span>
        {activeUser.isLoggedIn && (
          <span className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>লগইন সক্রিয়</span>
          </span>
        )}
      </div>

      {!activeUser.isLoggedIn ? (
        /* Unauthenticated State: Amazon Signature Sign-in Prompt */
        <div className="flex-1 flex flex-col justify-between py-1">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-950 font-bengali leading-snug">
              সেরা শপিং অভিজ্ঞতার জন্য লগইন করুন
            </h3>
            <p className="text-xs text-gray-600 font-bengali mt-1.5 leading-relaxed">
              আপনার সংরক্ষিত অর্ডার ট্র্যাক করুন, উইশলিস্ট ম্যানেজ করুন এবং শিক্ষার্থীদের বিশেষ ছাড় উপভোগ করুন।
            </p>

            {/* Amazon Signature Yellow 1-Click Sign-in Button */}
            <div className="my-4">
              <Link
                href="/login"
                prefetch={true}
                className="w-full py-2.5 px-4 rounded-lg bg-[#febd69] hover:bg-[#f3a847] text-gray-950 font-bold text-sm font-bengali flex items-center justify-center gap-2 shadow-xs hover:shadow-md active:scale-98 transition-all"
              >
                <LogIn className="w-4 h-4 text-gray-900" />
                <span>নিরাপদে সাইন ইন করুন</span>
              </Link>
            </div>

            {/* Value Propositions / Store Perks */}
            <div className="space-y-2 pt-1 border-t border-gray-100">
              <div className="flex items-center gap-2 text-xs text-gray-700 font-bengali">
                <Truck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>মালদা ও সমগ্র বাংলায় হোম ডেলিভারি</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-700 font-bengali">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                <span>১০০% আসল বই ও ক্যাশ অন ডেলিভারি</span>
              </div>
            </div>
          </div>

          {/* Footer Direct Action */}
          <div className="pt-3 border-t border-gray-100 mt-3">
            <Link
              href="/login"
              prefetch={true}
              className="text-xs sm:text-sm font-semibold text-sky-700 hover:text-amber-700 hover:underline inline-flex items-center gap-1 font-bengali group/link"
            >
              <span>নতুন অ্যাকাউন্ট খুলুন</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-1" />
            </Link>
          </div>
        </div>
      ) : (
        /* Authenticated State: Personalized Customer Hub */
        <div className="flex-1 flex flex-col justify-between py-1">
          <div>
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold font-bengali text-sm border border-amber-300">
                {activeUser.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-950 font-bengali leading-tight">
                  স্বাগতম, {activeUser.name}!
                </h3>
                <span className="text-[11px] text-gray-500 font-mono">{activeUser.phone}</span>
              </div>
            </div>

            <p className="text-xs text-gray-600 font-bengali leading-relaxed mb-3">
              আপনার সাম্প্রতিক পছন্দের বিষয়ের বইগুলো দ্রুত ব্রাউজ করুন:
            </p>

            {/* Quick Access Card Box */}
            {activeUser.recentCategory && (
              <Link
                href={activeUser.recentCategory.targetUrl}
                prefetch={true}
                className="block p-3 rounded-lg bg-amber-50/70 border border-amber-200/80 hover:bg-amber-100/70 transition-colors group/rec mb-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-700" />
                    <span className="text-xs font-bold text-gray-900 font-bengali">
                      {activeUser.recentCategory.nameBn}
                    </span>
                  </div>
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <span className="text-[10px] text-gray-500 font-bengali block mt-1">
                  সর্বশেষ আপডেট ও নতুন কালেকশন
                </span>
              </Link>
            )}

            <div className="grid grid-cols-2 gap-2 text-center text-xs font-bengali">
              <Link
                href="/orders"
                prefetch={true}
                className="p-2 rounded bg-gray-50 hover:bg-gray-100 text-gray-800 font-medium border border-gray-200/80 transition-colors"
              >
                📦 আপনার অর্ডার
              </Link>
              <Link
                href="/account"
                prefetch={true}
                className="p-2 rounded bg-gray-50 hover:bg-gray-100 text-gray-800 font-medium border border-gray-200/80 transition-colors"
              >
                👤 প্রোফাইল
              </Link>
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-3 border-t border-gray-100 mt-3">
            <Link
              href="/account"
              prefetch={true}
              className="text-xs sm:text-sm font-semibold text-sky-700 hover:text-amber-700 hover:underline inline-flex items-center gap-1 font-bengali group/link"
            >
              <span>আপনার সম্পূর্ণ অ্যাকাউন্টে যান</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-1" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
