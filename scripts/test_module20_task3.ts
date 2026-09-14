import fs from 'fs';
import path from 'path';
import {
  saveOfflineCartPreview,
  getOfflineCartPreview,
  registerBackgroundSyncItem,
  getPendingSyncQueue,
  processOfflineSyncQueue,
  formatOrderStatusPushNotification,
  checkForServiceWorkerUpdate,
  resetSyncQueueForTesting,
  PWA_CURRENT_VERSION,
} from '../src/lib/services/pwaServiceWorkerService';
import type { OfflineCartPreview } from '../src/types/pwaSecurity';

console.log('🧪 Starting Module 20 Task 3 Test Suite: Service Worker, Offline Caching & Background Sync...');

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failed++;
  }
}

async function runTests() {
  try {
    // Test 1: Service Worker (public/sw.js) Static File Inspection
    const swPath = path.join(process.cwd(), 'public', 'sw.js');
    assert(fs.existsSync(swPath), 'public/sw.js service worker file exists');

    const swContent = fs.readFileSync(swPath, 'utf8');
    assert(swContent.includes('mm-bookhouse-v2-launch'), 'Service worker has active v2-launch cache name');
    assert(swContent.includes("addEventListener('push'"), 'Service worker implements push notification listener (Item 8)');
    assert(swContent.includes("addEventListener('sync'"), 'Service worker implements Background Sync listener (Item 6)');
    assert(swContent.includes("addEventListener('notificationclick'"), 'Service worker handles notification click actions');
    assert(swContent.includes('SKIP_WAITING'), 'Service worker handles silent zero-touch code updates (Item 10)');

    // Test 2: Offline Cart Preview Caching (Item 5)
    resetSyncQueueForTesting();
    const sampleCart: OfflineCartPreview = {
      items: [
        {
          bookId: 'book-wbcs-scanner',
          title: 'WBCS Scanner 2026',
          author: 'Nitin Singhania',
          coverImage: '/images/books/wbcs.jpg',
          price: 490,
          mrp: 650,
          quantity: 1,
        },
      ],
      totalMrp: 650,
      totalDiscount: 160,
      payableAmount: 490,
      cachedAt: new Date().toISOString(),
    };

    saveOfflineCartPreview(sampleCart);
    const retrievedCart = getOfflineCartPreview();
    assert(
      retrievedCart !== null && retrievedCart.items.length === 1 && retrievedCart.payableAmount === 490,
      'Offline cart preview saved and retrieved with accurate pricing breakdown'
    );

    // Test 3: Background Sync Queue Registration (Item 6)
    const syncItem1 = registerBackgroundSyncItem('update_cart', {
      bookId: 'book-wbcs-scanner',
      quantity: 2,
    });
    const syncItem2 = registerBackgroundSyncItem('save_address', {
      pin: '732101',
      address: 'Rabindra Avenue, Malda',
    });

    const pendingQueue = getPendingSyncQueue();
    assert(pendingQueue.length === 2, 'Background sync queue registers 2 pending items');
    assert(syncItem1.action === 'update_cart', 'Sync item 1 registered as update_cart');
    assert(syncItem2.action === 'save_address', 'Sync item 2 registered as save_address');

    // Test 4: Background Sync Queue Execution
    const syncResult = await processOfflineSyncQueue(async (item) => {
      // Simulate successful backend sync
      return item.action === 'update_cart' || item.action === 'save_address';
    });

    assert(
      syncResult.processed === 2 && syncResult.succeeded === 2 && syncResult.failed === 0,
      'Background sync engine drains and processes all pending requests upon reconnection'
    );
    assert(getPendingSyncQueue().length === 0, 'Pending sync queue is now clean');

    // Test 5: Web Push Notification Formatter (Item 8)
    const pushNotification = formatOrderStatusPushNotification(
      'MM-9824',
      'dispatched',
      'https://mmbookhouse.in/orders/MM-9824/tracking'
    );

    assert(
      pushNotification.title.includes('হস্তান্তর'),
      'Push notification generates Bengali dispatched title'
    );
    assert(
      pushNotification.url === 'https://mmbookhouse.in/orders/MM-9824/tracking',
      'Push notification contains direct tracking link'
    );
    assert(
      Array.isArray(pushNotification.vibrate) && pushNotification.vibrate.length === 5,
      'Push notification includes 5-step native vibration cadence'
    );
    assert(
      pushNotification.actions?.length === 2,
      'Push notification contains actionable buttons'
    );

    // Test 6: Zero-Touch Silent Update Checker (Item 10)
    const upToDateCheck = checkForServiceWorkerUpdate(PWA_CURRENT_VERSION, '2.0.0-launch');
    assert(
      !upToDateCheck.updateAvailable && upToDateCheck.action === 'up_to_date',
      'Version match correctly reports up-to-date status'
    );

    const newVersionCheck = checkForServiceWorkerUpdate(PWA_CURRENT_VERSION, '2.1.0-launch');
    assert(
      newVersionCheck.updateAvailable && newVersionCheck.action === 'skip_waiting',
      'Version mismatch triggers silent zero-touch skip_waiting update'
    );

  } catch (err: unknown) {
    console.error('Fatal error during Task 3 tests:', err);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`Task 3 Tests Completed: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
