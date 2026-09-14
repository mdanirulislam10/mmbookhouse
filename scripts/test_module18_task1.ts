/**
 * Test Suite: Module 18 - Task 1: Core Types & Zod Validations
 * Run: npx ts-node scripts/test_module18_task1.ts
 */

import {
  e164PhoneSchema,
  rawPhoneInputSchema,
  whatsAppButtonSchema,
  notificationTriggerSchema,
  sendNotificationPayloadSchema,
  customerNotificationPreferenceSchema,
  optOutRequestSchema,
  metaWebhookPayloadSchema,
} from '../src/lib/validations/notifications';
import { NotificationPayload, CustomerNotificationPreference } from '../src/types/notifications';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function runTask1Tests() {
  console.log('========================================================');
  console.log('🧪 MODULE 18 - TASK 1: TYPES & VALIDATIONS TEST SUITE');
  console.log('========================================================\n');

  // Test 1: E.164 Phone format validation
  console.log('--- TEST 1: E.164 Phone Validation ---');
  const validPhone1 = e164PhoneSchema.safeParse('+919832123456');
  assert(validPhone1.success, 'Valid Indian E.164 phone (+919832123456) must pass');

  const validPhone2 = e164PhoneSchema.safeParse('+916295551234');
  assert(validPhone2.success, 'Valid Indian E.164 phone (+916295551234) must pass');

  const invalidPhone1 = e164PhoneSchema.safeParse('9832123456');
  assert(!invalidPhone1.success, 'Missing +91 prefix must fail E.164 validation');

  const invalidPhone2 = e164PhoneSchema.safeParse('+915832123456');
  assert(!invalidPhone2.success, 'Invalid Indian starting digit (5) must fail');

  const invalidPhone3 = e164PhoneSchema.safeParse('+91983212345');
  assert(!invalidPhone3.success, '9-digit phone number must fail');

  // Test 2: Raw Phone Input Schema
  console.log('\n--- TEST 2: Raw Phone Input Transformation & Acceptance ---');
  const raw1 = rawPhoneInputSchema.safeParse('09832 123 456');
  assert(raw1.success, 'Raw input with leading 0 and spaces must be accepted');

  const raw2 = rawPhoneInputSchema.safeParse('+91 9832-123456');
  assert(raw2.success, 'Raw input with spaces and dashes must be accepted');

  const raw3 = rawPhoneInputSchema.safeParse('12345');
  assert(!raw3.success, 'Garbage short phone input must fail');

  // Test 3: WhatsApp Buttons Validation
  console.log('\n--- TEST 3: WhatsApp Interactive Buttons ---');
  const validUrlBtn = whatsAppButtonSchema.safeParse({
    type: 'url',
    label: 'ট্র্যাক করুন',
    url: 'https://mmbook.in/track/ORD123',
  });
  assert(validUrlBtn.success, 'Valid URL button must pass');

  const validQuickReply = whatsAppButtonSchema.safeParse({
    type: 'quick_reply',
    label: 'হ্যাঁ, নিশ্চিত করুন',
    payload: 'CONFIRM_COD_ORD123',
  });
  assert(validQuickReply.success, 'Valid quick reply button must pass');

  const invalidBtn = whatsAppButtonSchema.safeParse({
    type: 'url',
    label: 'ভুল বাটন',
    // Missing url!
  });
  assert(!invalidBtn.success, 'URL button without URL must fail');

  // Test 4: Notification Payload Validation
  console.log('\n--- TEST 4: Send Notification Payload Validation ---');
  const validPayload: NotificationPayload = {
    recipient_name: 'সৌমেন দাস',
    phone_number: '+919832123456',
    trigger: 'order_confirmed',
    template_name: 'order_confirmed_bn',
    variables: {
      customer_name: 'সৌমেন দাস',
      order_id: 'ORD-2026-9871',
      total_amount: '৮৫০',
    },
    buttons: [
      {
        type: 'url',
        label: 'অর্ডার দেখুন',
        url: 'https://mmbook.in/account/orders/ORD-2026-9871',
      },
    ],
  };
  const payloadCheck = sendNotificationPayloadSchema.safeParse(validPayload);
  assert(payloadCheck.success, 'Complete valid notification payload must pass');

  const invalidTriggerPayload = {
    ...validPayload,
    trigger: 'invalid_event_type',
  };
  const triggerCheck = sendNotificationPayloadSchema.safeParse(invalidTriggerPayload);
  assert(!triggerCheck.success, 'Invalid trigger enum must fail');

  // Test 5: Customer Preference Schema
  console.log('\n--- TEST 5: Customer Notification Preferences ---');
  const prefData: CustomerNotificationPreference = {
    user_id: 'usr_malda_101',
    whatsapp_enabled: true,
    sms_enabled: true,
    email_enabled: false,
    promotions_opt_in: true,
    updated_at: new Date().toISOString(),
  };
  const prefCheck = customerNotificationPreferenceSchema.safeParse(prefData);
  assert(prefCheck.success, 'Customer preferences schema must validate');

  // Test 6: Opt-out Validation
  console.log('\n--- TEST 6: STOP Opt-Out Request ---');
  const optOut = optOutRequestSchema.safeParse({
    phone_number: '+919832123456',
    keyword: 'STOP',
    channel: 'all',
  });
  assert(optOut.success, 'Opt-out with STOP keyword must pass');

  const optOutBn = optOutRequestSchema.safeParse({
    phone_number: '+919832123456',
    keyword: 'থামুন',
    channel: 'sms',
  });
  assert(optOutBn.success, 'Opt-out with Bengali "থামুন" keyword must pass');

  // Test 7: Meta Webhook Schema Validation
  console.log('\n--- TEST 7: Meta WhatsApp Webhook Payload Validation ---');
  const metaWebhookSample = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'WHATSAPP_BIZ_ACC_1001',
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '919832000000',
                phone_number_id: 'PHONE_ID_1001',
              },
              statuses: [
                {
                  id: 'wamid.HBgLOTE5ODMyMTIzNDU2FQIAERgSMzAy',
                  status: 'delivered' as const,
                  timestamp: '1725984000',
                  recipient_id: '919832123456',
                },
              ],
            },
            field: 'messages',
          },
        ],
      },
    ],
  };
  const webhookCheck = metaWebhookPayloadSchema.safeParse(metaWebhookSample);
  assert(webhookCheck.success, 'Meta WhatsApp status webhook payload must pass validation');

  console.log('\n🎉 ALL TASK 1 TESTS PASSED SUCCESSFULLY! (100% Validations Working)');
}

runTask1Tests().catch((err) => {
  console.error('Fatal error running Task 1 test:', err);
  process.exit(1);
});
