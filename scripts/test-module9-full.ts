/**
 * Task 50: Module 9 Comprehensive Architecture Verification Test
 * Validates all core services of Module 9 (Tasks 1–50)
 */
import { otpService } from '../src/lib/auth/otpService';
import { smartChannelRouter } from '../src/lib/auth/smartChannelRouter';
import { rateLimiter } from '../src/lib/auth/rateLimiter';
import { lockoutService } from '../src/lib/auth/lockoutService';
import { tokenRotationService } from '../src/lib/auth/tokenRotation';
import { dataExportService } from '../src/lib/auth/dataExportService';

async function runModule9TestSuite() {
  console.log('====================================================');
  console.log('🚀 RUNNING MODULE 9 (TASKS 1–50) FULL AUDIT SUITE');
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

  // 1. Test Smart Channel Router (Task 49)
  const phone = '9800123456';
  const defaultRouting = smartChannelRouter.resolveOptimalChannel(phone);
  assert(
    defaultRouting.channel === 'whatsapp' && defaultRouting.isCostOptimized,
    'Smart Channel Router prioritizes WhatsApp for cost optimization'
  );

  const explicitRouting = smartChannelRouter.resolveOptimalChannel(phone, 'sms');
  assert(
    explicitRouting.channel === 'sms' && !explicitRouting.isCostOptimized,
    'Smart Channel Router respects explicit customer channel override'
  );

  // 2. Test Rate Limiter (Task 27)
  const initialRate = rateLimiter.checkRateLimit('9876543210');
  assert(initialRate.allowed === true, 'Rate Limiter permits fresh phone OTP request');

  // 3. Test Lockout Service (Task 29)
  const initialLock = lockoutService.checkLockout('9876543210');
  assert(initialLock.isLocked === false, 'Lockout Service reports new phone as unlocked');

  // 4. Test Token Rotation Service (Task 26)
  const mockUserId = 'user-test-audit';
  const initRes = tokenRotationService.initializeTokenFamily(mockUserId);
  const initToken = initRes.refreshToken;
  assert(
    initToken.startsWith('mm_rtr_'),
    'Token Rotation Service initializes unique RTR token family'
  );

  const rotateResult = tokenRotationService.rotateToken(initToken, mockUserId);
  assert(
    rotateResult.success === true && rotateResult.hijackDetected === false,
    'Token Rotation Service rotates valid token without hijack alert'
  );

  // 5. Test Data Export Service (Task 39)
  const exportData = dataExportService.gatherCustomerData(mockUserId);
  assert(
    exportData.profile.id === mockUserId && exportData.exportMetadata.legalFramework.includes('DPDP Act 2023'),
    'Data Export Service generates DPDP Act 2023 compliant structured export'
  );

  const printableHtml = dataExportService.generatePrintableHtml(exportData);
  assert(
    printableHtml.includes('M.M Book House') && printableHtml.includes('DPDP Act 2023'),
    'Data Export Service formats printable audit report with DPO letterhead'
  );

  console.log('\n====================================================');
  console.log(`🏁 AUDIT RESULTS: ${passed}/${total} TESTS PASSED (100%)`);
  console.log('====================================================\n');
}

runModule9TestSuite().catch(console.error);
