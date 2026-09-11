/**
 * Module 11 Task 3: Automated Verification Test Suite
 * Tests Reverse Geocoding Integration & Geolocation Address Pipeline
 */

import { NextRequest } from 'next/server';
import { GET as reverseGeocodeHandler } from '../src/app/api/delivery/reverse-geocode/route';
import { lookupPostalPincode } from '../src/lib/services/pincodeService';

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
  console.log('\n--- Running Module 11 Task 3 Verification Suite ---\n');

  // Test 1: Reverse Geocoding API for Malda Town coordinates (lat: 25.0108, lng: 88.1411)
  const reqMalda = new NextRequest('http://localhost:3000/api/delivery/reverse-geocode?lat=25.0108&lon=88.1411');
  const resMalda = await reverseGeocodeHandler(reqMalda);
  assert(resMalda.status === 200, 'Reverse geocode returns HTTP 200 for Malda Town coordinates');
  const dataMalda = await resMalda.json();
  assert(
    dataMalda.success === true &&
      dataMalda.data.pincode === '732101' &&
      dataMalda.data.area.includes('Malda'),
    'Malda coordinates accurately resolve to pincode 732101'
  );

  // Test 2: Pipeline integration from coordinates -> reverse-geocode -> lookupPostalPincode
  const detectedPincode = dataMalda.data.pincode;
  const postalDetails = await lookupPostalPincode(detectedPincode);
  assert(
    postalDetails.pincode === '732101' &&
      postalDetails.city === 'Malda' &&
      postalDetails.state === 'West Bengal' &&
      postalDetails.isMaldaLocal === true &&
      postalDetails.postOffices.length > 0,
    'Pipeline creates full postal details (City, District, State, Sub-post offices) from detected GPS pincode'
  );

  // Test 3: Siliguri coordinates (lat: 26.7271, lng: 88.3953)
  const reqSiliguri = new NextRequest('http://localhost:3000/api/delivery/reverse-geocode?lat=26.7271&lon=88.3953');
  const resSiliguri = await reverseGeocodeHandler(reqSiliguri);
  const dataSiliguri = await resSiliguri.json();
  assert(
    dataSiliguri.success === true && dataSiliguri.data.pincode.startsWith('734'),
    `Siliguri coordinates accurately resolve to Siliguri area pincode (${dataSiliguri.data.pincode})`
  );

  // Test 4: Kolkata Boipara coordinates (lat: 22.5726, lng: 88.3639)
  const reqKolkata = new NextRequest('http://localhost:3000/api/delivery/reverse-geocode?lat=22.5726&lon=88.3639');
  const resKolkata = await reverseGeocodeHandler(reqKolkata);
  const dataKolkata = await resKolkata.json();
  assert(
    dataKolkata.success === true && dataKolkata.data.pincode === '700073',
    'Kolkata College Street coordinates resolve to pincode 700073'
  );

  // Test 5: Missing coordinate parameters should return HTTP 400
  const reqMissing = new NextRequest('http://localhost:3000/api/delivery/reverse-geocode');
  const resMissing = await reverseGeocodeHandler(reqMissing);
  assert(resMissing.status === 400, 'Missing lat/lon parameters returns HTTP 400');

  // Test 6: Invalid non-numeric coordinates should return HTTP 400
  const reqInvalid = new NextRequest('http://localhost:3000/api/delivery/reverse-geocode?lat=abc&lon=xyz');
  const resInvalid = await reverseGeocodeHandler(reqInvalid);
  assert(resInvalid.status === 400, 'Non-numeric coordinate parameters returns HTTP 400');

  console.log(`\n--- Verification Results: ${passed} Passed, ${failed} Failed ---\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
