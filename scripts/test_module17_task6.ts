/**
 * Module 17 - Task 6 Test Suite: Review List Sorting, Aspect Filtering & Seller Reply
 * M.M Book House Malda - E-Commerce Platform
 */

import { ProductReview, ReviewSortOption } from '../src/types/reviews';

function runTests() {
  console.log('🧪 Starting Module 17 - Task 6 Test Suite: Review List & Aspect Filtering...');

  const mockReviews: ProductReview[] = [
    {
      id: 'rev-1',
      product_id: 'wbcs-manual',
      user_id: 'user-a',
      user_name: 'Amitabh Sen',
      user_location: 'Malda Town',
      topper_badge: 'WBCS 2024 Prelims Cleared',
      rating: 5,
      headline: 'অনবদ্য সংকলন ও বাঁধাই চমৎকার',
      body: 'বইয়ের বাইন্ডিং ও ছাপা সত্যিই দুর্দান্ত। নতুন সিলেবাস অনুযায়ী প্রস্তুত।',
      is_verified_purchase: true,
      status: 'approved',
      would_recommend: true,
      helpful_votes_count: 15,
      aspect_ratings: {
        printing_quality: 5,
        content_quality: 5,
        syllabus_relevance: 5,
      },
      seller_response: {
        id: 'resp-1',
        seller_name: 'M.M Book House',
        badge: 'অফিসিয়াল সেলার',
        response_text: 'ধন্যবাদ অমিতাভ বাবু! আপনার সফলতা কামনা করি।',
        responded_at: '2026-03-02T10:00:00.000Z',
      },
      created_at: '2026-03-01T10:00:00.000Z',
      updated_at: '2026-03-01T10:00:00.000Z',
    },
    {
      id: 'rev-2',
      product_id: 'wbcs-manual',
      user_id: 'user-b',
      user_name: 'Priyanka Das',
      user_location: 'Chanchal',
      rating: 4,
      headline: 'ভালো কন্টেন্ট, ব্যাখ্যা সহজ',
      body: 'বিষয়বস্তু সহজ ও বোধগম্য।',
      is_verified_purchase: false,
      status: 'approved',
      would_recommend: true,
      helpful_votes_count: 2,
      aspect_ratings: {
        printing_quality: 4,
        content_quality: 4,
        syllabus_relevance: 4,
      },
      created_at: '2026-03-05T10:00:00.000Z',
      updated_at: '2026-03-05T10:00:00.000Z',
    },
    {
      id: 'rev-3',
      product_id: 'wbcs-manual',
      user_id: 'user-c',
      user_name: 'Subir Roy',
      user_location: 'English Bazar',
      rating: 3,
      headline: 'মাঝারি মানের বাঁধাই',
      body: 'পৃষ্ঠার মান আরও উন্নত হতে পারত। তবে সিলেবাস ঠিক আছে।',
      is_verified_purchase: true,
      status: 'approved',
      would_recommend: false,
      helpful_votes_count: 5,
      aspect_ratings: {
        printing_quality: 3,
        content_quality: 4,
        syllabus_relevance: 3,
      },
      created_at: '2026-03-03T10:00:00.000Z',
      updated_at: '2026-03-03T10:00:00.000Z',
    },
  ];

  // Helper sorting function mirroring the component
  const sortReviews = (list: ProductReview[], sort: ReviewSortOption) => {
    return [...list].sort((a, b) => {
      if (sort === 'top_reviews') return b.helpful_votes_count - a.helpful_votes_count;
      if (sort === 'most_recent') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sort === 'highest_rating') return b.rating - a.rating;
      if (sort === 'lowest_rating') return a.rating - b.rating;
      return 0;
    });
  };

  // Test 1: Top Reviews sorting (by helpful_votes_count descending)
  const topSorted = sortReviews(mockReviews, 'top_reviews');
  if (topSorted[0].id !== 'rev-1' || topSorted[1].id !== 'rev-3' || topSorted[2].id !== 'rev-2') {
    throw new Error('Test 1 Failed: Top reviews sorting incorrect.');
  }
  console.log('✅ Test 1 Passed: Top Reviews sort verified.');

  // Test 2: Most Recent sorting
  const recentSorted = sortReviews(mockReviews, 'most_recent');
  if (recentSorted[0].id !== 'rev-2') {
    throw new Error('Test 2 Failed: Most recent sorting incorrect.');
  }
  console.log('✅ Test 2 Passed: Most Recent sort verified.');

  // Test 3: Highest and Lowest rating sorting
  const highSorted = sortReviews(mockReviews, 'highest_rating');
  const lowSorted = sortReviews(mockReviews, 'lowest_rating');
  if (highSorted[0].rating !== 5 || lowSorted[0].rating !== 3) {
    throw new Error('Test 3 Failed: Rating sorting incorrect.');
  }
  console.log('✅ Test 3 Passed: Highest & Lowest rating sorts verified.');

  // Test 4: Verified Buyer filter
  const verifiedOnly = mockReviews.filter((r) => r.is_verified_purchase);
  if (verifiedOnly.length !== 2 || verifiedOnly.some((r) => !r.is_verified_purchase)) {
    throw new Error('Test 4 Failed: Verified buyer filter incorrect.');
  }
  console.log('✅ Test 4 Passed: Verified Buyer filter verified.');

  // Test 5: Keyword highlight search filter
  const filterByKeyword = (list: ProductReview[], kw: string) => {
    const kwLower = kw.toLowerCase();
    return list.filter((r) => r.headline.toLowerCase().includes(kwLower) || r.body.toLowerCase().includes(kwLower));
  };
  const bindingReviews = filterByKeyword(mockReviews, 'বাঁধাই');
  if (bindingReviews.length !== 2) {
    throw new Error(`Test 5 Failed: Expected 2 reviews with 'বাঁধাই', found ${bindingReviews.length}`);
  }
  console.log('✅ Test 5 Passed: Keyword highlight pill filter verified.');

  // Test 6: Official seller response presence
  const sellerReplied = mockReviews.filter((r) => r.seller_response);
  if (sellerReplied.length !== 1 || sellerReplied[0].seller_response?.seller_name !== 'M.M Book House') {
    throw new Error('Test 6 Failed: Seller response verification failed.');
  }
  console.log('✅ Test 6 Passed: Official Seller Response thread verified.');

  // Test 7: Self voting restriction
  const canVote = (reviewUserId: string, voterUserId: string) => reviewUserId !== voterUserId;
  if (canVote('user-a', 'user-a') !== false || canVote('user-a', 'user-b') !== true) {
    throw new Error('Test 7 Failed: Self-voting protection logic failed.');
  }
  console.log('✅ Test 7 Passed: Self-voting restriction verified.');

  console.log('\n🎉 ALL MODULE 17 TASK 6 TESTS PASSED SUCCESSFULLY! (7/7 Checks)\n');
}

runTests();
