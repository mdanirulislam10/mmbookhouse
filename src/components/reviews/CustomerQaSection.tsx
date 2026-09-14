'use client';

import React, { useState, useMemo } from 'react';
import {
  HelpCircle,
  Search,
  PlusCircle,
  ThumbsUp,
  Store,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  X,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { ProductQuestion, ProductAnswer } from '@/types/reviews';
import { askQuestionSchema, answerQuestionSchema } from '@/lib/validations/reviews';

export interface CustomerQaSectionProps {
  productId: string;
  productTitle: string;
  questions: ProductQuestion[];
  currentUserId?: string;
  currentUserName?: string;
  isSeller?: boolean;
  onAskQuestion?: (data: { product_id: string; question_text: string }) => Promise<{ success: boolean; message?: string }>;
  onAnswerQuestion?: (data: { question_id: string; answer_text: string }) => Promise<{ success: boolean; message?: string }>;
  onUpvoteAnswer?: (answerId: string) => Promise<{ success: boolean; newCount: number }>;
  className?: string;
}

export const CustomerQaSection: React.FC<CustomerQaSectionProps> = ({
  productId,
  productTitle,
  questions,
  currentUserId,
  currentUserName = 'Anonymous User',
  isSeller = false,
  onAskQuestion,
  onAnswerQuestion,
  onUpvoteAnswer,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAskModalOpen, setIsAskModalOpen] = useState<boolean>(false);
  const [newQuestionText, setNewQuestionText] = useState<string>('');
  const [askError, setAskError] = useState<string | null>(null);
  const [askSuccess, setAskSuccess] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState<boolean>(false);

  // Answering states
  const [activeAnsweringQId, setActiveAnsweringQId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState<string>('');
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState<boolean>(false);

  // Answer upvotes state
  const [upvotedAnswers, setUpvotedAnswers] = useState<Record<string, boolean>>({});
  const [upvoteCounts, setUpvoteCounts] = useState<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    for (const q of questions) {
      for (const a of q.answers) {
        counts[a.id] = a.upvotes_count;
      }
    }
    return counts;
  });

  // Expand / Collapse state (Item 24: Top 4 answered questions default)
  const [expandedAll, setExpandedAll] = useState<boolean>(false);

  // Filter questions based on typeahead instant search (Item 21)
  const filteredQuestions = useMemo(() => {
    if (!searchQuery.trim()) {
      return questions;
    }
    const qLower = searchQuery.toLowerCase().trim();
    return questions.filter((q) => {
      const questionMatch = q.question_text.toLowerCase().includes(qLower);
      const answerMatch = q.answers.some((a) => a.answer_text.toLowerCase().includes(qLower));
      return questionMatch || answerMatch;
    });
  }, [questions, searchQuery]);

  // Display top 4 if not expanded and no search query active
  const displayLimit = 4;
  const isSearchActive = searchQuery.trim().length > 0;
  const visibleQuestions = isSearchActive || expandedAll
    ? filteredQuestions
    : filteredQuestions.slice(0, displayLimit);

  const handleAskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAskError(null);
    setAskSuccess(null);

    const validation = askQuestionSchema.safeParse({
      product_id: productId,
      question_text: newQuestionText.trim(),
    });

    if (!validation.success) {
      const issue = validation.error.issues[0];
      setAskError(issue ? issue.message : 'প্রশ্নটি ন্যূনতম ৫ অক্ষরের হতে হবে।');
      return;
    }

    setIsAsking(true);
    try {
      if (onAskQuestion) {
        const res = await onAskQuestion({
          product_id: productId,
          question_text: newQuestionText.trim(),
        });
        if (res.success) {
          setAskSuccess(res.message || 'আপনার প্রশ্ন সফলভাবে গৃহীত হয়েছে!');
          setNewQuestionText('');
          setTimeout(() => {
            setIsAskModalOpen(false);
            setAskSuccess(null);
          }, 1500);
        } else {
          setAskError(res.message || 'প্রশ্ন জমা নেওয়া সম্ভব হয়নি।');
        }
      } else {
        setAskSuccess('প্রশ্ন গৃহীত হয়েছে!');
        setTimeout(() => setIsAskModalOpen(false), 1000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'সমস্যা দেখা দিয়েছে।';
      setAskError(msg);
    } finally {
      setIsAsking(false);
    }
  };

  const handleAnswerSubmit = async (questionId: string) => {
    setAnswerError(null);
    const validation = answerQuestionSchema.safeParse({
      question_id: questionId,
      answer_text: answerText.trim(),
    });

    if (!validation.success) {
      const issue = validation.error.issues[0];
      setAnswerError(issue ? issue.message : 'উত্তর ন্যূনতম ৫ অক্ষরের হতে হবে।');
      return;
    }

    setIsSubmittingAnswer(true);
    try {
      if (onAnswerQuestion) {
        const res = await onAnswerQuestion({
          question_id: questionId,
          answer_text: answerText.trim(),
        });
        if (res.success) {
          setActiveAnsweringQId(null);
          setAnswerText('');
        } else {
          setAnswerError(res.message || 'উত্তর জমা নেওয়া সম্ভব হয়নি।');
        }
      } else {
        setActiveAnsweringQId(null);
        setAnswerText('');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'সমস্যা দেখা দিয়েছে।';
      setAnswerError(msg);
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const handleUpvoteAnswer = async (answer: ProductAnswer) => {
    if (upvotedAnswers[answer.id]) return;

    // Optimistic upvote
    setUpvotedAnswers((prev) => ({ ...prev, [answer.id]: true }));
    setUpvoteCounts((prev) => ({
      ...prev,
      [answer.id]: (prev[answer.id] ?? answer.upvotes_count) + 1,
    }));

    if (onUpvoteAnswer) {
      try {
        const res = await onUpvoteAnswer(answer.id);
        if (res.success && typeof res.newCount === 'number') {
          setUpvoteCounts((prev) => ({ ...prev, [answer.id]: res.newCount }));
        }
      } catch (err) {
        // Rollback
        setUpvotedAnswers((prev) => ({ ...prev, [answer.id]: false }));
        setUpvoteCounts((prev) => ({
          ...prev,
          [answer.id]: (prev[answer.id] ?? answer.upvotes_count) - 1,
        }));
      }
    }
  };

  return (
    <section className={`my-10 ${className}`} aria-label="Customer Questions and Answers">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-emerald-600" />
            <span>গ্রাহক প্রশ্নোত্তর ও জিজ্ঞাসা (Customer Q&A)</span>
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            বইটি সম্পর্কে আপনার কোনো প্রশ্ন থাকলে সরাসরি বিক্রেতা ও পাঠকদের জিজ্ঞাসা করুন
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAskModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl shadow-sm transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>প্রশ্ন করুন (Ask Question)</span>
        </button>
      </div>

      {/* Typeahead Instant Search Bar (Item 21 & 22) */}
      <div className="mt-5 relative">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="আপনার প্রশ্ন খুঁজুন (যেমন: সিলেবাস, নতুন সংস্করণ, পেজ সংখ্যা, কুরিয়ার)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Questions list */}
      <div className="mt-6 space-y-6 divide-y divide-gray-200">
        {visibleQuestions.length === 0 ? (
          <div className="py-10 text-center bg-gray-50 rounded-xl border border-gray-200 p-6 space-y-3">
            <p className="text-gray-600 text-sm">
              {searchQuery
                ? `&ldquo;${searchQuery}&rdquo; এর সাথে মিলে এমন কোনো প্রশ্নোত্তর পাওয়া যায়নি।`
                : 'এই বই সম্পর্কে এখনও কোনো প্রশ্নোত্তর নেই। প্রথম প্রশ্নটি করুন!'}
            </p>
            <button
              type="button"
              onClick={() => {
                setNewQuestionText(searchQuery);
                setIsAskModalOpen(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg transition"
            >
              এই বিষয়টি নিয়ে প্রশ্ন করুন
            </button>
          </div>
        ) : (
          visibleQuestions.map((q) => (
            <div key={q.id} className="pt-6 first:pt-0 space-y-3">
              {/* Question */}
              <div className="flex items-start gap-3">
                <span className="font-bold text-sm text-gray-900 bg-gray-100 rounded-md px-2 py-0.5 mt-0.5">
                  প্রশ্ন:
                </span>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                    {q.question_text}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                    <span>প্রশ্নকারী: {q.asked_by_name}</span>
                    <span>•</span>
                    <span>
                      {new Date(q.created_at).toLocaleDateString('bn-BD', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Answers */}
              <div className="pl-9 space-y-3">
                {q.answers.length === 0 ? (
                  <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    এখনও কোনো উত্তর আসেনি। বিক্রেতা বা অন্যান্য পাঠকরা শীঘ্রই উত্তর দেবেন।
                  </p>
                ) : (
                  q.answers.map((ans) => {
                    const upvotes = upvoteCounts[ans.id] ?? ans.upvotes_count;
                    const isUpvoted = upvotedAnswers[ans.id];

                    return (
                      <div
                        key={ans.id}
                        className={`p-3.5 rounded-xl border space-y-2 ${
                          ans.is_seller
                            ? 'bg-amber-50/70 border-amber-200'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        {/* Answer Author Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-gray-900 bg-emerald-100 text-emerald-800 rounded px-1.5 py-0.5">
                              উত্তর:
                            </span>
                            <span className="font-medium text-xs text-gray-900">
                              {ans.author_name}
                            </span>

                            {/* Official Seller Badge (Item 25) */}
                            {ans.is_seller && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded-full border border-amber-300">
                                <Store className="w-3 h-3 text-amber-800" />
                                M.M Book House (বিক্রেতা)
                              </span>
                            )}

                            {/* Verified Buyer Badge */}
                            {!ans.is_seller && ans.is_verified_buyer && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                <ShieldCheck className="w-3 h-3" />
                                ভেরিফাইড ক্রেতা
                              </span>
                            )}
                          </div>

                          <span className="text-[11px] text-gray-400">
                            {new Date(ans.created_at).toLocaleDateString('bn-BD', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>

                        {/* Answer Content */}
                        <p className="text-xs sm:text-sm text-gray-800 leading-relaxed whitespace-pre-line pl-6">
                          {ans.answer_text}
                        </p>

                        {/* Upvote Button (Item 26) */}
                        <div className="pl-6 pt-1 flex items-center gap-3">
                          <button
                            type="button"
                            disabled={isUpvoted}
                            onClick={() => handleUpvoteAnswer(ans)}
                            className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition ${
                              isUpvoted
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-medium'
                                : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-600'
                            }`}
                          >
                            <ThumbsUp className={`w-3 h-3 ${isUpvoted ? 'fill-emerald-600' : ''}`} />
                            <span>উপকারী উত্তর ({upvotes})</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Inline Answer Form Toggle (Item 27) */}
                {activeAnsweringQId === q.id ? (
                  <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-gray-800">
                        আপনার উত্তর লিখুন ({isSeller ? 'বিক্রেতা হিসেবে' : 'পাঠক হিসেবে'})
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveAnsweringQId(null);
                          setAnswerError(null);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {answerError && (
                      <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{answerError}</p>
                    )}

                    <textarea
                      rows={3}
                      placeholder="সঠিক ও নির্ভরযোগ্য তথ্য দিয়ে প্রশ্নকর্তাকে সাহায্য করুন..."
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    />

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveAnsweringQId(null)}
                        className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-200 rounded-lg"
                      >
                        বাতিল
                      </button>
                      <button
                        type="button"
                        disabled={isSubmittingAnswer}
                        onClick={() => handleAnswerSubmit(q.id)}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg disabled:opacity-50"
                      >
                        {isSubmittingAnswer ? 'জমা হচ্ছে...' : 'উত্তর সাবমিট করুন'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAnsweringQId(q.id);
                      setAnswerText('');
                      setAnswerError(null);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-800"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>এই প্রশ্নের উত্তর দিন</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Expand / Collapse All Answers Button (Item 24) */}
      {!isSearchActive && filteredQuestions.length > displayLimit && (
        <div className="mt-8 text-center pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => setExpandedAll(!expandedAll)}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 text-sm font-semibold rounded-xl shadow-sm transition"
          >
            {expandedAll ? (
              <>
                <span>কম দেখুন (Collapse)</span>
                <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>সব {filteredQuestions.length}টি প্রশ্নোত্তর দেখুন (See all answered questions)</span>
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Ask Question Modal (Item 23) */}
      {isAskModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ask-modal-title"
        >
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
              <h3 id="ask-modal-title" className="font-bold text-gray-900 text-base flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-emerald-600" />
                <span>বইটি সম্পর্কে প্রশ্ন করুন</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAskModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAskSubmit} className="p-5 space-y-4">
              <p className="text-xs text-gray-500 font-medium line-clamp-1">{productTitle}</p>

              {askError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{askError}</span>
                </div>
              )}

              {askSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{askSuccess}</span>
                </div>
              )}

              <div className="space-y-1">
                <label htmlFor="user-question-input" className="block text-xs font-semibold text-gray-800">
                  আপনার প্রশ্নটি স্পষ্ট করে লিখুন <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="user-question-input"
                  required
                  rows={4}
                  maxLength={500}
                  placeholder="যেমন: এই বইটি কি ২০২৬ সালের সংশোধিত সিলেবাস অনুযায়ী? সাথে কি কোনো বিগত বছরের মক টেস্ট পেপার আছে?"
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[11px] text-gray-400 block text-right">
                  {newQuestionText.length}/৫০০ অক্ষর
                </span>
              </div>

              {/* Community Guidelines Notice (Item 30) */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800">
                <strong>নির্দেশনা:</strong> অনুগ্রহ করে এখানে ব্যক্তিগত ফোন নম্বর, ইমেল বা অর্ডার সংক্রান্ত গোপনীয় তথ্য লিখবেন না।
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAskModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isAsking}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg transition disabled:opacity-50"
                >
                  {isAsking ? 'জমা হচ্ছে...' : 'প্রশ্ন পোস্ট করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
