/**
 * Test Suite: Module 19 - Task 3: Inventory Management, Barcode Scanner & POS Counter Sale
 * Run: npx tsx scripts/test_module19_task3.ts
 */

import { MerchantInventoryService } from '../src/lib/services/merchantInventoryService';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function runTask3Tests() {
  console.log('========================================================================');
  console.log('🧪 MODULE 19 - TASK 3: INVENTORY, BARCODE & POS RECONCILIATION TEST');
  console.log('========================================================================\n');

  const invService = new MerchantInventoryService();

  // Test 1: Add New Book
  console.log('--- TEST 1: Add New Book with Auto-Calculated Discount ---');
  const added = invService.addBook({
    sku: 'TET-2026-PRIMARY',
    isbn: '9789388291005',
    title: 'Primary TET Complete Guide 2026',
    title_bn: 'প্রাইমারি টেট সম্পূর্ণ সহায়িকা ২০২৬',
    author: 'ড. সুরজিৎ সাহা',
    publisher: 'দে’জ পাবলিশিং',
    edition_year: 2026,
    categories: ['TET', 'Primary TET'],
    mrp: 500,
    selling_price: 400,
    wholesale_cost_price: 280,
    discount_percent: 0, // Should be auto-recalculated to 20%
    stock_quantity: 12,
    low_stock_threshold: 5,
    weight_grams: 450,
    is_active: true,
    status: 'active',
  });

  assert(added.discount_percent === 20, `Auto discount percent is 20% (Got: ${added.discount_percent}%)`);
  assert(added.status === 'active', 'Initial status is active');

  // Test 2: Barcode / Camera ISBN Scanner Lookup (Item 17)
  console.log('\n--- TEST 2: Barcode / ISBN Scanner Lookup ---');
  const scanned = invService.getBookByIsbnOrBarcode('978-93-8829100-5'); // with hyphens
  assert(scanned?.id === added.id, 'Scanned formatted ISBN matches added book');
  assert(scanned?.title_bn === 'প্রাইমারি টেট সম্পূর্ণ সহায়িকা ২০২৬', 'Bengali title matches');

  // Test 3: Low-Stock Monitoring & Restock Checklist (Item 13)
  console.log('\n--- TEST 3: Low-Stock Monitoring (< 5 copies) ---');
  const lowStock = invService.getLowStockBooks(5);
  const hasMadhyamik = lowStock.some((b) => b.sku === 'MADH-TEST-2026');
  assert(hasMadhyamik, 'Madhyamik suggestion (3 copies) detected in low-stock list');

  const checklist = invService.generateEveningRestockChecklist();
  assert(checklist.total_items_to_restock >= 2, 'Evening restock checklist generated items');
  assert(checklist.items[0].recommended_reorder_qty > 0, 'Reorder recommendation qty is positive');

  // Test 4: POS Counter Sale Real-Time Stock Reconciliation (Item 18)
  console.log('\n--- TEST 4: POS Counter Sale Real-Time Stock Reconciliation ---');
  const initialStock = added.stock_quantity; // 12
  const counterSale = invService.recordCounterSale(added.isbn, 2);
  assert(counterSale.success, 'Physical counter sale of 2 copies succeeded');
  assert(counterSale.remainingStock === 10, `Stock reduced to 10 (Got: ${counterSale.remainingStock})`);

  // Selling more than available should fail
  const overSale = invService.recordCounterSale(added.isbn, 50);
  assert(!overSale.success, 'Over-selling at counter is blocked');
  assert(Boolean(overSale.error?.includes('পর্যাপ্ত স্টক নেই')), 'Contains Bengali error message');

  // Test 5: Auto Out-of-Stock Mode (Item 14)
  console.log('\n--- TEST 5: Auto Out-of-Stock Mode ---');
  // Sell remaining 10 copies
  invService.recordCounterSale(added.isbn, 10);
  const zeroStockBook = invService.getBookById(added.id)!;
  assert(zeroStockBook.stock_quantity === 0, 'Stock is now 0');
  assert(zeroStockBook.status === 'out_of_stock', 'Status auto-switched to out_of_stock (SEO safe)');

  // Replenish stock
  invService.updateBook(added.id, { stock_quantity: 25 });
  const replenished = invService.getBookById(added.id)!;
  assert(replenished.status === 'active', 'Status auto-restored to active upon restocking');

  // Test 6: Soft Delete & Archive Policy (Item 19)
  console.log('\n--- TEST 6: Soft Delete & Archive Policy ---');
  const archived = invService.archiveBook(added.id);
  assert(archived.success, 'Book archived successfully');
  assert(archived.book?.status === 'archived', 'Status is archived');
  assert(archived.book?.is_active === false, 'is_active is false');
  assert(invService.getBookById(added.id) !== null, 'Book record preserved in database');

  console.log('\n🎉 ALL TASK 3 TESTS PASSED SUCCESSFULLY! (100% Inventory & POS Working)');
}

runTask3Tests().catch((err) => {
  console.error('Fatal error running Task 3 test:', err);
  process.exit(1);
});
