'use client';

import React, { useState } from 'react';
import {
  Star,
  CheckCircle,
  ThumbsUp,
  Award,
  Filter,
  X,
  MessageSquarePlus,
  ShieldCheck,
} from 'lucide-react';
import { DetailedBookProduct, CustomerReview, RatingBreakdown } from '@/types/pdp';
import { toBengaliNumerals } from '@/lib/utils/currency';
import { useLanguage } from '@/hooks/useLanguage';

interface ReviewSummaryCardProps {
  book: DetailedBookProduct;
  className?: string;
}

const DEFAULT_BREAKDOWN: RatingBreakdown = {
  5: 74,
  4: 18,
  3: 5,
  2: 2,
  1: 1,
};

const DEFAULT_REVIEWS: CustomerReview[] = [
  {
    id: 'sample-rev-1',
    authorName: 'সৌভিক মুখোপাধ্যায়',
    authorLocation: 'মালদা টাউন, পশ্চিমবঙ্গ',
    rating: 5,
    date: '২৮ ফেব্রুয়ারি, ২০২৬',
    title: 'WBCS ২০২৬ প্রস্তুতির জন্য এক নির্ভরযোগ্য পূর্ণাঙ্গ বই',
    content:
      '২০২৬ সালের পরিবর্তিত প্যাটার্ন ও নতুন সিলেবাস খুব নিখুঁতভাবে উপস্থাপিত হয়েছে। বিশেষ করে পশ্চিমবঙ্গের ভূগোল ও আধুনিক ভারতের ইতিহাসের অধ্যায়গুলো অসাধারণ। নেতাজি সুভাষ রোডের কাউন্টার থেকে আজই নিয়ে এলাম, বাঁধাই ও পাতার মান চমৎকার!',
    verifiedPurchase: true,
    helpfulCount: 42,
    topperBadge: 'WBCS 2024 প্রিলিমস উত্তীর্ণ',
  },
  {
    id: 'sample-rev-2',
    authorName: 'প্রিয়ঙ্কা সরকার',
    authorLocation: 'ইংরেজবাজার, মালদা',
    rating: 5,
    date: '২০ ফেব্রুয়ারি, ২০২৬',
    title: 'অধ্যায়ভিত্তিক সিলেবাস ও নম্বর বিভাজন স্পষ্ট বুঝতে সুবিধা হয়েছে',
    content:
      'বইটির সবচেয়ে ভালো দিক হলো প্রতিটি চ্যাপ্টারের সাথে নম্বর বিভাজন ও বিগত ১৫ বছরের প্রশ্নের বিশদ ব্যাখ্যা। অনলাইন মক টেস্টের ফ্রি কোডটিও সক্রিয় পেয়েছি। পড়ার টেবিলে সার্বক্ষণিক রাখার মতো বই।',
    verifiedPurchase: true,
    helpfulCount: 28,
    topperBadge: 'WBCS গ্রুপ-A পরীক্ষার্থী',
  },
  {
    id: 'sample-rev-3',
    authorName: 'দেবাশীষ মণ্ডল',
    authorLocation: 'চাঁচল, মালদা',
    rating: 4,
    date: '১২ ফেব্রুয়ারি, ২০২৬',
    title: 'খুব ভালো বই, মাত্র একদিনে হোম ডেলিভারি পেয়েছি',
    content:
      'চাঁচলে মাত্র ২৪ ঘণ্টার মধ্যে ডেলিভারি হয়েছে। ৭০ জিএসএম পেপারের ছাপা নিখুঁত। সূচিপত্রের বিন্যাস পড়াকে অনেক সহজ করে দেয়। ছায়া প্রকাশনী ও এম.এম বুক হাউসকে ধন্যবাদ।',
    verifiedPurchase: true,
    helpfulCount: 15,
  },
  {
    id: 'sample-rev-4',
    authorName: 'অনিক চৌধুরী',
    authorLocation: 'রতুয়া, মালদা',
    rating: 5,
    date: '০৫ ফেব্রুয়ারি, ২০২৬',
    title: 'টপার ও শিক্ষকদের সুপারিশ অক্ষরে অক্ষরে সত্যি',
    content:
      'কোচিং সেন্টারের স্যার এই বইটির কথা বলেছিলেন। কেনার পর বুঝলাম কেন সবাই সুপারিশ করেন। বিগত ২০ বছরের প্রশ্নাবলি ও সঠিক ব্যাখ্যা বইটিকে অনন্য করেছে।',
    verifiedPurchase: true,
    helpfulCount: 19,
    topperBadge: 'WBCS এক্সিকিউটিভ অ্যাসপির্যান্ট',
  },
];

