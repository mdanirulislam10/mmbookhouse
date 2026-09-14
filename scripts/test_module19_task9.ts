import { StoreSettingsService } from '../src/lib/services/storeSettingsService';
import { defaultQueueService } from '../src/lib/services/notificationQueueService';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function runTask9Tests() {
  console.log('========================================================================');
  console.log('🧪 MODULE 19 - TASK 9: STORE SETTINGS, NOTICE BAR & OTP EXPORT TEST');
  console.log('========================================================================\n');

  const settingsService = new StoreSettingsService();

  // Test 1: Store Profile & Malda Physical Address (Item 47)
  console.log('--- TEST 1: Physical Shophouse Profile & Official UPI Info ---');
  const initialSettings = settingsService.getSettings();
  console.log('Store name:', initialSettings.store_name);
  console.log('Store address:', initialSettings.address);
  console.log('Official UPI ID:', initialSettings.upi_id);

  assert(initialSettings.store_name.includes('M.M Book House'), 'Store name is M.M Book House');
  assert(initialSettings.address.includes('মালদা'), 'Physical address mentions Malda shophouse');
  assert(initialSettings.upi_id === 'mmbookhouse@icici', 'Official UPI ID is configured');

  // Test 2: Maintenance Mode Toggle & RBAC Restriction (Item 45)
  console.log('\n--- TEST 2: Maintenance Mode Toggle & RBAC Guard ---');
  // Attempt by staff
  const staffAttempt = settingsService.updateSettings(
    { is_maintenance_mode: true },
    'dispatch_staff'
  );
  assert(staffAttempt.success === false, 'Blocked non-super_admin from enabling maintenance mode');
  assert(staffAttempt.error?.includes('সুপার অ্যাডমিন') === true, 'Returned RBAC error message');

  // Allowed for super_admin
  const adminAttempt = settingsService.updateSettings(
    { is_maintenance_mode: true },
    'super_admin'
  );
  assert(adminAttempt.success === true, 'Super Admin successfully enabled maintenance mode');
  assert(settingsService.isMaintenanceModeActive() === true, 'Maintenance mode is now active');

  // Super Admin bypass token test
  assert(
    settingsService.isMaintenanceModeActive('SUPER_ADMIN_BYPASS_KEY') === false,
    'Super Admin bypass token allows preview access while in maintenance mode'
  );

  // Restore maintenance mode to false
  settingsService.updateSettings({ is_maintenance_mode: false }, 'super_admin');
  assert(settingsService.isMaintenanceModeActive() === false, 'Maintenance mode successfully turned off');

  // Test 3: Announcement Notice Bar Update (Item 46)
  console.log('\n--- TEST 3: Header Announcement Notice Bar Real-time Editor ---');
  const noticeRes = settingsService.updateSettings(
    {
      announcement_notice: '📢 কলেজ ও অনার্স বইয়ের নতুন সংস্করণ এখন দোকানে উপলব্ধ!',
      announcement_bg_color: '#065f46',
    },
    'inventory_manager'
  );
  assert(noticeRes.success === true, 'Inventory Manager updated announcement notice bar');
  assert(
    settingsService.getSettings().announcement_notice?.includes('কলেজ ও অনার্স') === true,
    'Updated announcement notice successfully persisted'
  );

  // Test 4: High-Security Customer Data Export with 6-Digit OTP Gate (Item 48)
  console.log('\n--- TEST 4: Customer Data Export with Super-Admin OTP Gate ---');
  // Non-super_admin request
  const unauthorizedReq = settingsService.requestExportOtp('inventory_manager');
  assert(unauthorizedReq.success === false, 'Blocked inventory_manager from requesting export OTP');

  // Super Admin request
  const otpReq = settingsService.requestExportOtp('super_admin');
  assert(otpReq.success === true, 'Generated 6-digit OTP for super_admin');
  assert(otpReq.otpForTest !== undefined && otpReq.otpForTest.length === 6, 'Generated valid 6-digit OTP code');
  console.log('Export OTP generated:', otpReq.otpForTest);

  // Drain and verify WhatsApp security alert
  await defaultQueueService.drainQueue();
  const logs = defaultQueueService.getLogs();
  const alertLog = logs.find((l) => l.order_id === 'AUDIT-EXPORT');
  assert(alertLog !== undefined, 'Export security alert WhatsApp dispatched to owner');

  // Test wrong OTP verification
  const wrongOtpRes = settingsService.verifyOtpAndExportCustomers('000000', 'super_admin');
  assert(wrongOtpRes.success === false, 'Rejected incorrect OTP code');
  assert(wrongOtpRes.error?.includes('ভুল ওটিপি') === true, 'Returned incorrect OTP message');

  // Test correct OTP verification
  const correctOtpRes = settingsService.verifyOtpAndExportCustomers(otpReq.otpForTest!, 'super_admin');
  assert(correctOtpRes.success === true, 'OTP verified and customer CSV generated');
  assert(correctOtpRes.csv?.includes('Customer Name,Phone Number') === true, 'CSV contains proper headers');
  console.log('Customer CSV Export Preview:\n' + correctOtpRes.csv?.split('\n').slice(0, 3).join('\n'));

  console.log('\n========================================================================');
  console.log('🎉 ALL TESTS FOR MODULE 19 TASK 9 PASSED SUCCESSFULLY!');
  console.log('========================================================================\n');
}

runTask9Tests().catch((err) => {
  console.error(err);
  process.exit(1);
});
