/**
 * Test Suite: Module 17 - Task 3: Moderation, Profanity Filter & Abuse Quarantine
 * Run with: npx tsx scripts/test_module17_task3.ts
 */

import {
  checkProfanity,
  sanitizeReviewContent,
  determineInitialReviewStatus,
  processAbuseReport,
  detectReviewBombing,
} from '../src/lib/services/reviewModerationService';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    process.exit(1);
  }
}

console.log('🧪 Starting Module 17 - Task 3 Test Suite: Moderation & Abuse Quarantine...\n');

// 1. Clean review passes
const cleanProfanity = checkProfanity('বইটি পরীক্ষার প্রস্তুতির জন্য অত্যন্ত তথ্যবহুল ও চমৎকার।');
assert(!cleanProfanity.hasProfanity && cleanProfanity.flaggedTerms.length === 0, 'Clean review has no profanity');
console.log('✅ Test 1 Passed: Clean review passes profanity check.');

// 2. Profanity detection (Bengali & English terms)
const badEnglish = checkProfanity('This seller is a cheat and sold a fake product');
assert(badEnglish.hasProfanity && badEnglish.flaggedTerms.includes('cheat'), 'English abusive terms detected');

const badBengali = checkProfanity('দোকানদার একদম বাটপাড় এবং হারামি লোক');
assert(badBengali.hasProfanity && badBengali.flaggedTerms.includes('হারামি'), 'Bengali abusive slang detected');
console.log('✅ Test 2 Passed: Bilingual profanity detected accurately.');

// 3. Initial review moderation status (Item 10)
const cleanStatus = determineInitialReviewStatus({
  headline: 'Great WBCS Manual',
  body: 'Comprehensive and very easy to follow explanations for West Bengal students.',
});
assert(cleanStatus.status === 'approved' && !cleanStatus.isFlagged, 'Clean review auto-approved');

const flaggedStatus = determineInitialReviewStatus({
  headline: 'Scam alert',
  body: 'Don not buy this book, complete scam seller.',
});
assert(flaggedStatus.status === 'flagged_for_review' && flaggedStatus.isFlagged, 'Profanity flags review into moderation queue');
console.log('✅ Test 3 Passed: Auto-approval and moderation queue routing verified.');

// 4. Contact info sanitization (Item 28)
const textWithPhone = 'If anyone wants this book call me on 9832145678 immediately.';
const sanitizedPhone = sanitizeReviewContent(textWithPhone);
assert(sanitizedPhone.hasContactInfo, 'Phone number detected in review');
assert(sanitizedPhone.sanitizedText.includes('[PHONE PROTECTED]'), 'Phone number masked in sanitized output');
assert(!sanitizedPhone.isClean, 'Text with phone is marked not clean');
console.log('✅ Test 4 Passed: Contact phone numbers detected and masked.');

// 5. External spam link sanitization (Item 28)
const textWithLink = 'Download free pdf from https://freebooks.org/download.pdf today!';
const sanitizedLink = sanitizeReviewContent(textWithLink);
assert(sanitizedLink.hasLinks, 'External URL detected');
assert(sanitizedLink.sanitizedText.includes('[LINK REMOVED]'), 'External link stripped');
console.log('✅ Test 5 Passed: External promotional links detected and removed.');

// 6. Community abuse report auto-quarantine (Item 18 - 3 flags threshold)
const report1 = processAbuseReport(0, 3);
assert(!report1.shouldQuarantine && report1.newStatus === 'approved', '1st report does not quarantine');

const report2 = processAbuseReport(1, 3);
assert(!report2.shouldQuarantine && report2.newStatus === 'approved', '2nd report does not quarantine');

const report3 = processAbuseReport(2, 3);
assert(report3.shouldQuarantine && report3.newStatus === 'flagged_for_review', '3rd report auto-quarantines review');
assert(Boolean(report3.messageEn && report3.messageBn), 'Bilingual feedback returned on quarantine');
console.log('✅ Test 6 Passed: 3-Report community abuse threshold triggers automatic quarantine.');

// 7. Review bombing detection (Item 41)
const normalSpike = detectReviewBombing({
  negativeReviewsLast24h: 2,
  historicalDailyAverage: 2,
});
assert(!normalSpike.isBombingSuspicious, 'Normal negative review volume is not bombing');

const abnormalSpike = detectReviewBombing({
  negativeReviewsLast24h: 15,
  historicalDailyAverage: 2,
});
assert(abnormalSpike.isBombingSuspicious, '15 reviews vs avg of 2 (7.5x) detected as review bombing');
assert(abnormalSpike.quarantineRecommended, 'Quarantine recommended for bombing spike');
console.log('✅ Test 7 Passed: Review bombing detection algorithm verified.');

console.log('\n🎉 ALL MODULE 17 TASK 3 TESTS PASSED SUCCESSFULLY! (7/7 Checks)\n');
