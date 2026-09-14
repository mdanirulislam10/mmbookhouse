/**
 * Test Suite: Module 19 - Task 2: RBAC Security, Audit Trail & Auto-Lockout Engine
 * Run: npx tsx scripts/test_module19_task2.ts
 */

import { AdminAuthService } from '../src/lib/services/adminAuthService';
import { BookInventoryItem, AdminOrderSummary, AdminUser } from '../src/types/sellerCentral';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function runTask2Tests() {
  console.log('========================================================================');
  console.log('🧪 MODULE 19 - TASK 2: RBAC, AUDIT TRAIL & LOCKOUT TEST SUITE');
  console.log('========================================================================\n');

  const authService = new AdminAuthService('+919832000000');

  // Test 1: Role Permissions Matrix
  console.log('--- TEST 1: Role Permissions Verification ---');
  assert(authService.canAccess('super_admin', 'view_financials'), 'super_admin can view financials');
  assert(authService.canAccess('super_admin', 'view_wholesale_cost'), 'super_admin can view wholesale cost');
  assert(authService.canAccess('super_admin', 'export_customer_data'), 'super_admin can export customer data');

  assert(!authService.canAccess('inventory_manager', 'view_financials'), 'inventory_manager CANNOT view financials');
  assert(!authService.canAccess('inventory_manager', 'view_wholesale_cost'), 'inventory_manager CANNOT view wholesale cost');
  assert(authService.canAccess('inventory_manager', 'edit_book'), 'inventory_manager can edit books');

  assert(!authService.canAccess('dispatch_staff', 'edit_book'), 'dispatch_staff CANNOT edit books');
  assert(authService.canAccess('dispatch_staff', 'print_shipping_labels'), 'dispatch_staff can print shipping labels');
  assert(authService.canAccess('dispatch_staff', 'verify_counter_otp'), 'dispatch_staff can verify counter OTP');

  // Test 2: Field-Level Security for Books (Item 4)
  console.log('\n--- TEST 2: Field-Level Security (Book Wholesale Cost) ---');
  const rawBook: BookInventoryItem = {
    id: 'book_101',
    sku: 'WBCS-2026',
    isbn: '9789352834912',
    title: 'WBCS Scanner',
    title_bn: 'ডব্লিউবিসিএস স্ক্যানার',
    author: 'ড. অশোক ব্যানার্জী',
    publisher: 'ছায়া প্রকাশনী',
    categories: ['WBCS'],
    mrp: 650,
    selling_price: 520,
    wholesale_cost_price: 380, // SENSITIVE
    discount_percent: 20,
    stock_quantity: 40,
    low_stock_threshold: 5,
    weight_grams: 500,
    is_active: true,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const adminView = authService.sanitizeBookForRole(rawBook, 'super_admin');
  assert(adminView.wholesale_cost_price === 380, 'super_admin can view wholesale cost price (₹380)');

  const staffView = authService.sanitizeBookForRole(rawBook, 'dispatch_staff');
  assert(staffView.wholesale_cost_price === undefined, 'dispatch_staff cannot view wholesale cost price');

  const managerView = authService.sanitizeBookForRole(rawBook, 'inventory_manager');
  assert(managerView.wholesale_cost_price === undefined, 'inventory_manager cannot view wholesale cost price');

  // Test 3: Field-Level Security for Orders (Item 4)
  console.log('\n--- TEST 3: Field-Level Security (Order Wholesale Costs) ---');
  const sampleOrder: AdminOrderSummary = {
    order_id: 'ord_1',
    order_number: 'MMB-9021',
    customer_name: 'অমল দাস',
    customer_phone: '+919832112233',
    shipping_address_text: 'রথবাড়ি, মালদা',
    district: 'Malda',
    pincode: '732101',
    items: [
      {
        book_id: 'book_101',
        title: 'WBCS Scanner',
        sku: 'WBCS-2026',
        quantity: 2,
        unit_price: 520,
        wholesale_cost: 380, // SENSITIVE
      },
    ],
    total_amount: 1040,
    payment_mode: 'UPI',
    payment_status: 'PAID',
    pipeline_status: 'pending',
    is_counter_pickup: false,
    courier_pickup_requested: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const sanitizedOrderStaff = authService.sanitizeOrderForRole(sampleOrder, 'dispatch_staff');
  assert(sanitizedOrderStaff.items[0].wholesale_cost === undefined, 'Staff order view hides item wholesale cost');
  const sanitizedOrderAdmin = authService.sanitizeOrderForRole(sampleOrder, 'super_admin');
  assert(sanitizedOrderAdmin.items[0].wholesale_cost === 380, 'Admin order view preserves item wholesale cost');

  // Test 4: Immutable Audit Trail (Item 5)
  console.log('\n--- TEST 4: Immutable Audit Trail Logger ---');
  const logged = authService.logAdminAction({
    actor_id: 'admin_1',
    actor_name: 'সুনীল পাল (Owner)',
    role: 'super_admin',
    action: 'UPDATE_BOOK_PRICE',
    target_entity: 'book',
    target_id: 'book_101',
    changes: {
      selling_price: { old: 550, new: 520 },
    },
    ip_address: '192.168.1.10',
  });

  assert(!!logged.id.startsWith('audit_'), 'Audit log generated unique ID');
  const logs = authService.getAuditLogs({ target_entity: 'book' });
  assert(logs.length === 1, 'Audit log stored and retrievable');
  assert(logs[0].action === 'UPDATE_BOOK_PRICE', 'Audit action matches');

  // Test 5: Brute-force Auto-Lockout Guard (Item 8)
  console.log('\n--- TEST 5: Brute-Force Auto-Lockout Guard (5 Attempts -> 15 min lock) ---');
  const attackEmail = 'hacker@malda.com';
  authService.resetFailedAttempts(attackEmail);

  for (let i = 1; i <= 4; i++) {
    const res = authService.recordFailedLogin(attackEmail);
    assert(!res.locked, `Attempt ${i} is not locked yet`);
    assert(res.remainingAttempts === 5 - i, `Remaining attempts: ${res.remainingAttempts}`);
  }

  // 5th attempt must lock
  const lockRes = authService.recordFailedLogin(attackEmail);
  assert(lockRes.locked === true, '5th consecutive failed attempt locks account');
  assert(!!lockRes.lockedUntil, 'Lock expiration timestamp provided');
  assert(authService.isAccountLocked(attackEmail).locked === true, 'Account verified locked');

  // Reset unlocks
  authService.resetFailedAttempts(attackEmail);
  assert(authService.isAccountLocked(attackEmail).locked === false, 'Account unlocked after reset');

  // Test 6: Inactivity Session Timeout (Item 10)
  console.log('\n--- TEST 6: Inactivity Session Timeout ---');
  const mockUser: AdminUser = {
    id: 'adm_1',
    name: 'Owner',
    email: 'owner@mmbookhouse.in',
    phone: '+919832000000',
    role: 'super_admin',
    is_active: true,
    two_factor_enabled: true,
    failed_login_attempts: 0,
    created_at: new Date().toISOString(),
  };

  const activeSession = authService.createSession(mockUser, 120);
  assert(!authService.isSessionExpired(activeSession), 'New session with 120min expiry is active');

  const expiredSession = {
    ...activeSession,
    expires_at: new Date(Date.now() - 1000).toISOString(), // 1 second in past
  };
  assert(authService.isSessionExpired(expiredSession), 'Past session is correctly flagged as expired');

  console.log('\n🎉 ALL TASK 2 TESTS PASSED SUCCESSFULLY! (100% RBAC & Security Working)');
}

runTask2Tests().catch((err) => {
  console.error('Fatal error running Task 2 test:', err);
  process.exit(1);
});
