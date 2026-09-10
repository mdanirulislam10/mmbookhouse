'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem, SavedForLaterItem, AppliedCouponResult } from '@/types/cart';
import { cartMergerService, CartMergeResult } from '@/lib/auth/cartMerger';
import { guestCartService } from '@/lib/cart/guestCartService';
import { AVAILABLE_COUPONS } from '@/lib/data/couponData';

export type { CartItem, SavedForLaterItem };

interface CartStore {
  guestId: string;
  items: CartItem[];
  savedItems: SavedForLaterItem[];
  isAnimating: boolean;
  lastAddedItem: CartItem | null;
  lastDeletedItem: { item: CartItem; index: number } | null;
  isDrawerOpen: boolean;
  isRapidSnapMode: boolean;
  appliedCoupon: AppliedCouponResult | null;
  isGiftOrder: boolean;
  giftMessage: string;
  openDrawer: () => void;
  closeDrawer: () => void;
  setRapidSnapMode: (enabled: boolean) => void;
  addItem: (
    item: Omit<CartItem, 'quantity'> & { quantity?: number },
    options?: { skipDrawer?: boolean }
  ) => void;
  addItems: (
    items: (Omit<CartItem, 'quantity'> & { quantity?: number })[],
    options?: { skipDrawer?: boolean }
  ) => void;
  removeItem: (id: string) => void;
  undoRemoveItem: () => boolean;
  clearLastDeletedItem: () => void;
  updateQuantity: (id: string, quantity: number) => void;
  toggleItemSelect: (id: string, selected?: boolean) => void;
  selectAllItems: (selected: boolean) => void;
  applyCoupon: (code: string) => { success: boolean; message: string; messageBn: string };
  removeCoupon: () => void;
  setGiftOption: (isGift: boolean, message?: string) => void;
  clearCart: () => void;
  triggerBounce: () => void;
  ensureGuestId: () => string;
  syncWithUserAccount: (userId: string) => CartMergeResult;
  saveForLater: (id: string) => void;
  moveToCart: (id: string) => void;
  removeSavedItem: (id: string) => void;
  clearSavedItems: () => void;
  setItems: (items: CartItem[]) => void;
}

const CART_STORAGE_KEY = 'mm-bookhouse-cart-storage';
const CART_CHANNEL_NAME = 'mm-bookhouse-cart-channel';

let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(CART_CHANNEL_NAME);
  } catch {
    broadcastChannel = null;
  }
}

function notifyTabsOfCartChange() {
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'CART_UPDATED', timestamp: Date.now() });
    } catch {
      // Ignore broadcast errors in restricted environments
    }
  }
}

