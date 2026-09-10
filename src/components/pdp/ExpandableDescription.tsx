'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface ExpandableDescriptionProps {
  description: string;
  descriptionBn?: string;
  className?: string;
}

export const ExpandableDescription: React.FC<ExpandableDescriptionProps> = ({
  description,
  descriptionBn,
  className = '',
}) => {
  const { isBengali } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);

  const text = isBengali && descriptionBn ? descriptionBn : description;

  return (
    <section
      id="product-description"
      aria-label="বইয়ের বিস্তারিত বিবরণ"
      className={`bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 md:p-8 shadow-xs ${className}`}
    >
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-amber-600" />
        <span>{isBengali ? 'বইটির বিস্তারিত বিবরণ' : 'Product Description'}</span>
      </h2>

      <div className="relative">
        <div
          className={`text-xs sm:text-sm text-gray-700 leading-relaxed space-y-2 transition-all duration-300 ${
            !isExpanded ? 'line-clamp-4 max-h-24 overflow-hidden' : ''
          }`}
        >
          <p>{text}</p>
          {descriptionBn && description && descriptionBn !== description && isExpanded && (
            <div className="pt-3 border-t border-gray-100 text-gray-500 italic text-xs">
              <p className="font-semibold text-gray-600 mb-1">English Summary:</p>
              <p>{description}</p>
            </div>
          )}
        </div>

        {/* Bottom Blur Mask when collapsed */}
        {!isExpanded && (
          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        )}
      </div>

      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-950 transition-colors cursor-pointer"
      >
        <span>
          {isExpanded
            ? (isBengali ? 'সংক্ষিপ্ত করুন ▴' : 'Show less ▴')
            : (isBengali ? 'আরও পড়ুন ▾' : 'Read more ▾')}
        </span>
      </button>
    </section>
  );
};
