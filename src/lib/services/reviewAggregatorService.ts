/**
 * Module 17: Review Aggregator, Histogram & Schema.org JSON-LD Service
 * M.M Book House Malda - E-Commerce Platform
 * 
 * Implements architectural specifications from proposed_modules.md:
 * - Item 4: 3 Book-specific aspect ratings aggregate computation
 * - Item 11 & 12: Rating breakdown histogram (percentages, star counts, average)
 * - Item 13 & 44: Common review keyword/phrase extraction for 1-click filter pills
 * - Item 39: Schema.org Product & AggregateRating JSON-LD generation for Google Rich Snippets
 */

import { ProductReview, RatingDistributionSummary, StarDistributionItem } from '@/types/reviews';

export interface ProductMetadataForSchema {
  id: string;
  title: string;
  image_url?: string;
  price?: number;
  isbn?: string;
  author?: string;
  sku?: string;
}

export interface ReviewKeywordHighlight {
  keyword: string;
  count: number;
  sentiment: 'positive' | 'neutral' | 'negative';
}

/**
 * Calculates rating distribution, percentage histograms, and aspect averages.
 * Only reviews with status 'approved' are considered in the public summary.
 */
export function calculateRatingDistribution(reviews: ProductReview[]): RatingDistributionSummary {
  const approvedReviews = reviews.filter((r) => r.status === 'approved');
  const totalReviews = approvedReviews.length;

  if (totalReviews === 0) {
    return {
      average_rating: 0,
      total_reviews_count: 0,
      total_ratings_count: 0,
      five_star: { star: 5, count: 0, percentage: 0 },
      four_star: { star: 4, count: 0, percentage: 0 },
      three_star: { star: 3, count: 0, percentage: 0 },
      two_star: { star: 2, count: 0, percentage: 0 },
      one_star: { star: 1, count: 0, percentage: 0 },
      aspect_averages: {
        printing: 0,
        content: 0,
        syllabus: 0,
      },
    };
  }

  // Star counts
  const starCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let ratingSum = 0;

  // Aspect rating totals & counts
  let printingSum = 0;
  let printingCount = 0;
  let contentSum = 0;
  let contentCount = 0;
  let syllabusSum = 0;
  let syllabusCount = 0;

  for (const review of approvedReviews) {
    const star = Math.min(5, Math.max(1, Math.round(review.rating)));
    starCounts[star] = (starCounts[star] || 0) + 1;
    ratingSum += review.rating;

    if (review.aspect_ratings) {
      if (typeof review.aspect_ratings.printing_quality === 'number') {
        printingSum += review.aspect_ratings.printing_quality;
        printingCount++;
      }
      if (typeof review.aspect_ratings.content_quality === 'number') {
        contentSum += review.aspect_ratings.content_quality;
        contentCount++;
      }
      if (typeof review.aspect_ratings.syllabus_relevance === 'number') {
        syllabusSum += review.aspect_ratings.syllabus_relevance;
        syllabusCount++;
      }
    }
  }

  const averageRating = Number((ratingSum / totalReviews).toFixed(1));

  const buildStarItem = (star: 1 | 2 | 3 | 4 | 5): StarDistributionItem => {
    const count = starCounts[star] || 0;
    const percentage = Math.round((count / totalReviews) * 100);
    return { star, count, percentage };
  };

  return {
    average_rating: averageRating,
    total_reviews_count: totalReviews,
    total_ratings_count: totalReviews,
    five_star: buildStarItem(5),
    four_star: buildStarItem(4),
    three_star: buildStarItem(3),
    two_star: buildStarItem(2),
    one_star: buildStarItem(1),
    aspect_averages: {
      printing: printingCount > 0 ? Number((printingSum / printingCount).toFixed(1)) : 0,
      content: contentCount > 0 ? Number((contentSum / contentCount).toFixed(1)) : 0,
      syllabus: syllabusCount > 0 ? Number((syllabusSum / syllabusCount).toFixed(1)) : 0,
    },
  };
}

/**
 * Generates Schema.org JSON-LD compliant data for Google Rich Snippets & Search Engine SEO.
 * Item 39: Google Rich Snippet AggregateRating & Review schema.
 */
