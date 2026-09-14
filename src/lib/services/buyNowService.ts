/**
 * MM Book House - Module 12: Isolated 1-Click "Buy Now" Service
 * 
 * Implements:
 * - Isolated Purchase Sessions (Item 12): Does NOT mutate or touch the customer's regular cart.
 * - Session Persistence & Recovery: Stores express checkout payload safely in sessionStorage.
 * - In-Checkout Quantity Modifier (Item 17): Express `Qty: 1 ▾` update.
 * - Smart Payment Method Retention (Item 15): Remembers last selected payment channel.
 * - Unique Idempotency Key Generation (Item 33): Prevents duplicate submissions.
 */

import { CheckoutItem, CheckoutMode, PaymentMethodType } from '@/types/checkout';
import { DetailedBookProduct, GiftOptionsState, VariantCondition, VariantFormat } from '@/types/pdp';
import { BookProduct } from '@/types/catalog-filter';

export const BUY_NOW_SESSION_KEY = 'mm_isolated_buynow_session';
export const PREFERRED_PAYMENT_KEY = 'mm_preferred_payment_method';

export interface BuyNowSessionPayload {
  sessionId: string;
  idempotencyKey: string;
  item: CheckoutItem;
  createdAt: number;
  expiresAt: number; // Valid for 30 minutes
}

/**
 * Generates a unique UUID v4-compatible idempotency key (Item 33)
 */
export function generateCheckoutIdempotencyKey(prefix: string = 'idemp'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

/**
 * Creates an isolated Buy Now session without affecting the regular cart (Item 11, 12)
 */
export function createBuyNowSession({
  book,
  quantity = 1,
  format,
  condition,
  customPrice,
  customMrp,
  giftOptions,
}: {
  book: (Partial<DetailedBookProduct> | Partial<BookProduct>) & {
    id?: string;
    bookId?: string;
    title: string;
    price: number;
    mrp: number;
    titleBn?: string;
    author?: string;
    coverImage?: string;
    stockCount?: number;
    isPreorder?: boolean;
  };
  quantity?: number;
  format?: VariantFormat;
  condition?: VariantCondition;
  customPrice?: number;
  customMrp?: number;
  giftOptions?: GiftOptionsState;
}): BuyNowSessionPayload {
  const bookId = book.bookId || book.id || 'book-default';
  const price = customPrice ?? book.price;
  const mrp = customMrp ?? book.mrp;
  const finalQty = Math.max(1, Math.min(quantity, 10));

  const checkoutItem: CheckoutItem = {
    id: `buynow-${bookId}-${Date.now()}`,
    bookId,
    title: book.title,
    titleBn: book.titleBn || book.title,
    author: book.author || 'M.M Book House',
    price,
    mrp,
    quantity: finalQty,
    maxQuantity: book.stockCount || 10,
    coverImage: book.coverImage,
    binding: format,
    condition: condition || 'new',
    isPreorder: book.isPreorder,
    giftOptions,
  };

  const payload: BuyNowSessionPayload = {
    sessionId: `sess_bn_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    idempotencyKey: generateCheckoutIdempotencyKey('buynow'),
    item: checkoutItem,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes validity
  };

  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(BUY_NOW_SESSION_KEY, JSON.stringify(payload));
      localStorage.setItem(BUY_NOW_SESSION_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('Storage error while persisting Buy Now session:', e);
    }
  }

  return payload;
}

/**
 * Retrieves the active Buy Now session from storage
 */
export function getBuyNowSession(): BuyNowSessionPayload | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = sessionStorage.getItem(BUY_NOW_SESSION_KEY) || localStorage.getItem(BUY_NOW_SESSION_KEY);
    if (!raw) return null;

    const parsed: BuyNowSessionPayload = JSON.parse(raw);
    if (Date.now() > parsed.expiresAt) {
      clearBuyNowSession();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Updates quantity directly within the express checkout view (Item 17)
 */
export function updateBuyNowQuantity(newQty: number): BuyNowSessionPayload | null {
  const session = getBuyNowSession();
  if (!session) return null;

  const validQty = Math.max(1, Math.min(newQty, session.item.maxQuantity || 10));
  session.item.quantity = validQty;

  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(BUY_NOW_SESSION_KEY, JSON.stringify(session));
      localStorage.setItem(BUY_NOW_SESSION_KEY, JSON.stringify(session));
    } catch {}
  }

  return session;
}

/**
 * Clears the Buy Now session once order is placed or cancelled
 */
export function clearBuyNowSession(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(BUY_NOW_SESSION_KEY);
    localStorage.removeItem(BUY_NOW_SESSION_KEY);
  } catch {}
}

/**
 * Saves customer's preferred payment method (Item 15)
 */
export function savePreferredPaymentMethod(method: PaymentMethodType): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PREFERRED_PAYMENT_KEY, method);
  } catch {}
}

/**
 * Retrieves preferred payment method, defaulting to 'upi' (Item 15)
 */
export function getPreferredPaymentMethod(): PaymentMethodType {
  if (typeof window === 'undefined') return 'upi';
  try {
    const saved = localStorage.getItem(PREFERRED_PAYMENT_KEY) as PaymentMethodType;
    if (saved && ['upi', 'cod', 'card', 'netbanking'].includes(saved)) {
      return saved;
    }
  } catch {}
  return 'upi';
}
