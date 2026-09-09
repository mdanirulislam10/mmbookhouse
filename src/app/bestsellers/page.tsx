import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Award, Star, TrendingUp, Sparkles, BookOpen, ChevronRight, Home, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'বেস্টসেলার বইয়ের তালিকা (Top 10 Bestsellers) | M.M Book House Malda',
  description: 'মালদা ও পশ্চিমবঙ্গের সর্বাধিক বিক্রিত প্রামাণ্য বইয়ের সংকলন। WBCS, কলেজ ও বিশ্ববিদ্যালয় সেমিস্টার, মাধ্যমিক টেস্ট পেপার ও কালজয়ী সাহিত্যের সেরা বই।',
  keywords: ['বেস্টসেলার বই', 'Top 10 Books Malda', 'WBCS Bestseller', 'M.M Book House'],
};

const BESTSELLERS = [
  {
    rank: 1,
    title: 'WBCS প্রিলিমিনারি ও মেইনস কমপ্লিট ম্যানুয়াল (২০২৬ সংস্করণ)',
    author: 'ড. অশোক কুমার ঘোষ ও নিতিন সিংহানিয়া বিশেষজ্ঞ টিম',
    publisher: 'ছায়া প্রকাশনী',
    mrp: 850,
    price: 595,
    discount: '30%',
    rating: 4.9,
    reviewsCount: 342,
    badge: '#1 BESTSELLER',
    category: 'WBCS ও সিভিল সার্ভিস',
    categoryUrl: '/category/wbcs/prelims',
  },
  {
    rank: 2,
    title: 'গৌড়বঙ্গ বিশ্ববিদ্যালয় (UGB) ইতিহাস অনার্স ৪র্থ সেমিস্টার সহায়িকা',
    author: 'প্রফেসর প্রণব চ্যাটার্জী',
    publisher: 'মওলানা আজাদ পাবলিকেশন',
    mrp: 420,
    price: 315,
    discount: '25%',
    rating: 4.8,
    reviewsCount: 189,
    badge: 'UGB TOP CHOICE',
    category: 'কলেজ সেমিস্টার',
    categoryUrl: '/category/college/ugb',
  },
  {
    rank: 3,
    title: 'পশ্চিমবঙ্গ পুলিশ কনস্টেবল ও এসআই কমপ্লিট চ্যালেঞ্জার ২০২৬',
    author: 'ছায়া সম্পাদকীয় মণ্ডলী',
    publisher: 'ছায়া প্রকাশনী',
    mrp: 480,
    price: 336,
    discount: '30%',
    rating: 4.9,
    reviewsCount: 512,
    badge: 'HOT SELLER',
    category: 'পুলিশ ও চাকরির পরীক্ষা',
    categoryUrl: '/category/competitive-exams/wb-police',
  },
  {
    rank: 4,
    title: 'মাধ্যমিক টেস্ট পেপারস ও লাস্ট মিনিট সাজেশন সমগ্র',
    author: 'বিশেষজ্ঞ শিক্ষক পরিষদ',
    publisher: 'রায় ও মার্টিন',
    mrp: 350,
    price: 245,
    discount: '30%',
    rating: 4.7,
    reviewsCount: 420,
    badge: 'MADHYAMIK #1',
    category: 'স্কুল এডুকেশন',
    categoryUrl: '/category/school/madhyamik',
  },
  {
    rank: 5,
    title: 'কালজয়ী বাংলা গোয়েন্দা সমগ্র (ব্যোমকেশ, ফেলুদা ও কাকাবাবু বিশেষ সংস্করণ)',
    author: 'শরদিন্দু বন্দ্যোপাধ্যায় ও সত্যজিৎ রায়',
    publisher: 'আনন্দ পাবলিশার্স',
    mrp: 950,
    price: 665,
    discount: '30%',
    rating: 5.0,
    reviewsCount: 278,
    badge: 'CLASSIC BESTSELLER',
    category: 'সাহিত্য ও উপন্যাস',
    categoryUrl: '/category/literature/detective-thriller',
  },
  {
    rank: 6,
    title: 'ভারতের ইতিহাস ও জাতীয় আন্দোলন (Civil Services Special)',
    author: 'জীবন মুখোপাধ্যায়',
    publisher: 'শ্রীধর প্রকাশনী',
    mrp: 520,
    price: 390,
    discount: '25%',
    rating: 4.8,
    reviewsCount: 164,
    badge: 'RECOMMENDED',
    category: 'ইতিহাস ও সিভিল সার্ভিস',
    categoryUrl: '/category/wbcs/optional-history',
  },
  {
    rank: 7,
    title: 'প্রাথমিক ও উচ্চ প্রাথমিক TET কমপ্লিট সাকসেস গাইড',
    author: 'এম.এম একাডেমি প্যানেল',
    publisher: 'পারুল প্রকাশনী',
    mrp: 390,
    price: 273,
    discount: '30%',
    rating: 4.6,
    reviewsCount: 195,
    badge: 'TET BESTSELLER',
    category: 'শিক্ষক নিয়োগ পরীক্ষা',
    categoryUrl: '/category/competitive-exams/tet',
  },
  {
    rank: 8,
    title: 'উচ্চমাধ্যমিক (Class 12) আর্টস প্রশ্ন বিচিত্রা ও টেস্ট পেপার ২০২৬',
    author: 'পারুল সম্পাদকীয় পরিষদ',
    publisher: 'পারুল প্রকাশনী',
    mrp: 380,
    price: 266,
    discount: '30%',
    rating: 4.7,
    reviewsCount: 142,
    badge: 'WBCHSE TOP',
    category: 'স্কুল এডুকেশন',
    categoryUrl: '/category/school/higher-secondary',
  },
  {
    rank: 9,
    title: 'কলকাতা বিশ্ববিদ্যালয় (CU) বি.কম ট্যাক্সেশন ও অডিটিং গাইড',
    author: 'ড. অশোক বন্দ্যোপাধ্যায়',
    publisher: 'দে’জ পাবলিশিং',
    mrp: 460,
    price: 345,
    discount: '25%',
    rating: 4.8,
    reviewsCount: 88,
    badge: 'COMMERCE #1',
    category: 'কলেজ সেমিস্টার',
    categoryUrl: '/category/college/bcom',
  },
  {
    rank: 10,
    title: 'আধুনিক বাংলা কবিতা ও শ্রেষ্ঠ কবিতা সংকলন',
    author: 'শঙ্খ ঘোষ, জীবনানন্দ দাশ ও সুনীল গঙ্গোপাধ্যায়',
    publisher: 'দে’জ পাবলিশিং',
    mrp: 600,
    price: 450,
    discount: '25%',
    rating: 4.9,
    reviewsCount: 120,
    badge: 'LITERATURE GOLD',
    category: 'বাংলা সাহিত্য',
    categoryUrl: '/category/literature/poetry',
  },
];

