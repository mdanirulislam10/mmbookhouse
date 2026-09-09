import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Flame, TrendingUp, Sparkles, ChevronRight, Home, ArrowUpRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Movers & Shakers (ট্রেন্ডিং বই) | M.M Book House Malda',
  description: 'গত ২৪ ঘণ্টায় মালদা ও পশ্চিমবঙ্গের সর্বাধিক বিক্রিত ও জনপ্রিয় বইয়ের ট্রেন্ডিং তালিকা। লাইভ চাহিদা ও দ্রুত স্টক আউট অ্যালার্ট।',
  keywords: ['Movers and Shakers', 'ট্রেন্ডিং বই', 'মালদা বই চাহিদা', 'M.M Book House Trending'],
};

const TRENDING_BOOKS = [
  {
    id: 'trend-1',
    rank: 1,
    surge: '+210% বৃদ্ধি',
    title: 'WBP কনস্টেবল ও লেডি কনস্টেবল ২০২৬ প্র্যাকটিস সেট সমগ্র',
    publisher: 'ছায়া প্রকাশনী',
    mrp: 420,
    price: 294,
    discount: '30%',
    reason: 'সাম্প্রতিক নতুন বিজ্ঞপ্তি ও পরীক্ষার ঘোষণার কারণে বিপুল চাহিদা',
    category: 'পুলিশ ও চাকরির পরীক্ষা',
    categoryUrl: '/category/competitive-exams/wb-police',
  },
  {
    id: 'trend-2',
    rank: 2,
    surge: '+185% বৃদ্ধি',
    title: 'UGB ৫ম সেমিস্টার ইতিহাস ও পলিটিক্যাল সায়েন্স সিলেবাস গাইড',
    publisher: 'মওলানা আজাদ পাবলিকেশন',
    mrp: 380,
    price: 266,
    discount: '30%',
    reason: 'বিশ্ববিদ্যালয়ের সেমিস্টার পরীক্ষা আসন্ন হওয়ায় শিক্ষার্থীদের শীর্ষ পছন্দ',
    category: 'কলেজ সেমিস্টার',
    categoryUrl: '/category/college/ugb',
  },
  {
    id: 'trend-3',
    rank: 3,
    surge: '+140% বৃদ্ধি',
    title: 'WBCS প্রিলিমস লাস্ট ১০ ইয়ার্স সলভড পেপারস ও বিশ্লেষণ',
    publisher: 'দে’জ পাবলিশিং',
    mrp: 550,
    price: 385,
    discount: '30%',
    reason: 'প্রিলিমিনারি প্র্যাকটিসের জন্য মালদার সিভিল সার্ভিস পরীক্ষার্থীদের পছন্দ',
    category: 'WBCS স্পেশাল',
    categoryUrl: '/category/wbcs/solved-papers',
  },
  {
    id: 'trend-4',
    rank: 4,
    surge: '+120% বৃদ্ধি',
    title: 'মাধ্যমিক গণিত প্রকাশ সমাধান ও টেস্ট পেপার সাজেশন',
    publisher: 'রায় ও মার্টিন',
    mrp: 290,
    price: 203,
    discount: '30%',
    reason: 'বোর্ড পরীক্ষার রিভিশনের জন্য সর্বাধিক খোঁজা সহায়িকা',
    category: 'স্কুল এডুকেশন',
    categoryUrl: '/category/school/madhyamik',
  },
  {
    id: 'trend-5',
    rank: 5,
    surge: '+95% বৃদ্ধি',
    title: 'ব্যোমকেশ সমগ্র (অখণ্ড সংস্করণ)',
    publisher: 'আনন্দ পাবলিশার্স',
    mrp: 750,
    price: 562,
    discount: '25%',
    reason: 'বইমেলা ও ছুটির মৌসুমে বাংলা সাহিত্যের সবচেয়ে পঠিত রহস্য সমগ্র',
    category: 'সাহিত্য ও উপন্যাস',
    categoryUrl: '/category/literature/detective-thriller',
  },
];

export default function TrendingPage() {
  return (
    <div className="max-w-[1500px] mx-auto px-4 py-6 min-h-[75vh]">
      {/* Breadcrumb */}
      <nav aria-label="ব্রেডক্রাম্ব" className="flex items-center gap-1.5 text-xs text-gray-500 mb-4 select-none">
        <Link href="/" className="hover:text-amber-600 flex items-center gap-1">
          <Home className="w-3.5 h-3.5" />
          <span>হোম</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="font-bold text-gray-900">Movers & Shakers</span>
      </nav>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#131921] via-[#202c39] to-[#232f3e] text-white rounded-xl p-6 sm:p-8 mb-8 border border-red-500/20 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/30 text-red-300 text-xs font-bold uppercase tracking-wider mb-3">
              <Flame className="w-4 h-4 text-red-400 animate-pulse" />
              <span>Movers & Shakers (সর্বাধিক জনপ্রিয়)</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              গত ২৪ ঘণ্টায় <span className="text-amber-400">সর্বাধিক বিক্রির রেকর্ড</span>
            </h1>
            <p className="text-sm text-gray-300 mt-2 max-w-xl">
              যে বইগুলোর বিক্রি গত ২৪ ঘণ্টায় সবচেয়ে বেশি লাফিয়েছে! দ্রুত স্টক শেষ হওয়ার আগেই সংগ্রহ করুন।
            </p>
          </div>
          <div className="text-right hidden md:block">
            <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">রিয়েল-টাইম আপডেট</div>
            <div className="text-lg font-black text-amber-400 font-mono">প্রতি ১ ঘণ্টা পর পর</div>
          </div>
        </div>
      </div>

      {/* Trending Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TRENDING_BOOKS.map((book) => (
          <div
            key={book.id}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              {/* Surge badge */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="inline-flex items-center gap-1 text-[11px] font-black text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                  <TrendingUp className="w-3.5 h-3.5 text-red-600" />
                  <span>{book.surge}</span>
                </span>
                <span className="text-xs text-gray-500 font-medium">
                  {book.category}
                </span>
              </div>

              <h3 className="font-bold text-gray-900 text-base group-hover:text-amber-700 transition-colors line-clamp-2 mb-2">
                {book.title}
              </h3>
              <p className="text-xs text-gray-500 mb-1">
                প্রকাশনী: <span className="font-medium text-gray-700">{book.publisher}</span>
              </p>
              <p className="text-xs text-amber-800 bg-amber-50/70 border border-amber-200/60 p-2 rounded mb-4">
                💡 <strong>চাহিদার কারণ:</strong> {book.reason}
              </p>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <div>
                <span className="text-xl font-black text-gray-950">₹{book.price}</span>
                <span className="text-xs text-gray-400 line-through ml-1.5">₹{book.mrp}</span>
              </div>
              <Link
                href={book.categoryUrl}
                className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-amber-400 hover:bg-amber-500 text-gray-950 text-xs font-bold rounded shadow-xs transition-colors"
              >
                <span>বইটি দেখুন</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
