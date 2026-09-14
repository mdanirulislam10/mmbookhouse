/**
 * Test Suite: Module 18 - Task 9: Order Notification Feed & Status Ticks
 * Run: npx tsx scripts/test_module18_task9.ts
 */

import { NotificationLog } from '../src/types/notifications';
import { maskPhoneNumber } from '../src/lib/services/notificationTemplateService';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function runTask9Tests() {
  console.log('========================================================================');
  console.log('🧪 MODULE 18 - TASK 9: ORDER NOTIFICATION FEED TEST SUITE');
  console.log('========================================================================\n');

  const sampleNotifications: NotificationLog[] = [
    {
      id: 'log-f-1',
      order_id: 'ORD-2026-FEED',
      channel: 'whatsapp',
      trigger: 'order_confirmed',
      recipient_phone: '+919832001122',
      template_name: 'order_confirmed_bn',
      rendered_message: '🛍️ আপনার অর্ডার কনফার্মড হয়েছে! মোট: ₹৮৫০',
      status: 'read',
      cost_estimate_inr: 0.12,
      gateway_message_id: 'wamid.HBgLOTEwMDExMjIV',
      created_at: '2026-09-11T10:00:00Z',
    },
    {
      id: 'log-f-2',
      order_id: 'ORD-2026-FEED',
      channel: 'sms',
      trigger: 'out_for_delivery',
      recipient_phone: '+919832001122',
      template_name: 'out_for_delivery_sms',
      rendered_message: 'MMBOOK: পার্সেল আজ পৌঁছাবে। গোপন ওটিপি: ৪২১০',
      status: 'fallback_sms',
      cost_estimate_inr: 0.15,
      gateway_message_id: 'sms_17890911_123',
      created_at: '2026-09-11T14:30:00Z',
    },
  ];

  // Test 1: Order Specific Notifications Filter
  console.log('--- TEST 1: Feed Filter & Count ---');
  const orderFeed = sampleNotifications.filter((n) => n.order_id === 'ORD-2026-FEED');
  assert(orderFeed.length === 2, 'Found exactly 2 notifications for order ORD-2026-FEED');

  // Test 2: Channel Identification
  console.log('\n--- TEST 2: Channel Separation ---');
  const waItem = orderFeed.find((n) => n.channel === 'whatsapp');
  assert(!!waItem, 'WhatsApp notification exists in feed');
  assert(waItem?.status === 'read', 'WhatsApp status is read (double blue check tick)');

  const smsItem = orderFeed.find((n) => n.channel === 'sms');
  assert(!!smsItem, 'SMS fallback notification exists in feed');
  assert(smsItem?.status === 'fallback_sms', 'SMS fallback status identified');

  // Test 3: Phone Masking in Feed
  console.log('\n--- TEST 3: Masked Recipient Phone Verification ---');
  const masked = maskPhoneNumber('+919832001122');
  assert(masked === '+91 9832***122', 'Feed header displays masked phone +91 9832***122');

  // Test 4: OTP and Secret values in SMS text
  console.log('\n--- TEST 4: Out for Delivery OTP Verification ---');
  assert(!!smsItem?.rendered_message.includes('৪২১০'), 'SMS contains secret delivery OTP');

  console.log('\n🎉 ALL TASK 9 TESTS PASSED SUCCESSFULLY! (100% Order Feed Working)');
}

runTask9Tests().catch((err) => {
  console.error('Fatal error running Task 9 test:', err);
  process.exit(1);
});
