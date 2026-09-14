/**
 * Module 17 - Task 4 Test Suite: Rating Aggregator, Histogram & Schema.org JSON-LD
 * M.M Book House Malda - E-Commerce Platform
 */

import {
  calculateRatingDistribution,
  generateReviewSchemaJsonLd,
  extractReviewKeywordHighlights,
  ProductMetadataForSchema,
} from '../src/lib/services/reviewAggregatorService';
import { ProductReview } from '../src/types/reviews';

function runTests() {
  console.log('🧪 Starting Module 17 - Task 4 Test Suite: Rating Aggregator & Schema.org...');

  // Test 1: Empty reviews handling
  const emptySummary = calculateRatingDistribution([]);
  if (
    emptySummary.average_rating !== 0 ||
    emptySummary.total_reviews_count !== 0 ||
    emptySummary.five_star.count !== 0
  ) {
    throw new Error('Test 1 Failed: Empty reviews should return 0 average and 0 count.');
  }
  console.log('✅ Test 1 Passed: Empty reviews handled gracefully.');

  // Mock test reviews
  const mockReviews: ProductReview[] = [
    {
      id: 'rev-1',
      product_id: 'wbcs-manual-2026',
      user_id: 'user-1',
      user_name: 'Sourav Mondal',
      rating: 5,
      headline: 'অনবদ্য বই! সিলেবাস ভিত্তিক এবং সহজ ব্যাখ্যা',
      body: 'বইয়ের বাইন্ডিং কোয়ালিটি চমৎকার, কাগজের মান খুব ভালো এবং দ্রুত ডেলিভারি পেয়েছি মালদায়।',
      is_verified_purchase: true,
      status: 'approved',
      would_recommend: true,
      helpful_votes_count: 8,
      aspect_ratings: {
        printing_quality: 5,
        content_quality: 5,
        syllabus_relevance: 5,
      },
      created_at: '2026-03-01T10:00:00.000Z',
      updated_at: '2026-03-01T10:00:00.000Z',
    },
    {
      id: 'rev-2',
      product_id: 'wbcs-manual-2026',
      user_id: 'user-2',
      user_name: 'Debojyoti Paul',
      rating: 4,
      headline: 'ভালো কন্টেন্ট, তবে কিছু বানান সতর্কতা প্রয়োজন',
      body: 'সিলেবাস ঠিক আছে এবং সহজ ব্যাখ্যা রয়েছে। প্যাকেজিং ভালো ছিল।',
      is_verified_purchase: true,
      status: 'approved',
      would_recommend: true,
      helpful_votes_count: 3,
      aspect_ratings: {
        printing_quality: 4,
        content_quality: 4,
        syllabus_relevance: 5,
      },
      created_at: '2026-03-02T12:00:00.000Z',
      updated_at: '2026-03-02T12:00:00.000Z',
    },
    {
      id: 'rev-3',
      product_id: 'wbcs-manual-2026',
      user_id: 'user-3',
      user_name: 'Anirban Das',
      rating: 5,
      headline: 'প্যাকিং চমৎকার এবং সাশ্রয়ী দাম',
      body: 'বাইন্ডিং খুব মজবুত। পরীক্ষায় কমন পাওয়ার মতো প্রচুর প্রশ্ন রয়েছে।',
      is_verified_purchase: true,
      status: 'approved',
      would_recommend: true,
      helpful_votes_count: 5,
      aspect_ratings: {
        printing_quality: 5,
        content_quality: 5,
        syllabus_relevance: 4,
      },
      created_at: '2026-03-03T15:00:00.000Z',
      updated_at: '2026-03-03T15:00:00.000Z',
    },
    {
      id: 'rev-4',
      product_id: 'wbcs-manual-2026',
      user_id: 'spammer-1',
      user_name: 'Spam Bot',
      rating: 1,
      headline: 'Spam review',
      body: 'Irrelevant text',
      is_verified_purchase: false,
      status: 'rejected', // should be excluded from calculations
      would_recommend: false,
      helpful_votes_count: 0,
      created_at: '2026-03-04T00:00:00.000Z',
      updated_at: '2026-03-04T00:00:00.000Z',
    },
  ];

  // Test 2: Aggregator star counts & percentage
  const summary = calculateRatingDistribution(mockReviews);
  // Total approved reviews = 3 (ratings: 5, 4, 5) -> average = 14 / 3 = 4.67 -> 4.7
  if (summary.total_reviews_count !== 3) {
    throw new Error(`Test 2 Failed: Expected 3 approved reviews, got ${summary.total_reviews_count}`);
  }
  if (summary.average_rating !== 4.7) {
    throw new Error(`Test 2 Failed: Expected average 4.7, got ${summary.average_rating}`);
  }
  if (summary.five_star.count !== 2 || summary.four_star.count !== 1) {
    throw new Error('Test 2 Failed: Star count breakdown incorrect.');
  }
  // 2 out of 3 is 67%
  if (summary.five_star.percentage !== 67 || summary.four_star.percentage !== 33) {
    throw new Error(
      `Test 2 Failed: Percentages incorrect: 5-star ${summary.five_star.percentage}%, 4-star ${summary.four_star.percentage}%`
    );
  }
  console.log('✅ Test 2 Passed: Star counts, percentages, and overall average verified.');

  // Test 3: Status filtering (rejected reviews ignored)
  if (summary.one_star.count !== 0) {
    throw new Error('Test 3 Failed: Rejected reviews must not be counted in distribution.');
  }
  console.log('✅ Test 3 Passed: Non-approved reviews cleanly filtered out.');

  // Test 4: Aspect ratings breakdown
  // printing: 5, 4, 5 -> 14 / 3 = 4.7
  // content: 5, 4, 5 -> 14 / 3 = 4.7
  // syllabus: 5, 5, 4 -> 14 / 3 = 4.7
  if (!summary.aspect_averages) {
    throw new Error('Test 4 Failed: Aspect averages missing.');
  }
  if (
    summary.aspect_averages.printing !== 4.7 ||
    summary.aspect_averages.content !== 4.7 ||
    summary.aspect_averages.syllabus !== 4.7
  ) {
    throw new Error(
      `Test 4 Failed: Aspect averages mismatch: ${JSON.stringify(summary.aspect_averages)}`
    );
  }
  console.log('✅ Test 4 Passed: 3 Book-specific aspect ratings computed accurately.');

  // Test 5: Schema.org JSON-LD Generation
  const productMeta: ProductMetadataForSchema = {
    id: 'wbcs-manual-2026',
    title: 'WBCS General Studies Manual 2026',
    image_url: 'https://mmbookhouse.com/images/wbcs.jpg',
    price: 850,
    isbn: '978-93-12345-67-8',
    author: 'Nitin Singhania',
  };

  const schemaJsonLd = generateReviewSchemaJsonLd(productMeta, summary, mockReviews);
  if (schemaJsonLd['@context'] !== 'https://schema.org' || schemaJsonLd['@type'] !== 'Product') {
    throw new Error('Test 5 Failed: Invalid Schema.org root context.');
  }
  const aggRating = schemaJsonLd.aggregateRating as Record<string, string>;
  if (!aggRating || aggRating.ratingValue !== '4.7' || aggRating.reviewCount !== '3') {
    throw new Error('Test 5 Failed: AggregateRating in Schema.org invalid.');
  }
  const reviewsInSchema = schemaJsonLd.review as Array<Record<string, unknown>>;
  if (!Array.isArray(reviewsInSchema) || reviewsInSchema.length !== 3) {
    throw new Error('Test 5 Failed: Reviews array in Schema.org invalid.');
  }
  console.log('✅ Test 5 Passed: Schema.org JSON-LD AggregateRating & Review generator verified.');

  // Test 6: Keyword highlights extraction
  const highlights = extractReviewKeywordHighlights(mockReviews, 1);
  const keywordsFound = highlights.map((h) => h.keyword);
  if (!keywordsFound.includes('বাইন্ডিং কোয়ালিটি') || !keywordsFound.includes('সিলেবাস ভিত্তিক')) {
    throw new Error(`Test 6 Failed: Expected keywords missing. Found: ${keywordsFound.join(', ')}`);
  }
  console.log('✅ Test 6 Passed: 1-Click filter keyword highlights extracted successfully.');

  console.log('\n🎉 ALL MODULE 17 TASK 4 TESTS PASSED SUCCESSFULLY! (6/6 Checks)\n');
}

runTests();
