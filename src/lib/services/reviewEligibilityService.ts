/**
 * Module 17: Review Eligibility & Verified Purchase Service
 * M.M Book House Malda - E-Commerce Platform
 * 
 * Implements architectural specifications from proposed_modules.md:
 * - Item 2: Verified Purchase validation against customer order records
 * - Item 3: Gating non-buyers from review submission
 * - Item 8: Single review per user & edit/update (upsert) policy
 * - Item 9: Exclusion of cancelled and returned orders
 * - Item 16: Self-voting prevention on helpful votes
 */

import { ProductReview, ReviewEligibilityCheckResult, ReviewVoteRecord } from '@/types/reviews';
import { OrderStatus } from '@/types/tracking';

export interface OrderItemCheckRecord {
  product_id: string;
  quantity: number;
}

export interface CustomerOrderCheckRecord {
  id: string;
  user_id: string;
  status: OrderStatus;
  items: OrderItemCheckRecord[];
  delivered_at?: string | null;
  created_at: string;
}

/**
 * Checks if a customer is eligible to write a review for a specific product (Items 2, 3, 9)
 */
export function checkReviewEligibility(params: {
  userId?: string;
  productId: string;
  orderHistory: CustomerOrderCheckRecord[];
  existingReviews?: ProductReview[];
}): ReviewEligibilityCheckResult {
  const { userId, productId, orderHistory, existingReviews = [] } = params;

  if (!userId) {
    return {
      is_eligible: false,
      is_verified_purchase: false,
      reason: 'Please log in to your M.M Book House account to write a review.',
      reason_bn: 'রিভিউ লিখতে অনুগ্রহ করে আপনার এম.এম বুক হাউস অ্যাকাউন্টে লগইন করুন।',
    };
  }

  // 1. Check if user already reviewed this book (Item 8)
  const existingReview = existingReviews.find(
    (r) => r.user_id === userId && r.product_id === productId
  );
  if (existingReview) {
    return {
      is_eligible: true,
      is_verified_purchase: existingReview.is_verified_purchase,
      existing_review_id: existingReview.id,
      reason: 'You have already reviewed this book. You can edit your existing review.',
      reason_bn: 'আপনি ইতিমধ্যে এই বইটিতে রিভিউ দিয়েছেন। আপনি পূর্বের রিভিউটি এডিট করতে পারেন।',
    };
  }

  // 2. Find orders containing this book for this user
  const matchingOrders = orderHistory.filter(
    (order) =>
      order.user_id === userId &&
      order.items.some((item) => item.product_id === productId)
  );

  if (matchingOrders.length === 0) {
    // Item 3: Non-buyers are gated from review submission
    return {
      is_eligible: false,
      is_verified_purchase: false,
      reason: 'Only verified buyers who purchased this book from M.M Book House can submit a review.',
      reason_bn: 'শুধুমাত্র এম.এম বুক হাউস থেকে বইটি ক্রয় করা ভেরিফাইড ক্রেতারাই রিভিউ লিখতে পারবেন।',
    };
  }

  // 3. Check order fulfillment status (Items 2 & 9)
  const deliveredOrder = matchingOrders.find(
    (order) => order.status === 'delivered' || order.status === 'pickup_completed'
  );

  if (deliveredOrder) {
    return {
      is_eligible: true,
      is_verified_purchase: true,
      order_id: deliveredOrder.id,
      delivered_at: deliveredOrder.delivered_at || deliveredOrder.created_at,
    };
  }

  // Check if order was cancelled or returned (Item 9)
  const cancelledOrder = matchingOrders.find((order) =>
    ['cancelled_by_user', 'cancelled_by_seller', 'rto_delivered'].includes(order.status)
  );
  if (cancelledOrder) {
    return {
      is_eligible: false,
      is_verified_purchase: false,
      reason: 'Reviews cannot be submitted for cancelled or returned book orders.',
      reason_bn: 'বাতিলকৃত বা ফেরত দেওয়া অর্ডারের ক্ষেত্রে রিভিউ সাবমিট করা সম্ভব নয়।',
    };
  }

  // Order is still being packed or in transit
  return {
    is_eligible: false,
    is_verified_purchase: false,
    reason: 'Your order is currently in transit. You can write a review once the book is delivered.',
    reason_bn: 'আপনার পার্সেলটি এখনও ট্রানজিটে রয়েছে। বই হাতে পাওয়ার পর আপনি রিভিউ লিখতে পারবেন।',
  };
}

/**
 * Validates single review per user upsert policy (Item 8)
 */
export function validateSingleReviewPerUser(
  existingReviews: ProductReview[],
  userId: string,
  productId: string
): {
  can_create: boolean;
  can_update: boolean;
  existing_review_id?: string;
} {
  const existing = existingReviews.find(
    (r) => r.user_id === userId && r.product_id === productId
  );

  if (existing) {
    return {
      can_create: false,
      can_update: true,
      existing_review_id: existing.id,
    };
  }

  return {
    can_create: true,
    can_update: false,
  };
}

/**
 * Validates whether user is allowed to cast a helpful vote (Item 16)
 * Prevents self-voting and repeated voting on the same review.
 */
export function validateHelpfulVoteEligibility(params: {
  review: ProductReview;
  votingUserId: string;
  previousVotes: ReviewVoteRecord[];
}): {
  allowed: boolean;
  reason?: string;
  reason_bn?: string;
} {
  const { review, votingUserId, previousVotes } = params;

  if (!votingUserId) {
    return {
      allowed: false,
      reason: 'Please log in to vote on reviews.',
      reason_bn: 'রিভিউতে ভোট দিতে অনুগ্রহ করে লগইন করুন।',
    };
  }

  // 1. Self-voting prevention (Item 16)
  if (review.user_id === votingUserId) {
    return {
      allowed: false,
      reason: 'You cannot vote on your own review.',
      reason_bn: 'আপনি নিজের রিভিউতে নিজে হেল্পফুল ভোট দিতে পারবেন না।',
    };
  }

  // 2. Duplicate vote prevention
  const alreadyVoted = previousVotes.some(
    (v) => v.review_id === review.id && v.user_id === votingUserId && v.vote_type === 'helpful'
  );
  if (alreadyVoted) {
    return {
      allowed: false,
      reason: 'You have already voted on this review.',
      reason_bn: 'আপনি ইতিমধ্যে এই রিভিউটিতে হেল্পফুল ভোট দিয়েছেন।',
    };
  }

  return { allowed: true };
}
