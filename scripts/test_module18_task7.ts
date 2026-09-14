/**
 * Test Suite: Module 18 - Task 7: Notification REST APIs
 * Run: npx tsx scripts/test_module18_task7.ts
 */

import { POST as sendNotification, GET as getNotificationLogs } from '../src/app/api/notifications/route';
import {
  GET as getPrefs,
  PUT as updatePrefs,
  POST as handleOptOutApi,
} from '../src/app/api/notifications/preferences/route';
import { NextRequest } from 'next/server';
import { defaultQueueService } from '../src/lib/services/notificationQueueService';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function runTask7Tests() {
  console.log('========================================================================');
  console.log('🧪 MODULE 18 - TASK 7: NOTIFICATION REST APIS TEST SUITE');
  console.log('========================================================================\n');

  // Test 1: POST /api/notifications (Enqueue)
  console.log('--- TEST 1: POST /api/notifications ---');
  const validPayload = {
    recipient_name: 'সৌরভ গাঙ্গুলী',
    phone_number: '+919832887766',
    trigger: 'order_shipped',
    template_name: 'mmbook_order_shipped_bn_v1',
    order_id: 'ORD-API-9901',
    variables: {
      customer_name: 'সৌরভ গাঙ্গুলী',
      order_id: 'ORD-API-9901',
      courier_name: 'Delhivery',
      awb_code: 'DEL-9901-X',
    },
  };

  const reqSend = new NextRequest('http://localhost:3000/api/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validPayload),
  });

  const resSend = await sendNotification(reqSend);
  assert(resSend.status === 202, `Status 202 Accepted received (Got: ${resSend.status})`);
  const sendData = await resSend.json();
  assert(sendData.success === true, 'Enqueue success is true');
  assert(!!sendData.job_id?.startsWith('job_'), `Valid job ID returned: ${sendData.job_id}`);

  // Test 2: POST /api/notifications with invalid payload
  console.log('\n--- TEST 2: POST /api/notifications Validation Error ---');
  const invalidPayload = {
    recipient_name: '',
    phone_number: 'invalid_phone',
  };
  const reqBad = new NextRequest('http://localhost:3000/api/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(invalidPayload),
  });
  const resBad = await sendNotification(reqBad);
  assert(resBad.status === 400, 'Invalid body returns HTTP 400 Bad Request');

  // Drain queue to create log
  await defaultQueueService.drainQueue();

  // Test 3: GET /api/notifications (Query Logs)
  console.log('\n--- TEST 3: GET /api/notifications ---');
  const reqLogs = new NextRequest('http://localhost:3000/api/notifications?order_id=ORD-API-9901', {
    method: 'GET',
  });
  const resLogs = await getNotificationLogs(reqLogs);
  assert(resLogs.status === 200, 'GET logs returns HTTP 200');
  const logsData = await resLogs.json();
  assert(logsData.success === true, 'Success is true');
  assert(logsData.logs.length >= 1, 'Found at least 1 log for order ORD-API-9901');
  assert(logsData.logs[0].order_id === 'ORD-API-9901', 'Order ID matches in log');

  // Test 4: GET /api/notifications/preferences
  console.log('\n--- TEST 4: GET /api/notifications/preferences ---');
  const reqPrefGet = new NextRequest('http://localhost:3000/api/notifications/preferences?user_id=usr_api_100', {
    method: 'GET',
  });
  const resPrefGet = await getPrefs(reqPrefGet);
  assert(resPrefGet.status === 200, 'GET preferences returns HTTP 200');
  const prefGetData = await resPrefGet.json();
  assert(prefGetData.preferences.whatsapp_enabled === true, 'Default WhatsApp is true');
  assert(prefGetData.preferences.promotions_opt_in === false, 'Default Promotions is false');

  // Test 5: PUT /api/notifications/preferences
  console.log('\n--- TEST 5: PUT /api/notifications/preferences ---');
  const reqPrefPut = new NextRequest('http://localhost:3000/api/notifications/preferences', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: 'usr_api_100',
      whatsapp_enabled: true,
      sms_enabled: false,
      email_enabled: true,
      promotions_opt_in: true,
    }),
  });
  const resPrefPut = await updatePrefs(reqPrefPut);
  assert(resPrefPut.status === 200, 'PUT preferences returns HTTP 200');
  const prefPutData = await resPrefPut.json();
  assert(prefPutData.preferences.sms_enabled === false, 'SMS updated to false');
  assert(prefPutData.preferences.promotions_opt_in === true, 'Promotions updated to true');

  // Test 6: POST /api/notifications/preferences (STOP Opt-Out)
  console.log('\n--- TEST 6: POST /api/notifications/preferences (STOP Opt-Out) ---');
  const reqOptOut = new NextRequest('http://localhost:3000/api/notifications/preferences', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone_number: '+919832887766',
      keyword: 'STOP',
      channel: 'all',
    }),
  });
  const resOptOut = await handleOptOutApi(reqOptOut);
  assert(resOptOut.status === 200, 'POST opt-out returns HTTP 200');
  const optOutData = await resOptOut.json();
  assert(optOutData.success === true, 'Opt-out handled successfully');
  assert(optOutData.message.includes('বন্ধ করা হয়েছে'), 'Bengali confirmation message returned');

  console.log('\n🎉 ALL TASK 7 TESTS PASSED SUCCESSFULLY! (100% Notification REST APIs Working)');
}

runTask7Tests().catch((err) => {
  console.error('Fatal error running Task 7 test:', err);
  process.exit(1);
});
