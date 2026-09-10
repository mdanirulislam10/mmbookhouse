'use client';

import { CartItem, SavedForLaterItem, CartMergeResult } from '@/types/cart';

export type { CartMergeResult };

const USER_CARTS_STORAGE_KEY_PREFIX = 'mm_user_cart_';
const USER_SAVED_ITEMS_STORAGE_KEY_PREFIX = 'mm_user_saved_';

/**
 * Helper to generate consistent key for deduplication and matching
 */
export function getCartItemKey(item: { bookId: string; variantId?: string; id?: string }): string {
  if (item.id && item.id.startsWith('cart-bundle-')) {
    return item.id;
  }
  return item.variantId ? `${item.bookId}_${item.variantId}` : item.bookId;
}

/**
 * Task 43: Enhanced Seamless Guest-to-Account Cart Merging Service
 * Merges active cart items and saved-for-later items from a guest session
 * with the authenticated user's account with conflict resolution and store broadcast.
 */
export const cartMergerService = {
  /**
   * Intelligently merges guest cart items and saved items with account items.
   * - Sums quantities for matching books up to maxQuantity (default cap 20).
   * - Appends new guest items.
   * - Losslessly merges and deduplicates saved-for-later items.
   * - Returns detailed breakdown { mergedItems, mergedSavedItems, addedCount, updatedCount, conflictCount, timestamp }.
   */
  mergeCarts(
    guestItems: CartItem[] = [],
    accountItems: CartItem[] = [],
    guestSavedItems: SavedForLaterItem[] = [],
    accountSavedItems: SavedForLaterItem[] = []
  ): CartMergeResult {
    const mergedMap = new Map<string, CartItem>();
    let addedCount = 0;
    let updatedCount = 0;
    let conflictCount = 0;

    // 1. Seed with existing account items
    for (const item of accountItems) {
      const key = getCartItemKey(item);
      mergedMap.set(key, { ...item });
    }

    // 2. Merge guest active items
    for (const guestItem of guestItems) {
      const key = getCartItemKey(guestItem);
      const existing = mergedMap.get(key);

      if (existing) {
        // Matching bookId/variantId: sum quantities
        const maxLimit = existing.maxQuantity || guestItem.maxQuantity || 20;
        const rawSum = existing.quantity + guestItem.quantity;
        const newQty = Math.min(rawSum, maxLimit);

        if (rawSum > maxLimit) {
          conflictCount += 1;
        }

        updatedCount += 1;

        mergedMap.set(key, {
          ...existing,
          quantity: newQty,
          maxQuantity: maxLimit,
          price: guestItem.price || existing.price,
          mrp: guestItem.mrp || existing.mrp,
          inStock: existing.inStock !== false && guestItem.inStock !== false,
          isSelected: true,
        });
      } else {
        // New guest item not previously in account cart: append
        const maxLimit = guestItem.maxQuantity || 20;
        const newQty = Math.min(guestItem.quantity, maxLimit);
        if (guestItem.quantity > maxLimit) {
          conflictCount += 1;
        }

        mergedMap.set(key, {
          ...guestItem,
          id: guestItem.id || `cart-merged-${guestItem.bookId}-${Date.now().toString(36)}`,
          quantity: newQty,
          maxQuantity: maxLimit,
          isSelected: true,
        });
        addedCount += 1;
      }
    }

    // 3. Losslessly merge Saved For Later items (de-duplicate by bookId + variantId)
    const savedMap = new Map<string, SavedForLaterItem>();
    for (const item of accountSavedItems) {
      const key = getCartItemKey(item);
      savedMap.set(key, { ...item });
    }

    for (const guestSaved of guestSavedItems) {
      const key = getCartItemKey(guestSaved);
      if (!savedMap.has(key)) {
        savedMap.set(key, { ...guestSaved });
      }
    }

    const mergedItems = Array.from(mergedMap.values());
    const mergedSavedItems = Array.from(savedMap.values());
    const totalMergedCount = mergedItems.reduce((sum, i) => sum + i.quantity, 0);

    return {
      mergedItems,
      mergedSavedItems,
      addedCount,
      updatedCount,
      conflictCount,
      timestamp: Date.now(),
      itemsAddedCount: addedCount,
      itemsUpdatedCount: updatedCount,
      totalMergedCount,
    };
  },

  /**
   * Load previously saved active cart for a specific authenticated user ID
   */
  loadUserSavedCart(userId: string): CartItem[] {
    if (typeof window === 'undefined' && typeof globalThis.localStorage === 'undefined') return [];
    if (!userId) return [];
    try {
      const storage = typeof window !== 'undefined' ? window.localStorage : globalThis.localStorage;
      const data = storage.getItem(`${USER_CARTS_STORAGE_KEY_PREFIX}${userId}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  /**
   * Load previously saved Saved-For-Later items for a specific user ID
   */
  loadUserSavedItems(userId: string): SavedForLaterItem[] {
    if (typeof window === 'undefined' && typeof globalThis.localStorage === 'undefined') return [];
    if (!userId) return [];
    try {
      const storage = typeof window !== 'undefined' ? window.localStorage : globalThis.localStorage;
      const data = storage.getItem(`${USER_SAVED_ITEMS_STORAGE_KEY_PREFIX}${userId}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  /**
   * Persist the merged cart and saved-for-later items for an authenticated user ID
   */
  saveUserCart(userId: string, items: CartItem[], savedItems: SavedForLaterItem[] = []): void {
    if (typeof window === 'undefined' && typeof globalThis.localStorage === 'undefined') return;
    if (!userId) return;
    try {
      const storage = typeof window !== 'undefined' ? window.localStorage : globalThis.localStorage;
      storage.setItem(`${USER_CARTS_STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(items));
      storage.setItem(`${USER_SAVED_ITEMS_STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(savedItems));
    } catch {
      // Storage error gracefully handled
    }
  },

  /**
   * Clear user's saved cart and saved items
   */
  clearUserCart(userId: string): void {
    if (typeof window === 'undefined' && typeof globalThis.localStorage === 'undefined') return;
    if (!userId) return;
    try {
      const storage = typeof window !== 'undefined' ? window.localStorage : globalThis.localStorage;
      storage.removeItem(`${USER_CARTS_STORAGE_KEY_PREFIX}${userId}`);
      storage.removeItem(`${USER_SAVED_ITEMS_STORAGE_KEY_PREFIX}${userId}`);
    } catch {
      // Storage error gracefully handled
    }
  },

  /**
   * Complete guest-to-account merge:
   * Merges carts, saves to user account storage, updates useCartStore, and notifies other tabs.
   */
  mergeAndApply(
    userId: string,
    guestItems?: CartItem[],
    guestSavedItems?: SavedForLaterItem[]
  ): CartMergeResult {
    // Dynamic import to avoid circular dependency
    let useCartStore: any;
    try {
      useCartStore = require('@/hooks/useCartStore').useCartStore;
    } catch {
      // Fallback in environments without alias
    }

    const currentGuestItems = guestItems || (useCartStore ? useCartStore.getState().items : []);
    const currentGuestSaved = guestSavedItems || (useCartStore ? useCartStore.getState().savedItems || [] : []);

    const accountItems = this.loadUserSavedCart(userId);
    const accountSaved = this.loadUserSavedItems(userId);

    const result = this.mergeCarts(
      currentGuestItems,
      accountItems,
      currentGuestSaved,
      accountSaved
    );

    // Save to user storage
    this.saveUserCart(userId, result.mergedItems, result.mergedSavedItems);

    // Update Zustand store if available
    if (useCartStore) {
      useCartStore.setState({
        items: result.mergedItems,
        savedItems: result.mergedSavedItems,
        isAnimating: true,
      });

      useCartStore.getState().triggerBounce?.();

      setTimeout(() => {
        useCartStore.setState({ isAnimating: false });
      }, 800);
    }

    // Broadcast across tabs
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel('mm-bookhouse-cart-channel');
        bc.postMessage({ type: 'CART_UPDATED', timestamp: Date.now() });
        bc.close();
      } catch {
        // Ignore broadcast errors
      }
    }

    return result;
  },

  /**
   * Executes complete end-to-end synchronization when user authenticates
   */
  async syncGuestCartOnLogin(
    userId: string,
    currentGuestItems?: CartItem[],
    currentGuestSaved?: SavedForLaterItem[]
  ): Promise<CartMergeResult> {
    return this.mergeAndApply(userId, currentGuestItems, currentGuestSaved);
  },
};
