import { OrderPipelineService } from '../src/lib/services/orderPipelineService';
import { defaultQueueService } from '../src/lib/services/notificationQueueService';

async function runTask5Tests() {
  console.log('🧪 Starting Module 19 - Task 5: Order Dispatch Pipeline, Handover Manifest & Store Pickup Tests...\n');
  const service = new OrderPipelineService();

  // Test 1: Initial Pipeline Counts
  console.log('--- Test 1: Initial Pipeline Counts ---');
  const counts = service.getPipelineCounts();
  console.log('Pipeline counts:', counts);
  if (counts.pending >= 1 && counts.ready_for_pickup >= 2) {
    console.log('✅ Test 1 Passed: Initial pipeline counts verified accurately.');
  } else {
    throw new Error('❌ Test 1 Failed: Pipeline counts mismatch');
  }

  // Test 2: Pipeline State Transitions & Notification Queue Trigger
  console.log('\n--- Test 2: Pipeline State Transitions & Notifications ---');
  const transition1 = service.updatePipelineStatus('ord_malda_101', 'processing');
  if (transition1.success && transition1.order?.pipeline_status === 'processing') {
    console.log('✅ Status updated to processing successfully.');
  } else {
    throw new Error('❌ Test 2 Failed: Status update to processing failed');
  }

  const transition2 = service.updatePipelineStatus('ord_malda_101', 'handed_over', {
    courier_name: 'Delhivery',
    awb_code: 'DEL-88771122',
  });
  if (
    transition2.success &&
    transition2.order?.pipeline_status === 'handed_over' &&
    transition2.order?.awb_code === 'DEL-88771122'
  ) {
    console.log('✅ Status updated to handed_over with AWB code DEL-88771122.');
  } else {
    throw new Error('❌ Test 2 Failed: Status update to handed_over failed');
  }

  await defaultQueueService.drainQueue();
  const logs = defaultQueueService.getLogs({ order_id: 'ord_malda_101' });
  console.log(`Notification logs count: ${logs.length}`);
  const packedNotif = logs.find((n) => n.trigger === 'order_packed');
  const shippedNotif = logs.find((n) => n.trigger === 'order_shipped');
  if (packedNotif && shippedNotif) {
    console.log('✅ Test 2 Passed: order_packed and order_shipped notifications successfully enqueued and processed.');
  } else {
    throw new Error('❌ Test 2 Failed: Notifications were not properly enqueued');
  }

  // Test 3: Smart Packing Slip Checklist Generator with Rack Location
  console.log('\n--- Test 3: Smart Packing Slip Checklist Generator ---');
  const packingSlip = service.generatePackingSlip('ord_malda_101');
  if (
    packingSlip &&
    packingSlip.order_number === 'MMB-9021' &&
    packingSlip.items_checklist[0].rack_location === 'Rack A-2, Shelf 1' &&
    packingSlip.items_checklist[0].quantity === 1
  ) {
    console.log('✅ Packing slip generated with rack location:', packingSlip.items_checklist[0].rack_location);
    console.log('✅ Test 3 Passed: Smart A5 packing slip format verified.');
  } else {
    throw new Error('❌ Test 3 Failed: Packing slip generation failed');
  }

  // Test 4: 1-Click "Request Courier Pickup"
  console.log('\n--- Test 4: 1-Click Request Courier Pickup ---');
  const pickupRes = service.requestCourierPickup(['ord_malda_101'], 'Delhivery');
  if (pickupRes.success && pickupRes.pickup_token.startsWith('PKUP_') && pickupRes.scheduled_orders_count === 1) {
    console.log(`✅ Courier pickup requested with token: ${pickupRes.pickup_token}`);
    console.log('✅ Test 4 Passed: 1-Click courier pickup scheduled.');
  } else {
    throw new Error('❌ Test 4 Failed: Courier pickup request failed');
  }

  // Test 5: Daily Dispatch Handover Manifest Sheet
  console.log('\n--- Test 5: Daily Dispatch Handover Manifest Sheet ---');
  const manifest = service.generateDailyManifest('Delhivery');
  console.log(`Manifest ID: ${manifest.manifest_id}, Total Parcels: ${manifest.total_parcels}`);
  if (manifest.total_parcels >= 1 && manifest.orders.some((o) => o.awb === 'DEL-99023412')) {
    console.log('✅ Test 5 Passed: Daily dispatch handover manifest compiled accurately.');
  } else {
    throw new Error('❌ Test 5 Failed: Handover manifest generation failed');
  }

  // Test 6: Super-Fast Global Multi-Field Search
  console.log('\n--- Test 6: Super-Fast Global Multi-Field Search ---');
  const searchByName = service.searchOrders('অমল');
  const searchByPhone = service.searchOrders('9832445566');
  const searchByOrderNum = service.searchOrders('MMB-9023');
  const searchByAwb = service.searchOrders('DEL-99023412');

  if (
    searchByName.length === 1 &&
    searchByPhone.length === 1 &&
    searchByOrderNum.length === 1 &&
    searchByAwb.length === 1
  ) {
    console.log('✅ Multi-field search results matched for name, phone, order number, and AWB.');
    console.log('✅ Test 6 Passed: Global search working smoothly.');
  } else {
    throw new Error('❌ Test 6 Failed: Global search verification failed');
  }

  // Test 7: Counter Store Pickup (Click & Collect) 4-Digit OTP Verification
  console.log('\n--- Test 7: Counter Store Pickup 4-Digit OTP Verification ---');
  const wrongOtpRes = service.verifyCounterPickupOtp('ord_malda_102', '1234');
  if (!wrongOtpRes.success && wrongOtpRes.error?.includes('ভুল ওটিপি')) {
    console.log('✅ Rejection of incorrect OTP verified.');
  } else {
    throw new Error('❌ Test 7 Failed: Failed to reject incorrect OTP');
  }

  const correctOtpRes = service.verifyCounterPickupOtp('ord_malda_102', '7821');
  if (
    correctOtpRes.success &&
    correctOtpRes.order?.pipeline_status === 'delivered' &&
    correctOtpRes.order?.payment_status === 'PAID'
  ) {
    console.log('✅ Counter pickup authenticated with OTP: 7821, order marked as delivered & PAID.');
    await defaultQueueService.drainQueue();
    const deliveredNotif = defaultQueueService.getLogs({ order_id: 'ord_malda_102' }).find((n) => n.trigger === 'order_delivered');
    if (deliveredNotif) {
      console.log('✅ Instant order_delivered notification dispatched to customer.');
    }
    console.log('✅ Test 7 Passed: Store pickup OTP verification complete.');
  } else {
    throw new Error('❌ Test 7 Failed: Correct OTP verification failed');
  }

  console.log('\n======================================================');
  console.log('🎉 ALL 7 TESTS FOR MODULE 19 TASK 5 PASSED SUCCESSFULLY!');
  console.log('======================================================\n');
}

runTask5Tests().catch((err) => {
  console.error(err);
  process.exit(1);
});
