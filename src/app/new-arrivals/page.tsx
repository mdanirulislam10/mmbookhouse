import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Clock, Sparkles, ChevronRight, Home, ArrowRight, BookOpen } from 'lucide-react';

export const metadata: Metadata = {
  title: 'নতুন প্রকাশিত বই (New Arrivals 2026) | M.M Book House Malda',
  description: '২০২৬ সালের নতুন সংস্করণ ও সদ্য প্রকাশিত প্রামাণ্য বইসমূহ। WBCS নতুন সিলেবাস, UGB NEP সেমিস্টার গাইড ও সাম্প্রতিক বাংলা সাহিত্য।',
  keywords: ['নতুন বই', 'New Arrivals 2026', 'নতুন সিলেবাস বই', 'M.M Book House New Arrivals'],
};

const NEW_ARRIVALS = [
  {
    id: 'new-1',
    title: '২০২৬ WBCS প্রিলিমস কারেন্ট অ্যাফেয়ার্স ও পশ্চিমবঙ্গ ইয়ারবুক',
    author: 'এম.এম রিসার্চ টিম',
    publisher: 'ছায়া প্রকাশনী',
    mrp: 320,
    price: 240,
    discount: '25%',
    arrivalDate: 'আজই স্টকে এসেছে',
    category: 'WBCS স্পেশাল',
    categoryUrl: '/category/wbcs/current-affairs',
  },
  {
    id: 'new-2',
    title: 'গৌড়বঙ্গ বিশ্ববিদ্যালয় NEP ২০২৬ স্নাতক সেমিস্টার দর্শন সহায়িকা',
    author: 'প্রফেসর অসীম দে',
    publisher: 'মওলানা আজাদ পাবলিকেশন',
    mrp: 350,
    price: 280,
    discount: '20%',
    arrivalDate: 'গতকাল এসেছে',
    category: 'কলেজ সেমিস্টার',
    categoryUrl: '/category/college/ugb',
  },
  {
    id: 'new-3',
    title: 'রেলওয়ে রিক্রুটমেন্ট (RRB ALP ও টেকনিশিয়ান) প্র্যাকটিস ম্যানুয়াল',
    author: 'আর.কে. শর্মা ও বাংলা অনুবাদ টিম',
    publisher: 'দে’জ পাবলিশিং',
    mrp: 460,
    price: 345,
    discount: '25%',
    arrivalDate: '২ দিন আগে',
    category: 'চাকরির পরীক্ষা',
    categoryUrl: '/category/competitive-exams/railway',
  },
  {
    id: 'new-4',
    title: 'সমকালীন বাংলা ছোটগল্প সংকলন ও নির্বাচিত গল্পসমূহ (২০২৬)',
    author: 'শীর্ষেন্দু মুখোপাধ্যায় ও সমসাময়িক লেখকবৃন্দ',
    publisher: 'আনন্দ পাবলিশার্স',
    mrp: 480,
    price: 360,
    discount: '25%',
    arrivalDate: 'সদ্য প্রকাশিত',
    category: 'বাংলা সাহিত্য',
    categoryUrl: '/category/literature/short-stories',
  },
  {
    id: 'new-5',
    title: 'WBPSC ক্লার্কশিপ ও ফুড এসআই মেগা প্র্যাকটিস সেট ২০২৬',
    author: 'বিশেষজ্ঞ টিম',
    publisher: 'পারুল প্রকাশনী',
    mrp: 380,
    price: 285,
    discount: '25%',
    arrivalDate: 'এই সপ্তাহে',
    category: 'চাকরির পরীক্ষা',
    categoryUrl: '/category/competitive-exams/wbpsc-clerkship',
  },
  {
    id: 'new-6',
    title: 'মালদার ইতিহাস ও গৌড়ের স্থাপত্য ঐতিহ্য (বিশেষ সংস্করণ)',
    author: 'আঞ্চলিক ইতিহাস পরিষদ',
    publisher: 'এম.এম হেরিটেজ প্রেস',
    mrp: 290,
    price: 232,
    discount: '20%',
    arrivalDate: 'স্পেশাল এডিশন',
    category: 'মালদা স্পেশাল',
    categoryUrl: '/category/specials/malda-heritage',
  },
];

export default function NewArrivalsPage() {
  return (
    <div className="max-w-[1500px] mx-auto px-4 py-6 min-h-[75vh]">
      {/* Breadcrumb */}
      <nav aria-label="ব্রেডক্রাম্ব" className="flex items-center gap-1.5 text-xs text-gray-500 mb-4 select-none">
        <Link href="/" className="hover:text-amber-600 flex items-center gap-1">
          <Home className="w-3.5 h-3.5" />
          <span>হোম</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="font-bold text-gray-900">নতুন বই (New Arrivals)</span>
      </nav>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#131921] via-[#1a2533] to-[#232f3e] text-white rounded-xl p-6 sm:p-8 mb-8 border border-emerald-500/20 shadow-lg">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>সদ্য প্রকাশিত ও নতুন সিলেবাস</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            নতুন প্রকাশিত বই <span className="text-amber-400">(New Arrivals 2026)</span>
          </h1>
          <p className="text-sm text-gray-300 mt-2">
            সর্বশেষ সিলেবাস ও কারেন্ট কারিকুলাম অনুসারে সদ্য মুদ্রিত নতুন বই সরাসরি কলকাতার শীর্ষ পাবলিশার্স থেকে আমাদের মালদা কাউন্টারে উপস্থিত হয়েছে।
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {NEW_ARRIVALS.map((book) => (
          <div
            key={book.id}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-600 text-white">
                  <Clock className="w-3 h-3" />
                  <span>{book.arrivalDate}</span>
                </span>
                <span className="text-xs text-gray-500 font-medium">
                  {book.category}
                </span>
              </div>

              <h3 className="font-bold text-gray-900 text-base group-hover:text-amber-700 transition-colors line-clamp-2 mb-1">
                {book.title}
              </h3>
              <p className="text-xs text-gray-500 mb-1">লেখক: {book.author}</p>
              <p className="text-xs text-gray-500 mb-4">প্রকাশনী: <span className="font-medium text-gray-700">{book.publisher}</span></p>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <div>
                <span className="text-xl font-black text-gray-950">₹{book.price}</span>
                <span className="text-xs text-gray-400 line-through ml-1.5">₹{book.mrp}</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded ml-1.5">
                  {book.discount} ছাড়
                </span>
              </div>
              <Link
                href={book.categoryUrl}
                className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-amber-400 hover:bg-amber-500 text-gray-950 text-xs font-bold rounded shadow-xs transition-colors"
              >
                <span>দেখুন</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
