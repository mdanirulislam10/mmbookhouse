'use client';

import { useCallback, useMemo } from 'react';
import { create } from 'zustand';
import { useCartStore } from '@/hooks/useCartStore';
import {
  CartItem,
  OptimisticActionType,
  OptimisticCartAction,
  CartOptimisticError,
  OptimisticItemStatus,
  UseOptimisticCartOptions,
  UseOptimisticCartReturn,
} from '@/types/cart';
import { cartToast } from '@/lib/utils/cartToast';

/**
 * Shared status store so that any component consuming useOptimisticCart
 * observes the exact same pending and error state across the app.
 */
interface OptimisticStatusStore {
  pendingItemIds: string[];
  pendingItemId: string | null;
  itemStatuses: Record<string, OptimisticItemStatus>;
  lastError: CartOptimisticError | null;
  addPendingItem: (itemId: string, status?: OptimisticItemStatus) => void;
  removePendingItem: (itemId: string) => void;
  setItemStatus: (itemId: string, status: OptimisticItemStatus) => void;
  setLastError: (error: CartOptimisticError | null) => void;
  clearError: () => void;
}

export const useOptimisticStatusStore = create<OptimisticStatusStore>((set) => ({
  pendingItemIds: [],
  pendingItemId: null,
  itemStatuses: {},
  lastError: null,

  addPendingItem: (itemId, status = 'updating') =>
    set((state) => {
      const nextIds = state.pendingItemIds.includes(itemId)
        ? state.pendingItemIds
        : [...state.pendingItemIds, itemId];
      return {
        pendingItemIds: nextIds,
        pendingItemId: itemId,
        itemStatuses: {
          ...state.itemStatuses,
          [itemId]: status,
        },
      };
    }),

  removePendingItem: (itemId) =>
    set((state) => {
      const nextIds = state.pendingItemIds.filter((id) => id !== itemId);
      const nextStatuses = { ...state.itemStatuses };
      delete nextStatuses[itemId];
      return {
        pendingItemIds: nextIds,
        pendingItemId: nextIds.length > 0 ? nextIds[nextIds.length - 1] : null,
        itemStatuses: nextStatuses,
      };
    }),

  setItemStatus: (itemId, status) =>
    set((state) => ({
      itemStatuses: {
        ...state.itemStatuses,
        [itemId]: status,
      },
    })),

  setLastError: (error) => set({ lastError: error }),
  clearError: () => set({ lastError: null }),
}));

/**
 * Module-level Concurrency & Synchronization Engine
 * Prevents race conditions, out-of-order persistence, and store desync.
 */
class OptimisticConcurrencyEngine {
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private baseSnapshots: Map<string, CartItem[]> = new Map();
  private sequences: Map<string, number> = new Map();

  /**
   * Get next sequence generation number for an item
   */
  getNextSequence(itemId: string): number {
    const current = this.sequences.get(itemId) || 0;
    const next = current + 1;
    this.sequences.set(itemId, next);
    return next;
  }

  /**
   * Get current active sequence for an item
   */
  getSequence(itemId: string): number {
    return this.sequences.get(itemId) || 0;
  }

  /**
   * Capture a base snapshot before starting a burst of rapid operations
   */
  ensureBaseSnapshot(itemId: string, currentItems: CartItem[]): CartItem[] {
    if (!this.baseSnapshots.has(itemId)) {
      const cloned = JSON.parse(JSON.stringify(currentItems)) as CartItem[];
      this.baseSnapshots.set(itemId, cloned);
      return cloned;
    }
    return this.baseSnapshots.get(itemId)!;
  }

  /**
   * Get current base snapshot for an item
   */
  getBaseSnapshot(itemId: string): CartItem[] | undefined {
    return this.baseSnapshots.get(itemId);
  }

  /**
   * Clear base snapshot when burst completes or rolls back
   */
  clearBaseSnapshot(itemId: string): void {
    this.baseSnapshots.delete(itemId);
  }

  /**
   * Cancel any pending debounce timer for an item
   */
  cancelDebounce(itemId: string): void {
    const existing = this.debounceTimers.get(itemId);
    if (existing) {
      clearTimeout(existing);
      this.debounceTimers.delete(itemId);
    }
  }

