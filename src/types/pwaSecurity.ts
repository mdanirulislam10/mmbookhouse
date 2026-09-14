/**
 * Module 20: PWA Installation, Security Audit & Cloud Deployment Types
 * Covers all architectural discovery items (Items 1-50) for enterprise PWA & launch.
 */

// ==========================================
// 1. PWA & Web App Manifest Types (Items 1-10)
// ==========================================

export type PwaDisplayMode = 'fullscreen' | 'standalone' | 'minimal-ui' | 'browser';

export interface PwaAppShortcut {
  name: string;
  short_name: string;
  description: string;
  url: string;
  icons?: {
    src: string;
    sizes: string;
    type?: string;
    purpose?: 'any' | 'maskable' | 'monochrome';
  }[];
}

export interface PwaIconConfig {
  src: string;
  sizes: string;
  type: string;
  purpose?: 'any' | 'maskable' | 'monochrome';
}

export interface PwaSplashScreenConfig {
  backgroundColor: string;
  themeColor: string;
  logoUrl: string;
  taglineBengali: string;
  taglineEnglish: string;
  durationMs: number;
}

export interface PwaAppManifestConfig {
  name: string;
  short_name: string;
  description: string;
  start_url: string;
  display: PwaDisplayMode;
  background_color: string;
  theme_color: string;
  lang: string;
  dir: 'ltr' | 'rtl';
  orientation: 'portrait' | 'landscape' | 'any';
  icons: PwaIconConfig[];
  categories: string[];
  shortcuts: PwaAppShortcut[];
  splashScreen?: PwaSplashScreenConfig;
}

export type PwaInstallationStatus = 'not_supported' | 'installable' | 'installed' | 'dismissed';

export interface PushNotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url: string;
  vibrate?: number[];
  data?: Record<string, unknown>;
  actions?: PushNotificationAction[];
}

export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface PushSubscriptionData {
  endpoint: string;
  expirationTime?: number | null;
  keys: PushSubscriptionKeys;
}

// ==========================================
// 2. Offline Mode & Background Sync (Items 4, 5, 6)
// ==========================================

export type OfflineSyncQueueAction =
  | 'update_cart'
  | 'save_address'
  | 'cancel_order'
  | 'wishlist_toggle'
  | 'sync_offline_orders';

export interface OfflineSyncQueueItem {
  id: string;
  action: OfflineSyncQueueAction;
  payload: Record<string, unknown>;
  createdAt: string;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  retryCount: number;
  lastError?: string;
}

export interface OfflineCartItemPreview {
  bookId: string;
  title: string;
  author: string;
  coverImage: string;
  price: number;
  mrp: number;
  quantity: number;
}

export interface OfflineCartPreview {
  items: OfflineCartItemPreview[];
  totalMrp: number;
  totalDiscount: number;
  payableAmount: number;
  cachedAt: string;
}

// ==========================================
// 3. Security, Zero-Trust & Headers (Items 11-20)
// ==========================================

export interface CspDirectives {
  defaultSrc: string[];
  scriptSrc: string[];
  styleSrc: string[];
  imgSrc: string[];
  connectSrc: string[];
  fontSrc: string[];
  frameSrc: string[];
  objectSrc: string[];
}

export interface SecurityHeadersConfig {
  contentSecurityPolicy: string;
  xFrameOptions: 'DENY' | 'SAMEORIGIN';
  xContentTypeOptions: 'nosniff';
  strictTransportSecurity: string;
  referrerPolicy: string;
  permissionsPolicy: string;
}

export interface RateLimitRule {
  endpointPrefix: string;
  maxRequestsPerMinute: number;
  blockDurationSeconds: number;
}

export interface RateLimitCheckResult {
  allowed: boolean;
  currentCount: number;
  maxAllowed: number;
  remaining: number;
  resetInSeconds: number;
  reason?: string;
}

export interface ClientPriceValidationItem {
  bookId: string;
  quantity: number;
  claimedPrice: number;
}

export interface ClientPriceValidationRequest {
  items: ClientPriceValidationItem[];
  couponCode?: string;
  claimedShipping: number;
  claimedTotal: number;
}

