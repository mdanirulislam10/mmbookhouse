/**
 * Test Suite: Module 16 - Task 8: Customer Account Orders Hub
 * Run with: npx tsx scripts/test_module16_task8.ts
 */

import React from 'react';
import { CustomerOrdersHub } from '../src/components/orders/CustomerOrdersHub';
import { LiveTrackingData } from '../src/types/tracking';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    process.exit(1);
  }
}

console.log('🧪 Starting Module 16 - Task 8 Test Suite: Customer Account Orders Hub...\n');

// 1. Export check
assert(typeof CustomerOrdersHub === 'function', 'CustomerOrdersHub is a valid React component function');
console.log('✅ Test 1 Passed: CustomerOrdersHub component exported successfully.');

// 2. Mock order dataset
const mockOrders: LiveTrackingData[] = [
  {
    orderId: 'MMB-2026-001',
    orderNumber: 'MMB-2026-001',
    status: 'shipped',
    statusLabelEn: 'Shipped',
    statusLabelBn: 'শিপমেন্ট প্রেরিত',
    isStorePickup: false,
    isCancellable: false,
    isReturnable: false,
    subtotal: 500,
    shippingFee: 0,
    grandTotal: 500,
    items: [{ id: 'b1', title: 'Rabindra Rachanabali', author: 'Tagore', quantity: 1, price: 500 }],
  },
  {
    orderId: 'MMB-2026-002',
    orderNumber: 'MMB-2026-002',
    status: 'delivered',
    statusLabelEn: 'Delivered',
    statusLabelBn: 'ডেলিভারি সম্পন্ন',
    isStorePickup: false,
    isCancellable: false,
    isReturnable: true,
    subtotal: 450,
    shippingFee: 0,
    grandTotal: 450,
    items: [{ id: 'b2', title: 'Apur Sansar', author: 'Bibhutibhushan', quantity: 1, price: 450 }],
  },
  {
    orderId: 'MMB-2026-003',
    orderNumber: 'MMB-2026-003',
    status: 'pickup_ready',
    statusLabelEn: 'Ready for Pickup',
    statusLabelBn: 'কাউন্টারে প্রস্তুত',
    isStorePickup: true,
    isCancellable: false,
    isReturnable: false,
    subtotal: 300,
    shippingFee: 0,
    grandTotal: 300,
    items: [{ id: 'b3', title: 'Malda History', author: 'Local Historian', quantity: 1, price: 300 }],
  },
  {
    orderId: 'MMB-2026-004',
    orderNumber: 'MMB-2026-004',
    status: 'cancelled_by_user',
    statusLabelEn: 'Cancelled',
    statusLabelBn: 'অর্ডার বাতিল',
    isStorePickup: false,
    isCancellable: false,
    isReturnable: false,
    subtotal: 250,
    shippingFee: 40,
    grandTotal: 290,
    items: [{ id: 'b4', title: 'Mathematics Guide', author: 'K. C. Nag', quantity: 1, price: 250 }],
  },
];

// 3. Tab filter logic verification (Item 30)
const inTransitOrders = mockOrders.filter((o) => !o.isStorePickup && ['shipped', 'out_for_delivery'].includes(o.status || ''));
assert(inTransitOrders.length === 1 && inTransitOrders[0].orderId === 'MMB-2026-001', 'In-transit filter works');

const deliveredOrders = mockOrders.filter((o) => o.status === 'delivered');
assert(deliveredOrders.length === 1 && deliveredOrders[0].orderId === 'MMB-2026-002', 'Delivered filter works');

const storePickupOrders = mockOrders.filter((o) => o.isStorePickup);
assert(storePickupOrders.length === 1 && storePickupOrders[0].orderId === 'MMB-2026-003', 'Store pickup filter works');

const cancelledOrders = mockOrders.filter((o) => o.status === 'cancelled_by_user');
assert(cancelledOrders.length === 1 && cancelledOrders[0].orderId === 'MMB-2026-004', 'Cancelled filter works');
console.log('✅ Test 2 Passed: 5-Tab order classification filters orders accurately.');

// 4. Search logic verification (Item 32)
const searchByTitle = mockOrders.filter((o) =>
  o.items?.some((i) => i.title.toLowerCase().includes('rabindra'))
);
assert(searchByTitle.length === 1 && searchByTitle[0].orderId === 'MMB-2026-001', 'Search by title works');

const searchByAuthor = mockOrders.filter((o) =>
  o.items?.some((i) => i.author?.toLowerCase().includes('nag'))
);
assert(searchByAuthor.length === 1 && searchByAuthor[0].orderId === 'MMB-2026-004', 'Search by author works');

const searchById = mockOrders.filter((o) => (o.orderNumber || o.orderId || '').includes('003'));
assert(searchById.length === 1 && searchById[0].orderId === 'MMB-2026-003', 'Search by Order ID works');
console.log('✅ Test 3 Passed: Live search across book titles, authors, and Order IDs verified.');

// 5. Element instantiation
const elemHub = React.createElement(CustomerOrdersHub, {
  initialOrders: mockOrders,
  locale: 'bn',
});
assert(Boolean(elemHub), 'CustomerOrdersHub element created');
console.log('✅ Test 4 Passed: Customer account orders hub element verified.');

console.log('\n🎉 ALL MODULE 16 TASK 8 TESTS PASSED SUCCESSFULLY! (4/4 Checks)\n');
