'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/hooks/useLanguage';
import { toBengaliNumerals } from '@/lib/utils/currency';
import { User, Building2, Calendar } from 'lucide-react';

export interface AuthorPublisherLinksProps {
  author: string;
  authorBn?: string;
  publisher: string;
  publisherBn?: string;
  publicationYear?: number | string;
  role?: string;
  roleBn?: string;
  className?: string;
}

/**
 * Task 9: Hyperlinked Author & Publisher Metadata
 *
 * - Hyperlinked author -> /search?author=...
 * - Hyperlinked publisher -> /search?publisher=...
 * - Publication year tag
 * - Amazon-style clean metadata row with hover effects
 */
export const AuthorPublisherLinks: React.FC<AuthorPublisherLinksProps> = ({
  author,
  authorBn,
  publisher,
  publisherBn,
  publicationYear,
  role,
  roleBn,
  className = '',
}) => {
  const { language } = useLanguage();
  const isBengali = language === 'bn';

  const authorDisplayName = isBengali ? (authorBn || author) : author;
  const publisherDisplayName = isBengali ? (publisherBn || publisher) : publisher;
  const roleDisplay = isBengali ? (roleBn || 'লেখক') : (role || 'Author');

  const formattedYear = publicationYear
    ? isBengali
      ? toBengaliNumerals(publicationYear)
      : String(publicationYear)
    : null;

  return (
    <div className={`flex flex-wrap items-center gap-y-1 gap-x-3 text-sm text-gray-600 ${className}`}>
      {/* Author Link */}
      <div className="flex items-center gap-1.5">
        <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        <span className="text-gray-500">{roleDisplay}:</span>
        <Link
          href={`/search?author=${encodeURIComponent(author)}`}
          className="font-medium text-amber-700 hover:text-amber-800 hover:underline transition-colors"
          title={isBengali ? `${authorDisplayName}-এর সমস্ত বই দেখুন` : `View all books by ${author}`}
        >
          {authorDisplayName}
        </Link>
      </div>

      <span className="text-gray-300 select-none">•</span>

      {/* Publisher Link */}
      <div className="flex items-center gap-1.5">
        <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        <span className="text-gray-500">{isBengali ? 'প্রকাশক:' : 'Publisher:'}</span>
        <Link
          href={`/search?publisher=${encodeURIComponent(publisher)}`}
          className="font-medium text-amber-700 hover:text-amber-800 hover:underline transition-colors"
          title={isBengali ? `${publisherDisplayName}-এর সমস্ত বই দেখুন` : `View all books from ${publisher}`}
        >
          {publisherDisplayName}
        </Link>
      </div>

      {/* Publication Year */}
      {formattedYear && (
        <>
          <span className="text-gray-300 select-none">•</span>
          <div className="flex items-center gap-1 text-gray-500 text-xs">
            <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span>
              {isBengali ? `প্রকাশনা: ${formattedYear}` : `Year: ${formattedYear}`}
            </span>
          </div>
        </>
      )}
    </div>
  );
};
