/**
 * Module 17: Review & Customer Q&A Zod Validation Schemas
 * M.M Book House Malda - E-Commerce Platform
 * 
 * Implements architectural specifications from proposed_modules.md:
 * - Item 4: Aspect ratings validation
 * - Item 5: Review submission form validation
 * - Item 6: Customer photo upload validation (Max 5 images)
 * - Item 15: Helpful voting validation
 * - Item 18: Abuse reporting validation
 * - Item 23: Q&A question submission
 * - Item 24: Q&A answer submission
 * - Item 28: Regex sanitization guarding against phone numbers and external links
 */

import { z } from 'zod';

export const aspectRatingItemSchema = z
  .number()
  .int()
  .min(1, 'Minimum rating is 1')
  .max(5, 'Maximum rating is 5');

export const aspectRatingsSchema = z.object({
  printing_quality: aspectRatingItemSchema.optional(),
  content_quality: aspectRatingItemSchema.optional(),
  syllabus_relevance: aspectRatingItemSchema.optional(),
});

/**
 * Regex patterns for spam and contact info sanitization (Item 28)
 */
export const PHONE_NUMBER_REGEX = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}|\b[6-9]\d{9}\b/;
export const EXTERNAL_URL_REGEX = /(https?:\/\/|www\.)[^\s/$.?#].[^\s]*/i;

export const customerPhotoInputSchema = z.union([
  z.string().url('Each photo must be a valid URL'),
  z.object({
    id: z.string().optional(),
    url: z.string().url('Invalid photo URL'),
    thumbnail_url: z.string().optional(),
    caption: z.string().optional(),
    uploaded_at: z.string().optional(),
  }),
]);

/**
 * Submit Review Zod Schema (Items 4, 5, 6)
 */
export const submitReviewSchema = z.object({
  product_id: z.string().min(1, 'Product ID is required'),
  order_id: z.string().min(1, 'Order ID is required to verify purchase').optional(),
  rating: z.number().int().min(1, 'Rating must be at least 1 star').max(5, 'Rating cannot exceed 5 stars'),
  headline: z
    .string()
    .trim()
    .min(3, 'Review headline must have at least 3 characters')
    .max(150, 'Review headline cannot exceed 150 characters')
    .refine((val) => !PHONE_NUMBER_REGEX.test(val), {
      message: 'Headline must not contain phone numbers for customer privacy',
    }),
  body: z
    .string()
    .trim()
    .min(10, 'Review description must have at least 10 characters')
    .max(3000, 'Review description cannot exceed 3000 characters')
    .refine((val) => !PHONE_NUMBER_REGEX.test(val), {
      message: 'Review content must not share personal contact details',
    })
    .refine((val) => !EXTERNAL_URL_REGEX.test(val), {
      message: 'External promotional links are not allowed in reviews',
    }),
  aspect_ratings: aspectRatingsSchema.optional(),
  photos: z
    .array(customerPhotoInputSchema)
    .max(5, 'You can upload a maximum of 5 customer photos (Item 6)')
    .optional(),
  would_recommend: z.boolean().default(true),
  variant_format: z.enum(['paperback', 'hardcover', 'bundle']).optional(),
  topper_badge: z.string().max(100).optional(),
});

/**
 * Update Existing Review Zod Schema (Item 8 - Upsert/Edit Policy)
 */
export const updateReviewSchema = z.object({
  review_id: z.string().min(1, 'Review ID is required'),
  rating: z.number().int().min(1).max(5).optional(),
  headline: z.string().trim().min(3).max(150).optional(),
  body: z.string().trim().min(10).max(3000).optional(),
  aspect_ratings: aspectRatingsSchema.optional(),
  photos: z.array(customerPhotoInputSchema).max(5).optional(),
  would_recommend: z.boolean().optional(),
  topper_badge: z.string().max(100).optional(),
});

/**
 * Review Voting & Abuse Report Schema (Items 15 & 18)
 */
export const voteReviewSchema = z.object({
  review_id: z.string().min(1, 'Review ID is required'),
  vote_type: z.enum(['helpful', 'report_abuse']),
  reason: z.string().max(300).optional(),
});

/**
 * Customer Q&A Question Submission Schema (Item 23)
 */
export const askQuestionSchema = z.object({
  product_id: z.string().min(1, 'Product ID is required'),
  question_text: z
    .string()
    .trim()
    .min(5, 'Question must have at least 5 characters')
    .max(500, 'Question cannot exceed 500 characters')
    .refine((val) => !PHONE_NUMBER_REGEX.test(val), {
      message: 'Questions must not include personal phone numbers',
    })
    .refine((val) => !EXTERNAL_URL_REGEX.test(val), {
      message: 'External links are not allowed in questions',
    }),
});

/**
 * Customer Q&A Answer Submission Schema (Item 24)
 */
export const answerQuestionSchema = z.object({
  question_id: z.string().min(1, 'Question ID is required'),
  answer_text: z
    .string()
    .trim()
    .min(5, 'Answer must have at least 5 characters')
    .max(2000, 'Answer cannot exceed 2000 characters')
    .refine((val) => !PHONE_NUMBER_REGEX.test(val), {
      message: 'Answers must not share contact phone numbers',
    })
    .refine((val) => !EXTERNAL_URL_REGEX.test(val), {
      message: 'Links are not permitted in community answers',
    }),
});
