import {
  createBundleEvent,
  calculateAttachRateStats,
  computeAbTestBreakdown,
} from '../src/lib/services/bundleAnalyticsService';
import { AdminBundleAnalyticsView } from '../src/components/admin/AdminBundleAnalyticsView';
import { BundleAnalyticsEvent } from '../src/types/bundle';

async function runTests() {
  console.log('🧪 Running Module 15 - Task 9 Verification: Bundle Analytics, Conversion & AOV Telemetry');

  // Test 1: Event logging structure (Item 28)
  console.log('Test 1: Event logging generation');
  const event = createBundleEvent({
    bundle_id: 'bundle-wb-math-10',
    primary_product_id: 'wb-math-10',
    event_type: 'CONVERT',
    item_ids: ['wb-math-10', 'wb-math-sol-10'],
    total_amount: 320,
    user_id: 'usr-9876',
  });

  if (!event.id.startsWith('event-') || !event.timestamp || event.total_amount !== 320) {
    throw new Error('Test 1 Failed: createBundleEvent failed to produce valid event entity');
  }
  console.log('✅ Test 1 Passed: Bundle event entity generated with valid telemetry ID and timestamp.');

  // Test 2: Attach Rate & AOV Uplift calculation (Items 45, 46)
  console.log('Test 2: Attach Rate & AOV Uplift calculation');
  const sampleEvents: BundleAnalyticsEvent[] = [
    createBundleEvent({
      bundle_id: 'b1',
      primary_product_id: 'p1',
      event_type: 'IMPRESSION',
      item_ids: ['p1', 'p2'],
    }),
    createBundleEvent({
      bundle_id: 'b1',
      primary_product_id: 'p1',
      event_type: 'CLICK',
      item_ids: ['p1', 'p2'],
    }),
    createBundleEvent({
      bundle_id: 'b1',
      primary_product_id: 'p1',
      event_type: 'CONVERT',
      item_ids: ['p1', 'p2'],
      total_amount: 280,
    }),
    createBundleEvent({
      bundle_id: 'b1',
      primary_product_id: 'p1',
      event_type: 'CONVERT',
      item_ids: ['p1', 'p2'],
      total_amount: 320,
    }),
  ];

  // If 10 people bought the primary book, and 2 bought the bundle -> attach rate = (2 / 10) * 100 = 20.0%
  // Average bundle order = (280 + 320) / 2 = 300
  // Standard single book orders average = 200
  // AOV Uplift = ((300 - 200) / 200) * 100 = 50.0%
  const stats = calculateAttachRateStats(sampleEvents, 10, [200, 200]);

  if (stats.attach_rate_percentage !== 20.0) {
    throw new Error(`Test 2 Failed: Expected attach rate 20.0%, got ${stats.attach_rate_percentage}%`);
  }
  if (stats.average_order_value_bundle !== 300) {
    throw new Error(`Test 2 Failed: Expected bundle AOV 300, got ${stats.average_order_value_bundle}`);
  }
  if (stats.aov_uplift_percentage !== 50.0) {
    throw new Error(`Test 2 Failed: Expected AOV uplift 50.0%, got ${stats.aov_uplift_percentage}%`);
  }
  console.log('✅ Test 2 Passed: Attach Rate (20%) and AOV Uplift (+50%) match mathematical formula.');

  // Test 3: A/B Testing Cohort Comparison (Item 47)
  console.log('Test 3: A/B Testing telemetry breakdown');
  const abEvents: (BundleAnalyticsEvent & { variant: 'A' | 'B' | 'C' })[] = [
    // Variant A (Control)
    { ...sampleEvents[0], variant: 'A', event_type: 'IMPRESSION' },
    { ...sampleEvents[0], variant: 'A', event_type: 'CONVERT', total_amount: 180 },
    // Variant C (Curated P1)
    { ...sampleEvents[0], variant: 'C', event_type: 'IMPRESSION' },
    { ...sampleEvents[0], variant: 'C', event_type: 'CLICK' },
    { ...sampleEvents[0], variant: 'C', event_type: 'CONVERT', total_amount: 290 },
  ];

  const abBreakdown = computeAbTestBreakdown(abEvents);
  if (!abBreakdown.A || !abBreakdown.B || !abBreakdown.C) {
    throw new Error('Test 3 Failed: Missing cohorts in A/B test results');
  }
  if (abBreakdown.C.total_revenue !== 290 || abBreakdown.C.conversions !== 1) {
    throw new Error('Test 3 Failed: Variant C metrics mismatched');
  }
  console.log('✅ Test 3 Passed: A/B testing cohort comparison calculated correctly.');

  // Test 4: Component export
  console.log('Test 4: Verify AdminBundleAnalyticsView export');
  if (typeof AdminBundleAnalyticsView !== 'function') {
    throw new Error('AdminBundleAnalyticsView must be a valid React component');
  }
  console.log('✅ Test 4 Passed: AdminBundleAnalyticsView component exported properly.');

  console.log('\n🎉 ALL 4 TESTS FOR TASK 9 PASSED SUCCESSFULLY!\n');
}

runTests().catch((err) => {
  console.error('❌ Task 9 verification failed:', err);
  process.exit(1);
});
