import {
  runPreLaunch50PointChecklist,
  simulateOneRupeeLiveSmokeTest,
  generateGoogleMerchantProductFeed,
  generateLaunchWhatsAppCampaignMessage,
  auditLegalPolicyRoutes,
} from '../src/lib/services/launchQAService';
import sitemap from '../src/app/sitemap';
import robots from '../src/app/robots';

console.log('🧪 Starting Module 20 Task 9 Test Suite: 50-Point Pre-Launch QA & Smoke Test...');

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failed++;
  }
}

async function runTests() {
  try {
    // Test 1: 50-Point Pre-Launch QA Checklist Audit (Item 41)
    const checklist = runPreLaunch50PointChecklist();
    assert(checklist.totalItems === 50, 'Checklist contains precisely all 50 architectural discovery items');
    assert(checklist.passedItems === 50, 'All 50 checklist items pass verification with 100% success');
    assert(checklist.failedItems === 0 && checklist.warningItems === 0, 'Zero failed or warning checklist items');
    assert(checklist.readyForLaunch === true, 'Platform declared 100% READY FOR LAUNCH');

    // Test 2: ₹1 Live Payment Smoke Test Simulation (Item 42)
    const smokeTest = simulateOneRupeeLiveSmokeTest('razorpay');
    assert(smokeTest.overallSuccess, '1-Rupee live smoke test completes with overallSuccess = true');
    assert(smokeTest.amount === 1.0, 'Smoke test transaction amount is ₹1.00');
    assert(smokeTest.orderCreated && smokeTest.signatureVerified, 'Order creation and cryptographic signature verified');
    assert(smokeTest.webhookProcessed && smokeTest.invoiceGenerated, 'Payment webhook processed and GST invoice generated');
    assert(smokeTest.thermalLabelReady, '4x6 thermal shipping label prepared for physical printer test');

    // Test 3: Google Search Console, Sitemap & Robots.txt (Item 44)
    const siteMapEntries = sitemap();
    const robotsRules = robots();

    assert(siteMapEntries.length > 30, 'Sitemap contains extensive canonical routes & categories');
    const hasTermsInSitemap = siteMapEntries.some((e) => e.url.includes('/terms'));
    const hasPrivacyInSitemap = siteMapEntries.some((e) => e.url.includes('/privacy'));
    const hasShippingInSitemap = siteMapEntries.some((e) => e.url.includes('/shipping-policy'));
    const hasRefundInSitemap = siteMapEntries.some((e) => e.url.includes('/refund-policy'));

    assert(
      hasTermsInSitemap && hasPrivacyInSitemap && hasShippingInSitemap && hasRefundInSitemap,
      'Sitemap indexes all mandatory legal compliance policy pages for Google Search Console'
    );

    assert(Array.isArray(robotsRules.rules) && robotsRules.rules.length >= 2, 'Robots.txt contains crawl budget optimization rules');

    // Test 4: Google Merchant Center Product Feed Generation (Item 45)
    const sampleBooks = [
      {
        id: 'wbcs-scanner-2026',
        title: 'WBCS Scanner 2026 (Bengali Edition)',
        description: 'Complete guide for WBCS prelims and mains.',
        price: 490,
        coverImage: '/images/books/wbcs.jpg',
        isbn: '9789354490123',
      },
      {
        id: 'madhyamik-test-paper',
        title: 'Madhyamik ABTA Test Paper 2026',
        description: 'West Bengal Board Class 10 full test paper.',
        price: 240,
        coverImage: '/images/books/abta.jpg',
      },
    ];

    const merchantFeed = generateGoogleMerchantProductFeed(sampleBooks);
    assert(merchantFeed.length === 2, 'Google Merchant feed formats both sample books');
    assert(merchantFeed[0].id === 'MM-wbcs-scanner-2026', 'Merchant item ID correctly prefixed with MM-');
    assert(merchantFeed[0].price === '490 INR', 'Merchant price formatted in standard ISO currency string');
    assert(merchantFeed[0].condition === 'new', 'Book condition set to "new"');
    assert(merchantFeed[0].availability === 'in_stock', 'Availability set to "in_stock"');

    // Test 5: Official Launch WhatsApp Campaign Message (Item 48)
    const campaign = generateLaunchWhatsAppCampaignMessage('সৌমিক সেন', 'LAUNCH2026');
    assert(campaign.messageBengali.includes('সৌমিক সেন'), 'WhatsApp message personalizes customer name');
    assert(campaign.messageBengali.includes('LAUNCH2026'), 'WhatsApp message features LAUNCH2026 promo coupon');
    assert(campaign.deepLink.includes('coupon=LAUNCH2026'), 'WhatsApp deep-link auto-applies discount');

    // Test 6: Legal & Compliance Policy Routes Audit (Item 46)
    const activeAppRoutes = [
      '/',
      '/deals',
      '/category/wbcs',
      '/terms',
      '/privacy',
      '/shipping-policy',
      '/refund-policy',
      '/support',
    ];
    const policyAudit = auditLegalPolicyRoutes(activeAppRoutes);
    assert(policyAudit.allPoliciesPresent, 'All mandatory legal policy routes verified present and active');
    assert(policyAudit.missingRoutes.length === 0, 'Zero missing legal routes');

  } catch (err: unknown) {
    console.error('Fatal error during Task 9 tests:', err);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`Task 9 Tests Completed: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
