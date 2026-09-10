'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { WishlistItem, WishlistFolder } from '@/types/cart';
import { BOOKS_CATALOG } from '@/lib/data/booksCatalog';
import { useCartStore } from './useCartStore';

export type { WishlistItem, WishlistFolder };

export const DEFAULT_WISHLIST_FOLDERS: WishlistFolder[] = [
  {
    id: 'folder-all',
    name: 'All Saved Books',
    nameBn: 'সকল পছন্দের বই',
    slug: 'all',
    description: 'All saved books across all subjects',
    isDefault: true,
    createdAt: 1700000000000,
  },
  {
    id: 'folder-wbcs',
    name: 'WBCS & Competitive',
    nameBn: 'WBCS ও সিভিল সার্ভিস',
    slug: 'wbcs',
    description: 'Books saved for WBCS and competitive examinations',
    createdAt: 1700000001000,
  },
  {
    id: 'folder-college',
    name: 'College Semester',
    nameBn: 'কলেজ ও বিশ্ববিদ্যালয়',
    slug: 'college',
    description: 'Undergraduate semester reference books',
    createdAt: 1700000002000,
  },
];

function createWishlistItemFromCatalog(
  input: (Partial<WishlistItem> & { bookId: string }) | string,
  folderId?: string
): WishlistItem {
  const bookId = typeof input === 'string' ? input : input.bookId;
  const catalogEntry = BOOKS_CATALOG.find((b) => b.bookId === bookId || b.id === bookId);

  const partialObj: Partial<WishlistItem> = typeof input === 'object' ? input : {};

  return {
    id: partialObj.id || `wishlist-${bookId}-${Date.now().toString(36)}`,
    bookId,
    title: partialObj.title || catalogEntry?.title || 'Competitive Exam Reference Book',
    titleBn: partialObj.titleBn || catalogEntry?.titleBn || 'প্রতিযোগিতামূলক পরীক্ষার বই',
    author: partialObj.author || catalogEntry?.author || 'অভিজ্ঞ লেখক প্যানেল',
    price: partialObj.price || catalogEntry?.price || 450,
    mrp: partialObj.mrp || catalogEntry?.mrp || 600,
    coverImage: partialObj.coverImage || catalogEntry?.coverImage || '/images/books/wbcs-manual.webp',
    rating: partialObj.rating || catalogEntry?.rating || 4.8,
    reviewsCount: partialObj.reviewsCount || 42,
    inStock: partialObj.inStock !== undefined ? partialObj.inStock : (catalogEntry?.inStock ?? true),
    stockCount: partialObj.stockCount !== undefined ? partialObj.stockCount : 12,
    folderId: partialObj.folderId || folderId || 'folder-all',
    addedAt: partialObj.addedAt || Date.now(),
    priceDropAlert: partialObj.priceDropAlert || false,
    originalPrice: partialObj.originalPrice || partialObj.price || catalogEntry?.price || 450,
  };
}

interface WishlistStore {
  items: WishlistItem[];
  folders: WishlistFolder[];
  isAnimating: boolean;
  selectedFolderId: string;
  setSelectedFolderId: (folderId: string) => void;
  addItem: (item: (Partial<WishlistItem> & { bookId: string }) | string, folderId?: string) => void;
  removeItem: (bookIdOrId: string) => void;
  toggleItem: (item: (Partial<WishlistItem> & { bookId: string }) | string, folderId?: string) => void;
  clearWishlist: () => void;
  isInWishlist: (bookIdOrId: string) => boolean;
  triggerBounce: () => void;
  createFolder: (name: string, nameBn?: string) => string;
  deleteFolder: (folderId: string) => void;
  moveToFolder: (bookIdOrId: string, folderId: string) => void;
  addAllToCart: (folderId?: string) => { addedCount: number };
  getShareableLink: (folderId?: string) => string;
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
      items: [
        createWishlistItemFromCatalog('book-wbcs-manual-2026', 'folder-wbcs'),
        createWishlistItemFromCatalog('book-wbcs-scanner-2026', 'folder-wbcs'),
        {
          ...createWishlistItemFromCatalog('book-college-history-sem4', 'folder-college'),
          priceDropAlert: true,
          originalPrice: 420,
          price: 360,
        },
      ],
      folders: DEFAULT_WISHLIST_FOLDERS,
      isAnimating: false,
      selectedFolderId: 'folder-all',

      setSelectedFolderId: (folderId: string) => set({ selectedFolderId: folderId }),

      addItem: (input, targetFolderId) => {
        const bookId = typeof input === 'string' ? input : input.bookId;
        const exists = get().items.some((i) => i.bookId === bookId || i.id === bookId);
        if (!exists) {
          const newItem = createWishlistItemFromCatalog(input, targetFolderId || get().selectedFolderId);
          set((state) => ({
            items: [newItem, ...state.items],
            isAnimating: true,
          }));
          setTimeout(() => set({ isAnimating: false }), 700);
          notifyTabsOfWishlistChange();
        }
      },

      removeItem: (bookIdOrId) => {
        set((state) => ({
          items: state.items.filter((i) => i.bookId !== bookIdOrId && i.id !== bookIdOrId),
        }));
        notifyTabsOfWishlistChange();
      },

      toggleItem: (input, targetFolderId) => {
        const bookId = typeof input === 'string' ? input : input.bookId;
        if (get().isInWishlist(bookId)) {
          get().removeItem(bookId);
        } else {
          get().addItem(input, targetFolderId);
        }
      },

