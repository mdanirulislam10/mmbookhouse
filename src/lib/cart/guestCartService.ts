'use client';

import { z } from 'zod';
import { CartItem, SavedForLaterItem } from '@/types/cart';

/**
 * 30 Days TTL Expiration in Milliseconds
 * 30 days * 24 hours * 60 minutes * 60 seconds * 1000 ms
 */
export const GUEST_CART_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const CART_STORAGE_KEY = 'mm-bookhouse-cart-storage';
export const CURRENT_SCHEMA_VERSION = 1;

/**
 * Zod Schema for individual CartItem
 */
export const cartItemSchema = z.object({
  id: z.string().min(1),
  bookId: z.string().min(1),
  variantId: z.string().optional(),
  title: z.string().min(1),
  titleBn: z.string().optional(),
  author: z.string().min(1),
  authorBn: z.string().optional(),
  price: z.number().min(0),
  mrp: z.number().min(0),
  quantity: z.number().int().min(1).max(100),
  maxQuantity: z.number().int().min(1).optional(),
  coverImage: z.string().optional(),
  binding: z.enum(['paperback', 'hardcover']).optional(),
  condition: z.enum(['new', 'used']).optional(),
  inStock: z.boolean().optional(),
  stockCount: z.number().int().min(0).optional(),
  isSelected: z.boolean().optional(),
  priceDroppedAmount: z.number().min(0).optional(),
  isFreebie: z.boolean().optional(),
  addedAt: z.number().optional(),
});

/**
 * Zod Schema for individual SavedForLaterItem
 */
export const savedForLaterItemSchema = z.object({
  id: z.string().min(1),
  bookId: z.string().min(1),
  variantId: z.string().optional(),
  title: z.string().min(1),
  titleBn: z.string().optional(),
  author: z.string().min(1),
  price: z.number().min(0),
  mrp: z.number().min(0),
  coverImage: z.string().optional(),
  binding: z.enum(['paperback', 'hardcover']).optional(),
  inStock: z.boolean().optional(),
  savedAt: z.number().optional(),
});

/**
 * Zod Schema for the stored guest cart payload
 */
export const guestCartStorageSchema = z.object({
  version: z.number().int().default(CURRENT_SCHEMA_VERSION),
  guestId: z.string().min(1),
  items: z.array(cartItemSchema).max(200).default([]),
  savedItems: z.array(savedForLaterItemSchema).max(200).default([]),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
});

export type StoredGuestCartPayload = z.infer<typeof guestCartStorageSchema>;

/**
 * In-memory fallback map when localStorage is blocked or quota is exceeded
 */
const inMemoryFallbackStore = new Map<string, string>();

/**
 * Generate cryptographically secure random alphanumeric string
 */
function generateSecureRandomString(length = 16): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(Math.ceil(length / 2));
      crypto.getRandomValues(bytes);
      return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'))
        .join('')
        .substring(0, length);
    }
  } catch {
    // Fall back to pseudo-random generator
  }

  // Pure browser / universal fallback
  let result = '';
  while (result.length < length) {
    result += Math.random().toString(36).substring(2);
  }
  return result.substring(0, length);
}

/**
 * Task 42: Resilient Guest User Structured Storage & Schema Service
 */
export class GuestCartService {
  /**
   * Generates a cryptographically safe guest ID
   * Format: guest_<base36-timestamp>_<random-token>
   * Example: guest_m7w2x9a_e8f2a1b9c3d4e5f6
   */
  generateGuestId(): string {
    const timestampStr = Date.now().toString(36);
    const randomToken = generateSecureRandomString(16);
    return `guest_${timestampStr}_${randomToken}`;
  }

  /**
   * Validates if a string is a valid guest ID
   */
  isValidGuestId(id: unknown): boolean {
    if (typeof id !== 'string' || !id.startsWith('guest_')) {
      return false;
    }

    const parts = id.split('_');
    // Expected format: ['guest', '<timestamp36>', '<randomToken>']
    if (parts.length < 3) {
      return false;
    }

    const timestampPart = parts[1];
    const tokenPart = parts.slice(2).join('_');

    // Token must have sufficient entropy (at least 6 characters)
    if (!tokenPart || tokenPart.length < 6) {
      return false;
    }

    // Timestamp must parse to a valid date
    const parsedTimestamp = parseInt(timestampPart, 36);
    if (isNaN(parsedTimestamp) || parsedTimestamp <= 0) {
      return false;
    }

    // Must be after year 2020 (1577836800000) and not in the distant future (> now + 2 days)
    const now = Date.now();
    if (parsedTimestamp < 1577836800000 || parsedTimestamp > now + 2 * 24 * 60 * 60 * 1000) {
      return false;
    }

    return true;
  }

