import React, { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Home, MapPin } from 'lucide-react';
import { AddressCardGrid } from '@/components/account/AddressCardGrid';

export const metadata: Metadata = {
  title: 'আপনার সংরক্ষিত ডেলিভারি ঠিকানা (Your Addresses) | M.M Book House Malda',
  description: 'M.M Book House Malda কাস্টমার অ্যাড্রেস বুক। একাধিক ডেলিভারি ঠিকানা পরিচালনা, নতুন ঠিকানা যোগ, সম্পাদনা ও ডিফল্ট নির্বাচন।',
  keywords: ['ডেলিভারি ঠিকানা', 'অ্যাড্রেস বুক', 'Your Addresses', 'Amazon Address Book', 'মালদা বই ডেলিভারি'],
};

export default function AccountAddressesPage() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8 min-h-[75vh] font-bengali">
      {/* Breadcrumb Navigation */}
      <nav aria-label="ব্রেডক্রাম্ব" className="flex items-center gap-1.5 text-xs text-slate-500 mb-6 select-none flex-wrap">
        <Link href="/" className="hover:text-amber-600 flex items-center gap-1 transition-colors">
          <Home className="w-3.5 h-3.5" />
          <span>হোম</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link href="/account" className="hover:text-amber-600 transition-colors">
          আপনার অ্যাকাউন্ট
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-bold text-slate-900 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-amber-600" />
          <span>আপনার ঠিকানা (Addresses)</span>
        </span>
      </nav>

      {/* Main Address Card Grid */}
      <Suspense
        fallback={
          <div className="space-y-6 animate-pulse">
            <div className="h-16 bg-slate-100 rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="h-64 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-200" />
              <div className="h-64 bg-slate-100 rounded-2xl" />
              <div className="h-64 bg-slate-100 rounded-2xl" />
            </div>
          </div>
        }
      >
        <AddressCardGrid />
      </Suspense>
    </div>
  );
}
