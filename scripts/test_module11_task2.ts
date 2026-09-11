/**
 * Module 11 Task 2: Automated Verification Test Suite
 * Tests Postal Edge API and Pincode Service
 */

import {
  resolvePostalPincodeLocal,
  lookupPostalPincode,
  isMaldaPincode,
} from '../src/lib/services/pincodeService';
import { GET } from '../src/app/api/pincode/[code]/route';
import { NextRequest } from 'next/server';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${testName}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n--- Running Module 11 Task 2 Verification Suite ---\n');

  // Test 1: Malda Town Core Pincode (732101)
  const maldaCore = resolvePostalPincodeLocal('732101');
  assert(
    maldaCore !== null &&
      maldaCore.city === 'Malda' &&
      maldaCore.state === 'West Bengal' &&
      maldaCore.isMaldaLocal === true &&
      maldaCore.postOffices.includes('Rathbari S.O') &&
      maldaCore.postOffices.includes('Malda H.O'),
    'Malda Town 732101 resolves with City, State and multiple Sub-post offices'
  );

  // Test 2: Bengali Numerals Normalization (৭৩২১০১)
  const bengaliPincode = await lookupPostalPincode('৭৩২১০১');
  assert(
    bengaliPincode.pincode === '732101' &&
      bengaliPincode.city === 'Malda' &&
      bengaliPincode.isMaldaLocal === true,
    'Bengali digits "৭৩২১০১" correctly normalize and resolve to 732101'
  );

  // Test 3: Sub-divisional blocks of Malda District
  const gazole = resolvePostalPincodeLocal('732124');
  assert(
    gazole !== null && gazole.city === 'Gazole' && gazole.isMaldaLocal === true,
    'Gazole 732124 resolves correctly within Malda'
  );

  const chanchal = resolvePostalPincodeLocal('732123');
  assert(
    chanchal !== null && chanchal.city === 'Chanchal' && chanchal.isMaldaLocal === true,
    'Chanchal 732123 resolves correctly within Malda'
  );

  // Test 4: Major regional hubs (Kolkata, Siliguri)
  const kolkata = resolvePostalPincodeLocal('700001');
  assert(
    kolkata !== null && kolkata.city === 'Kolkata' && kolkata.isMaldaLocal === false,
    'Kolkata 700001 resolves correctly with isMaldaLocal=false'
  );

  const siliguri = resolvePostalPincodeLocal('734001');
  assert(
    siliguri !== null && siliguri.city === 'Siliguri' && siliguri.district === 'Darjeeling',
    'Siliguri 734001 resolves correctly with Darjeeling district'
  );

  // Test 5: National Metro Circles fallback
  const delhi = await lookupPostalPincode('110001');
  assert(
    delhi.state === 'Delhi' && delhi.city.includes('Delhi'),
    'Delhi 110001 resolves to Delhi state'
  );

  const bangalore = await lookupPostalPincode('560001');
  assert(
    bangalore.state === 'Karnataka' && bangalore.city === 'Bengaluru',
    'Bengaluru 560001 resolves to Karnataka'
  );

  // Test 6: isMaldaPincode utility
  assert(isMaldaPincode('732101') === true, '732101 is identified as Malda');
  assert(isMaldaPincode('৭৩২১০২') === true, 'Bengali ৭৩২১০২ is identified as Malda');
  assert(isMaldaPincode('700001') === false, '700001 is NOT identified as Malda');

  // Test 7: Speed test (<15ms response guarantee)
  const start = performance.now();
  for (let i = 0; i < 50; i++) {
    resolvePostalPincodeLocal('732101');
    resolvePostalPincodeLocal('700001');
  }
  const durationMs = performance.now() - start;
  const avgPerLookup = durationMs / 100;
  assert(
    avgPerLookup < 1.0,
    `Postal directory lookup speed is blazing fast: ${avgPerLookup.toFixed(3)}ms per lookup (<15ms target)`
  );

  // Test 8: Invalid Pincodes
  const invalidPincode = await lookupPostalPincode('032101');
  assert(invalidPincode.isDeliverable === false, 'Invalid pincode starting with 0 is marked non-deliverable');

  // Test 9: API Route Handler GET verification
  const reqValid = new NextRequest('http://localhost:3000/api/pincode/732101');
  const resValid = await GET(reqValid, { params: Promise.resolve({ code: '732101' }) });
  assert(resValid.status === 200, 'API route returns HTTP 200 for valid pincode');
  const bodyValid = await resValid.json();
  assert(
    bodyValid.success === true && bodyValid.data.city === 'Malda',
    'API route returns correct payload structure for 732101'
  );

  // Test 10: API Route Handler Invalid Code
  const reqInvalid = new NextRequest('http://localhost:3000/api/pincode/999');
  const resInvalid = await GET(reqInvalid, { params: Promise.resolve({ code: '999' }) });
  assert(resInvalid.status === 400, 'API route returns HTTP 400 for invalid pincode');

  console.log(`\n--- Verification Results: ${passed} Passed, ${failed} Failed ---\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
