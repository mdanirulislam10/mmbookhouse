import { BookProduct, BookVariantOption } from './catalog-filter';

export interface BookSpecification {
  isbn10?: string;
  isbn13: string;
  publisher: string;
  publicationYear: number | string;
  edition: string;
  language: string;
  languageBn: string;
  pages: number;
  weight?: string;
  dimensions?: string;
  paperType?: string;
}

export interface LookInsideSamplePage {
  pageNumber: number;
  title: string;
  titleBn?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  type?: 'cover' | 'preface' | 'toc' | 'chapter' | 'sample';
  textSnippet?: string;
}

export interface AuthorBio {
  name: string;
  nameBn: string;
  bio: string;
  bioBn: string;
  avatarUrl?: string;
  otherBookIds?: string[];
}

export interface TableOfContentChapter {
  chapterNumber: number | string;
  title: string;
  titleBn: string;
  pageRange?: string;
  topics?: string[];
}

export interface RatingBreakdown {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

export interface UsedBookCondition {
  isAvailable: boolean;
  price: number;
  mrp: number;
  conditionNote: string;
  conditionNoteBn: string;
  sellerName?: string;
  images?: string[];
}

export interface DetailedBookProduct extends BookProduct {
  slug: string;
  authorBn?: string;
  publisherBn?: string;
  galleryImages: string[];
  specifications: BookSpecification;
  lookInside?: {
    enabled: boolean;
    totalPages: number;
    samplePages: LookInsideSamplePage[];
    pdfSampleUrl?: string;
  };
  authorBio?: AuthorBio;
  usedBookOption?: UsedBookCondition;
  description: string;
  descriptionBn: string;
  tableOfContents?: TableOfContentChapter[];
  ratingBreakdown?: RatingBreakdown;
  recommendedBadge?: string;
  inStoreMaldaStock?: number;
  frequentlyBoughtTogetherIds?: string[];
  questionsCount?: number;
  bonusOffer?: {
    title: string;
    titleBn: string;
    description: string;
  };
  // Pre-order and Restock specifications (Module 8 Tasks 37 & 38)
  isPreorder?: boolean;
  expectedReleaseDate?: string;
  expectedReleaseDateBn?: string;
  maxPreorderLimit?: number;
  restockDays?: number;
  restockExpectedDate?: string;
  restockExpectedDateBn?: string;
  reviews?: CustomerReview[];
}

export interface CustomerReview {
  id: string;
  authorName: string;
  authorLocation?: string;
  rating: number;
  date: string;
  title: string;
  content: string;
  verifiedPurchase: boolean;
  helpfulCount: number;
  topperBadge?: string;
}

export type BookImageAngle = 'front' | 'back' | 'spine' | 'toc' | 'sample' | 'other';

export interface BookAngleAsset {
  id: string;
  url: string;
  zoomUrl?: string;
  angle: BookImageAngle;
  label: string;
  labelBn: string;
  altText: string;
  altTextBn: string;
}

export type VariantFormat = 'paperback' | 'hardcover' | 'bundle';
export type VariantCondition = 'new' | 'used';

export interface ProductVariantState {
  format: VariantFormat;
  condition: VariantCondition;
  price: number;
  mrp: number;
  discountPercent: number;
  stockQuantity: number;
  inStock: boolean;
  isUsed: boolean;
}

export interface GiftOptionsState {
  hasGiftOptions: boolean;
  giftMessage?: string;
  recipientName?: string;
  hidePriceOnInvoice?: boolean;
  giftWrapType?: 'standard' | 'festive' | 'none';
}

export type StockUrgencyStatus =
  | 'in_stock'
  | 'low_stock'
  | 'ultra_urgency'
  | 'out_of_stock'
  | 'preorder'
  | 'back_in_stock_soon';

export type UrgencyLevel = 'none' | 'normal' | 'high' | 'critical';

export interface StockUrgencyState {
  stockQuantity: number;
  status: StockUrgencyStatus;
  urgencyLevel: UrgencyLevel;
  badgeText: string;
  badgeTextBn: string;
  badgeColor: string;
  isAvailable: boolean;
  isPreorder: boolean;
  expectedReleaseDate?: string;
  expectedReleaseDateBn?: string;
  isBackInStockSoon: boolean;
  restockDays?: number;
  restockDate?: string;
  restockDateBn?: string;
  isReservedByCurrentUser: boolean;
  reservationSecondsRemaining?: number;
  isLiveSyncActive: boolean;
  lastSyncTime?: Date;
}

export interface CartReservationState {
  token: string | null;
  bookId: string | null;
  variantId?: string | null;
  quantity: number;
  expiresAt: number | null; // Unix timestamp ms
  secondsRemaining: number;
  isActive: boolean;
  isExpired: boolean;
  isNearExpiry: boolean; // < 60 seconds
}

export interface StockNotificationRequest {
  bookId: string;
  bookTitle: string;
  phoneNumber: string;
  whatsappConsent: boolean;
  smsConsent?: boolean;
  notificationChannel?: 'whatsapp' | 'sms' | 'both';
  customerName?: string;
  requestedAt?: string;
}

export interface ExpressBuyNowPayload {
  bookId: string;
  title: string;
  titleBn?: string;
  author: string;
  price: number;
  mrp: number;
  quantity: number;
  coverImage?: string;
  variantFormat?: VariantFormat;
  condition?: VariantCondition;
  giftOptions?: GiftOptionsState;
}

/**
 * Module 8 (Part 5: Tasks 41 - 45) Social Proof & Genuine DB Metrics
 */
export interface PdpBookMetrics {
  bookId: string;
  slug?: string;
  liveViewers: number;
  recentSales24h: number;
  salesRegion: string;
  salesRegionEn: string;
  totalSold: number;
  lastOrderedMinutesAgo: number;
  source: 'db_orders' | 'catalog_metrics';
  updatedAt?: string;
}


