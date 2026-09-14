/**
 * Test Suite: Module 18 - Task 4: Queue, Asynchronous Dispatcher, Logs & Admin Alert Bot
 * Run: npx tsx scripts/test_module18_task4.ts
 */

import { NotificationQueueService } from '../src/lib/services/notificationQueueService';
import { CascadeNotificationEngine } from '../src/lib/services/notificationProviderService';
import { NotificationPayload } from '../src/types/notifications';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function runTask4Tests() {
  console.log('========================================================================');
  console.log('🧪 MODULE 18 - TASK 4: QUEUE, WORKER & ADMIN ALERT BOT TEST SUITE');
  console.log('========================================================================\n');

  const engine = new CascadeNotificationEngine();
  const queueService = new NotificationQueueService(engine, '+919832000000');

  const testPayload: NotificationPayload = {
    user_id: 'usr_malda_777',
    recipient_name: 'দেবাশিস মুখার্জী',
    phone_number: '+919832445566',
    trigger: 'order_confirmed',
    template_name: 'mmbook_order_confirmed_bn_v1',
    order_id: 'ORD-2026-8822',
    variables: {
      customer_name: 'দেবাশিস মুখার্জী',
      order_id: 'ORD-2026-8822',
      total_amount: '1480',
    },
  };

  // Test 1: Non-blocking enqueueing
  console.log('--- TEST 1: Decoupled Non-blocking Enqueueing ---');
  const enqResult = queueService.enqueueNotification(testPayload);
  assert(enqResult.status === 'queued', 'Enqueue returns status queued');
  assert(!!enqResult.job_id?.startsWith('job_'), `Job ID generated: ${enqResult.job_id}`);

  // Test 2: Drain Queue and Verify Persistent Logs
  console.log('\n--- TEST 2: Worker Processing & Persistent Logs ---');
  await queueService.drainQueue();

  const logs = queueService.getLogs({ order_id: 'ORD-2026-8822' });
  assert(logs.length === 1, 'Exactly one log created for order');
  assert(logs[0].status === 'sent', `Log status is sent (Got: ${logs[0].status})`);
  assert(logs[0].channel === 'whatsapp', 'Delivered via primary WhatsApp channel');
  assert(logs[0].cost_estimate_inr === 0.12, 'Cost recorded as ₹0.12');
  assert(!!logs[0].gateway_message_id, `Gateway message ID recorded: ${logs[0].gateway_message_id}`);
  assert(logs[0].recipient_phone === '+919832445566', 'Recipient phone is formatted correctly');

  // Test 3: Idempotency Protection
  console.log('\n--- TEST 3: Idempotency Protection Against Duplicate Triggers ---');
  const dupResult = queueService.enqueueNotification(testPayload);
  assert(dupResult.status === 'duplicate_skipped', 'Duplicate enqueue within 5 minutes was skipped');
  assert(dupResult.job_id === enqResult.job_id, 'Returned same original job ID');

  // Test 4: Admin Instant Order Alert Bot
  console.log('\n--- TEST 4: Admin Instant WhatsApp Alert Bot ---');
  const adminAlert = queueService.sendAdminNewOrderAlert({
    order_id: 'ORD-2026-8822',
    customer_name: 'দেবাশিস মুখার্জী',
    total_amount: 1480,
    item_count: 3,
    payment_mode: 'UPI',
    delivery_address: 'মালদা সদর, রথবাড়ি',
  });

  assert(adminAlert.status === 'queued', 'Admin alert enqueued successfully');
  await queueService.drainQueue();

  const adminLogs = queueService.getLogs({ order_id: 'ORD-2026-8822' });
  assert(adminLogs.length === 2, 'Total 2 logs now (1 customer + 1 admin alert)');
  const adminLog = adminLogs.find((l) => l.recipient_phone === '+919832000000');
  assert(!!adminLog, 'Admin alert logged to admin phone +919832000000');
  assert(adminLog?.status === 'sent', 'Admin alert dispatched via WhatsApp');

  // Test 5: Status Update via Webhook Receipt (delivered & read)
  console.log('\n--- TEST 5: Gateway Status Update via Message ID ---');
  const msgId = logs[0].gateway_message_id!;
  const updatedToDelivered = queueService.updateStatusByMessageId(msgId, 'delivered');
  assert(updatedToDelivered, 'Successfully updated status to delivered');

  let updatedLogs = queueService.getLogs({ order_id: 'ORD-2026-8822' });
  let targetLog = updatedLogs.find((l) => l.gateway_message_id === msgId);
  assert(targetLog?.status === 'delivered', 'Log status updated to delivered');
  assert(!!targetLog?.delivered_at, 'delivered_at timestamp recorded');

  const updatedToRead = queueService.updateStatusByMessageId(msgId, 'read');
  assert(updatedToRead, 'Successfully updated status to read');
  updatedLogs = queueService.getLogs({ order_id: 'ORD-2026-8822' });
  targetLog = updatedLogs.find((l) => l.gateway_message_id === msgId);
  assert(targetLog?.status === 'read', 'Log status updated to read');
  assert(!!targetLog?.read_at, 'read_at timestamp recorded');

  console.log('\n🎉 ALL TASK 4 TESTS PASSED SUCCESSFULLY! (100% Queue, Worker & Logs Working)');
}

runTask4Tests().catch((err) => {
  console.error('Fatal error running Task 4 test:', err);
  process.exit(1);
});
