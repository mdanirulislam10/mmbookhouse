'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem } from '@/types/header';

interface CartStore {
  items: CartItem[];
  isAnimating: boolean;
  lastAddedItem: CartItem | null;
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  addItems: (items: (Omit<CartItem, 'quantity'> & { quantity?: number })[]) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  triggerBounce: () => void;
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

function isSameCartItem(existing: CartItem, incoming: { id: string; bookId?: string }): boolean {
  const isExistingBundle = existing.id.startsWith('cart-bundle-');
  const isIncomingBundle = incoming.id.startsWith('cart-bundle-');
  if (isExistingBundle || isIncomingBundle) {
    return existing.id === incoming.id;
  }
  return existing.id === incoming.id || Boolean(incoming.bookId && existing.bookId === incoming.bookId);
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
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
      isAnimating: false,
      lastAddedItem: null,

      addItem: (item) => {
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

        set({
          items: updatedItems,
          isAnimating: true,
          lastAddedItem: addedFullItem,
        });

        // Reset animation trigger after 800ms
        setTimeout(() => {
          set({ isAnimating: false });
        }, 800);

        notifyTabsOfCartChange();
      },

      addItems: (newItems) => {
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

        set({
          items: currentItems,
          isAnimating: true,
          lastAddedItem: lastItem,
        });

        setTimeout(() => {
          set({ isAnimating: false });
        }, 800);

        notifyTabsOfCartChange();
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        }));
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
        set({ items: [], lastAddedItem: null });
        notifyTabsOfCartChange();
      },

      triggerBounce: () => {
        set({ isAnimating: true });
        setTimeout(() => {
          set({ isAnimating: false });
        }, 800);
      },
    }),
    {
      name: CART_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
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

export const useCartActions = () =>
  useCartStore((state) => ({
    addItem: state.addItem,
    addItems: state.addItems,
    removeItem: state.removeItem,
    updateQuantity: state.updateQuantity,
    clearCart: state.clearCart,
    triggerBounce: state.triggerBounce,
  }));

/**
 * Convenient custom hook for components needing full cart state
 */
export function useCart() {
  const items = useCartStore((state) => state.items);
  const isAnimating = useCartStore((state) => state.isAnimating);
  const lastAddedItem = useCartStore((state) => state.lastAddedItem);
  const addItem = useCartStore((state) => state.addItem);
  const addItems = useCartStore((state) => state.addItems);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const triggerBounce = useCartStore((state) => state.triggerBounce);

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalMrp = items.reduce((sum, item) => sum + item.mrp * item.quantity, 0);
  const totalSavings = totalMrp > subtotal ? totalMrp - subtotal : 0;

  return {
    items,
    totalCount,
    subtotal,
    totalMrp,
    totalSavings,
    isAnimating,
    lastAddedItem,
    addItem,
    addItems,
    removeItem,
    updateQuantity,
    clearCart,
    triggerBounce,
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
