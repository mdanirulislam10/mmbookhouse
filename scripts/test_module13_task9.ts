import {
  evaluateTransactionRisk,
  calculateTPlusOneSettlement,
  calculateMonthlyGatewayGstInvoice,
} from '../src/lib/services/merchantFinanceService';
import { PaymentTransaction } from '../src/types/payment';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

console.log('🧪 Testing Module 13 - Task 9: Merchant Finance Dashboard, Settlement & B2B GST Invoicing');

// 1. AI Risk & Fraud Scoring (Item 44)
const cleanTx = evaluateTransactionRisk({
  amount: 450,
  customerPhone: '9733085000',
  isInternationalCard: false,
  isVpnOrProxy: false,
  velocityAttemptsLast5Min: 1,
});
assert(cleanTx.riskLevel === 'LOW', 'Standard local payment scores LOW risk');
assert(cleanTx.isBlocked === false, 'Standard payment is not blocked');

const suspiciousTx = evaluateTransactionRisk({
  amount: 15000, // High value
  customerPhone: '9733085000',
  isInternationalCard: true, // International
  isVpnOrProxy: true, // VPN
  velocityAttemptsLast5Min: 5, // High velocity
});
assert(suspiciousTx.riskLevel === 'HIGH', 'Flagged as HIGH risk when multiple red flags trigger');
assert(suspiciousTx.isBlocked === true, 'High risk transaction is blocked from execution');
assert(suspiciousTx.flags.includes('ANONYMOUS_PROXY_OR_VPN'), 'Flags VPN/Proxy usage');

// 2. T+1 Settlement Cycle (Item 29)
const mockTxs: PaymentTransaction[] = [
  {
    id: '1',
    order_id: 'O1',
    payment_gateway: 'razorpay',
    transaction_id: 't1',
    payment_method: 'upi', // 0% fee
    amount: 1000,
    currency: 'INR',
    status: 'PAID',
    is_zero_surcharge: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    order_id: 'O2',
    payment_gateway: 'razorpay',
    transaction_id: 't2',
    payment_method: 'card', // Standard 2% fee
    amount: 500,
    currency: 'INR',
    status: 'PAID',
    is_zero_surcharge: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const baseFriday = new Date('2026-03-13T12:00:00Z'); // Friday
const fridaySettlement = calculateTPlusOneSettlement(mockTxs, baseFriday);
assert(fridaySettlement.gross_sales === 1500, 'Calculates gross sales correctly');
assert(fridaySettlement.gateway_fee === 10, 'Calculates 2% fee on ₹500 card transaction (₹10)');
assert(fridaySettlement.gst_on_fee === 1.8, 'Calculates 18% GST on ₹10 fee (₹1.80)');
assert(fridaySettlement.net_settlement_amount === 1488.2, 'Net payout equals gross - (fee + GST)');
assert(fridaySettlement.settlement_time === '10:00 AM', 'Settlement scheduled at 10:00 AM (Item 29)');

// Check Sunday skip logic: Saturday (Day 6) + 1 is Sunday (Day 0) -> skips to Monday
const baseSaturday = new Date('2026-03-14T12:00:00Z');
const satSettlement = calculateTPlusOneSettlement(mockTxs, baseSaturday);
assert(new Date(satSettlement.settlement_date).getDay() === 1, 'Sunday bank holiday skipped; settles on Monday');

// 3. Monthly B2B GST Invoicing for Gateway Charges (Item 47)
const monthlySummary = calculateMonthlyGatewayGstInvoice('March 2026', mockTxs);
assert(monthlySummary.totalGrossVolume === 1500, 'Gross monthly volume is ₹1,500');
assert(monthlySummary.zeroSurchargeVolume === 1000, 'UPI ₹1,000 recorded under 0% zero surcharge volume');
assert(monthlySummary.standardFeeVolume === 500, 'Card ₹500 recorded under standard fee volume');
assert(monthlySummary.gstOnFeeAmount === 1.8, '18% GST input credit tracked accurately');
assert(monthlySummary.itcEligibleGst === 1.8, 'Full 18% GST is ITC-eligible for merchant tax deductions');

console.log(`\nResults for Task 9: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
  process.exit(1);
}
