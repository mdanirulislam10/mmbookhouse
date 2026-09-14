/**
 * Test Suite: Module 17 - Task 2: Verified Buyer & Eligibility Validator
 * Run with: npx tsx scripts/test_module17_task2.ts
 */

import {
  checkReviewEligibility,
  validateSingleReviewPerUser,
  validateHelpfulVoteEligibility,
  CustomerOrderCheckRecord,
} from '../src/lib/services/reviewEligibilityService';
import { ProductReview, ReviewVoteRecord } from '../src/types/reviews';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    process.exit(1);
  }
}

console.log('🧪 Starting Module 17 - Task 2 Test Suite: Verified Buyer & Eligibility Validator...\n');

const mockOrders: CustomerOrderCheckRecord[] = [
  {
    id: 'ord-delivered-1',
    user_id: 'user-anirul',
    status: 'delivered',
    items: [{ product_id: 'book-wbcs-2026', quantity: 1 }],
    delivered_at: '2026-09-05T10:00:00Z',
    created_at: '2026-09-02T10:00:00Z',
  },
  {
    id: 'ord-transit-2',
    user_id: 'user-souvik',
    status: 'shipped',
    items: [{ product_id: 'book-wbcs-2026', quantity: 1 }],
    created_at: '2026-09-10T10:00:00Z',
  },
  {
    id: 'ord-cancelled-3',
    user_id: 'user-priyanka',
    status: 'cancelled_by_user',
    items: [{ product_id: 'book-wbcs-2026', quantity: 1 }],
    created_at: '2026-09-08T10:00:00Z',
  },
];

// 1. Delivered purchase check (Item 2)
const resDelivered = checkReviewEligibility({
  userId: 'user-anirul',
  productId: 'book-wbcs-2026',
  orderHistory: mockOrders,
});
assert(resDelivered.is_eligible, 'Delivered buyer must be eligible');
assert(resDelivered.is_verified_purchase, 'Delivered buyer gets verified purchase badge');
assert(resDelivered.order_id === 'ord-delivered-1', 'Matching order ID captured');
console.log('✅ Test 1 Passed: Delivered purchase verified successfully.');

// 2. Non-buyer check (Item 3)
const resNonBuyer = checkReviewEligibility({
  userId: 'user-random-viewer',
  productId: 'book-wbcs-2026',
  orderHistory: mockOrders,
});
assert(!resNonBuyer.is_eligible, 'Non-buyer must not be eligible to review');
assert(Boolean(resNonBuyer.reason), 'Informative message returned for non-buyer');
console.log('✅ Test 2 Passed: Non-buyer strictly gated from submitting review.');

// 3. In-transit order check (Item 9)
const resInTransit = checkReviewEligibility({
  userId: 'user-souvik',
  productId: 'book-wbcs-2026',
  orderHistory: mockOrders,
});
assert(!resInTransit.is_eligible, 'In-transit order cannot review before delivery');
assert(Boolean(resInTransit.reason?.includes('delivered') || resInTransit.reason_bn?.includes('হাতে পাওয়ার পর')), 'Advised to wait for delivery');
console.log('✅ Test 3 Passed: In-transit order gated until delivery is completed.');

// 4. Cancelled order check (Item 9)
const resCancelled = checkReviewEligibility({
  userId: 'user-priyanka',
  productId: 'book-wbcs-2026',
  orderHistory: mockOrders,
});
assert(!resCancelled.is_eligible, 'Cancelled order cannot submit review');
console.log('✅ Test 4 Passed: Cancelled order barred from review submission.');

// 5. Single review per user upsert policy (Item 8)
const mockExistingReviews: ProductReview[] = [
  {
    id: 'rev-existing-001',
    product_id: 'book-wbcs-2026',
    user_id: 'user-anirul',
    user_name: 'Anirul Islam',
    rating: 5,
    headline: 'Great manual',
    body: 'Best book for WBCS exam preparation in Bengali.',
    is_verified_purchase: true,
    helpful_votes_count: 5,
    would_recommend: true,
    status: 'approved',
    created_at: '2026-09-06T12:00:00Z',
    updated_at: '2026-09-06T12:00:00Z',
  },
];

const upsertCheck = validateSingleReviewPerUser(
  mockExistingReviews,
  'user-anirul',
  'book-wbcs-2026'
);
assert(!upsertCheck.can_create, 'User with existing review cannot create another');
assert(upsertCheck.can_update, 'User with existing review can update');
assert(upsertCheck.existing_review_id === 'rev-existing-001', 'Existing review ID returned');
console.log('✅ Test 5 Passed: Single review per user upsert logic validated.');

// 6. Helpful vote self-voting prevention (Item 16)
const testReview = mockExistingReviews[0];
const previousVotes: ReviewVoteRecord[] = [];

const selfVoteCheck = validateHelpfulVoteEligibility({
  review: testReview,
  votingUserId: 'user-anirul', // Same author as review
  previousVotes,
});
assert(!selfVoteCheck.allowed, 'Self-voting on own review must be rejected');
assert(Boolean(selfVoteCheck.reason), 'Self-vote provides user explanation');
console.log('✅ Test 6 Passed: Self-voting on own review strictly prevented.');

// 7. Duplicate helpful voting check
const voteRecorded: ReviewVoteRecord = {
  review_id: 'rev-existing-001',
  user_id: 'user-voter-2',
  vote_type: 'helpful',
  created_at: new Date().toISOString(),
};

const duplicateVoteCheck = validateHelpfulVoteEligibility({
  review: testReview,
  votingUserId: 'user-voter-2',
  previousVotes: [voteRecorded],
});
assert(!duplicateVoteCheck.allowed, 'Duplicate helpful vote must be blocked');

const newVoteCheck = validateHelpfulVoteEligibility({
  review: testReview,
  votingUserId: 'user-voter-3', // Fresh voter
  previousVotes: [voteRecorded],
});
assert(newVoteCheck.allowed, 'Fresh voter is allowed to vote helpful');
console.log('✅ Test 7 Passed: Duplicate helpful voting prevented.');

console.log('\n🎉 ALL MODULE 17 TASK 2 TESTS PASSED SUCCESSFULLY! (7/7 Checks)\n');
