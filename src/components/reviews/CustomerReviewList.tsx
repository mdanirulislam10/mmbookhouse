'use client';

import React, { useState, useMemo } from 'react';
import {
  Star,
  ShieldCheck,
  Award,
  ThumbsUp,
  Flag,
  CheckCircle2,
  Store,
  Filter,
  ArrowUpDown,
  BookOpen,
  Layers,
  GraduationCap,
} from 'lucide-react';
import { ProductReview, ReviewSortOption } from '@/types/reviews';
import { ReviewKeywordHighlight } from '@/lib/services/reviewAggregatorService';

export interface CustomerReviewListProps {
  reviews: ProductReview[];
  currentUserId?: string;
  keywordHighlights?: ReviewKeywordHighlight[];
  onVoteHelpful?: (reviewId: string) => Promise<{ success: boolean; newHelpfulCount: number; message?: string }>;
  onReportAbuse?: (reviewId: string) => Promise<{ success: boolean; message?: string }>;
  onPhotoClick?: (photoUrl: string) => void;
  className?: string;
}

export const CustomerReviewList: React.FC<CustomerReviewListProps> = ({
  reviews,
  currentUserId,
  keywordHighlights = [],
  onVoteHelpful,
  onReportAbuse,
  onPhotoClick,
  className = '',
}) => {
  const [selectedSort, setSelectedSort] = useState<ReviewSortOption>('top_reviews');
  const [selectedStarFilter, setSelectedStarFilter] = useState<number | 'all'>('all');
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);

  // Optimistic vote & report tracking
  const [votedReviews, setVotedReviews] = useState<Record<string, boolean>>({});
  const [reportedReviews, setReportedReviews] = useState<Record<string, boolean>>({});
  const [helpfulCounts, setHelpfulCounts] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const r of reviews) {
      initial[r.id] = r.helpful_votes_count;
    }
    return initial;
  });

  // Filter & sort logic
  const filteredAndSortedReviews = useMemo(() => {
    let list = reviews.filter((r) => r.status === 'approved');

    // Star filter
    if (selectedStarFilter !== 'all') {
      list = list.filter((r) => Math.round(r.rating) === selectedStarFilter);
    }

    // Verified only filter
    if (verifiedOnly) {
      list = list.filter((r) => r.is_verified_purchase);
    }

    // Keyword filter
    if (selectedKeyword) {
      const kwLower = selectedKeyword.toLowerCase();
      list = list.filter(
        (r) =>
          r.headline.toLowerCase().includes(kwLower) ||
          r.body.toLowerCase().includes(kwLower)
      );
    }

    // Sorting
    return [...list].sort((a, b) => {
      if (selectedSort === 'top_reviews') {
        const countA = helpfulCounts[a.id] ?? a.helpful_votes_count;
        const countB = helpfulCounts[b.id] ?? b.helpful_votes_count;
        return countB - countA || b.rating - a.rating;
      }
      if (selectedSort === 'most_recent') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (selectedSort === 'highest_rating') {
        return b.rating - a.rating;
      }
      if (selectedSort === 'lowest_rating') {
        return a.rating - b.rating;
      }
      return 0;
    });
  }, [reviews, selectedStarFilter, verifiedOnly, selectedKeyword, selectedSort, helpfulCounts]);

  const handleVote = async (review: ProductReview) => {
    if (votedReviews[review.id]) return;
    if (currentUserId && review.user_id === currentUserId) {
      alert('আপনি নিজের রিভিউতে ভোট দিতে পারবেন না।');
      return;
    }

    // Optimistic increment
    setVotedReviews((prev) => ({ ...prev, [review.id]: true }));
    setHelpfulCounts((prev) => ({
      ...prev,
      [review.id]: (prev[review.id] ?? review.helpful_votes_count) + 1,
    }));

    if (onVoteHelpful) {
      try {
        const res = await onVoteHelpful(review.id);
        if (res.success && typeof res.newHelpfulCount === 'number') {
          setHelpfulCounts((prev) => ({ ...prev, [review.id]: res.newHelpfulCount }));
        }
      } catch (err) {
        // Rollback on error
        setVotedReviews((prev) => ({ ...prev, [review.id]: false }));
        setHelpfulCounts((prev) => ({
          ...prev,
          [review.id]: (prev[review.id] ?? review.helpful_votes_count) - 1,
        }));
      }
    }
  };

  const handleReport = async (reviewId: string) => {
    if (reportedReviews[reviewId]) return;
    if (!confirm('আপনি কি এই রিভিউটি স্প্যাম বা আপত্তিকর হিসেবে রিপোর্ট করতে চান?')) return;

    setReportedReviews((prev) => ({ ...prev, [reviewId]: true }));
    if (onReportAbuse) {
      await onReportAbuse(reviewId);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Filter and Sort Toolbar */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Sort Selector */}
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <ArrowUpDown className="w-4 h-4 text-gray-500" />
            <label htmlFor="review-sort-select" className="font-medium">
              সাজান:
            </label>
            <select
              id="review-sort-select"
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value as ReviewSortOption)}
              className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="top_reviews">শীর্ষ রিভিউ (Top Reviews)</option>
              <option value="most_recent">সাম্প্রতিক (Most Recent)</option>
              <option value="highest_rating">সর্বোচ্চ রেটিং (Highest Rating)</option>
              <option value="lowest_rating">সর্বনিম্ন রেটিং (Lowest Rating)</option>
            </select>
          </div>

          {/* Star Filter & Verified Checkbox */}
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span>শুধু ভেরিফাইড বায়ার</span>
            </label>

            <select
              value={selectedStarFilter}
              onChange={(e) =>
                setSelectedStarFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
              className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              aria-label="Filter by star rating"
            >
              <option value="all">সব রেটিং (All Stars)</option>
              <option value="5">৫ স্টার (5 Stars)</option>
              <option value="4">৪ স্টার (4 Stars)</option>
              <option value="3">৩ স্টার (3 Stars)</option>
              <option value="2">২ স্টার (2 Stars)</option>
              <option value="1">১ স্টার (1 Star)</option>
            </select>
          </div>
        </div>

        {/* 1-Click Keyword Highlight Filters (Item 13 & 44) */}
        {keywordHighlights.length > 0 && (
          <div className="pt-2 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-gray-600 uppercase tracking-wide">
              <Filter className="w-3.5 h-3.5" />
              <span>জনপ্রিয় টপিক দিয়ে ফিল্টার করুন:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {keywordHighlights.map((kw) => {
                const isSelected = selectedKeyword === kw.keyword;
                return (
                  <button
                    key={kw.keyword}
                    type="button"
                    onClick={() => setSelectedKeyword(isSelected ? null : kw.keyword)}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium transition ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {kw.keyword} ({kw.count})
                  </button>
                );
              })}
              {selectedKeyword && (
                <button
                  type="button"
                  onClick={() => setSelectedKeyword(null)}
                  className="text-xs px-2 py-1 rounded-full text-red-600 hover:bg-red-50 font-medium"
                >
                  ক্লিয়ার ফিল্টার ✕
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Reviews List */}
      {filteredAndSortedReviews.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-gray-500 text-sm">
            এই ফিল্টারের সাথে মিলে এমন কোনো রিভিউ পাওয়া যায়নি।
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {filteredAndSortedReviews.map((review) => {
            const helpfulCount = helpfulCounts[review.id] ?? review.helpful_votes_count;
            const hasVoted = votedReviews[review.id];
            const isSelf = currentUserId && review.user_id === currentUserId;

            return (
              <article key={review.id} className="py-6 space-y-3.5">
                {/* Author Info & Badges Header */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {/* User Avatar Initial */}
                    <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">
                      {review.user_name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 text-sm">
                          {review.user_name}
                        </span>
                        {/* Local Social Proof Badge (Item 49) */}
                        {review.user_location && (
                          <span className="text-xs text-gray-500 font-normal">
                            ({review.user_location})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {/* Verified Purchase Badge (Item 2) */}
                        {review.is_verified_purchase && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            <ShieldCheck className="w-3 h-3" />
                            ভেরিফাইড ক্রেতা
                          </span>
                        )}
                        {/* Topper / Exam Badge (Item 47) */}
                        {review.topper_badge && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                            <Award className="w-3 h-3" />
                            {review.topper_badge}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="text-xs text-gray-400">
                    {new Date(review.created_at).toLocaleDateString('bn-BD', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                {/* Star Rating & Headline */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= review.rating ? 'fill-amber-400' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                      {review.headline}
                    </h4>
                  </div>

                  {/* 3 Book Aspect Ratings (Item 4) */}
                  {review.aspect_ratings && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {typeof review.aspect_ratings.printing_quality === 'number' && (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full border border-gray-200">
                          <Layers className="w-3 h-3 text-gray-500" />
                          প্রিন্ট ও বাঁধাই: <strong>{review.aspect_ratings.printing_quality}/৫</strong>
                        </span>
                      )}
                      {typeof review.aspect_ratings.content_quality === 'number' && (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full border border-gray-200">
                          <BookOpen className="w-3 h-3 text-gray-500" />
                          বিষয়বস্তু ও ব্যাখ্যা: <strong>{review.aspect_ratings.content_quality}/৫</strong>
                        </span>
                      )}
                      {typeof review.aspect_ratings.syllabus_relevance === 'number' && (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full border border-gray-200">
                          <GraduationCap className="w-3 h-3 text-gray-500" />
                          সিলেবাস সামঞ্জস্য: <strong>{review.aspect_ratings.syllabus_relevance}/৫</strong>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Review Body */}
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                  {review.body}
                </p>

                {/* Attached Customer Photos (Items 6, 7) */}
                {review.photos && review.photos.length > 0 && (
                  <div className="flex gap-2 pt-1">
                    {review.photos.map((photo, pIdx) => (
                      <button
                        key={photo.id || pIdx}
                        type="button"
                        onClick={() => onPhotoClick && onPhotoClick(photo.url)}
                        className="w-16 h-16 rounded-md overflow-hidden border border-gray-200 hover:opacity-90 transition focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <img
                          src={photo.thumbnail_url || photo.url}
                          alt={photo.caption || 'Review attachment'}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Recommendation indicator */}
                {review.would_recommend && (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>পাঠক বইটি অন্য শিক্ষার্থীদের পড়তে পরামর্শ দিয়েছেন</span>
                  </div>
                )}

                {/* Official Seller Response Thread (Item 19) */}
                {review.seller_response && (
                  <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1.5 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-amber-900 flex items-center gap-1.5">
                        <Store className="w-4 h-4 text-amber-700" />
                        {review.seller_response.seller_name} ({review.seller_response.badge})
                      </span>
                      <span className="text-[11px] text-amber-700">
                        {new Date(review.seller_response.responded_at).toLocaleDateString('bn-BD', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-800 leading-relaxed">
                      {review.seller_response.response_text}
                    </p>
                  </div>
                )}

                {/* Action Bar (Helpful Vote & Abuse Report) */}
                <div className="flex items-center justify-between pt-2 text-xs text-gray-500">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      disabled={hasVoted || Boolean(isSelf)}
                      onClick={() => handleVote(review)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border transition ${
                        hasVoted
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-medium cursor-default'
                          : isSelf
                          ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700'
                      }`}
                      title={isSelf ? 'নিজের রিভিউতে ভোট দেওয়া যায় না' : 'উপকারী মনে হলে ভোট দিন'}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${hasVoted ? 'fill-emerald-600' : ''}`} />
                      <span>উপকারী ({helpfulCount})</span>
                    </button>

                    {isSelf && (
                      <span className="text-[11px] text-gray-400 italic">
                        (আপনার নিজস্ব রিভিউ)
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={reportedReviews[review.id]}
                    onClick={() => handleReport(review.id)}
                    className="hover:text-red-600 flex items-center gap-1 transition"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>
                      {reportedReviews[review.id] ? 'রিপোর্ট গৃহীত' : 'রিপোর্ট করুন'}
                    </span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
