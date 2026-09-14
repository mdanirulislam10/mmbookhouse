import {
  grantPaymentFailureGracePeriod,
  getFailureGracePeriodRemainingSeconds,
  clearFailureGracePeriod,
  getFriendlyBankErrorMessage,
  generateRecoveryOptions,
  generateWhatsAppRecoveryPayLink,
  getPaymentHelplineDetails,
  PAYMENT_HELPLINE_PHONE,
} from '../src/lib/services/paymentRecoveryService';

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

console.log('🧪 Testing Module 13 - Task 6: Payment Failure Recovery, 3-Min Grace & WhatsApp Pay-Link');

// 1. Test 3-Minute Stock Grace Period (Item 34)
const orderId = 'MMB-9042';
const grace = grantPaymentFailureGracePeriod(orderId, 180);
assert(grace.remainingSeconds === 180, 'Initial grace period is 180 seconds (3 minutes)');

const remaining = getFailureGracePeriodRemainingSeconds(orderId);
assert(remaining > 0 && remaining <= 180, 'Remaining grace seconds accurately tracked');

clearFailureGracePeriod(orderId);
assert(getFailureGracePeriodRemainingSeconds(orderId) === 0, 'Grace period cleared after resolution');

// 2. Friendly Bank Downtime Messages (Item 30)
const bankDownMsg = getFriendlyBankErrorMessage('GATEWAY_BANK_DOWN_503');
assert(bankDownMsg.isBankDowntime === true, 'Detects bank downtime error');
assert(bankDownMsg.messageBn.includes('বিকল্প ব্যাংক'), 'Suggests alternate bank in Bengali');

const timeoutMsg = getFriendlyBankErrorMessage('PAYMENT_TIMEOUT');
assert(timeoutMsg.messageBn.includes('কোনো টাকা কাটা হয়নি'), 'Reassures no money deducted on timeout');

// 3. 3 Smooth Recovery Options (Item 32)
// For order <= ₹2,500, all 3 options (UPI, Card, Convert to COD) are available
const optionsUnder2500 = generateRecoveryOptions('MMB-9042', 1200, '9832012345');
assert(optionsUnder2500.cart_preserved === true, 'Cart is preserved on failure (Item 31)');
assert(optionsUnder2500.suggested_options.length === 3, 'Presents 3 recovery options');
assert(optionsUnder2500.suggested_options.includes('retry_upi'), 'Option 1: Retry Alternate UPI');
assert(optionsUnder2500.suggested_options.includes('try_card'), 'Option 2: Try Card');
assert(optionsUnder2500.suggested_options.includes('convert_to_cod'), 'Option 3: Convert to COD (eligible)');

// For order > ₹2,500, COD option is excluded because of ₹2,500 cap
const optionsOver2500 = generateRecoveryOptions('MMB-9043', 2800, '9832012345');
assert(!optionsOver2500.suggested_options.includes('convert_to_cod'), 'Over ₹2,500 order does not offer COD conversion');

// 4. Automated 5-min WhatsApp Recovery Link (Item 33)
const payLink = generateWhatsAppRecoveryPayLink({
  orderId: 'MMB-9042',
  amount: 450,
  phone: '9832012345',
});
assert(payLink.startsWith('https://api.whatsapp.com/send?'), 'Generates standard WhatsApp send API link');
assert(payLink.includes('phone=9832012345'), 'Includes customer phone number');
assert(payLink.includes('MMB-9042'), 'Includes order number in recovery text');
assert(payLink.includes('resume_order%3DMMB-9042'), 'Includes 1-click order resume token query');

// 5. 1-Tap Customer Helpline (Item 40)
const helpline = getPaymentHelplineDetails();
assert(helpline.phone === PAYMENT_HELPLINE_PHONE, 'Matches official helpline phone number');
assert(helpline.dialerUrl === 'tel:+919733085000', 'Provides standard clickable tel: URI');
assert(helpline.callPromptBn.includes('+91 97330 85000'), 'Prompts call assistance in Bengali');

console.log(`\nResults for Task 6: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
  process.exit(1);
}
