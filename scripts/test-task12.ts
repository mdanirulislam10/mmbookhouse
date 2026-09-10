import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log('--- RUNNING TASK 12 VERIFICATION TESTS ---');

const cartItemCardPath = path.join(__dirname, '../src/components/cart/CartItemCard.tsx');
const cartViewPath = path.join(__dirname, '../src/components/cart/CartView.tsx');
const cartDictPath = path.join(__dirname, '../src/lib/i18n/cartDictionary.ts');

// 1. Verify CartItemCard.tsx exists
assert.ok(fs.existsSync(cartItemCardPath), 'src/components/cart/CartItemCard.tsx must exist');
console.log('✓ CartItemCard.tsx exists');

// 2. Verify CartItemCard content requirements
const cardCode = fs.readFileSync(cartItemCardPath, 'utf8');

// Cover image with Next/Image and fallback icon
assert.ok(cardCode.includes('<Image') || cardCode.includes('Image'), 'Must use Next/Image for cover thumbnail');
assert.ok(cardCode.includes('BookOpen'), 'Must provide BookOpen fallback icon');
assert.ok(cardCode.includes('onError'), 'Must handle image loading errors gracefully');

// Bilingual book title & links to book details
assert.ok(cardCode.includes('bookUrl') && cardCode.includes('/book/'), 'Must link title to book details page');
assert.ok(cardCode.includes('primaryTitle') && cardCode.includes('secondaryTitle'), 'Must support bilingual primary and secondary titles');

// Author and Publisher metadata
assert.ok(cardCode.includes('authorDisplay') && cardCode.includes('publisherDisplay'), 'Must display author and publisher metadata');

// Binding format badge (Paperback / Hardcover)
assert.ok(cardCode.includes('binding') && (cardCode.includes('paperback') || cardCode.includes('hardcover')), 'Must support binding format badges');

// Stock status badge
assert.ok(cardCode.includes('isOutOfStock') || cardCode.includes('isLowStock'), 'Must calculate stock status');
assert.ok(cardCode.includes('text-emerald-700') && cardCode.includes('text-amber-800'), 'Must style stock badges with emerald and amber');

// Price display with savings
assert.ok(cardCode.includes('formatINR(item.price') && cardCode.includes('formatINR(item.mrp'), 'Must format unit price and struck-through MRP');
assert.ok(cardCode.includes('savingsAmount') && cardCode.includes('saveAmount'), 'Must display green savings amount badge');

// Integrated selection checkbox
assert.ok(cardCode.includes('type="checkbox"') && cardCode.includes('onToggleSelect'), 'Must include integrated selection checkbox');

// Quantity stepper & Action links (Delete, Save for later, Share)
assert.ok(cardCode.includes('handleQuantityChange') && cardCode.includes('Minus') && cardCode.includes('Plus'), 'Must include quantity controls');
assert.ok(cardCode.includes('handleRemove') && cardCode.includes('Trash2'), 'Must include Delete action link');
assert.ok(cardCode.includes('handleSaveForLater') || cardCode.includes('SaveForLaterAction'), 'Must include Save for later action link');
assert.ok(cardCode.includes('handleShare') && cardCode.includes('Share2'), 'Must include Share action link');

console.log('✓ CartItemCard functional and visual specifications verified');

// 3. Verify Mount in CartView.tsx
const cartViewCode = fs.readFileSync(cartViewPath, 'utf8');
assert.ok(cartViewCode.includes("import { CartItemCard } from './CartItemCard'"), 'CartView must import CartItemCard');
assert.ok(cartViewCode.includes('<CartItemCard'), 'CartView must mount CartItemCard');
assert.ok(!cartViewCode.includes('Active Cart Items List Placeholder'), 'Placeholder must be removed and replaced by CartItemCard');

console.log('✓ CartItemCard successfully mounted in CartView.tsx');

// 4. Verify Dictionary Keys for Task 12
const dictCode = fs.readFileSync(cartDictPath, 'utf8');
assert.ok(dictCode.includes('onlyLeft'), 'Dictionary must include onlyLeft stock indicator');
assert.ok(dictCode.includes('saveAmount'), 'Dictionary must include saveAmount');
assert.ok(dictCode.includes('share'), 'Dictionary must include share label');
assert.ok(dictCode.includes('publisherLabel'), 'Dictionary must include publisherLabel');

console.log('✓ Dictionary translations verified');
console.log('--- ALL TASK 12 TESTS PASSED SUCCESSFULLY! ---');
