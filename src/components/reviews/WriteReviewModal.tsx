'use client';

import React, { useState } from 'react';
import {
  Star,
  X,
  UploadCloud,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Layers,
  BookOpen,
  GraduationCap,
} from 'lucide-react';
import { CustomerPhoto, ProductReview } from '@/types/reviews';
import { submitReviewSchema } from '@/lib/validations/reviews';

export interface WriteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productTitle: string;
  initialReview?: ProductReview | null;
  onSubmit: (data: {
    product_id: string;
    rating: number;
    headline: string;
    body: string;
    aspect_ratings?: {
      printing_quality?: number;
      content_quality?: number;
      syllabus_relevance?: number;
    };
    photos?: CustomerPhoto[];
    would_recommend: boolean;
    topper_badge?: string;
  }) => Promise<{ success: boolean; message?: string }>;
}

export const WriteReviewModal: React.FC<WriteReviewModalProps> = ({
  isOpen,
  onClose,
  productId,
  productTitle,
  initialReview,
  onSubmit,
}) => {
  const [rating, setRating] = useState<number>(initialReview?.rating || 5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  // 3 Aspect Ratings
  const [printingQuality, setPrintingQuality] = useState<number>(
    initialReview?.aspect_ratings?.printing_quality || 5
  );
  const [contentQuality, setContentQuality] = useState<number>(
    initialReview?.aspect_ratings?.content_quality || 5
  );
  const [syllabusRelevance, setSyllabusRelevance] = useState<number>(
    initialReview?.aspect_ratings?.syllabus_relevance || 5
  );

  const [headline, setHeadline] = useState<string>(initialReview?.headline || '');
  const [body, setBody] = useState<string>(initialReview?.body || '');
  const [wouldRecommend, setWouldRecommend] = useState<boolean>(
    initialReview ? initialReview.would_recommend : true
  );
  const [topperBadge, setTopperBadge] = useState<string>(initialReview?.topper_badge || '');
  const [photos, setPhotos] = useState<CustomerPhoto[]>(initialReview?.photos || []);

  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const [imageCaptionInput, setImageCaptionInput] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddPhoto = () => {
    if (!imageUrlInput.trim()) return;
    if (photos.length >= 5) {
      setErrorMessage('সর্বোচ্চ ৫টি ছবি আপলোড করা যাবে।');
      return;
    }

    const newPhoto: CustomerPhoto = {
      id: `photo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      url: imageUrlInput.trim(),
      caption: imageCaptionInput.trim() || undefined,
      uploaded_at: new Date().toISOString(),
    };

    setPhotos([...photos, newPhoto]);
    setImageUrlInput('');
    setImageCaptionInput('');
    setErrorMessage(null);
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const formData = {
      product_id: productId,
      rating,
      headline: headline.trim(),
      body: body.trim(),
      aspect_ratings: {
        printing_quality: printingQuality,
        content_quality: contentQuality,
        syllabus_relevance: syllabusRelevance,
      },
      photos: photos.length > 0 ? photos : undefined,
      would_recommend: wouldRecommend,
      topper_badge: topperBadge.trim() || undefined,
    };

    // Validate with Zod
    const validation = submitReviewSchema.safeParse(formData);
    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      setErrorMessage(firstIssue ? firstIssue.message : 'অনুগ্রহ করে সব তথ্য সঠিকভাবে পূরণ করুন।');
      return;
    }

    setSubmitting(true);
    try {
      const res = await onSubmit(formData);
      if (res.success) {
        setSuccessMessage(res.message || 'রিভিউ সফলভাবে জমা দেওয়া হয়েছে!');
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setErrorMessage(res.message || 'রিভিউ জমা দেওয়া সম্ভব হয়নি।');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'অপ্রত্যাশিত সমস্যা হয়েছে।';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 id="review-modal-title" className="text-lg font-bold text-gray-900">
              {initialReview ? 'রিভিউ সম্পাদনা করুন (Edit Review)' : 'আপনার রিভিউ ও রেটিং দিন'}
            </h2>
            <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{productTitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Overall Star Rating */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">
              সামগ্রিক রেটিং (Overall Rating) <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="p-1 focus:outline-none transition transform hover:scale-110"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= (hoverRating ?? rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              <span className="text-sm font-medium text-gray-600 ml-2">
                {rating === 5 && 'অসাধারণ (৫/৫)'}
                {rating === 4 && 'খুব ভালো (৪/৫)'}
                {rating === 3 && 'মোটামুটি (৩/৫)'}
                {rating === 2 && 'চলনসই (২/৫)'}
                {rating === 1 && 'খারাপ (১/৫)'}
              </span>
            </div>
          </div>

          {/* 3 Aspect Ratings (Item 4) */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3.5">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              বইয়ের নির্দিষ্ট মান নির্ধারণ (Aspect Ratings)
            </h4>

            {/* 1. Printing & Binding */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-medium text-gray-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                প্রিন্টিং ও বাঁধাই মান:
              </span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setPrintingQuality(s)}
                    className="p-0.5"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        s <= printingQuality ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Content & Explanation */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-medium text-gray-800 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                বিষয়বস্তু ও ব্যাখ্যা:
              </span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setContentQuality(s)}
                    className="p-0.5"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        s <= contentQuality ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Syllabus Relevance */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-medium text-gray-800 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                সর্বশেষ সিলেবাস সামঞ্জস্য:
              </span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSyllabusRelevance(s)}
                    className="p-0.5"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        s <= syllabusRelevance ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Headline */}
          <div className="space-y-1">
            <label htmlFor="review-headline" className="block text-xs font-semibold text-gray-800">
              রিভিউ শিরোনাম (Headline) <span className="text-red-500">*</span>
            </label>
            <input
              id="review-headline"
              type="text"
              required
              maxLength={150}
              placeholder="সংক্ষেপে মূল বিষয় লিখুন (যেমন: চমৎকার বই, নতুন সিলেবাস অনুযায়ী)"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Detailed Review Text */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label htmlFor="review-body" className="block text-xs font-semibold text-gray-800">
                বিস্তারিত মতামত (Review Details) <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-gray-400">{body.length} / ৩০০০ অক্ষর</span>
            </div>
            <textarea
              id="review-body"
              required
              rows={4}
              maxLength={3000}
              placeholder="বইটি পড়ার আপনার বাস্তব অভিজ্ঞতা লিখুন। কাগজের মান, উপস্থাপনা ও প্রশ্নোত্তরের প্রাসঙ্গিকতা উল্লেখ করুন..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Recommendation Toggle */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-800">
              আপনি কি অন্যান্য শিক্ষার্থীদের এই বইটি সুপারিশ করবেন?
            </label>
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="recommend"
                  checked={wouldRecommend === true}
                  onChange={() => setWouldRecommend(true)}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span>হ্যাঁ, সুপারিশ করব</span>
              </label>
              <label className="inline-flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="recommend"
                  checked={wouldRecommend === false}
                  onChange={() => setWouldRecommend(false)}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span>না, করব না</span>
              </label>
            </div>
          </div>

          {/* Optional Topper Badge / Exam target */}
          <div className="space-y-1">
            <label htmlFor="topper-badge" className="block text-xs font-semibold text-gray-800">
              আপনার লক্ষ্য বা ব্যাজ (ঐচ্ছিক)
            </label>
            <input
              id="topper-badge"
              type="text"
              placeholder="যেমন: WBCS 2026 পরীক্ষার্থী, TET উত্তীর্ণ, WB Police ইত্যাদি"
              value={topperBadge}
              onChange={(e) => setTopperBadge(e.target.value)}
              className="w-full px-3.5 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Photo Uploads (Max 5) */}
          <div className="space-y-2 pt-2 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-semibold text-gray-800">
                বইয়ের ছবি যোগ করুন (সর্বোচ্চ ৫টি)
              </label>
              <span className="text-[11px] text-gray-400">{photos.length}/৫টি ছবি</span>
            </div>

            {/* Photos thumbnail preview */}
            {photos.length > 0 && (
              <div className="flex flex-wrap gap-2.5 mb-2">
                {photos.map((p, idx) => (
                  <div
                    key={p.id || idx}
                    className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-300 group"
                  >
                    <img src={p.url} alt="Attachment" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute inset-0 bg-red-600/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      aria-label="Remove photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Photo URL inputs */}
            {photos.length < 5 && (
              <div className="p-3 bg-gray-50 border border-dashed border-gray-300 rounded-xl space-y-2">
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="ছবির লিংক / URL (e.g. https://...)"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddPhoto}
                    className="px-3 py-1.5 bg-gray-800 text-white text-xs font-medium rounded-lg hover:bg-black transition"
                  >
                    যোগ করুন
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="ছবির ক্যাপশন (ঐচ্ছিক)"
                  value={imageCaptionInput}
                  onChange={(e) => setImageCaptionInput(e.target.value)}
                  className="w-full px-3 py-1 border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}
          </div>

          {/* Footer Submit / Cancel */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-lg shadow-sm transition disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? 'সংরক্ষণ হচ্ছে...' : initialReview ? 'আপডেট করুন' : 'রিভিউ সাবমিট করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
