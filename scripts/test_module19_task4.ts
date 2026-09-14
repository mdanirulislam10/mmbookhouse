/**
 * Test Suite: Module 19 - Task 4: Bulk Operations, CSV Importer & Bulk Price Modifier
 * Run: npx tsx scripts/test_module19_task4.ts
 */

import { BulkCatalogService } from '../src/lib/services/bulkCatalogService';
import { MerchantInventoryService } from '../src/lib/services/merchantInventoryService';
import { AdminOrderSummary } from '../src/types/sellerCentral';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function runTask4Tests() {
  console.log('========================================================================');
  console.log('🧪 MODULE 19 - TASK 4: BULK CSV & PRICE MODIFIER TEST SUITE');
  console.log('========================================================================\n');

  const invService = new MerchantInventoryService();
  const bulkService = new BulkCatalogService(invService);

  // Test 1: Bulk CSV Parser & Error Preview (Item 15)
  console.log('--- TEST 1: 1-Click Bulk CSV Parser with Error Highlighting ---');
  const sampleCsv = `sku,isbn,title,title_bn,author,publisher,mrp,selling_price,wholesale_cost_price,stock_quantity,weight_grams,categories,rack_location
WBCS-TEST-01,9789350011111,WBCS History Compendium,ডব্লিউবিসিএস ইতিহাস সংকলন,রমেশ মজুমদার,ছায়া প্রকাশনী,500,400,300,20,400,WBCS; History,Rack A-1
WBCS-BAD-ROW,9789350022222,Bad Row Book,ভুল বই,লেখক,ছায়া প্রকাশনী,400,450,250,10,300,WBCS,Rack A-2
WBCS-TEST-02,9789350033333,WBCS Geography Compendium,ডব্লিউবিসিএস ভূগোল সংকলন,কার্তিক চন্দ্র মণ্ডল,ছায়া প্রকাশনী,600,480,360,15,450,WBCS; Geography,Rack A-3`;

  const parseResult = bulkService.parseAndValidateCsv(sampleCsv);
  assert(parseResult.totalRows === 3, `Total rows parsed is 3 (Got: ${parseResult.totalRows})`);
  assert(parseResult.validRows.length === 2, `Valid rows count is 2 (Got: ${parseResult.validRows.length})`);
  assert(parseResult.failedRows.length === 1, `Failed rows count is 1 (Got: ${parseResult.failedRows.length})`);
  assert(parseResult.failedRows[0].rowNumber === 3, 'Failed row was correctly identified as row 3');
  assert(parseResult.failedRows[0].errors[0].includes('বিক্রয় মূল্য'), 'Identified selling price > MRP error');

  // Test 2: Commit Import
  console.log('\n--- TEST 2: Commit Valid Import to Inventory ---');
  const initialCount = invService.getAllBooksCount();
  const importedCount = bulkService.commitImport(parseResult.validRows);
  assert(importedCount === 2, 'Committed 2 valid books');
  assert(invService.getAllBooksCount() === initialCount + 2, 'Total inventory count incremented by 2');

  // Test 3: Bulk Price Modifier Tool (Item 16)
  console.log('\n--- TEST 3: Bulk Price Modifier Tool ---');
  const bookBefore = invService.getBookByIsbnOrBarcode('9789350011111')!;
  const oldDiscount = bookBefore.discount_percent; // 20%
  const oldPrice = bookBefore.selling_price; // 400

  // Increase discount by 5% for all "ছায়া প্রকাশনী" books
  const modResult = bulkService.modifyBulkPrices(
    { publisher: 'ছায়া প্রকাশনী' },
    { type: 'increase_discount_percent', value: 5 }
  );

  assert(modResult.affectedCount >= 3, `Affected at least 3 books from Chhaya (Got: ${modResult.affectedCount})`);
  const bookAfter = invService.getBookByIsbnOrBarcode('9789350011111')!;
  assert(bookAfter.discount_percent === oldDiscount + 5, `Discount increased from ${oldDiscount}% to ${bookAfter.discount_percent}%`);
  assert(bookAfter.selling_price < oldPrice, `Selling price lowered to ₹${bookAfter.selling_price}`);

  // Test 4: Order CSV Export (Item 30)
  console.log('\n--- TEST 4: Custom Date Range Order CSV Export ---');
  const sampleOrders: AdminOrderSummary[] = [
    {
      order_id: 'ord_csv_1',
      order_number: 'MMB-7001',
      customer_name: 'দেবাশিস কর',
      customer_phone: '+919832111111',
      shipping_address_text: 'রবীন্দ্র এভিনিউ, মালদা',
      district: 'Malda',
      pincode: '732101',
      items: [],
      total_amount: 850,
      payment_mode: 'UPI',
      payment_status: 'PAID',
      pipeline_status: 'delivered',
      is_counter_pickup: false,
      courier_pickup_requested: true,
      awb_code: 'AWB-1001',
      courier_name: 'Delhivery',
      created_at: '2026-09-01T10:00:00Z',
      updated_at: '2026-09-01T10:00:00Z',
    },
    {
      order_id: 'ord_csv_2',
      order_number: 'MMB-7002',
      customer_name: 'পল্লব দে',
      customer_phone: '+919832222222',
      shipping_address_text: 'বহরমপুর, মুর্শিদাবাদ',
      district: 'Murshidabad',
      pincode: '742101',
      items: [],
      total_amount: 1200,
      payment_mode: 'COD',
      payment_status: 'PAID',
      pipeline_status: 'handed_over',
      is_counter_pickup: false,
      courier_pickup_requested: true,
      awb_code: 'AWB-1002',
      courier_name: 'Blue Dart',
      created_at: '2026-09-05T12:00:00Z',
      updated_at: '2026-09-05T12:00:00Z',
    },
  ];

  const orderCsv = bulkService.exportOrdersToCsv(sampleOrders, {
    start: '2026-09-01T00:00:00Z',
    end: '2026-09-10T23:59:59Z',
  });
  assert(orderCsv.includes('Order ID,Order Number'), 'CSV includes header');
  assert(orderCsv.includes('MMB-7001') && orderCsv.includes('MMB-7002'), 'CSV includes both orders');

  // Test 5: Grid Pagination (Item 49)
  console.log('\n--- TEST 5: Cursor-Based Grid Pagination (20 items/page) ---');
  const dummyList = Array.from({ length: 45 }, (_, i) => ({ id: `item_${i + 1}` }));
  const page1 = bulkService.paginateItems(dummyList, 1, 20);
  assert(page1.data.length === 20, 'Page 1 has exactly 20 items');
  assert(page1.totalPages === 3, 'Total pages is 3');
  assert(page1.hasNext === true, 'Page 1 hasNext is true');
  assert(page1.hasPrev === false, 'Page 1 hasPrev is false');

  const page3 = bulkService.paginateItems(dummyList, 3, 20);
  assert(page3.data.length === 5, 'Page 3 has remaining 5 items');
  assert(page3.hasNext === false, 'Page 3 hasNext is false');
  assert(page3.hasPrev === true, 'Page 3 hasPrev is true');

  console.log('\n🎉 ALL TASK 4 TESTS PASSED SUCCESSFULLY! (100% Bulk Operations Working)');
}

runTask4Tests().catch((err) => {
  console.error('Fatal error running Task 4 test:', err);
  process.exit(1);
});
