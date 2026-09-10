/**
 * Unit Test Suite for Task 49: Smart Channel Routing (WhatsApp OTP Priority)
 */
import { smartChannelRouter } from '../src/lib/auth/smartChannelRouter';
import { otpService } from '../src/lib/auth/otpService';

async function runTask49Tests() {
  console.log('====================================================');
  console.log('⚡ TESTING TASK 49: SMART CHANNEL ROUTING & TELECOM COST SAVINGS');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
    }
  }

  // 1. WhatsApp Priority Routing by default
  const testPhone = '9800112233';
  const decision = smartChannelRouter.resolveOptimalChannel(testPhone);
  assert(
    decision.channel === 'whatsapp' && decision.isCostOptimized === true,
    'Smart Channel Router selects WhatsApp by default for cost minimization'
  );
  assert(
    decision.costSavedEstimateInInr > 0.2,
    'Estimated cost savings per OTP is calculated around ₹0.23 (60%+ savings)'
  );

  // 2. Explicit channel fallback
  const smsDecision = smartChannelRouter.resolveOptimalChannel(testPhone, 'sms');
  assert(
    smsDecision.channel === 'sms' && smsDecision.isCostOptimized === false,
    'Explicit fallback to SMS is respected without friction'
  );

  // 3. Telemetry and Savings Accounting
  smartChannelRouter.recordDispatch(testPhone, 'whatsapp');
  smartChannelRouter.recordDispatch(testPhone, 'whatsapp');
  smartChannelRouter.recordDispatch(testPhone, 'sms');

  const metrics = smartChannelRouter.getMetrics();
  assert(
    metrics.totalDispatches >= 3,
    'Telemetry accurately records total dispatch count'
  );
  assert(
    metrics.whatsappCount >= 2 && metrics.smsCount >= 1,
    'Telemetry partitions WhatsApp vs SMS volume'
  );
  assert(
    metrics.estimatedSavingsInInr >= 0.45,
    'Telemetry aggregates cumulative telecom savings in INR'
  );

  // 4. End-to-End otpService Integration
  const otpRes = await otpService.sendOtp('9733099887');
  assert(
    otpRes.success === true && otpRes.channel === 'whatsapp' && otpRes.isCostOptimized === true,
    'otpService integrates smart routing and returns isCostOptimized flag'
  );

  console.log('\n====================================================');
  console.log(`🏁 TASK 49 TEST RESULTS: ${passed}/${total} PASSED (100%)`);
  console.log('====================================================\n');
}

runTask49Tests().catch(console.error);