function isSameCartItem(
  existing: CartItem | SavedForLaterItem,
  incoming: { id: string; bookId?: string; variantId?: string }
): boolean {
  const isExistingBundle = existing.id.startsWith('cart-bundle-');
  const isIncomingBundle = incoming.id.startsWith('cart-bundle-');
  if (isExistingBundle || isIncomingBundle) {
    return existing.id === incoming.id;
  }
  if (existing.id === incoming.id) {
    return true;
  }
  if (incoming.bookId && existing.bookId === incoming.bookId) {
    if (incoming.variantId || existing.variantId) {
      return incoming.variantId === existing.variantId;
    }
    return true;
  }
  return false;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get): CartStore => ({
      guestId: 'guest_init',
      items: [
        // Preload 1 sample item so user immediately sees real content on first load
        {
          id: 'cart-item-1',
          bookId: 'book-wbcs-manual-2026',
          title: 'WBCS Preliminary & Main Exam Manual (2026 Edition)',
          titleBn: 'ডাব্লুবিসিএস প্রিলিমিনারি ও মেইনস ম্যানুয়াল (২০২৬)',
          author: 'ড. অশোক কুমার ঘোষ',
          price: 650,
          mrp: 850,
          quantity: 1,
          coverImage: '/images/books/wbcs-manual.webp',
        },
      ],
      savedItems: [],
      isAnimating: false,
      lastAddedItem: null,
      lastDeletedItem: null,
      isDrawerOpen: false,
      isRapidSnapMode: false,
      appliedCoupon: null,
      isGiftOrder: false,
      giftMessage: '',

      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
      setRapidSnapMode: (enabled) => set({ isRapidSnapMode: enabled }),

      ensureGuestId: () => {
        const current = get().guestId;
        if (!current || current === 'guest_init' || !guestCartService.isValidGuestId(current)) {
          const newGuestId = guestCartService.generateGuestId();
          set({ guestId: newGuestId });
          return newGuestId;
        }
        return current;
      },

      addItem: (item, options) => {
        const currentItems = get().items;
        const existingIndex = currentItems.findIndex((i) => isSameCartItem(i, item));

        let updatedItems: CartItem[];
        const addedQty = item.quantity || 1;

        if (existingIndex > -1) {
          const existingItem = currentItems[existingIndex];
          const maxAllowed = existingItem.maxQuantity || item.maxQuantity;
          const newQuantity = maxAllowed
            ? Math.min(existingItem.quantity + addedQty, maxAllowed)
            : existingItem.quantity + addedQty;

          updatedItems = currentItems.map((i, index) =>
            index === existingIndex
              ? { ...i, quantity: newQuantity, maxQuantity: maxAllowed }
              : i
          );
        } else {
          const maxAllowed = item.maxQuantity;
          const initialQty = maxAllowed ? Math.min(addedQty, maxAllowed) : addedQty;
          updatedItems = [
            ...currentItems,
            {
              ...item,
              quantity: initialQty,
              maxQuantity: maxAllowed,
            },
          ];
        }

        const addedFullItem: CartItem = {
          ...item,
          quantity: addedQty,
        };

        const shouldOpenDrawer = !get().isRapidSnapMode && !options?.skipDrawer;

        set({
          items: updatedItems,
          isAnimating: true,
          lastAddedItem: addedFullItem,
          ...(shouldOpenDrawer ? { isDrawerOpen: true } : {}),
        });

        // Reset animation trigger after 800ms
        setTimeout(() => {
          set({ isAnimating: false });
        }, 800);

        notifyTabsOfCartChange();
      },

      addItems: (newItems, options) => {
        let currentItems = [...get().items];
        let lastItem: CartItem | null = null;

        for (const item of newItems) {
          const existingIndex = currentItems.findIndex((i) => isSameCartItem(i, item));
          const addedQty = item.quantity || 1;

          if (existingIndex > -1) {
            const existingItem = currentItems[existingIndex];
            const maxAllowed = existingItem.maxQuantity || item.maxQuantity;
            const newQuantity = maxAllowed
              ? Math.min(existingItem.quantity + addedQty, maxAllowed)
              : existingItem.quantity + addedQty;

            currentItems = currentItems.map((i, index) =>
              index === existingIndex
                ? { ...i, quantity: newQuantity, maxQuantity: maxAllowed }
                : i
            );
          } else {
            const maxAllowed = item.maxQuantity;
            const initialQty = maxAllowed ? Math.min(addedQty, maxAllowed) : addedQty;
            currentItems.push({
              ...item,
              quantity: initialQty,
              maxQuantity: maxAllowed,
            });
          }

          lastItem = {
            ...item,
            quantity: addedQty,
          };
        }

        const shouldOpenDrawer = !get().isRapidSnapMode && !options?.skipDrawer;

        set({
          items: currentItems,
          isAnimating: true,
          lastAddedItem: lastItem,
          ...(shouldOpenDrawer ? { isDrawerOpen: true } : {}),
        });

        setTimeout(() => {
          set({ isAnimating: false });
        }, 800);

        notifyTabsOfCartChange();
      },

      removeItem: (id) => {
        const currentItems = get().items;
        const index = currentItems.findIndex((i) => i.id === id);
        const itemToDelete = currentItems[index];
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
          lastDeletedItem: itemToDelete ? { item: itemToDelete, index } : null,
        }));
        notifyTabsOfCartChange();
      },

      undoRemoveItem: () => {
        const deleted = get().lastDeletedItem;
        if (!deleted) return false;
        const currentItems = [...get().items];
        const insertIndex = Math.min(deleted.index, currentItems.length);
        currentItems.splice(insertIndex, 0, deleted.item);
        set({
          items: currentItems,
          lastDeletedItem: null,
        });
        notifyTabsOfCartChange();
        return true;
      },

      clearLastDeletedItem: () => {
        set({ lastDeletedItem: null });
      },

      toggleItemSelect: (id, selected) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id
              ? { ...i, isSelected: selected !== undefined ? selected : !(i.isSelected ?? true) }
              : i
          ),
        }));
        notifyTabsOfCartChange();
      },

      selectAllItems: (selected) => {
        set((state) => ({
          items: state.items.map((i) => ({ ...i, isSelected: selected })),
        }));
        notifyTabsOfCartChange();
      },

      applyCoupon: (code: string) => {
        const sanitized = code.trim().toUpperCase();
        const found = AVAILABLE_COUPONS.find((c) => c.code === sanitized);
        if (!found) {
          return {
            success: false,
            message: `Invalid promo code "${code}". Please enter a valid coupon.`,
            messageBn: `অবৈধ প্রমো কোড "${code}"। সঠিক কোড লিখুন।`,
          };
        }

        const activeSubtotal = get().items
          .filter((i) => i.isSelected !== false && i.inStock !== false)
          .reduce((sum, item) => sum + item.price * item.quantity, 0);

        if (activeSubtotal < found.minOrderValue) {
          const needed = found.minOrderValue - activeSubtotal;
          return {
            success: false,
            message: `Add books worth ₹${needed} more to apply this coupon.`,
            messageBn: `এই কুপনটি পেতে আর মাত্র ₹${needed}-এর বই কার্টে যোগ করুন।`,
          };
        }

        let discount = 0;
        if (found.type === 'FLAT') {
          discount = found.value;
        } else if (found.type === 'PERCENTAGE') {
          const rawDiscount = Math.round((activeSubtotal * found.value) / 100);
          discount = found.maxDiscount ? Math.min(rawDiscount, found.maxDiscount) : rawDiscount;
        } else if (found.type === 'FREE_SHIPPING') {
          discount = 0;
        }

        const appliedResult: AppliedCouponResult = {
          coupon: found,
          discountAmount: discount,
          isShippingFree: found.type === 'FREE_SHIPPING',
          message: `Coupon "${found.code}" applied successfully!`,
          messageBn: `প্রমো কোড "${found.code}" সফলভাবে প্রয়োগ করা হয়েছে!`,
        };

        set({ appliedCoupon: appliedResult });
        notifyTabsOfCartChange();

        return {
          success: true,
          message: appliedResult.message,
          messageBn: appliedResult.messageBn,
        };
      },

      removeCoupon: () => {
        set({ appliedCoupon: null });
        notifyTabsOfCartChange();
      },

      setGiftOption: (isGift, message) => {
        set({
          isGiftOrder: isGift,
          ...(message !== undefined ? { giftMessage: message } : {}),
        });
        notifyTabsOfCartChange();
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        const currentItem = get().items.find((i) => i.id === id);
        if (currentItem?.maxQuantity && quantity > currentItem.maxQuantity) {
          return; // Strictly block quantity exceeding maxQuantity (e.g. max 1 for flash deals)
        }
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
        }));
        notifyTabsOfCartChange();
      },

      clearCart: () => {
        set({
          items: [],
          lastAddedItem: null,
          appliedCoupon: null,
          isGiftOrder: false,
          giftMessage: '',
        });
        notifyTabsOfCartChange();
      },

      triggerBounce: () => {
        set({ isAnimating: true });
        setTimeout(() => {
          set({ isAnimating: false });
        }, 800);
      },

      syncWithUserAccount: (userId: string) => {
        const currentItems = get().items;
        const existingAccountItems = cartMergerService.loadUserSavedCart(userId);
        const result = cartMergerService.mergeCarts(currentItems, existingAccountItems);
        cartMergerService.saveUserCart(userId, result.mergedItems);
        set({ items: result.mergedItems, isAnimating: true });
        setTimeout(() => {
          set({ isAnimating: false });
        }, 800);
        notifyTabsOfCartChange();
        return result;
      },

      saveForLater: (id: string) => {
        const currentItems = get().items;
        const itemToSave = currentItems.find((i) => i.id === id);
        if (!itemToSave) return;

        const currentSaved = get().savedItems || [];
        const savedItem: SavedForLaterItem = {
          id: itemToSave.id,
          bookId: itemToSave.bookId,
          variantId: itemToSave.variantId,
          title: itemToSave.title,
          titleBn: itemToSave.titleBn,
          author: itemToSave.author,
          authorBn: itemToSave.authorBn,
          price: itemToSave.price,
          mrp: itemToSave.mrp,
          quantity: itemToSave.quantity,
          maxQuantity: itemToSave.maxQuantity,
          coverImage: itemToSave.coverImage,
          binding: itemToSave.binding,
          condition: itemToSave.condition,
          inStock: itemToSave.inStock ?? true,
          stockCount: itemToSave.stockCount,
          isFreebie: itemToSave.isFreebie,
          savedAt: Date.now(),
        };

        const filteredSaved = currentSaved.filter(
          (s) => !isSameCartItem(s, itemToSave)
        );

        set({
          items: currentItems.filter((i) => i.id !== id),
          savedItems: [savedItem, ...filteredSaved],
        });

        notifyTabsOfCartChange();
      },

      moveToCart: (id: string) => {
        const currentSaved = get().savedItems || [];
        const itemToMove = currentSaved.find((s) => s.id === id);
        if (!itemToMove) return;

        const currentItems = get().items;
        const existingIndex = currentItems.findIndex((i) => isSameCartItem(i, itemToMove));
        const addedQty = itemToMove.quantity || 1;

        let updatedItems: CartItem[];
        let fullAddedItem: CartItem;

        if (existingIndex > -1) {
          const existingItem = currentItems[existingIndex];
          const maxAllowed = existingItem.maxQuantity || itemToMove.maxQuantity;
          const newQuantity = maxAllowed
            ? Math.min(existingItem.quantity + addedQty, maxAllowed)
            : existingItem.quantity + addedQty;

          updatedItems = currentItems.map((i, index) =>
            index === existingIndex
              ? { ...i, quantity: newQuantity, maxQuantity: maxAllowed }
              : i
          );
          fullAddedItem = {
            ...existingItem,
            quantity: addedQty,
          };
        } else {
          const maxAllowed = itemToMove.maxQuantity;
          const initialQty = maxAllowed ? Math.min(addedQty, maxAllowed) : addedQty;
          const newCartItem: CartItem = {
            id: itemToMove.id || `cart-item-${Date.now().toString(36)}`,
            bookId: itemToMove.bookId,
            variantId: itemToMove.variantId,
            title: itemToMove.title,
            titleBn: itemToMove.titleBn,
            author: itemToMove.author,
            authorBn: itemToMove.authorBn,
            price: itemToMove.price,
            mrp: itemToMove.mrp,
            quantity: initialQty,
            maxQuantity: maxAllowed,
            coverImage: itemToMove.coverImage,
            binding: itemToMove.binding,
            condition: itemToMove.condition,
            inStock: itemToMove.inStock ?? true,
            stockCount: itemToMove.stockCount,
            isFreebie: itemToMove.isFreebie,
            isSelected: true,
            addedAt: Date.now(),
          };
          updatedItems = [...currentItems, newCartItem];
          fullAddedItem = newCartItem;
        }

        set({
          items: updatedItems,
          savedItems: currentSaved.filter((s) => s.id !== id),
          isAnimating: true,
          lastAddedItem: fullAddedItem,
        });

        setTimeout(() => {
          set({ isAnimating: false });
        }, 800);

        notifyTabsOfCartChange();
      },

      removeSavedItem: (id: string) => {
        set((state) => ({
          savedItems: (state.savedItems || []).filter((i) => i.id !== id),
        }));
        notifyTabsOfCartChange();
      },

      clearSavedItems: () => {
        set({ savedItems: [] });
        notifyTabsOfCartChange();
      },

      setItems: (items: CartItem[]) => {
        set({ items });
        notifyTabsOfCartChange();
      },
    }),
    {
      name: CART_STORAGE_KEY,
      storage: createJSONStorage(() => guestCartService.createResilientStorageAdapter(CART_STORAGE_KEY)),
      partialize: (state) => ({
        guestId: state.guestId,
        items: state.items,
        savedItems: state.savedItems,
        appliedCoupon: state.appliedCoupon,
        isGiftOrder: state.isGiftOrder,
        giftMessage: state.giftMessage,
      }),
      merge: (persistedState, currentState) => {
        const p = (persistedState as any) || {};
        const validGuestId = guestCartService.isValidGuestId(p.guestId)
          ? p.guestId
          : currentState.guestId !== 'guest_init'
          ? currentState.guestId
          : guestCartService.generateGuestId();

        return {
          ...currentState,
          ...p,
          guestId: validGuestId,
          items: Array.isArray(p.items) ? p.items : currentState.items,
          savedItems: Array.isArray(p.savedItems) ? p.savedItems : [],
          appliedCoupon: p.appliedCoupon || null,
          isGiftOrder: Boolean(p.isGiftOrder),
          giftMessage: p.giftMessage || '',
        };
      },
    }
  )
);

