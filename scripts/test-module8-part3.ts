/**
 * Module 8: Part 3 (Tasks 21 - 30) Automated Test Runner
 */

import { runModule8Part3UnitTests } from '../src/lib/utils/__tests__/module8Part3.test';

console.log('======================================================================');
console.log('M.M Book House Malda - Module 8 Part 3 Test Suite (Tasks 21 - 30)');
console.log('COD, Store Pickup (BOPIS) & Trust Architecture');
console.log('======================================================================\n');

const results = runModule8Part3UnitTests();

console.log(`\nTests Completed:`);
console.log(`Passed: ${results.passed}`);
console.log(`Failed: ${results.failed}`);

if (results.errors.length > 0) {
  console.error('\nErrors encountered:');
  results.errors.forEach((err) => console.error(`  - ${err}`));
  process.exit(1);
} else {
  console.log('\nSUCCESS: All Module 8 Part 3 unit tests passed flawlessly!');
  process.exit(0);
}