export interface ClientPriceValidationResult {
  isValid: boolean;
  serverTotal: number;
  claimedTotal: number;
  discrepancies: string[];
  recalculatedBreakdown: {
    itemsTotal: number;
    discount: number;
    shipping: number;
    grandTotal: number;
  };
}

export interface SecretLeakAuditReport {
  hasLeakedSecrets: boolean;
  scannedKeysCount: number;
  safeKeys: string[];
  violations: {
    key: string;
    issue: string;
  }[];
}

export interface DpdpComplianceCheck {
  rule: string;
  passed: boolean;
  details: string;
}

export interface DpdpComplianceReport {
  isCompliant: boolean;
  checks: DpdpComplianceCheck[];
  lastAuditedAt: string;
}

// ==========================================
// 4. Performance & Core Web Vitals (Items 21-30)
// ==========================================

export interface CoreWebVitalsMetrics {
  lcp: number; // Largest Contentful Paint in seconds (< 1.2s target)
  inp: number; // Interaction to Next Paint in ms (< 50ms target)
  cls: number; // Cumulative Layout Shift (0 target)
  fid?: number; // First Input Delay (ms)
  fcp?: number; // First Contentful Paint (s)
  ttfb?: number; // Time to First Byte (ms)
}

export interface MetricAuditEvaluation {
  metric: string;
  value: number;
  target: string;
  unit: string;
  status: 'good' | 'needs_improvement' | 'poor';
}

export interface PerformanceAuditReport {
  overallScore: number;
  webVitalsPassed: boolean;
  evaluatedMetrics: MetricAuditEvaluation[];
  imageOptimizationStatus: {
    usesModernFormats: boolean; // AVIF / WebP
    hasBlurPlaceholders: boolean;
    hasResponsiveSizes: boolean;
  };
  fontOptimizationStatus: {
    selfHosted: boolean;
    foutFoitPrevented: boolean;
  };
  bundleMetrics: {
    firstLoadJsKb: number;
    isUnder80KbBudget: boolean;
    dynamicImportsUsed: boolean;
  };
}

// ==========================================
// 5. System Health & Monitoring (Items 38, 39)
// ==========================================

export type SystemHealthStatus = 'healthy' | 'degraded' | 'down';

export interface ServiceHealthItem {
  serviceName: string;
  status: 'ok' | 'degraded' | 'down';
  latencyMs: number;
  message?: string;
  lastCheckedAt: string;
}

export interface HealthEndpointResponse {
  status: SystemHealthStatus;
  uptimeSeconds: number;
  environment: string;
  timestamp: string;
  services: ServiceHealthItem[];
  memoryUsageMb: number;
  activePoolConnections: number;
}

export interface ErrorAlertPayload {
  errorId: string;
  message: string;
  stackTrace?: string;
  endpoint?: string;
  userId?: string;
  severity: 'critical' | 'error' | 'warning';
  timestamp: string;
}

// ==========================================
// 6. Pre-Launch QA & Smoke Test (Items 41-50)
// ==========================================

export type LaunchAuditCategory =
  | 'pwa'
  | 'security'
  | 'performance'
  | 'cloud'
  | 'qa_smoke'
  | 'legal_compliance';

export interface LaunchAuditItem {
  id: number;
  category: LaunchAuditCategory;
  titleBengali: string;
  titleEnglish: string;
  status: 'pass' | 'fail' | 'warning';
  notes: string;
  verifiedAt: string;
}

export interface PreLaunchQAChecklistResult {
  totalItems: number;
  passedItems: number;
  warningItems: number;
  failedItems: number;
  readyForLaunch: boolean;
  auditDate: string;
  items: LaunchAuditItem[];
}

export interface SmokeTestTransactionResult {
  transactionId: string;
  amount: number;
  paymentGateway: 'razorpay' | 'upi_qr';
  orderCreated: boolean;
  signatureVerified: boolean;
  webhookProcessed: boolean;
  invoiceGenerated: boolean;
  thermalLabelReady: boolean;
  overallSuccess: boolean;
  completedAt: string;
  notes: string;
}

export interface GoogleMerchantFeedItem {
  id: string;
  title: string;
  description: string;
  link: string;
  imageLink: string;
  availability: 'in_stock' | 'out_of_stock';
  price: string;
  currency: 'INR';
  brand: string;
  condition: 'new';
  googleProductCategory: string;
  isbn?: string;
}