// Module 2 (Task 32): Setup Cross-Tab Broadcast Channel & Storage Listener
if (typeof window !== 'undefined') {
  if (broadcastChannel) {
    broadcastChannel.onmessage = (event) => {
      if (event.data?.type === 'CART_UPDATED') {
        useCartStore.persist.rehydrate();
        // Trigger subtle bounce to visually indicate multi-tab sync
        useCartStore.getState().triggerBounce();
      }
    };
  }

  window.addEventListener('storage', (event) => {
    if (event.key === CART_STORAGE_KEY) {
      useCartStore.persist.rehydrate();
      useCartStore.getState().triggerBounce();
    }
  });
}

/**
 * Module 2 (Task 48): Atomic Selectors for Selective Re-rendering & Memory Optimization
 * These selectors allow components (like CartButton) to only re-render when their specific
 * slice of state changes, preventing wasteful re-renders of the entire header tree.
 */
export const useCartCount = () =>
  useCartStore((state) => state.items.reduce((sum, item) => sum + item.quantity, 0));

export const useCartSubtotal = () =>
  useCartStore((state) => state.items.reduce((sum, item) => sum + item.price * item.quantity, 0));

export const useCartAnimation = () =>
  useCartStore((state) => state.isAnimating);

/**
 * Module 10 (Task 21): Save for Later Selectors
 */
