/**
 * Test Suite: Module 18 - Task 2: Phone Sanitizer & 10 Bengali Transactional Templates
 * Run: npx tsx scripts/test_module18_task2.ts
 */

import {
  sanitizePhoneNumberE164,
  maskPhoneNumber,
  renderNotificationMessage,
  getNotificationButtons,
  NOTIFICATION_TEMPLATES,
  DLT_SENDER_HEADER,
  DLT_PRINCIPAL_ENTITY_ID,
} from '../src/lib/services/notificationTemplateService';
import { NotificationTrigger } from '../src/types/notifications';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function runTask2Tests() {
  console.log('========================================================================');
  console.log('🧪 MODULE 18 - TASK 2: PHONE SANITIZER & 10 BENGALI TEMPLATES TEST SUITE');
  console.log('========================================================================\n');

  // Test 1: Phone Sanitizer with Diverse Indian Formats
  console.log('--- TEST 1: Phone Sanitizer E.164 & Masking ---');
  
  const p1 = sanitizePhoneNumberE164('9832123456');
  assert(p1.valid && p1.formatted === '+919832123456', '10-digit raw number formats to +919832123456');
  assert(p1.masked === '+91 9832***456', `Masked format is correct: ${p1.masked}`);

  const p2 = sanitizePhoneNumberE164('09832123456');
  assert(p2.valid && p2.formatted === '+919832123456', 'Leading 0 number formats to +919832123456');

  const p3 = sanitizePhoneNumberE164('+91 9832-123456');
  assert(p3.valid && p3.formatted === '+919832123456', 'Formatted +91 with spaces and dashes parses correctly');

  const p4 = sanitizePhoneNumberE164('919832123456');
  assert(p4.valid && p4.formatted === '+919832123456', '12-digit number starting with 91 parses correctly');

  const p5 = sanitizePhoneNumberE164('5832123456');
  assert(!p5.valid && !!p5.error, 'Invalid first digit (5) fails sanitization');

  const p6 = sanitizePhoneNumberE164('12345');
  assert(!p6.valid && !!p6.error, 'Short number fails sanitization');

  // Test 2: Mask Phone Utility
  console.log('\n--- TEST 2: Standalone Masking Utility ---');
  const masked = maskPhoneNumber('+916295551234');
  assert(masked === '+91 6295***234', 'Masking preserves first 4 digits and last 3 digits');

  // Test 3: TRAI DLT Headers & Metadata
  console.log('\n--- TEST 3: TRAI DLT Compliance Settings ---');
  assert(DLT_SENDER_HEADER === 'MMBOOK', 'DLT Sender Header must be MMBOOK');
  assert(DLT_PRINCIPAL_ENTITY_ID === '1701158291000010482', 'Principal Entity ID configured correctly');

  // Test 4: Verify All 10 Transactional Triggers
  console.log('\n--- TEST 4: Verify All 10 Bengali Transactional Triggers ---');
  const triggers: NotificationTrigger[] = [
    'order_confirmed',
    'cod_verification',
    'order_packed',
    'order_shipped',
    'out_for_delivery',
    'order_delivered',
    'delivery_attempted',
    'order_cancelled_refund',
    'review_request',
    'abandoned_cart',
  ];

  assert(Object.keys(NOTIFICATION_TEMPLATES).length === 10, 'Must have exactly 10 triggers defined');

  const sampleVars = {
    customer_name: 'অনিরুদ্ধ ব্যানার্জী',
    order_id: 'ORD-9871',
    total_amount: '1250',
    payment_mode: 'UPI (PhonePe)',
    delivery_address: 'মহেশমাটি, মালদা, ৭৩২৪০১',
    book_titles: 'WBCS স্ক্যানার ২০২৬ ও আধুনিক ভারত',
    courier_name: 'Blue Dart Express',
    awb_code: 'BLUDART-983210',
    est_delivery_date: '১২ সেপ্টেম্বর ২০২৬',
    delivery_agent_name: 'রাহুল কর্মকার',
    delivery_agent_phone: '9832198321',
    otp_code: '4928',
    collect_amount: '০',
    failure_reason: 'গ্রাহকের ফোন নট রিচেবল',
    next_attempt_date: '১৩ সেপ্টেম্বর',
    refund_amount: '1250',
    refund_utr: 'UTR829100234182',
    book_name: 'WBCS স্ক্যানার ২০২৬',
    coin_reward: '২০',
    cart_items_preview: 'দেশ বিদেশের সেরা গল্প ও ব্যাকরণ',
    coupon_code: 'READ5',
  };

  for (const trig of triggers) {
    const tpl = NOTIFICATION_TEMPLATES[trig];
    assert(!!tpl, `Template for ${trig} exists`);
    assert(tpl.dltHeader === 'MMBOOK', `DLT Header is MMBOOK for ${trig}`);
    assert(tpl.dltTemplateId.startsWith('10071612'), `DLT Template ID valid for ${trig}`);

    // Render WhatsApp
    const waMsg = renderNotificationMessage(trig, 'whatsapp', sampleVars);
    assert(waMsg.length > 20, `WhatsApp message rendered for ${trig} (length: ${waMsg.length})`);
    assert(waMsg.includes(tpl.titleBn.split(' ')[0]), `WhatsApp message contains title emoji for ${trig}`);

    // Render SMS
    const smsMsg = renderNotificationMessage(trig, 'sms', sampleVars);
    assert(smsMsg.startsWith('MMBOOK:'), `SMS message starts with MMBOOK: for ${trig}`);
    assert(smsMsg.length > 20, `SMS message rendered for ${trig}`);

    // Default Buttons
    const buttons = getNotificationButtons(trig, sampleVars);
    assert(buttons.length >= 1, `At least 1 action button configured for ${trig}`);

    // Special checks for specific triggers
    if (trig === 'cod_verification') {
      const confirmBtn = buttons.find((b) => b.payload?.includes('CONFIRM_COD'));
      assert(!!confirmBtn, 'COD Verification has 1-tap confirmation quick reply button');
      const cancelBtn = buttons.find((b) => b.payload?.includes('CANCEL_COD'));
      assert(!!cancelBtn, 'COD Verification has cancellation quick reply button');
    }

    if (trig === 'out_for_delivery') {
      assert(waMsg.includes('4928'), 'Out for delivery WhatsApp message includes OTP code 4928');
      assert(smsMsg.includes('4928'), 'Out for delivery SMS message includes OTP code 4928');
    }

    if (trig === 'order_cancelled_refund') {
      assert(waMsg.includes('UTR829100234182'), 'Refund WhatsApp message contains Bank UTR');
    }
  }

  console.log('\n🎉 ALL TASK 2 TESTS PASSED SUCCESSFULLY! (100% Templates & Sanitizer Working)');
}

runTask2Tests().catch((err) => {
  console.error('Fatal error running Task 2 test:', err);
  process.exit(1);
});
