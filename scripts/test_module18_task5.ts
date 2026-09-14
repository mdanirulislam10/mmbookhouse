/**
 * Test Suite: Module 18 - Task 5: Customer Preferences & Opt-Out Handling
 * Run: npx tsx scripts/test_module18_task5.ts
 */

import { NotificationPreferenceService } from '../src/lib/services/notificationPreferenceService';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function runTask5Tests() {
  console.log('========================================================================');
  console.log('🧪 MODULE 18 - TASK 5: PREFERENCES & OPT-OUT TEST SUITE');
  console.log('========================================================================\n');

  const prefService = new NotificationPreferenceService();

  // Test 1: Default Preferences
  console.log('--- TEST 1: Default Customer Preferences ---');
  const defaults = prefService.getPreferences('usr_malda_501');
  assert(defaults.user_id === 'usr_malda_501', 'User ID matches');
  assert(defaults.whatsapp_enabled === true, 'WhatsApp enabled by default');
  assert(defaults.sms_enabled === true, 'SMS fallback enabled by default');
  assert(defaults.promotions_opt_in === false, 'Promotions opt-out by default per DPDP Act');

  // Test 2: Update Preferences
  console.log('\n--- TEST 2: Update Preferences ---');
  const updated = prefService.updatePreferences('usr_malda_501', {
    promotions_opt_in: true,
  });
  assert(updated.promotions_opt_in === true, 'Promotions opt-in updated to true');

  // Test 3: Opt-Out with STOP Keyword
  console.log('\n--- TEST 3: Opt-Out with STOP Keyword ---');
  const optOutRes = prefService.handleOptOut('+919832112233', 'STOP');
  assert(optOutRes.success, 'Opt-out with STOP keyword succeeds');
  assert(optOutRes.record?.phone === '+919832112233', 'Recorded phone is E.164');

  // Test 4: Opt-Out with Bengali "থামুন" Keyword
  console.log('\n--- TEST 4: Bengali "থামুন" Keyword ---');
  const optOutBn = prefService.handleOptOut('09832556677', 'থামুন');
  assert(optOutBn.success, 'Opt-out with "থামুন" succeeds');
  assert(optOutBn.record?.phone === '+919832556677', 'Correctly sanitized raw phone with leading 0');

  // Test 5: Rejection of Invalid Keyword
  console.log('\n--- TEST 5: Reject Invalid Keywords ---');
  const badKey = prefService.handleOptOut('+919832112233', 'RANDOM_TEXT');
  assert(!badKey.success, 'Random text is rejected as opt-out keyword');

  // Test 6: Promotional Blocking Check
  console.log('\n--- TEST 6: Promotional Notification Blocking ---');
  const isBlockedPromo = prefService.isOptedOut('+919832112233', true);
  assert(isBlockedPromo, 'Promotional notification is blocked for opted-out phone');

  const isBlockedTx = prefService.isOptedOut('+919832112233', false);
  assert(!isBlockedTx, 'Critical transactional order notification is NOT blocked');

  // Test 7: Opt back in
  console.log('\n--- TEST 7: Customer Opt-In ---');
  const optInRes = prefService.optIn('+919832112233');
  assert(optInRes.success, 'Opt-in succeeded');
  assert(!prefService.isOptedOut('+919832112233', true), 'No longer blocked after opt-in');

  console.log('\n🎉 ALL TASK 5 TESTS PASSED SUCCESSFULLY! (100% Preferences & Opt-Out Working)');
}

runTask5Tests().catch((err) => {
  console.error('Fatal error running Task 5 test:', err);
  process.exit(1);
});