export function generateReviewSchemaJsonLd(
  product: ProductMetadataForSchema,
  summary: RatingDistributionSummary,
  topReviews?: ProductReview[]
): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
  };

  if (product.image_url) {
    schema.image = product.image_url;
  }

  if (product.isbn) {
    schema.isbn = product.isbn;
  }

  if (product.author) {
    schema.author = {
      '@type': 'Person',
      name: product.author,
    };
  }

  if (product.sku || product.id) {
    schema.sku = product.sku || product.id;
  }

  if (typeof product.price === 'number') {
    schema.offers = {
      '@type': 'Offer',
      price: product.price.toFixed(2),
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
    };
  }

  // Include aggregateRating only if there are reviews
  if (summary.total_reviews_count > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: summary.average_rating.toString(),
      reviewCount: summary.total_reviews_count.toString(),
      bestRating: '5',
      worstRating: '1',
    };
  }

  // Add individual reviews (if approved reviews are provided)
  const approvedReviews = (topReviews || []).filter((r) => r.status === 'approved');
  if (approvedReviews.length > 0) {
    schema.review = approvedReviews.slice(0, 10).map((r) => {
      const publishDate = r.created_at ? r.created_at.split('T')[0] : new Date().toISOString().split('T')[0];
      return {
        '@type': 'Review',
        author: {
          '@type': 'Person',
          name: r.user_name || 'Anonymous Reader',
        },
        datePublished: publishDate,
        name: r.headline || `${r.rating} Star Review`,
        reviewBody: r.body,
        reviewRating: {
          '@type': 'Rating',
          ratingValue: r.rating.toString(),
          bestRating: '5',
          worstRating: '1',
        },
      };
    });
  }

  return schema;
}

/**
 * Common keyword highlights dictionary with associated sentiment
 */
const KEYWORD_DICTIONARY: Array<{ terms: string[]; label: string; sentiment: 'positive' | 'neutral' | 'negative' }> = [
  { terms: ['বাইন্ডিং', 'বাঁধাই', 'binding'], label: 'বাইন্ডিং কোয়ালিটি', sentiment: 'positive' },
  { terms: ['কাগজ', 'কাগজের মান', 'paper'], label: 'কাগজের মান', sentiment: 'positive' },
  { terms: ['সিলেবাস', 'syllabus'], label: 'সিলেবাস ভিত্তিক', sentiment: 'positive' },
  { terms: ['সহজ ব্যাখ্যা', 'সহজ ভাষায়', 'ব্যাখ্যা'], label: 'সহজ ব্যাখ্যা', sentiment: 'positive' },
  { terms: ['কমন', 'সাজেশন', 'পরীক্ষায় কমন'], label: 'পরীক্ষায় কমন', sentiment: 'positive' },
  { terms: ['দ্রুত ডেলিভারি', 'ফাস্ট ডেলিভারি', 'fast delivery'], label: 'ফাস্ট ডেলিভারি', sentiment: 'positive' },
  { terms: ['প্যাকিং চমৎকার', 'প্যাকিং', 'packaging'], label: 'ভালো প্যাকিং', sentiment: 'positive' },
  { terms: ['মূল্য সাশ্রয়ী', 'কম দাম', 'value for money'], label: 'সাশ্রয়ী দাম', sentiment: 'positive' },
  { terms: ['মিস্টেক', 'বানান ভুল', 'ভুল'], label: 'বানান সতর্কতা', sentiment: 'negative' },
];

/**
 * Extracts popular keywords/phrases from approved reviews to power 1-click filter pills.
 * Item 13 & 44: 1-click filter pill tags.
 */
export function extractReviewKeywordHighlights(
  reviews: ProductReview[],
  minCount: number = 1
): ReviewKeywordHighlight[] {
  const approvedReviews = reviews.filter((r) => r.status === 'approved');
  const counts = new Map<string, { label: string; count: number; sentiment: 'positive' | 'neutral' | 'negative' }>();

  for (const entry of KEYWORD_DICTIONARY) {
    counts.set(entry.label, { label: entry.label, count: 0, sentiment: entry.sentiment });
  }

  for (const review of approvedReviews) {
    const fullText = `${review.headline} ${review.body}`.toLowerCase();
    for (const entry of KEYWORD_DICTIONARY) {
      const match = entry.terms.some((term) => fullText.includes(term.toLowerCase()));
      if (match) {
        const item = counts.get(entry.label)!;
        item.count++;
      }
    }
  }

  const results: ReviewKeywordHighlight[] = [];
  for (const [, value] of counts) {
    if (value.count >= minCount) {
      results.push({
        keyword: value.label,
        count: value.count,
        sentiment: value.sentiment,
      });
    }
  }

  // Sort descending by count
  results.sort((a, b) => b.count - a.count);

  return results;
}
