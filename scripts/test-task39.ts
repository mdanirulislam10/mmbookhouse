import { dataExportService } from '../src/lib/auth/dataExportService';
import { dpdpCompliance } from '../src/lib/auth/dpdpCompliance';
import { profileService, DEFAULT_CUSTOMER_PROFILE } from '../src/lib/auth/profileService';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    process.exit(1);
  }
  console.log(`✅ Passed: ${message}`);
}

console.log('====================================================');
console.log('🧪 Running Test Suite: Task 39 (DPDP Data Portability)');
console.log('====================================================\n');

// 1. Test data gathering
console.log('🔹 [Step 1] Gathering Complete Customer Portable Data');
const testUserId = 'user-demo-sabir';
const customerData = dataExportService.gatherCustomerData(testUserId);

assert(customerData !== null && typeof customerData === 'object', 'Customer portable data gathered successfully');
assert(Boolean(customerData.exportMetadata.exportId), `Export ID generated: ${customerData.exportMetadata.exportId}`);
assert(customerData.exportMetadata.legalFramework.includes('Digital Personal Data Protection Act, 2023'), 'Legal framework references DPDP Act 2023 Section 11');
assert(customerData.profile.fullName === 'সাবির আহমেদ', 'Profile name correctly matches demo profile');
assert(customerData.profile.phoneNumber === '9800123456', 'Verified phone number correctly extracted');
assert(customerData.examPreferences.length > 0, `Exam preferences captured: ${customerData.examPreferences.map(e => e.nameBn).join(', ')}`);
assert(customerData.savedAddresses.length > 0, `Saved addresses present: ${customerData.savedAddresses[0].addressLine1}`);
assert(customerData.orderHistory.length > 0, `Order history populated: ${customerData.orderHistory[0].orderId}`);
assert(Boolean(customerData.dpdpConsents.essential_auth), 'DPDP essential auth consent captured');
assert(customerData.activeSessions.length > 0, `Active sessions listed: ${customerData.activeSessions.length} session(s)`);

// 2. Test Printable HTML Report Generation
console.log('\n🔹 [Step 2] Generating Official Printable HTML Report');
const htmlReport = dataExportService.generatePrintableHtml(customerData);

assert(htmlReport.includes('M.M Book House (এম.এম বুক হাউস)'), 'Letterhead brand name present in HTML report');
assert(htmlReport.includes(customerData.exportMetadata.exportId), 'Export Reference ID is printed on report');
assert(htmlReport.includes('DPDP Act 2023 Sec 11 Compliant'), 'DPDP Section 11 compliance badge present');
assert(htmlReport.includes('ব্যক্তিগত প্রোফাইল ও পরিচিতি বিবরণ'), 'Section 1 Profile title present in HTML report');
assert(htmlReport.includes('পূর্ববর্তী বই অর্ডার ও চালান ইতিহাস'), 'Section 5 Order history table present in HTML report');
assert(htmlReport.includes('ডাটা প্রটেকশন অফিসার ও অভিযোগ প্রতিকার সেল'), 'DPO Grievance section present in HTML report');
assert(htmlReport.includes('@media print'), 'Responsive CSS print styles included');

// 3. Test JSON Export serialization
console.log('\n🔹 [Step 3] Testing JSON Serialization Integrity');
const serializedJson = JSON.stringify(customerData, null, 2);
const parsedBack = JSON.parse(serializedJson);
assert(parsedBack.exportMetadata.exportId === customerData.exportMetadata.exportId, 'JSON serialization and parsing lossless');
assert(parsedBack.profile.phoneNumber === customerData.profile.phoneNumber, 'Phone number intact in JSON');

console.log('\n====================================================');
console.log('🎉 All Task 39 Data Portability tests passed with 100% success!');
console.log('====================================================\n');
