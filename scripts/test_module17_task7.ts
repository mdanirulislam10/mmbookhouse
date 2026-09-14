/**
 * Module 17 - Task 7 Test Suite: Review Submission Modal & Validation Logic
 * M.M Book House Malda - E-Commerce Platform
 */

import { submitReviewSchema, updateReviewSchema } from '../src/lib/validations/reviews';

function runTests() {
  console.log('🧪 Starting Module 17 - Task 7 Test Suite: Review Submission Logic...');

  // Test 1: Valid review submission payload
  const validPayload = {
    product_id: 'wbcs-manual-2026',
    rating: 5,
    headline: 'অসাধারণ বই, নতুন সিলেবাস অনুযায়ী পারফেক্ট',
    body: 'বইয়ের বাঁধাই ও প্রিন্টিং কোয়ালিটি অত্যন্ত চমৎকার। প্রতিটি চ্যাপ্টারে বিস্তারিত ব্যাখ্যা রয়েছে।',
    aspect_ratings: {
      printing_quality: 5,
      content_quality: 5,
      syllabus_relevance: 5,
    },
    would_recommend: true,
    topper_badge: 'WBCS 2026 Aspirant',
    photos: [
      {
        id: 'p-1',
        url: 'https://images.unsplash.com/photo-1',
        caption: 'বইয়ের বাঁধাই',
        uploaded_at: '2026-03-01T10:00:00.000Z',
      },
    ],
  };

  const parsedValid = submitReviewSchema.safeParse(validPayload);
  if (!parsedValid.success) {
    throw new Error(`Test 1 Failed: Valid payload rejected: ${JSON.stringify(parsedValid.error.issues)}`);
  }
  console.log('✅ Test 1 Passed: Complete review submission payload validated.');

  // Test 2: Aspect ratings boundaries (1-5)
  const invalidAspectPayload = {
    ...validPayload,
    aspect_ratings: {
      printing_quality: 6, // invalid > 5
      content_quality: 0, // invalid < 1
      syllabus_relevance: 5,
    },
  };
  const parsedInvalidAspect = submitReviewSchema.safeParse(invalidAspectPayload);
  if (parsedInvalidAspect.success) {
    throw new Error('Test 2 Failed: Out of bounds aspect rating accepted.');
  }
  console.log('✅ Test 2 Passed: Aspect ratings 1-5 boundary enforced.');

  // Test 3: Headline and body length constraints
  const tooShortHeadline = {
    ...validPayload,
    headline: 'ab', // < 3 chars
  };
  if (submitReviewSchema.safeParse(tooShortHeadline).success) {
    throw new Error('Test 3 Failed: Too short headline accepted.');
  }

  const tooShortBody = {
    ...validPayload,
    body: 'ছোট মতামত', // < 10 chars
  };
  if (submitReviewSchema.safeParse(tooShortBody).success) {
    throw new Error('Test 3 Failed: Too short body accepted.');
  }
  console.log('✅ Test 3 Passed: Headline and body length validation enforced.');

  // Test 4: Maximum 5 photos enforcement
  const tooManyPhotos = {
    ...validPayload,
    photos: [
      { id: '1', url: 'https://img.com/1', uploaded_at: '2026-03-01' },
      { id: '2', url: 'https://img.com/2', uploaded_at: '2026-03-01' },
      { id: '3', url: 'https://img.com/3', uploaded_at: '2026-03-01' },
      { id: '4', url: 'https://img.com/4', uploaded_at: '2026-03-01' },
      { id: '5', url: 'https://img.com/5', uploaded_at: '2026-03-01' },
      { id: '6', url: 'https://img.com/6', uploaded_at: '2026-03-01' }, // 6th photo
    ],
  };
  if (submitReviewSchema.safeParse(tooManyPhotos).success) {
    throw new Error('Test 4 Failed: More than 5 photos accepted.');
  }
  console.log('✅ Test 4 Passed: 5 photo maximum limit enforced.');

  // Test 5: Edit / Update review schema
  const updatePayload = {
    review_id: 'rev-101',
    headline: 'আপডেটেড শিরোনাম',
    body: 'পরিমার্জিত বিস্তারিত মতামত যা দশ অক্ষরের বেশি।',
    rating: 4,
  };
  const parsedUpdate = updateReviewSchema.safeParse(updatePayload);
  if (!parsedUpdate.success) {
    throw new Error('Test 5 Failed: Valid update payload rejected.');
  }
  console.log('✅ Test 5 Passed: Review edit / update payload schema verified.');

  console.log('\n🎉 ALL MODULE 17 TASK 7 TESTS PASSED SUCCESSFULLY! (5/5 Checks)\n');
}

runTests();
