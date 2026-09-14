import { z } from 'zod';

/**
 * Module 15: Zod Validation Schemas for Bundles and Cross-Selling
 * 
 * Complies with:
 * - Item 6: Compact 2 to 3 items per bundle constraint.
 * - Item 7: Valid combo discounts (flat or percentage).
 * - Item 41: Atomic cart payload validation.
 */

export const bundleItemSchema = z.object({
  product_id: z.string().min(1, 'Product ID is required'),
  title: z.string().min(1, 'Title is required'),
  title_bn: z.string().optional(),
  author: z.string().optional(),
  publisher: z.string().optional(),
  isbn13: z.string().optional(),
  cover_image_url: z.string().min(1, 'Cover image URL is required'),
  unit_mrp: z.number().positive('Unit MRP must be positive'),
  unit_selling_price: z.number().positive('Unit selling price must be positive'),
  is_primary: z.boolean(),
  is_in_stock: z.boolean(),
  stock_quantity: z.number().int().nonnegative(),
  rating: z.number().min(0).max(5).optional(),
  total_reviews: z.number().int().nonnegative().optional(),
  edition: z.string().optional(),
  category_id: z.string().optional(),
  subject: z.string().optional(),
  page_count: z.number().int().positive().optional(),
  synopsis: z.string().optional(),
});

export const createBundleInputSchema = z
  .object({
    primary_product_id: z.string().min(1, 'Primary product ID is required'),
    title: z.string().min(3, 'Bundle title must be at least 3 characters'),
    title_bn: z.string().optional(),
    description: z.string().optional(),
    items: z
      .array(bundleItemSchema)
      .min(2, 'Bundle must contain at least 2 items')
      .max(3, 'Bundle cannot contain more than 3 items to avoid cognitive overload (Item 6)'),
    discount_type: z.enum(['PERCENTAGE', 'FLAT']),
    discount_value: z.number().nonnegative('Discount value must be non-negative'),
    bundle_source: z.enum(['CURATED', 'ALGORITHMIC', 'CATEGORY_FALLBACK']).default('CURATED'),
    priority_score: z.number().int().default(100),
  })
  .refine(
    (data) => {
      // Must have exactly one primary item
      const primaryCount = data.items.filter((it) => it.is_primary).length;
      return primaryCount === 1;
    },
    {
      message: 'Bundle must contain exactly one primary item',
      path: ['items'],
    }
  )
  .refine(
    (data) => {
      if (data.discount_type === 'PERCENTAGE') {
        return data.discount_value <= 50; // Max 50% discount allowed
      }
      return true;
    },
    {
      message: 'Percentage discount cannot exceed 50%',
      path: ['discount_value'],
    }
  );

export const addBundleToCartSchema = z
  .object({
    bundleId: z.string().optional(),
    bundle_id: z.string().optional(),
    primaryProductId: z.string().optional(),
    primary_product_id: z.string().optional(),
    selectedProductIds: z.array(z.string().min(1)).optional(),
    product_ids: z.array(z.string().min(1)).optional(),
    comboDiscountApplied: z.number().nonnegative().default(0),
    device_fingerprint: z.string().optional(),
    utm_campaign: z.string().optional(),
  })
  .transform((data) => {
    const bundleId = data.bundleId || data.bundle_id || '';
    const selectedProductIds = data.selectedProductIds || data.product_ids || [];
    const primaryProductId = data.primaryProductId || data.primary_product_id || selectedProductIds[0] || '';
    return {
      bundleId,
      primaryProductId,
      selectedProductIds,
      comboDiscountApplied: data.comboDiscountApplied,
      device_fingerprint: data.device_fingerprint,
      utm_campaign: data.utm_campaign,
    };
  })
  .refine((data) => data.bundleId.length > 0, {
    message: 'Bundle ID is required',
    path: ['bundleId'],
  })
  .refine((data) => data.selectedProductIds.length > 0, {
    message: 'At least one product must be selected',
    path: ['selectedProductIds'],
  });

export const bundleAnalyticsSchema = z.object({
  bundle_id: z.string().min(1),
  primary_product_id: z.string().min(1),
  event_type: z.enum(['IMPRESSION', 'CLICK', 'CONVERT']),
  item_ids: z.array(z.string().min(1)).min(1),
  total_amount: z.number().nonnegative().optional(),
  user_id: z.string().optional(),
});
