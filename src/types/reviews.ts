/**
 * Module 17: Verified Buyer Reviews, Ratings & Customer Q&A Types
 * M.M Book House Malda - E-Commerce Platform
 * 
 * Implements architectural specifications from proposed_modules.md:
 * - Item 2: Verified Purchase gating
 * - Item 4: 3 Book-specific aspect ratings (Printing, Content, Syllabus)
 * - Item 6 & 14: Customer photo uploads & gallery
 * - Item 15: Helpful voting & abuse reporting
 * - Item 17: Sorting options (Top, Recent, High-to-low, Low-to-high)
 * - Item 19: Official Seller Response thread
 * - Item 21-29: Customer Q&A question and answer models
 * - Item 31-34: PostgreSQL relational review entities & denormalized aggregates
 */

export interface AspectRatings {
  /** Paper & Binding Quality (১-৫ স্টার) */
  printing_quality?: number;
  /** Content Depth & Explanation (১-৫ স্টার) */
  content_quality?: number;
  /** Latest Syllabus Relevance (১-৫ স্টার) */
  syllabus_relevance?: number;
}

export interface CustomerPhoto {
  id: string;
  url: string;
  thumbnail_url?: string;
  caption?: string;
  uploaded_at: string;
}

export interface OfficialSellerResponse {
  id: string;
  seller_name: string; // e.g. "M.M Book House (Official Store)"
  response_text: string;
  responded_at: string;
  badge: string; // e.g. "Verified Seller"
}

export type ReviewStatus = 'approved' | 'flagged_for_review' | 'rejected';

export interface ProductReview {
  id: string;
  product_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  user_location?: string; // Item 49: Local social proof badge (e.g. "Malda Town", "Chanchal")
  topper_badge?: string;  // e.g. "WBCS 2024 Prelims Cleared"
  rating: number;         // 1 to 5
  aspect_ratings?: AspectRatings;
  headline: string;
  body: string;
  is_verified_purchase: boolean; // Item 2: Verified Purchase
  photos?: CustomerPhoto[];
  helpful_votes_count: number;
  would_recommend: boolean;
  variant_format?: 'paperback' | 'hardcover' | 'bundle';
  seller_response?: OfficialSellerResponse;
  status: ReviewStatus;
  created_at: string;
  updated_at: string;
}

export type ReviewSortOption =
  | 'top_reviews'
  | 'most_recent'
  | 'highest_rating'
  | 'lowest_rating';

export interface StarDistributionItem {
  star: 1 | 2 | 3 | 4 | 5;
  count: number;
  percentage: number;
}

export interface RatingDistributionSummary {
  average_rating: number;
  total_reviews_count: number;
  total_ratings_count: number;
  five_star: StarDistributionItem;
  four_star: StarDistributionItem;
  three_star: StarDistributionItem;
  two_star: StarDistributionItem;
  one_star: StarDistributionItem;
  aspect_averages?: {
    printing: number;
    content: number;
    syllabus: number;
  };
}

export interface ProductAnswer {
  id: string;
  question_id: string;
  author_name: string;
  is_seller: boolean;          // Item 25: Answered by M.M Book House (Seller)
  is_verified_buyer: boolean;  // Answered by past customer
  answer_text: string;
  upvotes_count: number;
  created_at: string;
}

export interface ProductQuestion {
  id: string;
  product_id: string;
  asked_by_name: string;
  question_text: string;
  answers_count: number;
  answers: ProductAnswer[];
  upvotes_count: number;
  created_at: string;
}

export interface ReviewVoteRecord {
  review_id: string;
  user_id: string;
  vote_type: 'helpful' | 'report_abuse';
  created_at: string;
}

export interface ReviewEligibilityCheckResult {
  is_eligible: boolean;
  is_verified_purchase: boolean;
  order_id?: string;
  delivered_at?: string;
  existing_review_id?: string;
  reason?: string;
  reason_bn?: string;
}
