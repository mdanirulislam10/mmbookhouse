/**
 * Test Suite: Module 17 - Task 1: Core Types & Zod Validations
 * Run with: npx tsx scripts/test_module17_task1.ts
 */

import {
  submitReviewSchema,
  updateReviewSchema,
  voteReviewSchema,
  askQuestionSchema,
  answerQuestionSchema,
} from '../src/lib/validations/reviews';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    process.exit(1);
  }
}

console.log('🧪 Starting Module 17 - Task 1 Test Suite: Review & QA Schemas...\n');

// 1. Valid review submission with aspect ratings & photos
const validReview = submitReviewSchema.safeParse({
  product_id: 'prod-wbcs-2026',
  order_id: 'MMB-2026-9021',
  rating: 5,
  headline: 'WBCS 2026 প্রস্তুতির সেরা বই',
  body: 'এই বইটির বাঁধাই ও পাতার মান অত্যন্ত ভালো। বিশেষ করে ইতিহাসের অধ্যায়গুলো খুব সুন্দরভাবে ব্যাখ্যা করা হয়েছে।',
  aspect_ratings: {
    printing_quality: 5,
    content_quality: 5,
    syllabus_relevance: 5,
  },
  photos: [
    'https://cdn.mmbookhouse.com/reviews/photo1.webp',
    'https://cdn.mmbookhouse.com/reviews/photo2.webp',
  ],
  would_recommend: true,
  variant_format: 'paperback',
});
assert(validReview.success, 'Valid review payload with aspect ratings and photos should pass');
console.log('✅ Test 1 Passed: Valid review payload with aspect ratings passes.');

// 2. Reject out-of-range rating (0 or 6)
const invalidRating = submitReviewSchema.safeParse({
  product_id: 'prod-1',
  order_id: 'ord-1',
  rating: 6,
  headline: 'Superb book',
  body: 'Great book for all students preparing for Madhyamik examinations.',
});
assert(!invalidRating.success, 'Rating of 6 must fail validation');

const invalidZeroRating = submitReviewSchema.safeParse({
  product_id: 'prod-1',
  order_id: 'ord-1',
  rating: 0,
  headline: 'Bad book',
  body: 'This book does not meet the standards of the latest syllabus.',
});
assert(!invalidZeroRating.success, 'Rating of 0 must fail validation');
console.log('✅ Test 2 Passed: Out-of-bounds ratings strictly rejected.');

// 3. Reject short body (< 10 chars)
const shortBody = submitReviewSchema.safeParse({
  product_id: 'prod-1',
  order_id: 'ord-1',
  rating: 5,
  headline: 'Good',
  body: 'Good book',
});
assert(!shortBody.success, 'Review body < 10 characters must fail');
console.log('✅ Test 3 Passed: Short/unhelpful reviews rejected.');

// 4. Contact info and spam URL sanitization (Item 28)
const reviewWithPhone = submitReviewSchema.safeParse({
  product_id: 'prod-1',
  order_id: 'ord-1',
  rating: 4,
  headline: 'Great book, call me',
  body: 'Please contact me at 9832145678 to buy my secondhand copy.',
});
assert(!reviewWithPhone.success, 'Review containing phone number must be rejected');

const reviewWithUrl = submitReviewSchema.safeParse({
  product_id: 'prod-1',
  order_id: 'ord-1',
  rating: 3,
  headline: 'Buy cheaper elsewhere',
  body: 'You can get free pdf at https://spam-free-books.com/download right now.',
});
assert(!reviewWithUrl.success, 'Review containing external link must be rejected');
console.log('✅ Test 4 Passed: Phone numbers and spam URLs sanitized & blocked.');

// 5. Max 5 photos rule (Item 6)
const sixPhotos = submitReviewSchema.safeParse({
  product_id: 'prod-1',
  order_id: 'ord-1',
  rating: 5,
  headline: 'Awesome book images',
  body: 'Attached all the chapter index pages for reference.',
  photos: [
    'https://cdn.com/1.jpg',
    'https://cdn.com/2.jpg',
    'https://cdn.com/3.jpg',
    'https://cdn.com/4.jpg',
    'https://cdn.com/5.jpg',
    'https://cdn.com/6.jpg',
  ],
});
assert(!sixPhotos.success, 'More than 5 photos must fail validation');
console.log('✅ Test 5 Passed: Maximum 5 photos constraint enforced.');

// 6. Helpful voting & report abuse schema
const validHelpfulVote = voteReviewSchema.safeParse({
  review_id: 'rev-101',
  vote_type: 'helpful',
});
assert(validHelpfulVote.success, 'Helpful vote schema is valid');

const validAbuseReport = voteReviewSchema.safeParse({
  review_id: 'rev-101',
  vote_type: 'report_abuse',
  reason: 'Offensive language used in comments',
});
assert(validAbuseReport.success, 'Report abuse schema is valid');
console.log('✅ Test 6 Passed: Review voting and abuse reporting schemas valid.');

// 7. Q&A question and answer schemas
const validQuestion = askQuestionSchema.safeParse({
  product_id: 'prod-wbcs-2026',
  question_text: 'এই বইটিতে কি ২০২৬ সালের সাম্প্রতিক অর্থনৈতিক সমীক্ষার ডেটা আছে?',
});
assert(validQuestion.success, 'Valid customer question schema passes');

const validAnswer = answerQuestionSchema.safeParse({
  question_id: 'q-991',
  answer_text: 'হ্যাঁ, এই সংস্করণে জানুয়ারি ২০২৬ পর্যন্ত বাজেট ও আর্থিক সমীক্ষা সম্পূর্ণ আপডেট করা রয়েছে।',
});
assert(validAnswer.success, 'Valid community answer schema passes');
console.log('✅ Test 7 Passed: Customer Q&A question and answer schemas valid.');

console.log('\n🎉 ALL MODULE 17 TASK 1 TESTS PASSED SUCCESSFULLY! (7/7 Checks)\n');
