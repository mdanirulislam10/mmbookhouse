import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { cartDictionary, getCartDictionary } from '../src/lib/i18n/cartDictionary';
import { metadata } from '../src/app/cart/page';

console.log('--- RUNNING TASK 11 VERIFICATION TESTS ---');

// 1. Verify Page Metadata
assert.strictEqual(
  metadata.title,
  'Shopping Cart | M.M Book House',
  'Metadata title must match specification'
);
assert.ok(metadata.description, 'Metadata description must be defined');
assert.ok(metadata.openGraph, 'OpenGraph metadata must be defined');
console.log('✓ Metadata verification passed');

// 2. Verify Bilingual Dictionary
const bnDict = getCartDictionary('bn');
const enDict = getCartDictionary('en');

assert.strictEqual(bnDict.breadcrumbs.cart, 'শপিং কার্ট', 'Bengali breadcrumb cart label');
assert.strictEqual(enDict.breadcrumbs.cart, 'Shopping Cart', 'English breadcrumb cart label');
assert.strictEqual(bnDict.pageTitle, 'শপিং কার্ট', 'Bengali page title');
assert.strictEqual(enDict.pageTitle, 'Shopping Cart', 'English page title');
assert.ok(bnDict.emptyCart.title, 'Bengali empty cart title exists');
assert.ok(enDict.emptyCart.title, 'English empty cart title exists');
assert.ok(bnDict.orderSummary.title, 'Bengali order summary title exists');
assert.ok(enDict.orderSummary.title, 'English order summary title exists');
assert.ok(bnDict.savedForLater.title, 'Bengali saved for later title exists');
assert.ok(enDict.savedForLater.title, 'English saved for later title exists');
console.log('✓ Bilingual dictionary verification passed');

// 3. Verify Component Files Existence & Content Requirements
const cartPagePath = path.join(__dirname, '../src/app/cart/page.tsx');
const cartViewPath = path.join(__dirname, '../src/components/cart/CartView.tsx');
const orderSummaryPath = path.join(__dirname, '../src/components/cart/CartOrderSummary.tsx');
const emptyStatePath = path.join(__dirname, '../src/components/cart/CartEmptyState.tsx');

assert.ok(fs.existsSync(cartPagePath), 'src/app/cart/page.tsx must exist');
assert.ok(fs.existsSync(cartViewPath), 'src/components/cart/CartView.tsx must exist');
assert.ok(fs.existsSync(orderSummaryPath), 'src/components/cart/CartOrderSummary.tsx must exist');
assert.ok(fs.existsSync(emptyStatePath), 'src/components/cart/CartEmptyState.tsx must exist');

const cartViewCode = fs.readFileSync(cartViewPath, 'utf8');
assert.ok(cartViewCode.includes('lg:col-span-8'), 'Must have lg:col-span-8 for left column');
assert.ok(cartViewCode.includes('lg:col-span-4'), 'Must have lg:col-span-4 for right column');
assert.ok(cartViewCode.includes('breadcrumbs'), 'Must include breadcrumbs');
assert.ok(cartViewCode.includes('CartEmptyState'), 'Must include CartEmptyState');
assert.ok(cartViewCode.includes('CartOrderSummary'), 'Must include CartOrderSummary');
assert.ok(cartViewCode.includes('savedForLater'), 'Must include Saved for Later section placeholder');

const orderSummaryCode = fs.readFileSync(orderSummaryPath, 'utf8');
assert.ok(orderSummaryCode.includes('sticky top-20'), 'Order summary must have sticky positioning');
assert.ok(orderSummaryCode.includes('Proceed to Buy') || orderSummaryCode.includes('proceedToCheckout'), 'Must have Proceed to Buy CTA');

console.log('✓ Component structural requirements verified');
console.log('--- ALL TASK 11 TESTS PASSED SUCCESSFULLY! ---');
