/**
 * Verification Script for Module 8 (Part 2: Tasks 11 to 20)
 * SLA Engine, Holiday Calendar, Courier Partner, and Delivery Calculator
 */

import {
  isSunday,
  isBusinessDay,
  addBusinessDays,
  formatAmazonDeliveryDate,
  getHolidayInfo,
} from '../src/lib/services/holidayCalendar';
import {
  calculateSLA,
  isMaldaTownPincode,
  determineDeliveryZone,
} from '../src/lib/services/slaEngine';
import { checkCourierServiceability } from '../src/lib/services/courierService';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 Starting Module 8 (Part 2: Tasks 11-20) Verification');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      if (detail) console.error(`   Details: ${detail}`);
      failed++;
    }
  }

  // ----------------------------------------------------------------
  // Task 17: Holiday Calendar & Business Day Tests
  // ----------------------------------------------------------------
  console.log('--- Task 17: Holiday Calendar & Sunday Exclusion ---');

  // Test Sunday exclusion (2026-03-01 is a Sunday)
  const sunday = new Date('2026-03-01T10:00:00Z');
  assert(isSunday(sunday), 'Identifies Sunday correctly');
  assert(!isBusinessDay(sunday), 'Sunday is not a business day');

  // Test Republic Day holiday (2026-01-26)
  const repDay = new Date('2026-01-26T10:00:00Z');
  const repInfo = getHolidayInfo(repDay);
  assert(repInfo !== null && repInfo.isNational, 'Identifies Republic Day as national holiday');
  assert(!isBusinessDay(repDay), 'Republic Day is excluded from business days');

  // Test Durga Puja Dashami holiday (2026-10-21)
  const dashami = new Date('2026-10-21T10:00:00Z');
  const dashamiInfo = getHolidayInfo(dashami);
  assert(dashamiInfo !== null && dashamiInfo.nameBn.includes('বিজয়া দশমী'), 'Identifies Durga Puja Dashami holiday');
  assert(!isBusinessDay(dashami), 'Vijaya Dashami is excluded from business days');

  // Test addBusinessDays skips Sundays and holidays
  // 2026-01-24 is Saturday. Adding 1 business day should skip Sunday (Jan 25) AND Republic Day (Jan 26 Monday), landing on Tuesday Jan 27!
  const satBeforeRepDay = new Date(2026, 0, 24); // Jan 24, 2026 Saturday
  const nextBizDay = addBusinessDays(satBeforeRepDay, 1);
  assert(
    nextBizDay.getDate() === 27,
    'addBusinessDays skips Sunday (Jan 25) and Republic Day (Jan 26) to land on Jan 27',
    `Expected Jan 27, got ${nextBizDay.toDateString()}`
  );

  // ----------------------------------------------------------------
  // Task 11: Amazon-Style Formatted Delivery Date
  // ----------------------------------------------------------------
  console.log('\n--- Task 11: Amazon-Style Formatted Delivery Date ---');
  const sampleDate = new Date(2026, 2, 11); // March 11, 2026 (Wednesday)
  const amazonFormat = formatAmazonDeliveryDate(sampleDate);
  assert(
    amazonFormat.dayOfWeekBn === 'বুধবার',
    'Formats Bengali day name correctly (বুধবার)'
  );
  assert(
    amazonFormat.formattedBn.includes('বুধবার') && amazonFormat.formattedBn.includes('মার্চ'),
    'Formats full Bengali date string correctly (বুধবার, ১১ মার্চ)'
  );
  assert(
    amazonFormat.fullPromiseBn.includes('ডেলিভারি হবে'),
    'Contains standard Amazon Bengali promise ("ডেলিভারি হবে...")'
  );

  // ----------------------------------------------------------------
  // Task 12: Malda Town SLA (732101 - 732103)
  // ----------------------------------------------------------------
  console.log('\n--- Task 12: Malda Town SLA ---');
  assert(isMaldaTownPincode('732101'), '732101 is Malda Town');
  assert(isMaldaTownPincode('732102'), '732102 is Malda Town');
  assert(isMaldaTownPincode('732103'), '732103 is Malda Town');
  assert(!isMaldaTownPincode('732124'), '732124 (Chanchal) is not Malda Town urban core');

  // Test order placed before 2 PM IST (11:00 AM IST = 5:30 UTC) on a business day
  const morningDate = new Date(Date.UTC(2026, 2, 10, 5, 30));
  const maldaMorningSla = calculateSLA('732101', { orderDate: morningDate });
  assert(
    maldaMorningSla.isSameDayEligible,
    'Order before 2 PM in Malda Town qualifies for same-day delivery'
  );
  assert(
    maldaMorningSla.slaBadgeBn.includes('আজ দুপুর ২টার মধ্যে অর্ডার করলে আজই ডেলিভারি'),
    'Contains Malda Same-Day badge text'
  );

  // Test order placed after 2 PM IST (4:30 PM IST = 11:00 UTC)
  const afternoonDate = new Date(Date.UTC(2026, 2, 10, 11, 0));
  const maldaAfternoonSla = calculateSLA('732101', { orderDate: afternoonDate });
  assert(
    maldaAfternoonSla.isTomorrow,
    'Order after 2 PM in Malda Town promises next-day delivery'
  );
  assert(
    maldaAfternoonSla.slaBadgeBn.includes('মালদা টাউনে আগামীকাল বিকেলের মধ্যে নিশ্চিত ফ্রি ডেলিভারি'),
    'Contains Malda Next-Day badge text'
  );

  // ----------------------------------------------------------------
  // Task 13: Regional SLA (North/South Dinajpur & Murshidabad)
  // ----------------------------------------------------------------
  console.log('\n--- Task 13: Regional SLA (Dinajpur & Murshidabad) ---');
  const raiganjSla = calculateSLA('733129'); // Raiganj (Uttar Dinajpur)
  assert(
    raiganjSla.slaBadgeBn.includes('১ থেকে ২ কার্যদিবসের মধ্যে ডেলিভারি'),
    'Raiganj (733129) has 1-2 business days SLA badge'
  );

  const berhamporeSla = calculateSLA('742101'); // Berhampore (Murshidabad)
  assert(
    berhamporeSla.slaBadgeBn.includes('১ থেকে ২ কার্যদিবসের মধ্যে ডেলিভারি'),
    'Murshidabad (742101) has 1-2 business days SLA badge'
  );

  // ----------------------------------------------------------------
  // Task 14: Kolkata & WB SLA
  // ----------------------------------------------------------------
  console.log('\n--- Task 14: Kolkata & West Bengal SLA ---');
  const kolkataSla = calculateSLA('700001'); // Kolkata GPO
  assert(
    kolkataSla.slaBadgeBn.includes('২ থেকে ৩ দিনের মধ্যে এক্সপ্রেস ডেলিভারি'),
    'Kolkata (700001) has 2-3 days express delivery SLA badge'
  );

  const durgapurSla = calculateSLA('713201'); // Durgapur (Paschim Bardhaman)
  assert(
    durgapurSla.slaBadgeBn.includes('২ থেকে ৩ দিনের মধ্যে এক্সপ্রেস ডেলিভারি'),
    'Durgapur (713201) has 2-3 days express delivery SLA badge'
  );

  // ----------------------------------------------------------------
  // Task 15: National SLA
  // ----------------------------------------------------------------
  console.log('\n--- Task 15: National SLA ---');
  const delhiSla = calculateSLA('110001'); // New Delhi
  assert(
    delhiSla.slaBadgeBn.includes('৪ থেকে ৬ কার্যদিবসের মধ্যে ডেলিভারি'),
    'New Delhi (110001) has 4-6 business days SLA badge'
  );
  assert(
    delhiSla.zone === 'national',
    'National zone correctly resolved for Delhi'
  );

  // ----------------------------------------------------------------
  // Task 20: Malda 2-Hour Super-Express Option
  // ----------------------------------------------------------------
  console.log('\n--- Task 20: Malda Municipality 2-Hour Super-Express Option ---');
  const expressSla = calculateSLA('732101', { isSuperExpressSelected: true });
  assert(
    expressSla.slaBadgeBn.includes('২ ঘণ্টার মধ্যে সুপার-এক্সপ্রেস ডেলিভারি'),
    'Malda 2-Hour super-express badge applied'
  );
  assert(
    expressSla.expressFee === 30,
    'Malda super-express fee is ₹30'
  );
  assert(
    expressSla.carrierRecommended === 'MM Local Rider',
    'Malda super-express uses MM Local Rider'
  );

  // ----------------------------------------------------------------
  // Task 18: Courier Serviceability API & Fallback
  // ----------------------------------------------------------------
  console.log('\n--- Task 18: Courier Partner Serviceability & Fallback ---');
  const courierLocal = await checkCourierServiceability({
    pincode: '732101',
    orderValue: 550,
  });
  assert(
    courierLocal.partnerName === 'MM Local Rider',
    'Local Malda uses MM Local Rider'
  );
  assert(
    courierLocal.isFreeDelivery,
    'Order >= ₹499 qualifies for free delivery'
  );
  assert(
    courierLocal.baseShippingCharge === 0,
    'Free shipping charge is ₹0'
  );

  const courierKolkata = await checkCourierServiceability({
    pincode: '700001',
    orderValue: 350,
  });
  assert(
    courierKolkata.partnerName === 'Delhivery' || courierKolkata.partnerName === 'Shiprocket' || courierKolkata.partnerName === 'India Post',
    'Kolkata routes to recognized courier partner'
  );
  assert(
    !courierKolkata.isFreeDelivery && courierKolkata.baseShippingCharge === 40,
    'Order < ₹499 charges ₹40 standard shipping'
  );

  console.log('\n====================================================');
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