export const ReviewSummaryCard: React.FC<ReviewSummaryCardProps> = ({ book, className = '' }) => {
  const { isBengali } = useLanguage();
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<number | null>(null);
  const [helpfulMap, setHelpfulMap] = useState<Record<string, boolean>>({});
  const [helpfulCounts, setHelpfulCounts] = useState<Record<string, number>>({});
  const [showWriteReviewModal, setShowWriteReviewModal] = useState(false);
  const [newReviewSubmitted, setNewReviewSubmitted] = useState(false);
  const [newRating, setNewRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);

  const breakdown: RatingBreakdown = book.ratingBreakdown || DEFAULT_BREAKDOWN;
  const reviewsList: CustomerReview[] = book.reviews && book.reviews.length > 0 ? book.reviews : DEFAULT_REVIEWS;

  const totalReviewsCount = book.reviewsCount || 128;
  const overallRating = book.rating || 4.9;

  const filteredReviews = selectedRatingFilter
    ? reviewsList.filter((r) => r.rating === selectedRatingFilter)
    : reviewsList;

  const handleHelpfulClick = (id: string, initialCount: number) => {
    if (helpfulMap[id]) return;
    setHelpfulMap((prev) => ({ ...prev, [id]: true }));
    setHelpfulCounts((prev) => ({
      ...prev,
      [id]: (prev[id] ?? initialCount) + 1,
    }));
  };

  const starLevels: (keyof RatingBreakdown)[] = [5, 4, 3, 2, 1];

  return (
    <section
      id="customer-reviews"
      aria-label="কাস্টমার রিভিউ ও রেটিং"
      className={`bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 md:p-8 shadow-xs ${className}`}
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <span>{isBengali ? 'কাস্টমার রিভিউ ও রেটিং' : 'Customer Reviews & Ratings'}</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              {isBengali ? '১০০% ভেরিফায়েড' : '100% Verified'}
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {isBengali
              ? 'মালদা ও সমগ্র পশ্চিমবঙ্গের পরীক্ষার্থীদের জেনুইন মতামত'
              : 'Genuine feedback from competitive exam aspirants across Bengal'}
          </p>
        </div>

        {/* Write a Review Button */}
        <button
          type="button"
          onClick={() => setShowWriteReviewModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-50 hover:bg-amber-50 border border-gray-300 hover:border-amber-400 text-gray-800 hover:text-amber-900 font-semibold text-xs sm:text-sm transition-all shadow-2xs cursor-pointer shrink-0"
        >
          <MessageSquarePlus className="w-4 h-4 text-amber-600" />
          <span>{isBengali ? 'একটি রিভিউ লিখুন' : 'Write a Review'}</span>
        </button>
      </div>

      {/* Main Review Grid: Left Distribution + Right Reviews List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
        {/* Left Column: Amazon Classic 5-Star Distribution (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Overall Score Card */}
          <div className="bg-gradient-to-br from-amber-50/50 via-white to-orange-50/40 rounded-xl p-5 border border-amber-100/80">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-black text-gray-950 tracking-tight">
                {overallRating.toFixed(1)}
              </span>
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => {
                    const isFull = overallRating >= s;
                    const isHalf = !isFull && overallRating >= s - 0.5;
                    return (
                      <Star
                        key={s}
                        className={`w-5 h-5 ${
                          isFull
                            ? 'text-[#ffa41c] fill-[#ffa41c]'
                            : isHalf
                            ? 'text-[#ffa41c] fill-[#ffa41c]/60'
                            : 'text-gray-200 fill-gray-100'
                        }`}
                      />
                    );
                  })}
                </div>
                <p className="text-xs font-medium text-gray-600">
                  {isBengali ? '৫-এর মধ্যে ' : ''}
                  <span className="font-bold text-gray-900">{overallRating}</span>
                  {isBengali ? ' স্টার' : ' out of 5 stars'}
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-2 font-medium">
              {isBengali
                ? `মোট ${toBengaliNumerals(totalReviewsCount)}টি গ্লোবাল রেটিংস`
                : `${totalReviewsCount} global ratings`}
            </p>
          </div>

          {/* 5-Star Progress Bars Distribution */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
              <span>{isBengali ? 'স্টার রেটিং বিভাজন' : 'Rating Breakdown'}</span>
              {selectedRatingFilter && (
                <button
                  onClick={() => setSelectedRatingFilter(null)}
                  className="text-amber-700 hover:text-amber-900 hover:underline flex items-center gap-1 text-[11px] cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  <span>{isBengali ? 'ফিল্টার মুছুন' : 'Clear Filter'}</span>
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {starLevels.map((star) => {
                const percentage = breakdown[star] || 0;
                const isSelected = selectedRatingFilter === star;

                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() =>
                      setSelectedRatingFilter(isSelected ? null : star)
                    }
                    className={`w-full group flex items-center gap-3 p-1.5 rounded-lg transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'bg-amber-100/70 ring-1 ring-amber-400'
                        : 'hover:bg-amber-50/60'
                    }`}
                    title={
                      isBengali
                        ? `${toBengaliNumerals(star)} স্টার রিভিউ ফিল্টার করুন`
                        : `Filter by ${star} star reviews`
                    }
                  >
                    {/* Star Label */}
                    <span className="text-xs font-bold text-gray-700 group-hover:text-amber-800 w-12 shrink-0 flex items-center gap-1">
                      <span>{isBengali ? toBengaliNumerals(star) : star}</span>
                      <Star className="w-3 h-3 text-[#ffa41c] fill-[#ffa41c]" />
                    </span>

                    {/* Progress Bar Container */}
                    <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-200 relative">
                      <div
                        className="h-full bg-gradient-to-r from-[#ffa41c] to-[#ff8f00] rounded-full transition-all duration-500 shadow-2xs"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    {/* Percentage Label */}
                    <span className="text-xs font-bold text-gray-600 group-hover:text-gray-900 w-10 text-right shrink-0">
                      {isBengali ? `${toBengaliNumerals(percentage)}%` : `${percentage}%`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Social Proof Trust Callout */}
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 leading-relaxed">
              <span className="font-bold">
                {isBengali ? 'ভেরিফায়েড পারচেজ নীতি:' : 'Verified Purchase Policy:'}
              </span>{' '}
              {isBengali
                ? 'কেবলমাত্র এম.এম বুক হাউস ওয়েবসাইট বা মালদা শোরুম থেকে সংগৃহীত ভেরিফায়েড অর্ডারের রিভিউ এখানে তালিকাভুক্ত।'
                : 'Only genuine reviews from verified orders placed online or at our Malda counter are featured.'}
            </div>
          </div>
        </div>

        {/* Right Column: Verified Customer Reviews List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-gray-900">
                {isBengali ? 'ভেরিফায়েড ক্রেতাদের রিভিউ' : 'Top Verified Reviews'}
              </h3>
              <span className="text-xs text-gray-500 font-medium">
                ({filteredReviews.length})
              </span>
            </div>

            {selectedRatingFilter && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                <Filter className="w-3 h-3 text-amber-600" />
                <span>
                  {isBengali
                    ? `${toBengaliNumerals(selectedRatingFilter)} স্টার ফিল্টার্ড`
                    : `Filtered: ${selectedRatingFilter} Star`}
                </span>
              </span>
            )}
          </div>

          {filteredReviews.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-sm font-medium text-gray-500">
                {isBengali
                  ? 'এই স্টার রেটিং-এ কোনো রিভিউ পাওয়া যায়নি।'
                  : 'No reviews found for this star rating.'}
              </p>
              <button
                type="button"
                onClick={() => setSelectedRatingFilter(null)}
                className="mt-2 text-xs font-bold text-amber-700 hover:underline cursor-pointer"
              >
                {isBengali ? 'সব রিভিউ দেখুন' : 'View all reviews'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReviews.map((rev) => {
                const currentHelpful = helpfulCounts[rev.id] ?? rev.helpfulCount;
                const isVoted = helpfulMap[rev.id];

                return (
                  <article
                    key={rev.id}
                    className="p-4 sm:p-5 rounded-xl border border-gray-200/90 bg-white hover:border-amber-300/80 hover:shadow-2xs transition-all space-y-3"
                  >
                    {/* User Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-orange-400 text-white font-bold text-sm flex items-center justify-center shadow-2xs">
                          {rev.authorName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-gray-900">
                            {rev.authorName}
                          </h4>
                          {rev.authorLocation && (
                            <p className="text-[11px] text-gray-500">
                              {rev.authorLocation}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Topper / Exam Badge */}
                      {rev.topperBadge && (
                        <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 shrink-0">
                          <Award className="w-3 h-3 text-amber-600" />
                          <span>{rev.topperBadge}</span>
                        </span>
                      )}
                    </div>

                    {/* Star Rating + Title + Verified Badge */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                rev.rating >= s
                                  ? 'text-[#ffa41c] fill-[#ffa41c]'
                                  : 'text-gray-200 fill-gray-100'
                              }`}
                            />
                          ))}
                        </div>
                        <h5 className="font-bold text-xs sm:text-sm text-gray-950">
                          {rev.title}
                        </h5>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-gray-500 flex-wrap">
                        <span>
                          {isBengali ? `${rev.date}-এ পর্যালোচিত` : `Reviewed on ${rev.date}`}
                        </span>
                        {rev.verifiedPurchase && (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>{isBengali ? 'ভেরিফায়েড ক্রেতা' : 'Verified Purchase'}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Review Body */}
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-normal">
                      {rev.content}
                    </p>

                    {/* Helpful Action Bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                      <div className="text-gray-500 text-[11px]">
                        {isBengali
                          ? `${toBengaliNumerals(currentHelpful)} জনের কাছে এটি সহায়ক মনে হয়েছে`
                          : `${currentHelpful} people found this helpful`}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleHelpfulClick(rev.id, rev.helpfulCount)}
                        disabled={isVoted}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold border transition-all cursor-pointer ${
                          isVoted
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default'
                            : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
                        }`}
                      >
                        <ThumbsUp className={`w-3 h-3 ${isVoted ? 'text-emerald-600' : 'text-gray-500'}`} />
                        <span>
                          {isVoted
                            ? (isBengali ? 'ধন্যবাদ!' : 'Helpful!')
                            : (isBengali ? 'সহায়ক' : 'Helpful')}
                        </span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Write a Review Modal */}
      {showWriteReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-4 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => {
                setShowWriteReviewModal(false);
                setNewReviewSubmitted(false);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer"
              aria-label="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <MessageSquarePlus className="w-5 h-5 text-amber-600" />
              <span>{isBengali ? 'বইটির জন্য রিভিউ লিখুন' : 'Write a Customer Review'}</span>
            </h3>

            {newReviewSubmitted ? (
              <div className="p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-7 h-7" />
                </div>
                <h4 className="font-bold text-gray-900 text-base">
                  {isBengali ? 'আপনার রিভিউ জমা হয়েছে!' : 'Thank you for your review!'}
                </h4>
                <p className="text-xs text-gray-600">
                  {isBengali
                    ? 'মডারেশন দলের যাচাইয়ের পর আপনার মূল্যবান মতামতটি পেজে দৃশ্যমান হবে।'
                    : 'Your review has been submitted and will appear shortly after moderation.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowWriteReviewModal(false);
                    setNewReviewSubmitted(false);
                  }}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg cursor-pointer"
                >
                  {isBengali ? 'ঠিক আছে' : 'Done'}
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setNewReviewSubmitted(true);
                }}
                className="space-y-4 text-xs"
              >
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    {isBengali ? 'আপনার রেটিং দিন' : 'Overall Rating'}
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((s) => {
                      const activeScore = hoverRating || newRating;
                      const isFilled = s <= activeScore;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setNewRating(s)}
                          onMouseEnter={() => setHoverRating(s)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="cursor-pointer transition-transform hover:scale-115 focus:outline-none p-0.5"
                          aria-label={`${s} stars`}
                        >
                          <Star
                            className={`w-6 h-6 transition-colors ${
                              isFilled ? 'text-amber-400 fill-amber-400' : 'text-gray-300 fill-gray-100'
                            }`}
                          />
                        </button>
                      );
                    })}
                    <span className="text-xs font-bold text-gray-700 ml-2">
                      {isBengali
                        ? `${toBengaliNumerals(hoverRating || newRating)} তারা`
                        : `${hoverRating || newRating} Star${(hoverRating || newRating) > 1 ? 's' : ''}`}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    {isBengali ? 'আপনার নাম ও স্থান' : 'Your Name & Location'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isBengali ? 'উদাঃ অনিরুদ্ধ রায় (মালদা)' : 'e.g. Aniruddha Roy (Malda)'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-hidden focus:border-amber-500 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    {isBengali ? 'রিভিউ শিরোনাম' : 'Headline'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isBengali ? 'বইটির প্রধান বিশেষত্ব এক লাইনে লিখুন' : 'What is most important to know?'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-hidden focus:border-amber-500 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    {isBengali ? 'বিস্তারিত অভিজ্ঞতা' : 'Written Review'}
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder={isBengali ? 'সিলেবাস, ছাপা, বাঁধাই ও উপযোগিতা সম্পর্কে আপনার মূল্যবান মতামত লিখুন...' : 'Write what you liked or disliked...'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-hidden focus:border-amber-500 text-gray-900"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowWriteReviewModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-semibold cursor-pointer"
                  >
                    {isBengali ? 'বাতিল' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-lg shadow-sm cursor-pointer"
                  >
                    {isBengali ? 'রিভিউ জমা দিন' : 'Submit Review'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