export const useSavedForLaterItems = () =>
  useCartStore((state) => state.savedItems || []);

export const useSavedForLaterCount = () =>
  useCartStore((state) => (state.savedItems ? state.savedItems.length : 0));

/**
 * Module 10 (Task 1): Cart Drawer State Hook
 * Convenient hook to control and read side cart drawer state
 */
export const useCartDrawer = () => {
  const isDrawerOpen = useCartStore((state) => state.isDrawerOpen);
  const openDrawer = useCartStore((state) => state.openDrawer);
  const closeDrawer = useCartStore((state) => state.closeDrawer);
  const isRapidSnapMode = useCartStore((state) => state.isRapidSnapMode);
  const setRapidSnapMode = useCartStore((state) => state.setRapidSnapMode);

  return {
    isOpen: isDrawerOpen,
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    isRapidSnapMode,
    setRapidSnapMode,
  };
};

export const useCartActions = () =>
  useCartStore((state) => ({
    addItem: state.addItem,
    addItems: state.addItems,
    removeItem: state.removeItem,
    undoRemoveItem: state.undoRemoveItem,
    clearLastDeletedItem: state.clearLastDeletedItem,
    updateQuantity: state.updateQuantity,
    toggleItemSelect: state.toggleItemSelect,
    selectAllItems: state.selectAllItems,
    applyCoupon: state.applyCoupon,
    removeCoupon: state.removeCoupon,
    setGiftOption: state.setGiftOption,
    clearCart: state.clearCart,
    triggerBounce: state.triggerBounce,
    openDrawer: state.openDrawer,
    closeDrawer: state.closeDrawer,
    setRapidSnapMode: state.setRapidSnapMode,
    saveForLater: state.saveForLater,
    moveToCart: state.moveToCart,
    removeSavedItem: state.removeSavedItem,
    clearSavedItems: state.clearSavedItems,
    setItems: state.setItems,
  }));

