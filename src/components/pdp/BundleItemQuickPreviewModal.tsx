'use client';

import React, { useEffect } from 'react';
import { BundleItem } from '../../types/bundle';
import { X, Star, BookOpen, ExternalLink, Check, Plus } from 'lucide-react';

export interface BundleItemQuickPreviewModalProps {
  item: BundleItem | null;
  isOpen: boolean;
  onClose: () => void;
  isSelected?: boolean;
  onToggleSelect?: (productId: string) => void;
  locale?: 'en' | 'bn';
}

export const BundleItemQuickPreviewModal: React.FC<BundleItemQuickPreviewModalProps> = ({
  item,
  isOpen,
  onClose,
  isSelected = true,
  onToggleSelect,
  locale = 'bn',
}) => {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const isBn = locale === 'bn';
  const discountPercent = Math.round(((item.unit_mrp - item.unit_selling_price) / item.unit_mrp) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          aria-label="Close Preview"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content Layout */}
        <div className="flex flex-col sm:flex-row gap-5">
          {/* Cover Image */}
          <div className="w-32 h-44 sm:w-36 sm:h-52 shrink-0 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 mx-auto sm:mx-0 shadow">
            <img
              src={item.cover_image_url}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Book Meta Details */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {item.title}
              </h3>
              {item.title_bn && (
                <p className="text-xs text-slate-600 font-medium mt-0.5">{item.title_bn}</p>
              )}

              {item.author && (
                <p className="text-xs text-slate-500 mt-1">
                  {isBn ? 'লেখক: ' : 'Author: '}
                  <span className="font-semibold text-slate-800">{item.author}</span>
                </p>
              )}

              {item.publisher && (
                <p className="text-xs text-slate-500 mt-0.5">
                  {isBn ? 'প্রকাশনী: ' : 'Publisher: '}
                  <span className="font-semibold text-slate-700">{item.publisher}</span>
                </p>
              )}

              {/* Star Rating */}
              <div className="flex items-center gap-1.5 mt-2">
                <div className="flex text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < Math.round(item.rating || 4.5) ? 'fill-amber-400' : 'text-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-700">{item.rating || '4.8'}</span>
                {item.total_reviews && (
                  <span className="text-[11px] text-slate-400">({item.total_reviews})</span>
                )}
              </div>

              {/* Price & Savings */}
              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-xl font-black text-slate-900 font-mono">
                  ₹{item.unit_selling_price.toFixed(0)}
                </span>
                {item.unit_mrp > item.unit_selling_price && (
                  <>
                    <span className="text-xs text-slate-400 line-through font-mono">
                      ₹{item.unit_mrp.toFixed(0)}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      {discountPercent}% {isBn ? 'ছাড়' : 'Off'}
                    </span>
                  </>
                )}
              </div>

              {/* Pages & Edition info */}
              <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2">
                {item.page_count && (
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    {item.page_count} {isBn ? 'পৃষ্ঠা' : 'pages'}
                  </span>
                )}
                {item.edition && <span>{item.edition}</span>}
              </div>
            </div>

            {/* Synopsis Snippet */}
            {item.synopsis && (
              <p className="text-xs text-slate-600 mt-3 line-clamp-3 bg-slate-50 p-2 rounded border border-slate-100">
                {item.synopsis}
              </p>
            )}
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <a
            href={`/books/${item.product_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            {isBn ? 'পূর্ণাঙ্গ বিবরণী দেখুন' : 'View Full Details'}
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              {isBn ? 'বন্ধ করুন' : 'Close'}
            </button>

            {onToggleSelect && (
              <button
                onClick={() => {
                  onToggleSelect(item.product_id);
                  onClose();
                }}
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg transition shadow-sm ${
                  isSelected
                    ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isSelected ? (
                  <>
                    <X className="w-3.5 h-3.5" />
                    {isBn ? 'বান্ডেল থেকে সরান' : 'Remove from Bundle'}
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    {isBn ? 'বান্ডেলে যুক্ত করুন' : 'Include in Bundle'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