      clearWishlist: () => {
        set({ items: [] });
        notifyTabsOfWishlistChange();
      },

      isInWishlist: (bookIdOrId) => {
        return get().items.some((i) => i.bookId === bookIdOrId || i.id === bookIdOrId);
      },

      triggerBounce: () => {
        set({ isAnimating: true });
        setTimeout(() => set({ isAnimating: false }), 700);
      },

      createFolder: (name, nameBn) => {
        const id = `folder-${Date.now().toString(36)}`;
        const slug = name.toLowerCase().replace(/\s+/g, '-');
        const newFolder: WishlistFolder = {
          id,
          name,
          nameBn: nameBn || name,
          slug,
          createdAt: Date.now(),
        };
        set((state) => ({
          folders: [...state.folders, newFolder],
        }));
        notifyTabsOfWishlistChange();
        return id;
      },

      deleteFolder: (folderId) => {
        if (folderId === 'folder-all') return;
        set((state) => ({
          folders: state.folders.filter((f) => f.id !== folderId),
          items: state.items.map((i) => (i.folderId === folderId ? { ...i, folderId: 'folder-all' } : i)),
          selectedFolderId: state.selectedFolderId === folderId ? 'folder-all' : state.selectedFolderId,
        }));
        notifyTabsOfWishlistChange();
      },

      moveToFolder: (bookIdOrId, targetFolderId) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.bookId === bookIdOrId || i.id === bookIdOrId ? { ...i, folderId: targetFolderId } : i
          ),
        }));
        notifyTabsOfWishlistChange();
      },

      addAllToCart: (folderId) => {
        const currentItems = get().items;
        const targetItems = folderId && folderId !== 'folder-all'
          ? currentItems.filter((i) => i.folderId === folderId)
          : currentItems;

        const inStockItems = targetItems.filter((i) => i.inStock !== false);
        if (inStockItems.length === 0) return { addedCount: 0 };

        const cartItemsToAdd = inStockItems.map((item) => ({
          id: `cart-wishlist-${item.bookId}-${Date.now().toString(36)}`,
          bookId: item.bookId,
          title: item.title,
          titleBn: item.titleBn,
          author: item.author,
          price: item.price,
          mrp: item.mrp,
          coverImage: item.coverImage,
          quantity: 1,
          inStock: true,
          isSelected: true,
        }));

        useCartStore.getState().addItems(cartItemsToAdd);
        return { addedCount: inStockItems.length };
      },

      getShareableLink: (folderId) => {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://mmbookhouse.in';
        const folderParam = folderId && folderId !== 'folder-all' ? `?folder=${encodeURIComponent(folderId)}` : '';
        return `${baseUrl}/account/wishlist${folderParam}`;
      },
    }),
    {
      name: WISHLIST_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      merge: (persistedState, currentState) => {
        const p = (persistedState as any) || {};
        let mergedItems: WishlistItem[] = [];

        if (Array.isArray(p.items)) {
          mergedItems = p.items.map((item: any) => {
            if (typeof item === 'string') {
              return createWishlistItemFromCatalog(item);
            }
            return {
              ...createWishlistItemFromCatalog(item.bookId || item.id),
              ...item,
            };
          });
        } else {
          mergedItems = currentState.items;
        }

        return {
          ...currentState,
          ...p,
          items: mergedItems,
          folders: Array.isArray(p.folders) && p.folders.length > 0 ? p.folders : currentState.folders,
        };
      },
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
    createFolder: state.createFolder,
    deleteFolder: state.deleteFolder,
    moveToFolder: state.moveToFolder,
    addAllToCart: state.addAllToCart,
    getShareableLink: state.getShareableLink,
    setSelectedFolderId: state.setSelectedFolderId,
  }));

export function useWishlist() {
  const items = useWishlistStore((state) => state.items);
  const folders = useWishlistStore((state) => state.folders);
  const selectedFolderId = useWishlistStore((state) => state.selectedFolderId);
  const isAnimating = useWishlistStore((state) => state.isAnimating);

  const addItem = useWishlistStore((state) => state.addItem);
  const removeItem = useWishlistStore((state) => state.removeItem);
  const toggleItem = useWishlistStore((state) => state.toggleItem);
  const clearWishlist = useWishlistStore((state) => state.clearWishlist);
  const isInWishlist = useWishlistStore((state) => state.isInWishlist);
  const triggerBounce = useWishlistStore((state) => state.triggerBounce);
  const createFolder = useWishlistStore((state) => state.createFolder);
  const deleteFolder = useWishlistStore((state) => state.deleteFolder);
  const moveToFolder = useWishlistStore((state) => state.moveToFolder);
  const addAllToCart = useWishlistStore((state) => state.addAllToCart);
  const getShareableLink = useWishlistStore((state) => state.getShareableLink);
  const setSelectedFolderId = useWishlistStore((state) => state.setSelectedFolderId);

  const activeFolderItems = selectedFolderId === 'folder-all'
    ? items
    : items.filter((i) => i.folderId === selectedFolderId);

  return {
    items,
    activeFolderItems,
    folders,
    selectedFolderId,
    count: items.length,
    activeFolderCount: activeFolderItems.length,
    isAnimating,
    addItem,
    removeItem,
    toggleItem,
    clearWishlist,
    isInWishlist,
    triggerBounce,
    createFolder,
    deleteFolder,
    moveToFolder,
    addAllToCart,
    getShareableLink,
    setSelectedFolderId,
  };
}