export default function BestsellersPage() {
  return (
    <div className="max-w-[1500px] mx-auto px-4 py-6 min-h-[75vh]">
      {/* Breadcrumb */}
      <nav aria-label="ব্রেডক্রাম্ব" className="flex items-center gap-1.5 text-xs text-gray-500 mb-4 select-none">
        <Link href="/" className="hover:text-amber-600 flex items-center gap-1">
          <Home className="w-3.5 h-3.5" />
          <span>হোম</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="font-bold text-gray-900">বেস্টসেলার বই</span>
      </nav>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#131921] via-[#1e2a38] to-[#232f3e] text-white rounded-xl p-6 sm:p-8 mb-8 border border-amber-500/20 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
              <Award className="w-4 h-4 text-amber-400" />
              <span>মালদা ও উত্তরবঙ্গের সর্বাধিক পঠিত</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              এই সপ্তাহের <span className="text-amber-400">টপ ১০ বেস্টসেলার বই</span>
            </h1>
            <p className="text-sm text-gray-300 mt-2 max-w-xl">
              প্রতি সপ্তাহে মালদার শিক্ষার্থী ও পাঠকদের পছন্দের ভিত্তিতে আপডেট হওয়া সেরা বিক্রিত বইয়ের তালিকা।
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg p-4 text-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold text-white">১০০% আসল প্রিন্ট গ্যারান্টি</div>
              <div className="text-gray-400">সরাসরি নেতাজি সুভাষ রোড কাউন্টার স্টক</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bestseller List */}
      <div className="space-y-4">
        {BESTSELLERS.map((book) => (
          <div
            key={book.rank}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:border-amber-400 hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
          >
            <div className="flex items-start gap-4 min-w-0">
              {/* Rank Badge */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-base shrink-0 ${
                book.rank <= 3
                  ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-gray-950 shadow-xs'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                #{book.rank}
              </div>

              {/* Details */}
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded bg-red-600 text-white">
                    {book.badge}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">
                    {book.category}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 text-base group-hover:text-amber-700 transition-colors">
                  {book.title}
                </h3>
                <div className="text-xs text-gray-500 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>লেখক: <strong className="text-gray-700">{book.author}</strong></span>
                  <span>প্রকাশনী: <strong className="text-gray-700">{book.publisher}</strong></span>
                  <span className="flex items-center gap-1 text-amber-600">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <strong>{book.rating}</strong> ({book.reviewsCount})
                  </span>
                </div>
              </div>
            </div>

            {/* Price & Action */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100 gap-2">
              <div className="flex sm:flex-col items-baseline sm:items-end gap-2 sm:gap-0">
                <div className="text-xl font-black text-gray-950">₹{book.price}</div>
                <div className="text-xs text-gray-400 line-through">M.R.P: ₹{book.mrp}</div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                  {book.discount} ছাড়
                </span>
              </div>
              <Link
                href={book.categoryUrl}
                className="inline-flex items-center gap-1 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-gray-950 text-xs font-bold rounded shadow-xs transition-colors"
              >
                <span>বইটি দেখুন</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