  /**
   * Creates a fresh, empty guest cart payload
   */
  createFreshGuestCart(existingGuestId?: string): StoredGuestCartPayload {
    const now = Date.now();
    const guestId =
      existingGuestId && this.isValidGuestId(existingGuestId)
        ? existingGuestId
        : this.generateGuestId();

    return {
      version: CURRENT_SCHEMA_VERSION,
      guestId,
      items: [],
      savedItems: [],
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Determines if a guest cart is older than the 30-day TTL expiration limit
   */
  isGuestCartExpired(cart: { updatedAt?: number; createdAt?: number }): boolean {
    const now = Date.now();
    const referenceTime = cart.updatedAt || cart.createdAt;
    if (!referenceTime || typeof referenceTime !== 'number' || referenceTime <= 0) {
      return true;
    }
    return now - referenceTime > GUEST_CART_TTL_MS;
  }

  /**
   * Validates raw cart data against the schema
   * Returns valid payload or null if invalid
   */
  validateGuestCartPayload(data: unknown): StoredGuestCartPayload | null {
    if (!data || typeof data !== 'object') {
      return null;
    }

    const result = guestCartStorageSchema.safeParse(data);
    if (result.success) {
      // Validate total quantity constraints
      const totalQuantity = result.data.items.reduce((sum, item) => sum + item.quantity, 0);
      if (totalQuantity > 1000) {
        return null;
      }
      return result.data;
    }

    return null;
  }

  /**
   * Attempts to salvage items from a partially corrupted payload
   */
  salvageCorruptedPayload(data: unknown): StoredGuestCartPayload {
    const now = Date.now();
    let guestId = this.generateGuestId();
    let createdAt = now;
    let updatedAt = now;
    const validItems: StoredGuestCartPayload['items'] = [];
    const validSavedItems: StoredGuestCartPayload['savedItems'] = [];

    if (data && typeof data === 'object') {
      const obj = data as Record<string, any>;
      if (this.isValidGuestId(obj.guestId)) {
        guestId = obj.guestId;
      }
      if (typeof obj.createdAt === 'number' && obj.createdAt > 0) {
        createdAt = obj.createdAt;
      }
      if (typeof obj.updatedAt === 'number' && obj.updatedAt > 0) {
        updatedAt = obj.updatedAt;
      }

      // Salvage cart items
      if (Array.isArray(obj.items)) {
        for (const item of obj.items) {
          const parseResult = cartItemSchema.safeParse(item);
          if (parseResult.success) {
            validItems.push(parseResult.data);
          }
        }
      }

      // Salvage saved items
      if (Array.isArray(obj.savedItems)) {
        for (const s of obj.savedItems) {
          const parseResult = savedForLaterItemSchema.safeParse(s);
          if (parseResult.success) {
            validSavedItems.push(parseResult.data);
          }
        }
      }
    }

    return {
      version: CURRENT_SCHEMA_VERSION,
      guestId,
      items: validItems,
      savedItems: validSavedItems,
      createdAt,
      updatedAt: now,
    };
  }

  /**
   * Safely reads and recovers guest cart from localStorage
   * Handles:
   * 1. Missing data -> returns fresh cart
   * 2. Corrupted JSON -> salvages or returns fresh cart
   * 3. Schema invalidity -> recovers valid items or re-initializes
   * 4. 30-day TTL expiration -> prunes and re-initializes fresh cart
   */
  loadGuestCart(storageKey = CART_STORAGE_KEY): StoredGuestCartPayload {
    try {
      let rawData: string | null = null;
      if (typeof window !== 'undefined' && window.localStorage) {
        rawData = window.localStorage.getItem(storageKey);
      } else if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
        rawData = (globalThis as any).localStorage.getItem(storageKey);
      }

      if (!rawData) {
        rawData = inMemoryFallbackStore.get(storageKey) || null;
      }

      if (!rawData) {
        return this.createFreshGuestCart();
      }

      let parsed: any;
      try {
        parsed = JSON.parse(rawData);
      } catch (jsonErr) {
        console.warn('[GuestCartService] Corrupt JSON in cart storage. Recovering fresh cart.');
        const fresh = this.createFreshGuestCart();
        this.saveGuestCart(fresh, storageKey);
        return fresh;
      }

      // If wrapped by Zustand persist ({ state: { ... }, version: 0 })
      const cartData = parsed?.state ? parsed.state : parsed;

      // Check TTL Expiration
      if (this.isGuestCartExpired(cartData)) {
        console.info('[GuestCartService] Guest cart expired (older than 30 days). Pruning.');
        const fresh = this.createFreshGuestCart();
        this.saveGuestCart(fresh, storageKey);
        return fresh;
      }

      // Validate schema
      const validated = this.validateGuestCartPayload(cartData);
      if (validated) {
        return validated;
      }

      // If invalid, salvage whatever items can be recovered
      console.warn('[GuestCartService] Cart schema invalid. Salvaging valid items.');
      const salvaged = this.salvageCorruptedPayload(cartData);
      this.saveGuestCart(salvaged, storageKey);
      return salvaged;
    } catch (err) {
      console.error('[GuestCartService] Unexpected error reading cart. Returning fresh cart.', err);
      return this.createFreshGuestCart();
    }
  }

  /**
   * Safely persists guest cart payload to localStorage
   * Handles QuotaExceededError gracefully with pruning and memory fallback.
   */
  saveGuestCart(payload: StoredGuestCartPayload, storageKey = CART_STORAGE_KEY): boolean {
    const updatedPayload: StoredGuestCartPayload = {
      ...payload,
      updatedAt: Date.now(),
      createdAt: payload.createdAt || Date.now(),
    };

    const serialized = JSON.stringify(updatedPayload);

    try {
      let storage: Storage | null = null;
      if (typeof window !== 'undefined' && window.localStorage) {
        storage = window.localStorage;
      } else if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
        storage = (globalThis as any).localStorage;
      }

      if (storage) {
        storage.setItem(storageKey, serialized);
        return true;
      }
    } catch (err: any) {
      const isQuotaError =
        err?.name === 'QuotaExceededError' ||
        err?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        err?.code === 22 ||
        err?.code === 1014;

      if (isQuotaError) {
        console.warn('[GuestCartService] Storage quota exceeded. Attempting cleanup.');
        const cleaned = this.handleQuotaExceeded(storageKey, updatedPayload);
        if (cleaned) return true;
      } else {
        console.error('[GuestCartService] Error writing to storage:', err);
      }
    }

    // Fallback to in-memory store
    inMemoryFallbackStore.set(storageKey, serialized);
    return false;
  }

