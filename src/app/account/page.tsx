import React, { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { AccountDashboardClient } from '@/components/account/AccountDashboardClient';

export const metadata: Metadata = {
  title: 'আপনার অ্যাকাউন্ট ও সেটিংস | M.M Book House Malda',
  description: 'M.M Book House Malda গ্রাহক অ্যাকাউন্ট। অর্ডার হিস্ট্রি, ডেলিভারি ঠিকানা, সংরক্ষিত বই ও নিরাপত্তা সেটিংস।',
  keywords: ['অ্যাকাউন্ট', 'My Account', 'M.M Book House Account', 'গ্রাহক প্রোফাইল'],
};

export default function AccountPage() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8 min-h-[75vh] font-bengali">
      {/* Breadcrumb */}
      <nav aria-label="ব্রেডক্রাম্ব" className="flex items-center gap-1.5 text-xs text-gray-500 mb-6 select-none">
        <Link href="/" className="hover:text-amber-600 flex items-center gap-1">
          <Home className="w-3.5 h-3.5" />
          <span>হোম</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="font-bold text-gray-900">আপনার অ্যাকাউন্ট</span>
      </nav>

      {/* Dynamic Client Dashboard Hub */}
      <Suspense
        fallback={
          <div className="space-y-6 animate-pulse">
            <div className="h-32 bg-gray-200 rounded-2xl" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-44 bg-gray-200 rounded-2xl" />
              <div className="h-44 bg-gray-200 rounded-2xl" />
              <div className="h-44 bg-gray-200 rounded-2xl" />
            </div>
          </div>
        }
      >
        <AccountDashboardClient />
      </Suspense>
    </div>
  );
}
