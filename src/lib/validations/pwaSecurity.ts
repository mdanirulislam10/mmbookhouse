import { z } from 'zod';

/**
 * Module 20: PWA & Security Zod Validation Schemas
 * Rigorous schemas for PWA manifests, push payloads, rate limits, security, and launch audits.
 */

// 1. PWA & Manifest Schemas
export const pwaIconConfigSchema = z.object({
  src: z.string().min(1, 'Icon path is required'),
  sizes: z.string().regex(/^\d+x\d+$/, 'Sizes must be formatted like 192x192 or 512x512'),
  type: z.string().default('image/png'),
  purpose: z.enum(['any', 'maskable', 'monochrome']).optional(),
});

export const pwaAppShortcutSchema = z.object({
  name: z.string().min(1, 'Shortcut name is required'),
  short_name: z.string().min(1, 'Shortcut short name is required'),
  description: z.string().min(1, 'Shortcut description is required'),
  url: z.string().startsWith('/', 'Shortcut URL must be a relative path starting with /'),
  icons: z.array(pwaIconConfigSchema).optional(),
});

export const pwaSplashScreenSchema = z.object({
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a 6-digit hex color'),
  themeColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a 6-digit hex color'),
  logoUrl: z.string().min(1, 'Logo URL is required'),
  taglineBengali: z.string().min(1, 'Bengali tagline is required'),
  taglineEnglish: z.string().min(1, 'English tagline is required'),
  durationMs: z.number().int().min(500).max(5000),
});

export const pwaManifestSchema = z.object({
  name: z.string().min(3, 'App name is required'),
  short_name: z.string().min(2, 'Short name is required'),
  description: z.string().min(10, 'Description must be detailed'),
  start_url: z.string().min(1),
  display: z.enum(['fullscreen', 'standalone', 'minimal-ui', 'browser']),
  background_color: z.string(),
  theme_color: z.string(),
  lang: z.string().default('bn'),
  dir: z.enum(['ltr', 'rtl']).default('ltr'),
  orientation: z.enum(['portrait', 'landscape', 'any']).default('portrait'),
  icons: z.array(pwaIconConfigSchema).min(2, 'At least 192x192 and 512x512 icons required'),
  categories: z.array(z.string()).min(1),
  shortcuts: z.array(pwaAppShortcutSchema).min(3, 'At least 3 quick app shortcuts required'),
  splashScreen: pwaSplashScreenSchema.optional(),
});

// 2. Web Push & Notification Schemas
export const pushNotificationActionSchema = z.object({
  action: z.string().min(1),
  title: z.string().min(1),
  icon: z.string().optional(),
});

export const pushNotificationPayloadSchema = z.object({
  title: z.string().min(1, 'Push title is required'),
  body: z.string().min(1, 'Push body is required'),
  icon: z.string().optional(),
  badge: z.string().optional(),
  url: z.string().min(1, 'Target URL is required'),
  vibrate: z.array(z.number()).optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  actions: z.array(pushNotificationActionSchema).optional(),
});

export const pushSubscriptionKeysSchema = z.object({
  p256dh: z.string().min(10, 'Invalid p256dh key'),
  auth: z.string().min(10, 'Invalid auth key'),
});

export const pushSubscriptionDataSchema = z.object({
  endpoint: z.string().url('Endpoint must be a valid push service URL'),
  expirationTime: z.number().nullable().optional(),
  keys: pushSubscriptionKeysSchema,
});

// 3. Offline & Sync Schemas
export const offlineSyncQueueItemSchema = z.object({
  id: z.string().min(1),
  action: z.enum([
    'update_cart',
    'save_address',
    'cancel_order',
    'wishlist_toggle',
    'sync_offline_orders',
  ]),
  payload: z.record(z.string(), z.unknown()),
  createdAt: z.string().datetime(),
  status: z.enum(['pending', 'syncing', 'completed', 'failed']),
  retryCount: z.number().int().min(0),
  lastError: z.string().optional(),
});

// 4. Security & Zero-Trust Schemas
export const securityHeadersConfigSchema = z.object({
  contentSecurityPolicy: z.string().min(20, 'CSP string cannot be empty'),
  xFrameOptions: z.enum(['DENY', 'SAMEORIGIN']),
  xContentTypeOptions: z.literal('nosniff'),
  strictTransportSecurity: z.string().min(10),
  referrerPolicy: z.string().min(5),
  permissionsPolicy: z.string().min(5),
});

export const clientPriceValidationItemSchema = z.object({
  bookId: z.string().min(1),
  quantity: z.number().int().positive(),
  claimedPrice: z.number().nonnegative(),
});

export const clientPriceValidationRequestSchema = z.object({
  items: z.array(clientPriceValidationItemSchema).min(1, 'Cart items required for validation'),
  couponCode: z.string().optional(),
  claimedShipping: z.number().nonnegative(),
  claimedTotal: z.number().positive('Claimed total must be positive'),
});

// 5. Performance & Health Schemas
export const coreWebVitalsSchema = z.object({
  lcp: z.number().nonnegative('LCP must be non-negative'),
  inp: z.number().nonnegative('INP must be non-negative'),
  cls: z.number().nonnegative('CLS must be non-negative'),
  fid: z.number().optional(),
  fcp: z.number().optional(),
  ttfb: z.number().optional(),
});

export const serviceHealthItemSchema = z.object({
  serviceName: z.string().min(1),
  status: z.enum(['ok', 'degraded', 'down']),
  latencyMs: z.number().nonnegative(),
  message: z.string().optional(),
  lastCheckedAt: z.string().datetime(),
});

// 6. Pre-Launch QA & Smoke Test Schemas
export const launchAuditItemSchema = z.object({
  id: z.number().int().positive(),
  category: z.enum(['pwa', 'security', 'performance', 'cloud', 'qa_smoke', 'legal_compliance']),
  titleBengali: z.string().min(3),
  titleEnglish: z.string().min(3),
  status: z.enum(['pass', 'fail', 'warning']),
  notes: z.string(),
  verifiedAt: z.string().datetime(),
});

export const smokeTestTransactionSchema = z.object({
  transactionId: z.string().min(3),
  amount: z.number().positive(),
  paymentGateway: z.enum(['razorpay', 'upi_qr']),
  orderCreated: z.boolean(),
  signatureVerified: z.boolean(),
  webhookProcessed: z.boolean(),
  invoiceGenerated: z.boolean(),
  thermalLabelReady: z.boolean(),
  overallSuccess: z.boolean(),
  completedAt: z.string().datetime(),
  notes: z.string(),
});

export const googleMerchantFeedItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(5),
  link: z.string().url(),
  imageLink: z.string().url(),
  availability: z.enum(['in_stock', 'out_of_stock']),
  price: z.string().regex(/^\d+(\.\d{2})?\sINR$/, 'Price must be in formatted string like "450 INR"'),
  currency: z.literal('INR'),
  brand: z.string().min(1),
  condition: z.literal('new'),
  googleProductCategory: z.string().min(1),
  isbn: z.string().optional(),
});
