import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDetailedBookBySlug, getAllDetailedBookSlugs } from '@/lib/data/pdpCatalog';
import { BookJsonLd } from '@/components/pdp/BookJsonLd';
import { PwaOfflineBanner } from '@/components/pwa/PwaOfflineBanner';
import { BookDetailsClient } from '@/components/pdp/BookDetailsClient';

/**
 * Task 47: Next.js Incremental Static Regeneration (ISR) Route
 * Revalidates every 3600 seconds (1 hour) for instant, lightning-fast edge performance.
 */
export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Task 47: Pre-renders all detailed books from catalog at build time
 */
export async function generateStaticParams() {
  const slugs = getAllDetailedBookSlugs();
  return slugs.map((slug) => ({ slug }));
}

/**
 * Task 48: Dynamic Open Graph & Twitter Metadata Generation
 * Optimizes social sharing previews with title, author, price, cover, and Malda Book House branding.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const book = getDetailedBookBySlug(slug);

  if (!book) {
    return {
      title: 'বই পাওয়া যায়নি | M.M Book House Malda',
      description: 'অনুরোধ করা বইটি এম.এম বুক হাউস মালদা ক্যাটালগে পাওয়া যায়নি।',
    };
  }

  const primaryTitle = book.titleBn
    ? `${book.titleBn} (${book.title})`
    : book.title;

  const pageTitle = `${primaryTitle} - ₹${book.price} | M.M Book House Malda`;
  const metaDescription =
    book.descriptionBn ||
    book.description ||
    `${book.title} - লেখক: ${book.author}, প্রকাশনী: ${book.publisher}। এম.এম বুক হাউস মালদা থেকে সর্বোচ্চ ছাড়ে সংগ্রহ করুন।`;

  const coverUrl = book.coverImage || '/images/books/wbcs-manual.webp';

  return {
    title: pageTitle,
    description: metaDescription,
    keywords: [
      book.title,
      book.titleBn,
      book.author,
      book.publisher,
      book.categoryName,
      'WBCS Book Malda',
      'M.M Book House',
      'মালদা বইয়ের দোকান',
      'Netaji Subhash Road Book Shop',
    ],
    openGraph: {
      title: pageTitle,
      description: metaDescription,
      url: `https://mmbookhouse.in/book/${book.slug || book.bookId}`,
      siteName: 'M.M Book House Malda',
      locale: 'bn_IN',
      type: 'book',
      images: [
        {
          url: coverUrl,
          width: 800,
          height: 1200,
          alt: book.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: metaDescription,
      images: [coverUrl],
    },
    alternates: {
      canonical: `https://mmbookhouse.in/book/${book.slug || book.bookId}`,
    },
  };
}

/**
 * Full Assembly: Amazon Classic PDP Route
 * Tasks 41–50: Social Proof, Schema JSON-LD, SEO Metadata, PWA Resilience & Interactive Layout
 */
export default async function BookDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const book = getDetailedBookBySlug(slug);

  if (!book) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#eaeded]">
      {/* Task 46: Schema.org Book & Product JSON-LD Structured Data */}
      <BookJsonLd book={book} />

      {/* Task 50: PWA Offline Resilience Banner */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 pt-3">
        <PwaOfflineBanner />
      </div>

      {/* Full PDP Interactive Assembly */}
      <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-8 animate-pulse text-gray-500">বইয়ের বিবরণ লোড হচ্ছে...</div>}>
        <BookDetailsClient book={book} />
      </Suspense>
    </div>
  );
}
