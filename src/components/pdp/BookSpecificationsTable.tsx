'use client';

import React from 'react';
import { BookSpecification } from '@/types/pdp';
import { toBengaliNumerals } from '@/lib/utils/currency';
import { useLanguage } from '@/hooks/useLanguage';
import {
  Book,
  Calendar,
  Building,
  Languages,
  FileSpreadsheet,
  Scale,
  Maximize,
  CheckCircle,
} from 'lucide-react';

interface BookSpecificationsTableProps {
  specs: BookSpecification;
  binding?: string;
  className?: string;
}

export const BookSpecificationsTable: React.FC<BookSpecificationsTableProps> = ({
  specs,
  binding = 'paperback',
  className = '',
}) => {
  const { isBengali } = useLanguage();

  const specRows = [
    {
      icon: Building,
      label: isBengali ? 'প্রকাশক ও প্রকাশনী' : 'Publisher',
      value: specs.publisher,
    },
    {
      icon: Calendar,
      label: isBengali ? 'প্রকাশনার বছর ও সংস্করণ' : 'Edition & Year',
      value: `${specs.edition} (${isBengali ? toBengaliNumerals(specs.publicationYear) : specs.publicationYear})`,
    },
    {
      icon: Book,
      label: isBengali ? 'ISBN-13 বারকোড' : 'ISBN-13',
      value: specs.isbn13,
    },
    ...(specs.isbn10
      ? [
          {
            icon: Book,
            label: isBengali ? 'ISBN-10' : 'ISBN-10',
            value: specs.isbn10,
          },
        ]
      : []),
    {
      icon: Languages,
      label: isBengali ? 'মুদ্রণ ভাষা ও মাধ্যম' : 'Language & Medium',
      value: isBengali ? specs.languageBn : specs.language,
    },
    {
      icon: FileSpreadsheet,
      label: isBengali ? 'মোট পৃষ্ঠা সংখ্যা' : 'Print Length',
      value: isBengali ? `${toBengaliNumerals(specs.pages)} পৃষ্ঠা` : `${specs.pages} Pages`,
    },
    {
      icon: Book,
      label: isBengali ? 'বাইন্ডিং ও বাঁধাই' : 'Binding Format',
      value:
        binding === 'hardcover'
          ? (isBengali ? 'হার্ডকভার লাইব্রেরি বাঁধাই' : 'Hardcover')
          : (isBengali ? 'পেপারব্যাক (Paperback)' : 'Paperback'),
    },
    ...(specs.weight
      ? [
          {
            icon: Scale,
            label: isBengali ? 'আইটেম ওজন' : 'Item Weight',
            value: specs.weight,
          },
        ]
      : []),
    ...(specs.dimensions
      ? [
          {
            icon: Maximize,
            label: isBengali ? 'বইয়ের মাপ (সাইজ)' : 'Dimensions',
            value: specs.dimensions,
          },
        ]
      : []),
    ...(specs.paperType
      ? [
          {
            icon: CheckCircle,
            label: isBengali ? 'কাগজের মান' : 'Paper Quality',
            value: specs.paperType,
          },
        ]
      : []),
  ];

  return (
    <section
      id="specifications"
      aria-label="বইয়ের স্পেসিফিকেশন ও মেটাডাটা"
      className={`bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 md:p-8 shadow-xs ${className}`}
    >
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100 flex items-center gap-2">
        <Book className="w-5 h-5 text-amber-600" />
        <span>{isBengali ? 'বইটির বিবরণ ও স্পেসিফিকেশন' : 'Product Specifications'}</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
        {specRows.map((row, idx) => {
          const Icon = row.icon;
          return (
            <div
              key={idx}
              className="flex items-start justify-between py-2 border-b border-gray-100/70 text-xs sm:text-sm"
            >
              <span className="text-gray-500 font-medium flex items-center gap-2">
                <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                <span>{row.label}</span>
              </span>
              <span className="font-bold text-gray-900 text-right ml-4 max-w-[60%]">
                {row.value}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
};
