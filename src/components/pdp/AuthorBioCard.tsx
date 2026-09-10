'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { User, BookOpen, ExternalLink, ArrowRight } from 'lucide-react';
import { AuthorBio, DetailedBookProduct } from '@/types/pdp';
import { useLanguage } from '@/hooks/useLanguage';
import { DETAILED_BOOKS_CATALOG } from '@/lib/data/pdpCatalog';
import { formatINR } from '@/lib/utils/currency';

interface AuthorBioCardProps {
  authorBio?: AuthorBio;
  authorName: string;
  currentBookId?: string;
  className?: string;
}

export const AuthorBioCard: React.FC<AuthorBioCardProps> = ({
  authorBio,
  authorName,
  currentBookId,
  className = '',
}) => {
  const { isBengali, language } = useLanguage();

  if (!authorBio && !authorName) return null;

  const displayName = isBengali && authorBio?.nameBn ? authorBio.nameBn : authorBio?.name || authorName;
  const bioText = isBengali && authorBio?.bioBn ? authorBio.bioBn : authorBio?.bio || 'বিশিষ্ট শিক্ষাবিদ ও লেখক। পশ্চিমবঙ্গ ও সর্বভারতীয় সিভিল সার্ভিস পরীক্ষায় শিক্ষার্থীদের দিকনির্দেশনায় বহু বছর নিয়োজিত।';

  // Find other books by this author from catalog
  const otherBooks = DETAILED_BOOKS_CATALOG.filter(
    (b) =>
      (b.author.toLowerCase() === authorName.toLowerCase() ||
        (authorBio?.nameBn && b.authorBn === authorBio.nameBn)) &&
      (!currentBookId || (b.bookId !== currentBookId && b.id !== currentBookId))
  );

  return (
    <section
      id="author-bio"
      aria-label="লেখক পরিচিতি"
      className={`bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 md:p-8 shadow-xs space-y-6 ${className}`}
    >
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
        <User className="w-5 h-5 text-amber-600" />
        <span>{isBengali ? 'লেখক সম্পর্কে পরিচিতি' : 'About the Author'}</span>
      </h2>

      <div className="flex flex-col sm:flex-row items-start gap-4">
        {/* Author Avatar */}
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-amber-100/70 border-2 border-amber-300 shrink-0 flex items-center justify-center">
          {authorBio?.avatarUrl ? (
            <Image
              src={authorBio.avatarUrl}
              alt={displayName}
              fill
              sizes="80px"
              className="object-cover"
            />
          ) : (
            <User className="w-10 h-10 text-amber-700" />
          )}
        </div>

        {/* Bio Content */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="text-base sm:text-lg font-bold text-gray-950">
              {displayName}
            </h3>

            <Link
              href={`/search?author=${encodeURIComponent(authorName)}`}
              className="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1"
            >
              <span>{isBengali ? 'এই লেখকের সমস্ত বই দেখুন' : 'View all books by author'}</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            {bioText}
          </p>
        </div>
      </div>

      {/* Task 26: Mini Shelf of Other Books by Author */}
      {otherBooks.length > 0 && (
        <div className="pt-4 border-t border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-bold text-gray-800 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span>{isBengali ? `${displayName}-এর আরও অন্যান্য বই` : `More books by ${displayName}`}</span>
            </h4>
            <Link
              href={`/search?author=${encodeURIComponent(authorName)}`}
              className="text-[11px] font-bold text-amber-800 hover:underline flex items-center gap-0.5"
            >
              <span>{isBengali ? 'সবগুলো' : 'View all'}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {otherBooks.slice(0, 4).map((book) => (
              <Link
                key={book.bookId}
                href={`/book/${book.slug || book.bookId}`}
                className="group p-2.5 rounded-xl border border-gray-200 hover:border-amber-400 hover:shadow-xs transition-all bg-gray-50/50 hover:bg-white flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden bg-gray-200 mb-2">
                    <img
                      src={book.coverImage || '/images/books/wbcs-manual.webp'}
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      loading="lazy"
                    />
                  </div>
                  <h5 className="text-xs font-bold text-gray-900 group-hover:text-amber-800 transition-colors line-clamp-2 leading-snug">
                    {isBengali ? book.titleBn || book.title : book.title}
                  </h5>
                </div>
                <div className="pt-2 text-xs font-black text-[#b12704]">
                  {formatINR(book.price, language)}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
