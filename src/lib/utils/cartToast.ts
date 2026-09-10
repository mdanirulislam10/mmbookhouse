/**
 * MM Book House - Cart Toast Notification Engine
 * Dispatches and manages toast notifications for optimistic cart updates, rollbacks, and alerts.
 */

import { useNotificationsStore } from '@/hooks/useNotifications';

export type ToastType = 'error' | 'success' | 'warning' | 'info';

export interface CartToastData {
  id: string;
  type: ToastType;
  title: string;
  titleBn?: string;
  message: string;
  messageBn?: string;
  durationMs?: number;
  timestamp: number;
}

export type ToastListener = (toast: CartToastData) => void;

class CartToastManager {
  private listeners: Set<ToastListener> = new Set();
  private recentToasts: CartToastData[] = [];
  private readonly maxHistory = 20;

  /**
   * Subscribe to new toast notifications
   * Returns an unsubscribe cleanup function.
   */
  subscribe(listener: ToastListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Dispatch a toast to all active subscribers and trigger browser events
   */
  dispatch(toast: Omit<CartToastData, 'id' | 'timestamp'> & { id?: string }): CartToastData {
    const fullToast: CartToastData = {
      id: toast.id || `toast-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      durationMs: toast.durationMs ?? 4000,
      ...toast,
    };

    // Store in recent history
    this.recentToasts.unshift(fullToast);
    if (this.recentToasts.length > this.maxHistory) {
      this.recentToasts.pop();
    }

    // Notify in-memory listeners
    this.listeners.forEach((listener) => {
      try {
        listener(fullToast);
      } catch (err) {
        console.error('[CartToast] Error in toast listener:', err);
      }
    });

    // Notify window via CustomEvent for multi-component or custom DOM listeners
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(
          new CustomEvent<CartToastData>('mm:cart-toast', {
            detail: fullToast,
            bubbles: true,
          })
        );
      } catch {
        // Ignore restricted window dispatch errors
      }
    }

    // Sync critical errors or order/stock alerts with useNotificationsStore
    try {
      const notifType = fullToast.type === 'error' ? 'system' : 'stock_alert';
      const badgeText = fullToast.type === 'error' ? 'ত্রুটি' : 'কার্ট';
      useNotificationsStore.getState().addNotification({
        title: fullToast.titleBn || fullToast.title,
        message: fullToast.messageBn || fullToast.message,
        type: notifType,
        badgeText,
      });
    } catch {
      // In non-React / test environments, notifications store might not have window
    }

    return fullToast;
  }

  /**
   * Trigger an error toast (e.g. for optimistic rollback)
   */
  error(
    message: string,
    options?: {
      title?: string;
      messageBn?: string;
      titleBn?: string;
      durationMs?: number;
    }
  ): CartToastData {
    return this.dispatch({
      type: 'error',
      title: options?.title || 'Cart Update Error',
      titleBn: options?.titleBn || 'কার্ট আপডেট সমস্যা',
      message,
      messageBn: options?.messageBn || 'কার্ট আপডেট করা সম্ভব হয়নি। পূর্বের অবস্থায় ফিরিয়ে নেওয়া হলো।',
      durationMs: options?.durationMs ?? 5000,
    });
  }

  /**
   * Trigger a success toast
   */
  success(
    message: string,
    options?: {
      title?: string;
      messageBn?: string;
      titleBn?: string;
      durationMs?: number;
    }
  ): CartToastData {
    return this.dispatch({
      type: 'success',
      title: options?.title || 'Success',
      titleBn: options?.titleBn || 'সফল',
      message,
      messageBn: options?.messageBn,
      durationMs: options?.durationMs ?? 3000,
    });
  }

  /**
   * Trigger an info toast
   */
  info(
    message: string,
    options?: {
      title?: string;
      messageBn?: string;
      titleBn?: string;
      durationMs?: number;
    }
  ): CartToastData {
    return this.dispatch({
      type: 'info',
      title: options?.title || 'Notice',
      titleBn: options?.titleBn || 'বিজ্ঞপ্তি',
      message,
      messageBn: options?.messageBn,
      durationMs: options?.durationMs ?? 3500,
    });
  }

  /**
   * Get recently dispatched toasts
   */
  getHistory(): CartToastData[] {
    return [...this.recentToasts];
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.recentToasts = [];
  }
}

export const cartToast = new CartToastManager();
