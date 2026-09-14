import {
  executeStockoutInstantRefund,
  handleDoubleDebitReport,
  getDoubleDebitTicket,
  executePartialRefund,
  executeCodReturnRefund,
  resetRefundStore,
} from '../src/lib/services/refundService';
import {
  registerPendingTransaction,
  runAutoReconciliationCron,
  resetPendingTransactions,
} from '../src/lib/services/autoReconciliationService';

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

async function runTests() {
  console.log('🧪 Testing Module 13 - Task 7: Automated Refund, Double-Debit & Reconciliation Engine');

  resetRefundStore();
  resetPendingTransactions();

  // 1. Stockout Instant Auto-Refund (Item 25)
  const stockoutResult = await executeStockoutInstantRefund({
    orderId: 'MMB-9042',
    paymentId: 'pay_concurrent_race_01',
    amount: 450,
    outOfStockBookTitles: ['WBCS General Studies Manual 2026'],
    destinationUpi: 'student@okhdfcbank',
  });
  assert(stockoutResult.refund.status === 'PROCESSED', 'Instant refund is processed');
  assert(stockoutResult.refund.amount === 450, 'Refunds 100% of order value');
  assert(stockoutResult.refund.expected_settlement_hours === 2, 'UPI instant refund settles in 2 hours');
  assert(stockoutResult.message_bn.includes('স্টক শেষ হয়ে যাওয়ায়'), 'Bengali message explains stockout clearly');

  // 2. Smart Double-Debit Reversal Ticket (Item 36)
  const ticket = handleDoubleDebitReport({
    orderId: 'MMB-9042',
    originalPaymentId: 'pay_orig_1234',
    duplicatePaymentId: 'pay_dupe_5678',
    amount: 450,
    rrnOrUtr: '123456789012',
  });
  assert(ticket.ticket_id.startsWith('DDT-'), 'Generates DDT tracking ticket');
  assert(ticket.auto_reversal_target_hours === 24, 'Guarantees 24-hour reversal target SLA (Item 36)');
  assert(getDoubleDebitTicket(ticket.ticket_id) !== undefined, 'Ticket is retrievable by ID');

  // 3. Partial Refund Control (Item 39)
  const partialRefund = await executePartialRefund({
    orderId: 'MMB-9050',
    paymentId: 'pay_combo_order_01',
    partialAmount: 180,
    totalOrderAmount: 750,
    reason: 'Single book in combo pack damaged',
    itemTitle: 'History of Bengal Vol 2',
  });
  assert(partialRefund.refund_type === 'PARTIAL', 'Creates partial refund record');
  assert(partialRefund.amount === 180, 'Refunds exact item price');

  // Negative test: partial refund cannot exceed or equal total amount
  try {
    await executePartialRefund({
      orderId: 'MMB-9050',
      paymentId: 'pay_combo_order_01',
      partialAmount: 750,
      totalOrderAmount: 750,
      reason: 'Should fail',
    });
    assert(false, 'Should throw error when partial refund equals total amount');
  } catch (err: any) {
    assert(err.message.includes('strictly less than'), 'Throws error when partial refund >= total amount');
  }

  // 4. COD Return Refund (Item 19)
  const codRefund = await executeCodReturnRefund({
    orderId: 'MMB-COD-9901',
    amount: 620,
    customerUpiId: 'buyer@okaxis',
    reason: 'Defective binding return',
  });
  assert(codRefund.status === 'PROCESSED', 'COD return refund is processed');
  assert(codRefund.expected_settlement_hours === 24, 'COD verified return adheres to 24-hour refund SLA');

  // 5. 5-Minute Auto-Reconciliation Cron (Item 24)
  registerPendingTransaction({
    transaction_id: 'tx_pending_01',
    order_id: 'MMB-RECON-01',
    amount: 350,
    status: 'PENDING',
    created_at: new Date().toISOString(),
    mockGatewayStatus: 'captured', // Bank finished transaction
  });

  registerPendingTransaction({
    transaction_id: 'tx_pending_02',
    order_id: 'MMB-RECON-02',
    amount: 500,
    status: 'PENDING',
    created_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(), // 35 mins old
    mockGatewayStatus: 'still_pending', // Timed out
  });

  registerPendingTransaction({
    transaction_id: 'tx_pending_03',
    order_id: 'MMB-RECON-03',
    amount: 220,
    status: 'PENDING',
    created_at: new Date().toISOString(),
    mockGatewayStatus: 'still_pending', // Recent pending
  });

  const reconReport = await runAutoReconciliationCron();
  assert(reconReport.totalChecked === 3, 'Checked all 3 pending transactions');
  assert(reconReport.reconciledCount === 1, 'Reconciles 1 captured transaction');
  assert(reconReport.reconciledOrders.includes('MMB-RECON-01'), 'Reconciled order ID recorded');
  assert(reconReport.failedCount === 1, 'Auto-cancels 1 expired (>30 min) transaction');
  assert(reconReport.stillPendingCount === 1, 'Keeps 1 recent pending active');

  console.log(`\nResults for Task 7: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