  /**
   * Schedule a debounced task for an item
   */
  scheduleDebounce(itemId: string, callback: () => void, delayMs: number): void {
    this.cancelDebounce(itemId);
    const timer = setTimeout(() => {
      this.debounceTimers.delete(itemId);
      callback();
    }, delayMs);
    this.debounceTimers.set(itemId, timer);
  }

  /**
   * Clear all concurrency state (e.g. for reset/testing)
   */
  reset(): void {
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
    this.baseSnapshots.clear();
    this.sequences.clear();
  }
}

export const optimisticEngine = new OptimisticConcurrencyEngine();

/**
 * Task 41: Optimistic UI Engine for Cart Operations
 * Provides zero-latency UI response, debounced backend persistence,
 * race-condition protection, and automatic snapshot rollback with error toasts.
 */
export function useOptimisticCart(options?: UseOptimisticCartOptions): UseOptimisticCartReturn {
  const debounceMs = options?.debounceMs ?? 300;
  const onPersist = options?.onPersist;
  const onRollback = options?.onRollback;
  const notifyError = options?.notifyError;
  const showToastOnRollback = options?.showToastOnRollback ?? true;

  // Cart store state
  const items = useCartStore((state) => state.items);
  const updateStoreQuantity = useCartStore((state) => state.updateQuantity);
  const removeStoreItem = useCartStore((state) => state.removeItem);
  const addStoreItem = useCartStore((state) => state.addItem);
  const setStoreItems = useCartStore((state) => state.setItems);

  // Status store state
  const pendingItemIds = useOptimisticStatusStore((state) => state.pendingItemIds);
  const pendingItemId = useOptimisticStatusStore((state) => state.pendingItemId);
  const itemStatuses = useOptimisticStatusStore((state) => state.itemStatuses);
  const lastError = useOptimisticStatusStore((state) => state.lastError);
  const addPendingItem = useOptimisticStatusStore((state) => state.addPendingItem);
  const removePendingItem = useOptimisticStatusStore((state) => state.removePendingItem);
  const setItemStatus = useOptimisticStatusStore((state) => state.setItemStatus);
  const setLastError = useOptimisticStatusStore((state) => state.setLastError);
  const clearError = useOptimisticStatusStore((state) => state.clearError);

  const isPending = pendingItemIds.length > 0;

  // Derived totals
  const totalCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );
  const totalMrp = useMemo(
    () => items.reduce((sum, item) => sum + (item.mrp || item.price) * item.quantity, 0),
    [items]
  );
  const totalSavings = useMemo(
    () => (totalMrp > subtotal ? totalMrp - subtotal : 0),
    [totalMrp, subtotal]
  );

  const isItemPending = useCallback(
    (itemId: string) => pendingItemIds.includes(itemId),
    [pendingItemIds]
  );

  const isItemRemoving = useCallback(
    (itemId: string) => itemStatuses[itemId] === 'removing',
    [itemStatuses]
  );

  const getItemStatus = useCallback(
    (itemId: string): OptimisticItemStatus => itemStatuses[itemId] || 'idle',
    [itemStatuses]
  );

  const getSnapshot = useCallback((): CartItem[] => {
    return JSON.parse(JSON.stringify(useCartStore.getState().items));
  }, []);

  /**
   * Internal Rollback Handler: Reverts store to snapshot and triggers error toast
   */
  const handleRollback = useCallback(
    (action: OptimisticCartAction, snapshot: CartItem[], rawError?: unknown) => {
      // Revert store state to previous snapshot
      setStoreItems(snapshot);

      // Clean up concurrency base snapshot
      optimisticEngine.clearBaseSnapshot(action.itemId);

      // Construct error details
      const errorObj: CartOptimisticError = {
        action,
        timestamp: Date.now(),
        message: `Failed to update "${action.itemId}". Changes reverted.`,
        messageBn: `বইটির কার্ট পরিবর্তন ব্যর্থ হয়েছে। পূর্বের অবস্থায় ফিরিয়ে নেওয়া হলো।`,
        rawError,
      };

      setLastError(errorObj);
      setItemStatus(action.itemId, 'error');
      removePendingItem(action.itemId);

      // Trigger error toast
      if (showToastOnRollback) {
        cartToast.error(errorObj.message, {
          title: 'Cart Update Failed',
          titleBn: 'কার্ট আপডেট ব্যর্থ',
          messageBn: errorObj.messageBn,
          durationMs: 5000,
        });
      }

      if (notifyError) {
        notifyError(errorObj.message, rawError);
      }

      if (onRollback) {
        onRollback(errorObj, snapshot);
      }
    },
    [setStoreItems, setLastError, setItemStatus, removePendingItem, showToastOnRollback, notifyError, onRollback]
  );

  /**
   * Manual rollback to an arbitrary snapshot
   */
  const rollbackToSnapshot = useCallback(
    (snapshot: CartItem[], reason?: string) => {
      setStoreItems(snapshot);
      optimisticEngine.reset();
      useOptimisticStatusStore.setState({
        pendingItemIds: [],
        pendingItemId: null,
        itemStatuses: {},
      });

      if (reason) {
        const errorObj: CartOptimisticError = {
          action: {
            id: `manual-${Date.now()}`,
            type: 'SET_QUANTITY',
            itemId: 'cart',
            timestamp: Date.now(),
            sequence: 0,
          },
          timestamp: Date.now(),
          message: reason,
          messageBn: reason,
        };
        setLastError(errorObj);
        cartToast.error(reason, { title: 'Cart Rollback', titleBn: 'কার্ট পুনরুদ্ধার' });
      }
    },
    [setStoreItems, setLastError]
  );

  /**
   * Perform debounced background persistence for quantity operations
   */
  const executeQuantityPersistence = useCallback(
    async (action: OptimisticCartAction, snapshot: CartItem[]): Promise<boolean> => {
      try {
        if (onPersist) {
          const result = await onPersist(action);
          if (result === false) {
            throw new Error('Persistence validation returned false');
          }
        }

        // Verify that this action wasn't superseded during await
        if (action.sequence === optimisticEngine.getSequence(action.itemId)) {
          optimisticEngine.clearBaseSnapshot(action.itemId);
          setItemStatus(action.itemId, 'idle');
          removePendingItem(action.itemId);
        }
        return true;
      } catch (err) {
        // Only rollback if this action sequence is still the latest for this item
        if (action.sequence === optimisticEngine.getSequence(action.itemId)) {
          handleRollback(action, snapshot, err);
        }
        return false;
      }
    },
    [onPersist, setItemStatus, removePendingItem, handleRollback]
  );

  /**
   * Optimistic Quantity Increment (Instant 0ms visual lag)
   */
  const incrementQuantity = useCallback(
    async (itemId: string, step = 1): Promise<boolean> => {
      const currentItems = useCartStore.getState().items;
      const targetItem = currentItems.find((i) => i.id === itemId);

      if (!targetItem) {
        return false;
      }

      const maxQty = targetItem.maxQuantity;
      const currentQty = targetItem.quantity;
      if (maxQty && currentQty >= maxQty) {
        cartToast.info(`Maximum allowed quantity is ${maxQty}`, {
          titleBn: 'সর্বোচ্চ সীমা',
          messageBn: `এই বইটির সর্বোচ্চ ${maxQty} কপি নেওয়া সম্ভব।`,
        });
        return false;
      }

      const nextQty = maxQty ? Math.min(currentQty + step, maxQty) : currentQty + step;

      // 1. Capture base snapshot before rapid sequence begins
      const baseSnapshot = optimisticEngine.ensureBaseSnapshot(itemId, currentItems);
      const sequence = optimisticEngine.getNextSequence(itemId);

      // 2. Synchronously update Zustand store (0ms VISUAL LAG!)
      updateStoreQuantity(itemId, nextQty);

      // 3. Update pending state
      addPendingItem(itemId, 'updating');

      const action: OptimisticCartAction = {
        id: `tx-inc-${Date.now()}-${sequence}`,
        type: 'INCREMENT',
        itemId,
        previousQuantity: currentQty,
        targetQuantity: nextQty,
        timestamp: Date.now(),
        sequence,
      };

      // 4. If debounceMs is 0, execute immediately; otherwise debounce trailing edge
      return new Promise<boolean>((resolve) => {
        if (debounceMs <= 0) {
          executeQuantityPersistence(action, baseSnapshot).then(resolve);
        } else {
          optimisticEngine.scheduleDebounce(
            itemId,
            () => {
              executeQuantityPersistence(action, baseSnapshot).then(resolve);
            },
            debounceMs
          );
        }
      });
    },
    [updateStoreQuantity, addPendingItem, debounceMs, executeQuantityPersistence]
  );

  /**
   * Optimistic Quantity Decrement (Instant 0ms visual lag)
   */
  const decrementQuantity = useCallback(
    async (itemId: string, step = 1): Promise<boolean> => {
      const currentItems = useCartStore.getState().items;
      const targetItem = currentItems.find((i) => i.id === itemId);

      if (!targetItem) {
        return false;
      }

      const currentQty = targetItem.quantity;
      const nextQty = currentQty - step;

      // 1. Capture base snapshot before rapid sequence begins
      const baseSnapshot = optimisticEngine.ensureBaseSnapshot(itemId, currentItems);
      const sequence = optimisticEngine.getNextSequence(itemId);

      // 2. Synchronously update Zustand store (0ms VISUAL LAG!)
      if (nextQty <= 0) {
        removeStoreItem(itemId);
      } else {
        updateStoreQuantity(itemId, nextQty);
      }

      // 3. Update pending state
      addPendingItem(itemId, nextQty <= 0 ? 'removing' : 'updating');

      const action: OptimisticCartAction = {
        id: `tx-dec-${Date.now()}-${sequence}`,
        type: 'DECREMENT',
        itemId,
        previousQuantity: currentQty,
        targetQuantity: nextQty <= 0 ? 0 : nextQty,
        timestamp: Date.now(),
        sequence,
      };

      return new Promise<boolean>((resolve) => {
        if (debounceMs <= 0) {
          executeQuantityPersistence(action, baseSnapshot).then(resolve);
        } else {
          optimisticEngine.scheduleDebounce(
            itemId,
            () => {
              executeQuantityPersistence(action, baseSnapshot).then(resolve);
            },
            debounceMs
          );
        }
      });
    },
    [removeStoreItem, updateStoreQuantity, addPendingItem, debounceMs, executeQuantityPersistence]
  );

  /**
   * Optimistic Direct Quantity Update
   */
  const updateQuantity = useCallback(
    async (itemId: string, quantity: number): Promise<boolean> => {
      const currentItems = useCartStore.getState().items;
      const targetItem = currentItems.find((i) => i.id === itemId);

      if (!targetItem) {
        return false;
      }

      if (quantity === targetItem.quantity) {
        return true;
      }

      const maxQty = targetItem.maxQuantity;
      const validQty = maxQty && quantity > maxQty ? maxQty : quantity;

      const baseSnapshot = optimisticEngine.ensureBaseSnapshot(itemId, currentItems);
      const sequence = optimisticEngine.getNextSequence(itemId);

      if (validQty <= 0) {
        removeStoreItem(itemId);
      } else {
        updateStoreQuantity(itemId, validQty);
      }

      addPendingItem(itemId, validQty <= 0 ? 'removing' : 'updating');

      const action: OptimisticCartAction = {
        id: `tx-set-${Date.now()}-${sequence}`,
        type: 'SET_QUANTITY',
        itemId,
        previousQuantity: targetItem.quantity,
        targetQuantity: validQty <= 0 ? 0 : validQty,
        timestamp: Date.now(),
        sequence,
      };

      return new Promise<boolean>((resolve) => {
        if (debounceMs <= 0) {
          executeQuantityPersistence(action, baseSnapshot).then(resolve);
        } else {
          optimisticEngine.scheduleDebounce(
            itemId,
            () => {
              executeQuantityPersistence(action, baseSnapshot).then(resolve);
            },
            debounceMs
          );
        }
      });
    },
    [removeStoreItem, updateStoreQuantity, addPendingItem, debounceMs, executeQuantityPersistence]
  );

  /**
   * Optimistic Item Removal with Pending Transition State
   * Immediately clears any active quantity debounce for this item,
   * removes it from store with 0ms lag, tracks pending status,
   * and reverts back to snapshot on persistence failure.
   */
  const removeItem = useCallback(
    async (itemId: string): Promise<boolean> => {
      const currentItems = useCartStore.getState().items;
      const targetItem = currentItems.find((i) => i.id === itemId);

      if (!targetItem) {
        return false;
      }

      // 1. Cancel any active debounce timers for this item
      optimisticEngine.cancelDebounce(itemId);

      // 2. Snapshot current state before removal
      const snapshot = JSON.parse(JSON.stringify(currentItems)) as CartItem[];
      const sequence = optimisticEngine.getNextSequence(itemId);

      // 3. Mark transition state as 'removing'
      addPendingItem(itemId, 'removing');

      // 4. Synchronously remove from Zustand store (0ms VISUAL LAG!)
      removeStoreItem(itemId);

      const action: OptimisticCartAction = {
        id: `tx-rem-${Date.now()}-${sequence}`,
        type: 'REMOVE_ITEM',
        itemId,
        item: targetItem,
        previousQuantity: targetItem.quantity,
        targetQuantity: 0,
        timestamp: Date.now(),
        sequence,
      };

      // 5. Execute persistence immediately (not debounced)
      try {
        if (onPersist) {
          const result = await onPersist(action);
          if (result === false) {
            throw new Error('Remove item persistence rejected');
          }
        }

        if (sequence === optimisticEngine.getSequence(itemId)) {
          optimisticEngine.clearBaseSnapshot(itemId);
          removePendingItem(itemId);
        }
        return true;
      } catch (err) {
        if (sequence === optimisticEngine.getSequence(itemId)) {
          handleRollback(action, snapshot, err);
        }
        return false;
      }
    },
    [removeStoreItem, addPendingItem, removePendingItem, onPersist, handleRollback]
  );

  /**
   * Optimistic Add Item
   */
  const addItem = useCallback(
    async (
      item: CartItem | (Omit<CartItem, 'quantity'> & { quantity?: number })
    ): Promise<boolean> => {
      const currentItems = useCartStore.getState().items;
      const snapshot = JSON.parse(JSON.stringify(currentItems)) as CartItem[];
      const itemId = item.id;
      const sequence = optimisticEngine.getNextSequence(itemId);

      // 1. Synchronously add to Zustand store
      addStoreItem(item, { skipDrawer: true });

      // 2. Mark pending
      addPendingItem(itemId, 'updating');

      const action: OptimisticCartAction = {
        id: `tx-add-${Date.now()}-${sequence}`,
        type: 'ADD_ITEM',
        itemId,
        targetQuantity: item.quantity || 1,
        timestamp: Date.now(),
        sequence,
      };

      try {
        if (onPersist) {
          const result = await onPersist(action);
          if (result === false) {
            throw new Error('Add item persistence rejected');
          }
        }

        if (sequence === optimisticEngine.getSequence(itemId)) {
          optimisticEngine.clearBaseSnapshot(itemId);
          setItemStatus(itemId, 'idle');
          removePendingItem(itemId);
        }
        return true;
      } catch (err) {
        if (sequence === optimisticEngine.getSequence(itemId)) {
          handleRollback(action, snapshot, err);
        }
        return false;
      }
    },
    [addStoreItem, addPendingItem, removePendingItem, setItemStatus, onPersist, handleRollback]
  );

  return {
    items,
    totalCount,
    subtotal,
    totalMrp,
    totalSavings,
    isPending,
    pendingItemId,
    pendingItemIds,
    lastError,
    isItemPending,
    isItemRemoving,
    getItemStatus,
    clearError,
    incrementQuantity,
    decrementQuantity,
    updateQuantity,
    removeItem,
    addItem,
    rollbackToSnapshot,
    getSnapshot,
  };
}
