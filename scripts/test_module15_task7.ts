import { POST } from '../src/app/api/cart/bundle-add/route';
import { NextRequest } from 'next/server';

function createMockRequest(body: any): NextRequest {
  return new NextRequest('http://localhost:3000/api/cart/bundle-add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function runTests() {
  console.log('🧪 Running Module 15 - Task 7 Verification: Atomic Multi-Item Add-to-Cart API');

  // Test 1: Valid 2-item bundle add to cart
  console.log('Test 1: Valid 2-item bundle add-to-cart');
  const req1 = createMockRequest({
    bundle_id: 'bundle-wb-math-10',
    product_ids: ['wb-math-10', 'wb-math-sol-10'],
    device_fingerprint: 'fp-user-123',
    utm_campaign: 'math_fbt_cross_sell',
  });

  const res1 = await POST(req1);
  const data1 = await res1.json();

  if (res1.status !== 200 || !data1.success) {
    throw new Error(`Test 1 Failed: Expected status 200 and success=true, got ${res1.status}, ${JSON.stringify(data1)}`);
  }
  if (data1.items_added_count !== 2) {
    throw new Error(`Test 1 Failed: Expected 2 items added, got ${data1.items_added_count}`);
  }
  if (!data1.items[0].shipTogether || !data1.items[1].shipTogether) {
    throw new Error('Test 1 Failed: All bundle items must have shipTogether=true');
  }
  if (!data1.items[0].bundleDiscountApplied) {
    throw new Error('Test 1 Failed: 2 items must qualify for bundleDiscountApplied=true');
  }
  console.log('✅ Test 1 Passed: 2-item atomic add-to-cart with ship_together and discount successful.');

  // Test 2: Single item selection (Conditional discount reversal - Item 43)
  console.log('Test 2: Single item bundle add-to-cart (discount reversal)');
  const req2 = createMockRequest({
    bundle_id: 'bundle-wb-math-10',
    product_ids: ['wb-math-10'],
  });

  const res2 = await POST(req2);
  const data2 = await res2.json();

  if (res2.status !== 200 || !data2.success) {
    throw new Error(`Test 2 Failed: Expected 200, got ${res2.status}`);
  }
  if (data2.items[0].bundleDiscountApplied === true) {
    throw new Error('Test 2 Failed: Single item should reverse bundle discount (bundleDiscountApplied=false)');
  }
  console.log('✅ Test 2 Passed: Single item correctly reverses combo discount to regular price.');

  // Test 3: Out-of-Stock rollback & error handling (Item 42)
  console.log('Test 3: Out of stock rollback handling');
  const req3 = createMockRequest({
    bundle_id: 'bundle-wb-math-10',
    product_ids: ['wb-math-10', 'out-of-stock-book'],
  });

  const res3 = await POST(req3);
  const data3 = await res3.json();

  if (res3.status !== 409 || data3.success !== false) {
    throw new Error(`Test 3 Failed: Expected status 409 and success=false, got ${res3.status}`);
  }
  if (data3.error !== 'OUT_OF_STOCK' || !data3.outOfStockProductIds.includes('out-of-stock-book')) {
    throw new Error(`Test 3 Failed: Expected OUT_OF_STOCK error identifying out-of-stock-book`);
  }
  console.log('✅ Test 3 Passed: Atomic failure rollback triggered when item is out of stock.');

  // Test 4: Zod validation error for empty or invalid payload
  console.log('Test 4: Zod validation on empty product_ids');
  const req4 = createMockRequest({
    bundle_id: 'invalid-bundle',
    product_ids: [],
  });

  const res4 = await POST(req4);
  const data4 = await res4.json();

  if (res4.status !== 400 || data4.error !== 'VALIDATION_ERROR') {
    throw new Error(`Test 4 Failed: Expected 400 VALIDATION_ERROR, got ${res4.status}`);
  }
  console.log('✅ Test 4 Passed: Payload schema validation rejects malformed requests.');

  console.log('\n🎉 ALL 4 TESTS FOR TASK 7 PASSED SUCCESSFULLY!\n');
}

runTests().catch((err) => {
  console.error('❌ Task 7 verification failed:', err);
  process.exit(1);
});
