import { z } from 'zod';

/**
 * Module 19: Merchant Seller Central Zod Validation Schemas
 * M.M Book House Malda - E-Commerce Platform
 */

export const adminRoleSchema = z.enum(['super_admin', 'inventory_manager', 'dispatch_staff']);

export const adminLoginSchema = z.object({
  email: z.string().email('সঠিক ইমেইল এড্রেস দিন'),
  password: z.string().min(8, 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে'),
  otp_code: z.string().regex(/^\d{6}$/, '৬-সংখ্যার ২-ফ্যাক্টর ওটিপি দিন').optional(),
});

export const bookMetadataSchema = z.object({
  sku: z.string().min(3, 'SKU কমপক্ষে ৩ অক্ষরের হতে হবে'),
  isbn: z.string().regex(/^(?:\d{10}|\d{13})$/, 'সঠিক ১০ বা ১৩ সংখ্যার ISBN বা বারকোড দিন'),
  title: z.string().min(1, 'বইয়ের ইংরেজি/সাধারণ নাম আবশ্যক'),
  title_bn: z.string().min(1, 'বইয়ের বাংলা নাম আবশ্যক'),
  author: z.string().min(1, 'লেখকের নাম আবশ্যক'),
  publisher: z.string().min(1, 'প্রকাশনীর নাম আবশ্যক'),
  edition_year: z.number().int().min(1950).max(2035).optional(),
  categories: z.array(z.string()).min(1, 'কমপক্ষে একটি ক্যাটাগরি নির্বাচন করুন'),
  class_grade: z.string().optional(),
  mrp: z.number().positive('মুদ্রিত MRP শূন্যের বেশি হতে হবে'),
  selling_price: z.number().positive('বিক্রয় মূল্য শূন্যের বেশি হতে হবে'),
  wholesale_cost_price: z.number().nonnegative().optional(),
  stock_quantity: z.number().int().nonnegative('স্টক সংখ্যা ০ বা তার বেশি হতে হবে'),
  low_stock_threshold: z.number().int().positive().default(5),
  weight_grams: z.number().positive('বইয়ের ওজন (গ্রাম) আবশ্যক'),
  rack_location: z.string().optional(),
  cover_image_url: z.string().url().optional(),
  preview_images: z.array(z.string().url()).optional(),
  status: z.enum(['active', 'out_of_stock', 'archived', 'out_of_print']).default('active'),
}).refine((data) => data.selling_price <= data.mrp, {
  message: 'বিক্রয় মূল্য মুদ্রিত MRP-এর চেয়ে বেশি হতে পারে না',
  path: ['selling_price'],
});

export const bulkBookImportRowSchema = z.object({
  sku: z.string().min(2),
  isbn: z.string().min(9),
  title: z.string().min(1),
  title_bn: z.string().min(1),
  author: z.string().min(1),
  publisher: z.string().min(1),
  mrp: z.coerce.number().positive(),
  selling_price: z.coerce.number().positive(),
  wholesale_cost_price: z.coerce.number().optional(),
  stock_quantity: z.coerce.number().int().nonnegative(),
  weight_grams: z.coerce.number().positive().default(300),
  categories: z.string().transform((val) => val.split(';').map((s) => s.trim()).filter(Boolean)),
  rack_location: z.string().optional(),
}).refine((data) => data.selling_price <= data.mrp, {
  message: 'বিক্রয় মূল্য মুদ্রিত MRP-এর চেয়ে বেশি হতে পারে না',
  path: ['selling_price'],
});

export const orderPipelineStatusSchema = z.enum([
  'pending',
  'processing',
  'ready_for_pickup',
  'handed_over',
  'delivered',
  'rto_returned',
  'cancelled',
]);

export const counterPickupOtpSchema = z.object({
  order_id: z.string().min(1, 'অর্ডার আইডি আবশ্যক'),
  otp_code: z.string().regex(/^\d{4}$/, 'কাউন্টার হ্যান্ডওভার ওটিপি ঠিক ৪ সংখ্যার হতে হবে'),
});

export const rtoVerificationSchema = z.object({
  awb_code: z.string().min(3, 'কুরিয়ারের AWB বারকোড আবশ্যক'),
  condition: z.enum(['intact', 'damaged']),
  restock_inventory: z.boolean().default(true),
  issue_refund: z.boolean().default(true),
  notes: z.string().optional(),
});

export const couponConfigSchema = z.object({
  code: z.string().min(3).max(20).regex(/^[A-Z0-9_-]+$/, 'কুপন কোড বড় হাতের ইংরেজি ও সংখ্যা হতে হবে'),
  discount_type: z.enum(['flat', 'percentage']),
  discount_value: z.number().positive('ছাড়ের পরিমাণ শূন্যের বেশি হতে হবে'),
  min_order_value: z.number().nonnegative().default(0),
  max_discount_amount: z.number().positive().optional(),
  expires_at: z.string().datetime({ message: 'সঠিক মেয়াদ উত্তীর্ণের তারিখ দিন' }),
  max_usages_per_user: z.number().int().positive().default(1),
  is_active: z.boolean().default(true),
});

export const storeProfileSettingsSchema = z.object({
  store_name: z.string().min(1, 'দোকানের নাম আবশ্যক'),
  address: z.string().min(1, 'দোকানের ঠিকানা আবশ্যক'),
  phone: z.string().min(10, 'ফোন নম্বর আবশ্যক'),
  whatsapp: z.string().min(10, 'হোয়াটসঅ্যাপ নম্বর আবশ্যক'),
  email: z.string().email('সঠিক ইমেইল এড্রেস আবশ্যক'),
  upi_id: z.string().regex(/^[\w.-]+@[\w.-]+$/, 'সঠিক UPI ID দিন (যেমন: mmbook@okaxis)'),
  upi_qr_url: z.string().url().optional(),
  announcement_notice: z.string().optional(),
  is_announcement_active: z.boolean().default(false),
  is_maintenance_mode: z.boolean().default(false),
  maintenance_message: z.string().optional(),
});
