/**
 * Test Suite: Module 18 - Task 6: Meta WhatsApp Webhook Route
 * Run: npx tsx scripts/test_module18_task6.ts
 */

import { GET, POST } from '../src/app/api/webhooks/whatsapp/route';
import { inboundButtonResponses } from '../src/lib/services/whatsappWebhookStore';
import { NextRequest } from 'next/server';
import { defaultQueueService } from '../src/lib/services/notificationQueueService';
import { defaultPreferenceService } from '../src/lib/services/notificationPreferenceService';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function runTask6Tests() {
  console.log('========================================================================');
  console.log('🧪 MODULE 18 - TASK 6: META WHATSAPP WEBHOOK TEST SUITE');
  console.log('========================================================================\n');

  // Test 1: GET Hub Challenge Verification
  console.log('--- TEST 1: Meta Handshake GET Endpoint ---');
  const validUrl = 'http://localhost:3000/api/webhooks/whatsapp?hub.mode=subscribe&hub.challenge=CHALLENGE_CODE_12345&hub.verify_token=mmbook_meta_token_2026';
  const req1 = new NextRequest(validUrl, { method: 'GET' });
  const res1 = await GET(req1);

  assert(res1.status === 200, 'Valid token handshake returns HTTP 200');
  const text1 = await res1.text();
  assert(text1 === 'CHALLENGE_CODE_12345', 'Response body is the exact hub challenge');

  // Invalid Token Test
  const invalidUrl = 'http://localhost:3000/api/webhooks/whatsapp?hub.mode=subscribe&hub.challenge=CODE&hub.verify_token=WRONG_TOKEN';
  const reqInvalid = new NextRequest(invalidUrl, { method: 'GET' });
  const resInvalid = await GET(reqInvalid);
  assert(resInvalid.status === 403, 'Invalid token returns HTTP 403 Forbidden');

  // Test 2: Inbound Status Receipt POST (Delivered & Read)
  console.log('\n--- TEST 2: Inbound Delivery Receipt Status Updates ---');
  // First seed a notification log in the queue service
  defaultQueueService.clearAll();
  defaultQueueService.enqueueNotification({
    recipient_name: 'সুব্রত রায়',
    phone_number: '+919832114477',
    trigger: 'order_confirmed',
    template_name: 'order_confirmed_bn',
    order_id: 'ORD-WH-001',
    variables: { customer_name: 'সুব্রত রায়', order_id: 'ORD-WH-001', total_amount: '500' },
  });
  await defaultQueueService.drainQueue();

  const logs = defaultQueueService.getLogs({ order_id: 'ORD-WH-001' });
  assert(logs.length === 1, 'Seeded log created');
  const seededMsgId = logs[0].gateway_message_id!;

  // Simulate Meta Webhook payload with 'delivered' status
  const statusPayload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'BIZ_123',
        changes: [
          {
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              statuses: [
                {
                  id: seededMsgId,
                  status: 'delivered',
                  timestamp: '1725984000',
                  recipient_id: '919832114477',
                },
              ],
            },
          },
        ],
      },
    ],
  };

  const reqStatus = new NextRequest('http://localhost:3000/api/webhooks/whatsapp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(statusPayload),
  });

  const resStatus = await POST(reqStatus);
  assert(resStatus.status === 200, 'POST status receipt returns HTTP 200');

  const updatedLog = defaultQueueService.getLogs({ order_id: 'ORD-WH-001' })[0];
  assert(updatedLog.status === 'delivered', 'Log status updated to delivered via webhook');

  // Test 3: Inbound Quick Reply Button (COD 1-Tap Confirmation)
  console.log('\n--- TEST 3: Inbound Quick Reply Button Response ---');
  const buttonPayload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'BIZ_123',
        changes: [
          {
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              messages: [
                {
                  from: '919832114477',
                  id: 'wamid.INBOUND_001',
                  timestamp: '1725984100',
                  type: 'button',
                  button: {
                    payload: 'CONFIRM_COD_ORD-WH-001',
                    text: '✔ হ্যাঁ, অর্ডার নিশ্চিত করুন',
                  },
                },
              ],
            },
          },
        ],
      },
    ],
  };

  const reqBtn = new NextRequest('http://localhost:3000/api/webhooks/whatsapp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buttonPayload),
  });

  const resBtn = await POST(reqBtn);
  assert(resBtn.status === 200, 'POST button response returns HTTP 200');

  const recordedBtn = inboundButtonResponses.find((b) => b.order_id === 'ORD-WH-001');
  assert(!!recordedBtn, 'COD confirmation button was recorded');
  assert(recordedBtn?.action === 'CONFIRM_COD', 'Action correctly identified as CONFIRM_COD');

  // Test 4: Inbound STOP text message
  console.log('\n--- TEST 4: Inbound STOP Opt-Out Text Message ---');
  const stopPayload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'BIZ_123',
        changes: [
          {
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              messages: [
                {
                  from: '919832998877',
                  id: 'wamid.INBOUND_002',
                  timestamp: '1725984200',
                  type: 'text',
                  text: {
                    body: 'STOP',
                  },
                },
              ],
            },
          },
        ],
      },
    ],
  };

  const reqStop = new NextRequest('http://localhost:3000/api/webhooks/whatsapp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(stopPayload),
  });

  const resStop = await POST(reqStop);
  assert(resStop.status === 200, 'POST STOP keyword returns HTTP 200');
  assert(defaultPreferenceService.isOptedOut('+919832998877', true), 'Customer was automatically opted out from promotions');

  console.log('\n🎉 ALL TASK 6 TESTS PASSED SUCCESSFULLY! (100% Meta Webhook Working)');
}

runTask6Tests().catch((err) => {
  console.error('Fatal error running Task 6 test:', err);
  process.exit(1);
});