  /**
   * Quota recovery strategy:
   * 1. Clear obsolete cache entries in localStorage
   * 2. Prune coverImage or saved items if necessary
   */
  private handleQuotaExceeded(
    storageKey: string,
    payload: StoredGuestCartPayload
  ): boolean {
    try {
      let storage: Storage | null = null;
      if (typeof window !== 'undefined' && window.localStorage) {
        storage = window.localStorage;
      } else if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
        storage = (globalThis as any).localStorage;
      }

      if (!storage) return false;

      // 1. Try removing non-critical keys like search history or debug keys
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && (key.includes('search_history') || key.includes('debug') || key.includes('temp'))) {
          storage.removeItem(key);
        }
      }

      // 2. Slim down current cart payload (e.g. trim savedItems to 20, remove long image URLs)
      const slimmedPayload: StoredGuestCartPayload = {
        ...payload,
        savedItems: payload.savedItems.slice(0, 20),
        items: payload.items.map((item) => ({
          ...item,
          coverImage: undefined, // remove bulky image data URI if present
        })),
      };

      storage.setItem(storageKey, JSON.stringify(slimmedPayload));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check and prune expired guest carts in localStorage
   */
  pruneIfExpired(storageKey = CART_STORAGE_KEY): boolean {
    const current = this.loadGuestCart(storageKey);
    return this.isGuestCartExpired(current);
  }

  /**
   * Resilient StateStorage adapter for Zustand persist middleware
   */
  createResilientStorageAdapter(storageKey = CART_STORAGE_KEY) {
    const service = this;

    return {
      getItem: (name: string): string | null => {
        try {
          let raw: string | null = null;
          if (typeof window !== 'undefined' && window.localStorage) {
            raw = window.localStorage.getItem(name);
          } else if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
            raw = (globalThis as any).localStorage.getItem(name);
          }

          if (!raw) {
            raw = inMemoryFallbackStore.get(name) || null;
          }

          if (!raw) return null;

          // Parse and run recovery
          let parsed: any;
          try {
            parsed = JSON.parse(raw);
          } catch {
            console.warn('[GuestCartService] Corrupt JSON detected by storage adapter. Re-initializing.');
            const fresh = service.createFreshGuestCart();
            return JSON.stringify({
              state: {
                guestId: fresh.guestId,
                items: fresh.items,
                savedItems: fresh.savedItems,
                createdAt: fresh.createdAt,
                updatedAt: fresh.updatedAt,
              },
              version: CURRENT_SCHEMA_VERSION,
            });
          }

          const state = parsed?.state || parsed;

          // Check expiration (30 days TTL) only if timestamp is present; otherwise keep & backfill timestamps
          const hasTimestamp =
            (typeof state.updatedAt === 'number' && state.updatedAt > 0) ||
            (typeof state.createdAt === 'number' && state.createdAt > 0);

          if (hasTimestamp && service.isGuestCartExpired(state)) {
            console.info('[GuestCartService] Cart expired (30-day TTL). Re-initializing.');
            const fresh = service.createFreshGuestCart();
            return JSON.stringify({
              state: {
                guestId: fresh.guestId,
                items: fresh.items,
                savedItems: fresh.savedItems,
                createdAt: fresh.createdAt,
                updatedAt: fresh.updatedAt,
              },
              version: CURRENT_SCHEMA_VERSION,
            });
          }

          // Validate or salvage
          const validated = service.validateGuestCartPayload(state);
          const finalState = validated || service.salvageCorruptedPayload(state);

          return JSON.stringify({
            state: {
              guestId: finalState.guestId,
              items: finalState.items,
              savedItems: finalState.savedItems,
              createdAt: finalState.createdAt || Date.now(),
              updatedAt: finalState.updatedAt || Date.now(),
            },
            version: CURRENT_SCHEMA_VERSION,
          });
        } catch (err) {
          console.error('[GuestCartService] Adapter getItem error:', err);
          return null;
        }
      },

      setItem: (name: string, value: string): void => {
        let serialized = value;
        try {
          const parsed = JSON.parse(value);
          if (parsed && typeof parsed === 'object') {
            const now = Date.now();
            if (parsed.state && typeof parsed.state === 'object') {
              if (!parsed.state.createdAt) parsed.state.createdAt = now;
              parsed.state.updatedAt = now;
              serialized = JSON.stringify(parsed);
            } else {
              if (!parsed.createdAt) parsed.createdAt = now;
              parsed.updatedAt = now;
              serialized = JSON.stringify(parsed);
            }
          }
        } catch {
          // Keep serialized as value
        }

        try {
          let storage: Storage | null = null;
          if (typeof window !== 'undefined' && window.localStorage) {
            storage = window.localStorage;
          } else if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
            storage = (globalThis as any).localStorage;
          }

          if (storage) {
            storage.setItem(name, serialized);
            return;
          }
        } catch (err: any) {
          const isQuotaError =
            err?.name === 'QuotaExceededError' ||
            err?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
            err?.code === 22 ||
            err?.code === 1014;

          if (isQuotaError) {
            console.warn('[GuestCartService] Adapter QuotaExceededError. Falling back to memory.');
          }
        }

        inMemoryFallbackStore.set(name, serialized);
      },

      removeItem: (name: string): void => {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.removeItem(name);
          } else if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
            (globalThis as any).localStorage.removeItem(name);
          }
        } catch {
          // Ignore
        }
        inMemoryFallbackStore.delete(name);
      },
    };
  }
}

export const guestCartService = new GuestCartService();