/**
 * Pure calculation function for Cart Totals, Savings, Selective Checkout, and Coupon Discounts
 * Fully testable and decoupled from React hooks
 */
export function calculateCartTotals(
  items: CartItem[],
  savedItems: SavedForLaterItem[] = [],
  appliedCoupon: AppliedCouponResult | null = null
) {
  // Overall totals
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const savedCount = savedItems.length;
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalMrp = items.reduce((sum, item) => sum + item.mrp * item.quantity, 0);
  const totalSavings = totalMrp > subtotal ? totalMrp - subtotal : 0;

  // Selective Checkout totals (Task 15 & Task 17: Exclude out-of-stock items)
  const purchasableItems = items.filter((item) => item.inStock !== false);
  const selectedItems = items.filter((item) => item.isSelected !== false && item.inStock !== false);
  const selectedCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const selectedSubtotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const selectedMrp = selectedItems.reduce((sum, item) => sum + item.mrp * item.quantity, 0);
  const selectedSavings = selectedMrp > selectedSubtotal ? selectedMrp - selectedSubtotal : 0;
  const isAllSelected = purchasableItems.length > 0 && selectedItems.length === purchasableItems.length;

  // Coupon & Delivery calculations (Tasks 31, 32, 33, 40)
  // Dynamic recalculation of coupon discount based on live selectedSubtotal and thresholds
  let dynamicCouponDiscount = 0;
  let isCouponValid = false;

  if (appliedCoupon) {
    if (selectedSubtotal >= appliedCoupon.coupon.minOrderValue) {
      isCouponValid = true;
      if (appliedCoupon.coupon.type === 'FLAT') {
        dynamicCouponDiscount = appliedCoupon.coupon.value;
      } else if (appliedCoupon.coupon.type === 'PERCENTAGE') {
        const rawDiscount = Math.round((selectedSubtotal * appliedCoupon.coupon.value) / 100);
        dynamicCouponDiscount = appliedCoupon.coupon.maxDiscount
          ? Math.min(rawDiscount, appliedCoupon.coupon.maxDiscount)
          : rawDiscount;
      } else if (appliedCoupon.coupon.type === 'FREE_SHIPPING') {
        dynamicCouponDiscount = 0;
      }
    } else {
      isCouponValid = false;
      dynamicCouponDiscount = 0;
    }
  }

  const couponDiscount = dynamicCouponDiscount;
  const FREE_DELIVERY_THRESHOLD = 499;
  const isFreeDelivery =
    selectedSubtotal >= FREE_DELIVERY_THRESHOLD ||
    (isCouponValid && appliedCoupon?.coupon.type === 'FREE_SHIPPING');
  const shippingFee = selectedCount === 0 || isFreeDelivery ? 0 : 40;
  const finalPayable = Math.max(0, selectedSubtotal - couponDiscount + shippingFee);
  const amountNeededForFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - selectedSubtotal);

  return {
    totalCount,
    savedCount,
    subtotal,
    totalMrp,
    totalSavings,
    purchasableItems,
    selectedItems,
    selectedCount,
    selectedSubtotal,
    selectedMrp,
    selectedSavings,
    isAllSelected,
    couponDiscount,
    isFreeDelivery,
    shippingFee,
    finalPayable,
    freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
    amountNeededForFreeDelivery,
  };
}

