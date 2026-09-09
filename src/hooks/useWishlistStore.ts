'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface WishlistStore {
  items: string[]; // List of book IDs saved in wishlist
  isAnimating: boolean;
  addItem: (bookId: string) => void;
  removeItem: (bookId: string) => void;
  toggleItem: (bookId: string) => void;
  clearWishlist: () => void;
  isInWishlist: (bookId: string) => boolean;
  triggerBounce: () => void;
}

const WISHLIST_STORAGE_KEY = 'mm-bookhouse-wishlist-storage';
const WISHLIST_CHANNEL_NAME = 'mm-bookhouse-wishlist-channel';

let wishlistBroadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    wishlistBroadcastChannel = new BroadcastChannel(WISHLIST_CHANNEL_NAME);
  } catch {
    wishlistBroadcastChannel = null;
  }
}

function notifyTabsOfWishlistChange() {
  if (wishlistBroadcastChannel) {
    try {
      wishlistBroadcastChannel.postMessage({ type: 'WISHLIST_UPDATED', timestamp: Date.now() });
    } catch {
      // Ignore in restricted environments
    }
  }
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: ['book-wbcs-manual-2026', 'book-college-history-sem4'], // 2 sample saved books
      isAnimating: false,

      addItem: (bookId: string) => {
        if (!get().items.includes(bookId)) {
          set((state) => ({
            items: [...state.items, bookId],
            isAnimating: true,
          }));
          setTimeout(() => set({ isAnimating: false }), 700);
          notifyTabsOfWishlistChange();
        }
      },

      removeItem: (bookId: string) => {
        set((state) => ({
          items: state.items.filter((id) => id !== bookId),
        }));
        notifyTabsOfWishlistChange();
      },

      toggleItem: (bookId: string) => {
        if (get().items.includes(bookId)) {
          get().removeItem(bookId);
        } else {
          get().addItem(bookId);
        }
      },

      clearWishlist: () => {
        set({ items: [] });
        notifyTabsOfWishlistChange();
      },

      isInWishlist: (bookId: string) => get().items.includes(bookId),

      triggerBounce: () => {
        set({ isAnimating: true });
        setTimeout(() => set({ isAnimating: false }), 700);
      },
    }),
    {
      name: WISHLIST_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Cross-tab sync setup
if (typeof window !== 'undefined') {
  if (wishlistBroadcastChannel) {
    wishlistBroadcastChannel.onmessage = (event) => {
      if (event.data?.type === 'WISHLIST_UPDATED') {
        useWishlistStore.persist.rehydrate();
        useWishlistStore.getState().triggerBounce();
      }
    };
  }

  window.addEventListener('storage', (event) => {
    if (event.key === WISHLIST_STORAGE_KEY) {
      useWishlistStore.persist.rehydrate();
      useWishlistStore.getState().triggerBounce();
    }
  });
}

/**
 * Module 2 (Task 48): Atomic Selectors for Selective Re-rendering
 */
export const useWishlistCount = () =>
  useWishlistStore((state) => state.items.length);

export const useWishlistAnimation = () =>
  useWishlistStore((state) => state.isAnimating);

export const useWishlistActions = () =>
  useWishlistStore((state) => ({
    addItem: state.addItem,
    removeItem: state.removeItem,
    toggleItem: state.toggleItem,
    clearWishlist: state.clearWishlist,
    triggerBounce: state.triggerBounce,
  }));

export function useWishlist() {
  const items = useWishlistStore((state) => state.items);
  const isAnimating = useWishlistStore((state) => state.isAnimating);
  const addItem = useWishlistStore((state) => state.addItem);
  const removeItem = useWishlistStore((state) => state.removeItem);
  const toggleItem = useWishlistStore((state) => state.toggleItem);
  const clearWishlist = useWishlistStore((state) => state.clearWishlist);
  const isInWishlist = useWishlistStore((state) => state.isInWishlist);
  const triggerBounce = useWishlistStore((state) => state.triggerBounce);

  return {
    items,
    count: items.length,
    isAnimating,
    addItem,
    removeItem,
    toggleItem,
    clearWishlist,
    isInWishlist,
    triggerBounce,
  };
}
