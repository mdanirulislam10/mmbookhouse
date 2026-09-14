import type {
  OfflineCartPreview,
  OfflineSyncQueueItem,
  OfflineSyncQueueAction,
  PushNotificationPayload,
} from '@/types/pwaSecurity';

/**
 * Module 20: Service Worker, Offline Caching & Background Sync Service (Items 4, 5, 6, 8, 10)
 * Provides programmatic helpers for:
 * - Offline cart preview caching (Item 5)
 * - Background Sync queue manager (Item 6)
 * - Web Push notification payload formatter (Item 8)
 * - Silent Zero-Touch cache version management (Item 10)
 */

// In-memory sync queue store (backed by localStorage in browser runtime)
let memorySyncQueue: OfflineSyncQueueItem[] = [];
let memoryOfflineCart: OfflineCartPreview | null = null;

export const PWA_CURRENT_VERSION = '2.0.0-launch';

/**
 * Saves the current cart to offline storage for preview when offline.
 */
export function saveOfflineCartPreview(preview: OfflineCartPreview): void {
  memoryOfflineCart = preview;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem('mm_offline_cart_preview', JSON.stringify(preview));
    } catch (e) {
      console.warn('[PWA] Failed to write offline cart to localStorage:', e);
    }
  }
}

/**
 * Retrieves the cached offline cart preview.
 */
export function getOfflineCartPreview(): OfflineCartPreview | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = window.localStorage.getItem('mm_offline_cart_preview');
      if (stored) {
        return JSON.parse(stored) as OfflineCartPreview;
      }
    } catch (e) {
      console.warn('[PWA] Failed to read offline cart from localStorage:', e);
    }
  }
  return memoryOfflineCart;
}

/**
 * Registers an action to the background sync queue.
 */
export function registerBackgroundSyncItem(
  action: OfflineSyncQueueAction,
  payload: Record<string, unknown>
): OfflineSyncQueueItem {
  const item: OfflineSyncQueueItem = {
    id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    action,
    payload,
    createdAt: new Date().toISOString(),
    status: 'pending',
    retryCount: 0,
  };

  memorySyncQueue.push(item);

  // Trigger background sync tag if supported by browser
  if (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'SyncManager' in window
  ) {
    navigator.serviceWorker.ready
      .then((reg) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (reg as any).sync?.register('sync-pending-cart');
      })
      .catch((err) => {
        console.warn('[PWA] Background Sync registration warning:', err);
      });
  }

  return item;
}

/**
 * Gets all pending sync items in the queue.
 */
export function getPendingSyncQueue(): OfflineSyncQueueItem[] {
  return memorySyncQueue.filter((item) => item.status === 'pending');
}

/**
 * Processes all pending offline sync items sequentially.
 */
export async function processOfflineSyncQueue(
  executor: (item: OfflineSyncQueueItem) => Promise<boolean>
): Promise<{ processed: number; succeeded: number; failed: number }> {
  let succeeded = 0;
  let failed = 0;
  const pending = getPendingSyncQueue();

  for (const item of pending) {
    item.status = 'syncing';
    try {
      const success = await executor(item);
      if (success) {
        item.status = 'completed';
        succeeded++;
      } else {
        item.status = 'failed';
        item.retryCount += 1;
        failed++;
      }
    } catch (err) {
      item.status = 'failed';
      item.retryCount += 1;
      item.lastError = err instanceof Error ? err.message : String(err);
      failed++;
    }
  }

  return { processed: pending.length, succeeded, failed };
}

/**
 * Formats an order status notification into a rich push notification payload (Item 8).
 */
export function formatOrderStatusPushNotification(
  orderId: string,
  status: 'dispatched' | 'out_for_delivery' | 'delivered',
  trackingUrl: string
): PushNotificationPayload {
  const statusMessages = {
    dispatched: {
      title: '📦 পার্সেল কুরিয়ারে হস্তান্তর হয়েছে!',
      body: `আপনার অর্ডার #${orderId} সফলভাবে প্যাকিং সম্পন্ন হয়ে কুরিয়ারে রওনা হয়েছে।`,
    },
    out_for_delivery: {
      title: '🛵 পার্সেল ডেলিভারির জন্য বের হয়েছে!',
      body: `ডেলিভারি এক্সিকিউটিভ আজ আপনার ঠিকানায় অর্ডার #${orderId} পৌঁছে দেবেন।`,
    },
    delivered: {
      title: '🎉 পার্সেল সফলভাবে ডেলিভার হয়েছে!',
      body: `আপনার অর্ডার #${orderId} সফলভাবে গৃহীত হয়েছে। এম.এম বুক হাউস সাথে থাকার জন্য ধন্যবাদ!`,
    },
  };

  const message = statusMessages[status];

  return {
    title: message.title,
    body: message.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    url: trackingUrl,
    vibrate: [200, 100, 200, 100, 200],
    data: {
      orderId,
      status,
      timestamp: Date.now(),
    },
    actions: [
      { action: 'track', title: 'ট্র্যাক করুন' },
      { action: 'close', title: 'ঠিক আছে' },
    ],
  };
}

/**
 * Checks for Service Worker version differences for Zero-Touch silent updates (Item 10).
 */
export function checkForServiceWorkerUpdate(
  currentVersion: string,
  incomingVersion: string
): {
  updateAvailable: boolean;
  action: 'skip_waiting' | 'up_to_date';
  messageBengali: string;
} {
  if (currentVersion !== incomingVersion) {
    return {
      updateAvailable: true,
      action: 'skip_waiting',
      messageBengali: 'অ্যাপের নতুন আপডেট উপলব্ধ। ব্যাকগ্রাউন্ডে স্বয়ংক্রিয়ভাবে রিফ্রেশ হচ্ছে।',
    };
  }

  return {
    updateAvailable: false,
    action: 'up_to_date',
    messageBengali: 'আপনার অ্যাপটি সম্পূর্ণ আপডেট রয়েছে।',
  };
}

/**
 * Resets the in-memory sync queue (useful for testing).
 */
export function resetSyncQueueForTesting(): void {
  memorySyncQueue = [];
  memoryOfflineCart = null;
}
