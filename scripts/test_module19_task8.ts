import { StoreMarketingService } from '../src/lib/services/storeMarketingService';
import { defaultQueueService } from '../src/lib/services/notificationQueueService';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function runTask8Tests() {
  console.log('========================================================================');
  console.log('🧪 MODULE 19 - TASK 8: STORE MARKETING, COUPONS & DEALS TEST SUITE');
  console.log('========================================================================\n');

  const marketingService = new StoreMarketingService();

  // Test 1: Coupon Application & Rules Engine (Item 41)
  console.log('--- TEST 1: Discount Coupon Application & Validation ---');
  
  // Flat ₹50 discount
  const flatRes = marketingService.validateAndApplyCoupon('MADHYAMIK50', 520);
  assert(flatRes.valid === true, 'MADHYAMIK50 coupon validated successfully');
  assert(flatRes.discount_amount === 50, 'Applied flat discount of ₹50');
  assert(flatRes.final_total === 470, 'Final total is ₹470 (520 - 50)');

  // Percentage 10% discount with min order check
  const pctRes = marketingService.validateAndApplyCoupon('WBCS10', 1000);
  assert(pctRes.valid === true, 'WBCS10 percentage coupon validated');
  assert(pctRes.discount_amount === 100, 'Applied 10% discount of ₹100');
  assert(pctRes.final_total === 900, 'Final total is ₹900 (1000 - 100)');

  // Min order violation
  const minOrderRes = marketingService.validateAndApplyCoupon('MADHYAMIK50', 350); // min is 400
  assert(minOrderRes.valid === false, 'Rejected coupon when order is below min order value');
  assert(minOrderRes.error?.includes('ন্যূনতম ₹400') === true, 'Informative Bengali error returned');

  // Expired coupon
  const expiredRes = marketingService.validateAndApplyCoupon('EXPIRED10', 500);
  assert(expiredRes.valid === false, 'Rejected inactive / expired coupon');

  // Test 2: Flash Deal Countdown Scheduler (Item 42)
  console.log('\n--- TEST 2: Flash Deal Scheduler & Countdown Evaluator ---');
  const activeDeals = marketingService.getActiveFlashDeals();
  assert(activeDeals.length > 0, 'Found running active flash deal');
  assert(activeDeals[0].deal_id === 'deal_wbcs_2026', 'Matched WBCS 2026 flash deal');

  const countdown = marketingService.getDealCountdown('deal_wbcs_2026');
  assert(countdown !== null, 'Countdown calculated successfully');
  assert(countdown?.is_active === true, 'Deal is currently active');
  assert(countdown?.is_ended === false, 'Deal is not ended');
  assert(countdown!.hours >= 0, 'Remaining hours is positive');
  console.log(`Flash sale time remaining: ${countdown?.hours}h ${countdown?.minutes}m ${countdown?.seconds}s`);

  // Test 3: Frequently Bought Together Combo Bundles (Item 43)
  console.log('\n--- TEST 3: Frequently Bought Together Combo Bundler ---');
  const combos = marketingService.getActiveCombos();
  assert(combos.length > 0, 'Found active combo bundle');
  assert(combos[0].combo_price === 890, 'Combo price is ₹890');
  assert(combos[0].savings_inr === 125, 'Customer savings calculated as ₹125');

  // Create new bundle
  const newCombo = marketingService.createCombo({
    combo_id: 'combo_madhyamik_duo',
    title: 'Madhyamik 2026 Suggestion + Test Paper Duo',
    title_bn: 'মাধ্যমিক ২০২৬ সাজেশন ও টেস্ট পেপার ডুও কম্বো',
    book_skus: ['MADH-TEST-2026', 'MADH-SUGG-2026'],
    combo_price: 600,
    original_total_price: 700,
    savings_inr: 100,
    is_active: true,
  });
  assert(newCombo.savings_inr === 100, 'New combo savings calculated as ₹100');

  // Test 4: Abandoned Cart WhatsApp Recovery Trigger (Item 44)
  console.log('\n--- TEST 4: Abandoned Cart 1-Click WhatsApp Recovery Trigger ---');
  const dormantCarts = marketingService.getDormantCarts(2);
  assert(dormantCarts.length > 0, 'Found dormant abandoned cart older than 2 hours');

  const recoveryRes = marketingService.sendWhatsAppCartRecovery(dormantCarts[0].cart_id, 'READ5');
  assert(recoveryRes.success === true, 'WhatsApp cart recovery dispatched');
  assert(recoveryRes.cart?.recovery_sent === true, 'Cart marked as recovery sent');

  await defaultQueueService.drainQueue();
  const logs = defaultQueueService.getLogs();
  const cartNotif = logs.find((l) => l.trigger === 'abandoned_cart');
  assert(cartNotif !== undefined, 'Abandoned cart notification logged in queue history');
  console.log('Recovery message preview:', cartNotif?.rendered_message);

  console.log('\n========================================================================');
  console.log('🎉 ALL TESTS FOR MODULE 19 TASK 8 PASSED SUCCESSFULLY!');
  console.log('========================================================================\n');
}

runTask8Tests().catch((err) => {
  console.error(err);
  process.exit(1);
});
