import React from 'react';
import Link from 'next/link';
import { BookOpen, Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4 shadow-sm">
        <BookOpen className="w-10 h-10" />
      </div>

      <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-2">
        ৪০৪: বইটি খুঁজে পাওয়া যায়নি
      </h1>

      <p className="text-sm sm:text-base text-gray-600 max-w-md mb-6 leading-relaxed">
        আপনি যে বই বা পেজটি খুঁজছেন তা স্থানান্তরিত হয়েছে অথবা এই মুহূর্তে ক্যাটালগে উপলব্ধ নেই।
      </p>

      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-all shadow-xs"
        >
          <Home className="w-4 h-4" />
          <span>হোম পেজে ফিরে যান</span>
        </Link>

        <Link
          href="/search"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 font-bold text-sm transition-all shadow-xs"
        >
          <Search className="w-4 h-4 text-amber-600" />
          <span>ক্যাটালগ সার্চ করুন</span>
        </Link>
      </div>
    </div>
  );
}
