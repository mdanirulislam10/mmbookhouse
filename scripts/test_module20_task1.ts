import {
  pwaManifestSchema,
  pwaAppShortcutSchema,
  pushNotificationPayloadSchema,
  pushSubscriptionDataSchema,
  offlineSyncQueueItemSchema,
  securityHeadersConfigSchema,
  clientPriceValidationRequestSchema,
  coreWebVitalsSchema,
  serviceHealthItemSchema,
  launchAuditItemSchema,
  smokeTestTransactionSchema,
  googleMerchantFeedItemSchema,
} from '../src/lib/validations/pwaSecurity';
import type {
  PwaAppManifestConfig,
  PushNotificationPayload,
  ClientPriceValidationRequest,
  CoreWebVitalsMetrics,
  SmokeTestTransactionResult,
  GoogleMerchantFeedItem,
} from '../src/types/pwaSecurity';

console.log('🧪 Starting Module 20 Task 1 Test Suite: Core Types & Zod Schemas...');

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failed++;
  }
}

try {
  // Test 1: PWA Web App Manifest Schema Validation
  const validManifest: PwaAppManifestConfig = {
    name: 'M.M Book House Malda | অনলাইন বইয়ের দোকান',
    short_name: 'MM Books',
    description: 'মালদা ও সমগ্র পশ্চিমবঙ্গের শিক্ষার্থীদের নির্ভরযোগ্য অনলাইন বইয়ের দোকান।',
    start_url: '/?source=pwa',
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#131921',
    lang: 'bn',
    dir: 'ltr',
    orientation: 'portrait',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
    categories: ['shopping', 'education', 'books'],
    shortcuts: [
      {
        name: '📦 ট্র্যাক অর্ডার',
        short_name: 'Track',
        description: 'অর্ডারের লাইভ ট্র্যাকিং স্ট্যাটাস',
        url: '/orders?action=track',
      },
      {
        name: '🔍 বই খুঁজুন',
        short_name: 'Search',
        description: '৫০,০০০+ বইয়ের দ্রুত অনুসন্ধান',
        url: '/search?focus=true',
      },
      {
        name: '⚡ ডিল অফ দ্য ডে',
        short_name: 'Deals',
        description: 'আজকের বিশেষ ফ্ল্যাশ ডিসকাউন্ট',
        url: '/deals?flash=true',
      },
    ],
    splashScreen: {
      backgroundColor: '#131921',
      themeColor: '#febd69',
      logoUrl: '/images/mm-logo-gold.png',
      taglineBengali: 'উত্তরবঙ্গের নির্ভরযোগ্য বইয়ের দোকান',
      taglineEnglish: "North Bengal's Trusted Bookstore",
      durationMs: 1200,
    },
  };

  const manifestValidation = pwaManifestSchema.safeParse(validManifest);
  assert(manifestValidation.success, 'PWA Manifest Zod schema validates Amazon-standard manifest');

  // Test 2: App Shortcuts Schema Validation
  const shortcutParse = pwaAppShortcutSchema.safeParse(validManifest.shortcuts[0]);
  assert(shortcutParse.success && shortcutParse.data.short_name === 'Track', 'App shortcut schema validates 📦 Track Order shortcut');

  // Test 3: Push Notification Payload Schema
  const pushPayload: PushNotificationPayload = {
    title: '📦 পার্সেল রওনা হয়েছে!',
    body: 'আপনার অর্ডার #MM-9824 ব্লু ডার্ট কুরিয়ারে হ্যান্ডওভার করা হয়েছে।',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    url: '/orders/MM-9824/tracking',
    vibrate: [200, 100, 200],
    actions: [
      { action: 'track', title: 'ট্র্যাক করুন' },
      { action: 'close', title: 'বন্ধ করুন' },
    ],
  };
  const pushValidation = pushNotificationPayloadSchema.safeParse(pushPayload);
  assert(pushValidation.success, 'Push Notification Payload validates with vibration and actions');

  // Test 4: Push Subscription Data Schema
  const subData = {
    endpoint: 'https://fcm.googleapis.com/fcm/send/sample-token-123456',
    keys: {
      p256dh: 'BNcRdreALRF88x3g2',
      auth: 'authSecretKey123',
    },
  };
  const subValidation = pushSubscriptionDataSchema.safeParse(subData);
  assert(subValidation.success, 'Push subscription data validates p256dh and auth keys');

  // Test 5: Offline Sync Queue Item
  const syncItem = {
    id: 'sync-001',
    action: 'update_cart',
    payload: { bookId: 'book-101', quantity: 2 },
    createdAt: new Date().toISOString(),
    status: 'pending',
    retryCount: 0,
  };
  const syncValidation = offlineSyncQueueItemSchema.safeParse(syncItem);
  assert(syncValidation.success, 'Offline Sync Queue item validates pending cart update');

  // Test 6: Security Headers Schema
  const secHeaders = {
    contentSecurityPolicy: "default-src 'self'; script-src 'self' https://checkout.razorpay.com",
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
    strictTransportSecurity: 'max-age=63072000; includeSubDomains; preload',
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: 'camera=(), microphone=(), geolocation=()',
  };
  const secValidation = securityHeadersConfigSchema.safeParse(secHeaders);
  assert(secValidation.success, 'Security Headers Config schema validates strict CSP and HSTS');

  // Test 7: Client Price Validation Request
  const priceReq: ClientPriceValidationRequest = {
    items: [
      { bookId: 'book-wbcs-01', quantity: 1, claimedPrice: 450 },
      { bookId: 'book-wbcs-02', quantity: 2, claimedPrice: 320 },
    ],
    couponCode: 'LAUNCH2026',
    claimedShipping: 0,
    claimedTotal: 1090,
  };
  const priceValidation = clientPriceValidationRequestSchema.safeParse(priceReq);
  assert(priceValidation.success, 'Client price validation request validates positive quantities & prices');

  // Test 8: Core Web Vitals Schema
  const vitals: CoreWebVitalsMetrics = {
    lcp: 1.1, // < 1.2s target
    inp: 38,  // < 50ms target
    cls: 0.0, // 0 target
    ttfb: 180,
  };
  const vitalsValidation = coreWebVitalsSchema.safeParse(vitals);
  assert(vitalsValidation.success, 'Core Web Vitals schema passes for target green thresholds');

  // Test 9: Service Health Item Schema
  const healthItem = {
    serviceName: 'Supabase PostgreSQL (AWS Mumbai)',
    status: 'ok',
    latencyMs: 24,
    lastCheckedAt: new Date().toISOString(),
  };
  const healthValidation = serviceHealthItemSchema.safeParse(healthItem);
  assert(healthValidation.success, 'Service health item validates low latency Mumbai DB connection');

  // Test 10: Launch Audit Item & Smoke Test Transaction
  const auditItem = {
    id: 1,
    category: 'pwa',
    titleBengali: 'PWA ম্যানিফেস্ট ও অফলাইন ক্যাশিং সক্রিয়',
    titleEnglish: 'PWA Manifest and Offline Caching Active',
    status: 'pass',
    notes: 'Service Worker and standalone display mode verified',
    verifiedAt: new Date().toISOString(),
  };
  const auditValidation = launchAuditItemSchema.safeParse(auditItem);
  assert(auditValidation.success, 'Launch audit item validates successfully');

  const smokeTest: SmokeTestTransactionResult = {
    transactionId: 'txn_smoke_1rupee_001',
    amount: 1,
    paymentGateway: 'razorpay',
    orderCreated: true,
    signatureVerified: true,
    webhookProcessed: true,
    invoiceGenerated: true,
    thermalLabelReady: true,
    overallSuccess: true,
    completedAt: new Date().toISOString(),
    notes: 'Live 1-Rupee UPI payment verified with automated refund capability',
  };
  const smokeValidation = smokeTestTransactionSchema.safeParse(smokeTest);
  assert(smokeValidation.success, '1-Rupee live smoke test schema validates complete pipeline');

  // Test 11: Google Merchant Feed Item Schema
  const merchantItem: GoogleMerchantFeedItem = {
    id: 'MM-BOOK-4901-01',
    title: 'WBCS Scanner 2026 (Bengali Edition) - Nitin Singhania',
    description: 'Comprehensive WBCS Prelims and Mains preparation guidebook.',
    link: 'https://mmbookhouse.in/book/wbcs-scanner-2026',
    imageLink: 'https://mmbookhouse.in/images/wbcs-scanner.jpg',
    availability: 'in_stock',
    price: '650 INR',
    currency: 'INR',
    brand: 'M.M Book House',
    condition: 'new',
    googleProductCategory: 'Media > Books > Non-Fiction',
    isbn: '9789354490123',
  };
  const merchantValidation = googleMerchantFeedItemSchema.safeParse(merchantItem);
  assert(merchantValidation.success, 'Google Merchant Product Feed item schema validates correctly');

} catch (err: unknown) {
  console.error('Fatal error during Task 1 tests:', err);
  failed++;
}

console.log(`\n========================================`);
console.log(`Task 1 Tests Completed: ${passed} Passed, ${failed} Failed`);
console.log(`========================================`);

if (failed > 0) {
  process.exit(1);
}