/**
 * Convenient custom hook for components needing full cart state
 */
export function useCart() {
  const items = useCartStore((state) => state.items);
  const savedItems = useCartStore((state) => state.savedItems || []);
  const isAnimating = useCartStore((state) => state.isAnimating);
  const lastAddedItem = useCartStore((state) => state.lastAddedItem);
  const lastDeletedItem = useCartStore((state) => state.lastDeletedItem);
  const isDrawerOpen = useCartStore((state) => state.isDrawerOpen);
  const isRapidSnapMode = useCartStore((state) => state.isRapidSnapMode);
  const appliedCoupon = useCartStore((state) => state.appliedCoupon);
  const isGiftOrder = useCartStore((state) => state.isGiftOrder);
  const giftMessage = useCartStore((state) => state.giftMessage);

  const openDrawer = useCartStore((state) => state.openDrawer);
  const closeDrawer = useCartStore((state) => state.closeDrawer);
  const setRapidSnapMode = useCartStore((state) => state.setRapidSnapMode);
  const addItem = useCartStore((state) => state.addItem);
  const addItems = useCartStore((state) => state.addItems);
  const removeItem = useCartStore((state) => state.removeItem);
  const undoRemoveItem = useCartStore((state) => state.undoRemoveItem);
  const clearLastDeletedItem = useCartStore((state) => state.clearLastDeletedItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const toggleItemSelect = useCartStore((state) => state.toggleItemSelect);
  const selectAllItems = useCartStore((state) => state.selectAllItems);
  const applyCoupon = useCartStore((state) => state.applyCoupon);
  const removeCoupon = useCartStore((state) => state.removeCoupon);
  const setGiftOption = useCartStore((state) => state.setGiftOption);
  const clearCart = useCartStore((state) => state.clearCart);
  const triggerBounce = useCartStore((state) => state.triggerBounce);
  const saveForLater = useCartStore((state) => state.saveForLater);
  const moveToCart = useCartStore((state) => state.moveToCart);
  const removeSavedItem = useCartStore((state) => state.removeSavedItem);
  const clearSavedItems = useCartStore((state) => state.clearSavedItems);
  const setItems = useCartStore((state) => state.setItems);

  const totals = calculateCartTotals(items, savedItems, appliedCoupon);

  const guestId = useCartStore((state) => state.guestId);
  const ensureGuestId = useCartStore((state) => state.ensureGuestId);
  const syncWithUserAccount = useCartStore((state) => state.syncWithUserAccount);

  return {
    guestId,
    ensureGuestId,
    syncWithUserAccount,
    items,
    savedItems,
    ...totals,
    // Coupon & Shipping
    appliedCoupon,
    // Gift Order
    isGiftOrder,
    giftMessage,
    // Undo
    lastDeletedItem,
    isAnimating,
    lastAddedItem,
    isDrawerOpen,
    isRapidSnapMode,
    // Actions
    openDrawer,
    closeDrawer,
    setRapidSnapMode,
    addItem,
    addItems,
    removeItem,
    undoRemoveItem,
    clearLastDeletedItem,
    updateQuantity,
    toggleItemSelect,
    selectAllItems,
    applyCoupon,
    removeCoupon,
    setGiftOption,
    clearCart,
    triggerBounce,
    saveForLater,
    moveToCart,
    removeSavedItem,
    clearSavedItems,
    setItems,
  };
}

// Sample books for quick testing in test console
export const SAMPLE_BOOKS: (Omit<CartItem, 'quantity'> & { quantity?: number })[] = [
  {
    id: 'sample-book-1',
    bookId: 'book-wbcs-manual-2026',
    title: 'WBCS Preliminary & Main Exam Manual (2026)',
    titleBn: 'ডাব্লুবিসিএস প্রিলিমিনারি ও মেইনস ম্যানুয়াল (২০২৬)',
    author: 'ড. অশোক কুমার ঘোষ',
    price: 650,
    mrp: 850,
    quantity: 1,
  },
  {
    id: 'sample-book-2',
    bookId: 'book-college-history-sem4',
    title: 'Modern Indian History (UGB Sem-IV)',
    titleBn: 'আধুনিক ভারতের ইতিহাস (UGB ৪র্থ সেমিস্টার)',
    author: 'প্রফেসর প্রণব চ্যাটার্জী',
    price: 320,
    mrp: 400,
    quantity: 1,
  },
  {
    id: 'sample-book-3',
    bookId: 'book-primary-tet-practice',
    title: 'WB Primary TET 5000+ MCQs & Practice Sets',
    titleBn: 'প্রাথমিক টেট ৫০০০+ প্র্যাকটিস সেট ও গাইড',
    author: 'এম.এম একাডেমি টিম',
    price: 280,
    mrp: 350,
    quantity: 1,
  },
];
