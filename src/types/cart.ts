/**
 * MM Book House - Module 10: Cart, Saved For Later & Wishlist Type Definitions
 */

export interface CartItem {
  id: string;
  bookId: string;
  variantId?: string;
  title: string;
  titleBn: string;
  author: string;
  authorBn?: string;
  publisher?: string;
  publisherBn?: string;
  slug?: string;
  price: number;
  mrp: number;
  quantity: number;
  maxQuantity?: number;
  coverImage?: string;
  binding?: 'paperback' | 'hardcover';
  condition?: 'new' | 'used';
  inStock?: boolean;
  stockCount?: number;
  isSelected?: boolean; // For selective checkout (Task 15)
  priceDroppedAmount?: number; // For price drop alert banner (Task 16)
  isFreebie?: boolean; // Freebie gift item (price = 0)
  addedAt?: number;
}

export interface SavedForLaterItem {
  id: string;
  bookId: string;
  variantId?: string;
  title: string;
  titleBn: string;
  author: string;
  authorBn?: string;
  price: number;
  mrp: number;
  quantity?: number;
  maxQuantity?: number;
  coverImage?: string;
  binding?: 'paperback' | 'hardcover';
  condition?: 'new' | 'used';
  inStock?: boolean;
  stockCount?: number;
  isFreebie?: boolean;
  savedAt: number;
}

export interface WishlistItem {
  id: string;
  bookId: string;
  title: string;
  titleBn: string;
  author: string;
  price: number;
  mrp: number;
  coverImage?: string;
  rating?: number;
  reviewsCount?: number;
  inStock: boolean;
  stockCount?: number;
  folderId?: string; // Custom wishlist folder / syllabus mapping (Task 30)
  addedAt: number;
  priceDropAlert?: boolean; // Price drop alert notification (Task 28)
  originalPrice?: number;
}

export interface WishlistFolder {
  id: string;
  name: string;
  nameBn: string;
  slug: string;
  description?: string;
  isDefault?: boolean;
  createdAt: number;
}

export type CouponType = 'FLAT' | 'PERCENTAGE' | 'FREE_SHIPPING';

export interface Coupon {
  code: string;
  type: CouponType;
  value: number; // e.g. 50 for flat 50, 10 for 10%
  minOrderValue: number;
  maxDiscount?: number;
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  applicableCategory?: string; // e.g. 'wbcs', 'college', 'all'
  expiresAt: string;
}

export interface AppliedCouponResult {
  coupon: Coupon;
  discountAmount: number;
  isShippingFree: boolean;
  message: string;
  messageBn: string;
}

export interface CartPricingBreakdown {
  rawItemsCount: number;
  selectedItemsCount: number;
  totalMrp: number;
  catalogSubtotal: number;
  catalogSavings: number;
  couponDiscount: number;
  appliedCoupon: AppliedCouponResult | null;
  shippingFee: number;
  isFreeDelivery: boolean;
  freeDeliveryThreshold: number; // ₹499
  amountNeededForFreeDelivery: number;
  finalPayable: number;
  isGiftOrder?: boolean;
  giftMessage?: string;
}

export interface StockValidationItem {
  bookId: string;
  variantId?: string;
  title: string;
  requestedQty: number;
  availableQty: number;
  isAvailable: boolean;
  isLowStock?: boolean;
}

export interface StockValidationReport {
  isValid: boolean;
  items: StockValidationItem[];
  outOfStockItems: StockValidationItem[];
}

/**
 * Task 41: Optimistic UI Engine for Cart Operations Types
 */
export type OptimisticActionType =
  | 'INCREMENT'
  | 'DECREMENT'
  | 'SET_QUANTITY'
  | 'REMOVE_ITEM'
  | 'ADD_ITEM';

export type OptimisticItemStatus = 'idle' | 'updating' | 'removing' | 'error';

export interface OptimisticCartAction {
  id: string;
  type: OptimisticActionType;
  itemId: string;
  item?: CartItem;
  previousQuantity?: number;
  targetQuantity?: number;
  timestamp: number;
  sequence: number;
}

export interface CartOptimisticError {
  action: OptimisticCartAction;
  message: string;
  messageBn: string;
  timestamp: number;
  rawError?: unknown;
}

export interface OptimisticCartStatus {
  isPending: boolean;
  pendingItemId: string | null;
  pendingItemIds: string[];
  lastError: CartOptimisticError | null;
}

export interface UseOptimisticCartOptions {
  /**
   * Optional custom persistence / network validation handler.
   * Return true or void to indicate success.
   * Return false or throw an error to simulate/trigger a rollback.
   */
  onPersist?: (action: OptimisticCartAction) => Promise<boolean | void>;

  /**
   * Delay in ms to debounce background persistence of rapid quantity adjustments.
   * Default: 300ms. (The UI updates instantaneously with 0ms visual lag).
   */
  debounceMs?: number;

  /**
   * Callback fired when a rollback occurs due to persistence or validation failure.
   */
  onRollback?: (error: CartOptimisticError, previousState: CartItem[]) => void;

  /**
   * Custom toast notifier callback. If not provided, triggers the built-in cartToast system.
   */
  notifyError?: (message: string, error?: unknown) => void;

  /**
   * Whether to automatically show a toast notification when a rollback occurs. Default: true.
   */
  showToastOnRollback?: boolean;
}

export interface UseOptimisticCartReturn {
  // Current Cart Data (from Zustand store)
  items: CartItem[];
  totalCount: number;
  subtotal: number;
  totalMrp: number;
  totalSavings: number;

  // Status tracking
  isPending: boolean;
  pendingItemId: string | null;
  pendingItemIds: string[];
  lastError: CartOptimisticError | null;
  isItemPending: (itemId: string) => boolean;
  isItemRemoving: (itemId: string) => boolean;
  getItemStatus: (itemId: string) => OptimisticItemStatus;
  clearError: () => void;

  // Optimistic Operations (Instant 0ms UI response)
  incrementQuantity: (itemId: string, step?: number) => Promise<boolean>;
  decrementQuantity: (itemId: string, step?: number) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<boolean>;
  removeItem: (itemId: string) => Promise<boolean>;
  addItem: (item: CartItem | (Omit<CartItem, 'quantity'> & { quantity?: number })) => Promise<boolean>;

  // Rollback & Snapshot Utilities
  rollbackToSnapshot: (snapshot: CartItem[], reason?: string) => void;
  getSnapshot: () => CartItem[];
}

/**
 * Task 42: Stored Guest Cart Payload definition
 */
export interface StoredGuestCartPayload {
  version: number;
  guestId: string;
  items: CartItem[];
  savedItems: SavedForLaterItem[];
  createdAt: number;
  updatedAt: number;
}

/**
 * Task 43: Guest-to-Account Cart Merge Breakdown
 */
export interface CartMergeResult {
  mergedItems: CartItem[];
  mergedSavedItems: SavedForLaterItem[];
  addedCount: number;
  updatedCount: number;
  conflictCount: number;
  timestamp: number;
  itemsAddedCount: number;
  itemsUpdatedCount: number;
  totalMergedCount: number;
}
