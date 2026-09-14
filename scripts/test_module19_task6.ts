import { ReturnsReconciliationService } from '../src/lib/services/returnsReconciliationService';
import { MerchantInventoryService } from '../src/lib/services/merchantInventoryService';
import { OrderPipelineService } from '../src/lib/services/orderPipelineService';
import { defaultQueueService } from '../src/lib/services/notificationQueueService';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function runTask6Tests() {
  console.log('========================================================================');
  console.log('🧪 MODULE 19 - TASK 6: RTO RETURNS & COD REMITTANCE TEST SUITE');
  console.log('========================================================================\n');

  const invService = new MerchantInventoryService();
  const pipelineService = new OrderPipelineService();
  const rtoService = new ReturnsReconciliationService(invService, pipelineService);

  // Test 1: Undamaged/Resellable RTO Parcel Verification & Auto-Restock (Item 28)
  console.log('--- TEST 1: Intact RTO Parcel Verification & Shelf Restock ---');
  const initialStock = invService.getItemBySku('WBCS-SCAN-2026')?.stock_quantity || 0;
  console.log(`Initial stock of WBCS-SCAN-2026: ${initialStock}`);

  const rtoRes1 = rtoService.processRtoReturn('ord_malda_101', {
    condition: 'intact_resellable',
    restock_to_shelf: true,
    refund_mode: 'instant_upi_refund',
  });

  assert(rtoRes1.success === true, 'RTO parcel processed successfully');
  assert(rtoRes1.result?.restocked === true, 'Item marked as restocked');
  assert(rtoRes1.result?.refund_status === 'refunded', 'Instant UPI refund issued for prepaid order');
  assert(rtoRes1.result?.refund_reference?.startsWith('UPI_REF_') === true, 'UPI refund reference generated');

  const updatedStock = invService.getItemBySku('WBCS-SCAN-2026')?.stock_quantity || 0;
  console.log(`Stock after RTO restock: ${updatedStock}`);
  assert(updatedStock === initialStock + 1, `Stock quantity increased by 1 (Expected: ${initialStock + 1}, Got: ${updatedStock})`);

  // Verify refund notification enqueued
  await defaultQueueService.drainQueue();
  const refundLogs = defaultQueueService.getLogs({ order_id: 'ord_malda_101' });
  assert(refundLogs.length > 0, 'Refund notification logged in queue');

  // Test 2: Damaged Parcel Inspection & Write-Off (Item 28)
  console.log('\n--- TEST 2: Damaged Parcel Routing & Write-off ---');
  const initialStock2 = invService.getItemBySku('HIST-HON-003')?.stock_quantity || 0;

  const rtoRes2 = rtoService.processRtoReturn('DEL-99023412', {
    condition: 'damaged',
    damage_notes: 'বইয়ের কভার ও পাতা জলে ভিজে ক্ষতিগ্রস্ত হয়েছে',
    restock_to_shelf: false,
    refund_mode: 'none',
  });

  assert(rtoRes2.success === true, 'Damaged RTO processed successfully via AWB code');
  assert(rtoRes2.result?.condition === 'damaged', 'Parcel condition recorded as damaged');
  assert(rtoRes2.result?.restocked === false, 'Damaged book was NOT restocked into active inventory');
  const updatedStock2 = invService.getItemBySku('HIST-HON-003')?.stock_quantity || 0;
  assert(updatedStock2 === initialStock2, 'Stock remained unchanged for damaged item');

  // Test 3: Daily COD Remittance Reconciliation (Item 29)
  console.log('\n--- TEST 3: Daily COD Remittance Reconciliation Sheet ---');
  // Order ord_murshidabad_103 has total_amount = 545, AWB: DEL-99023412
  const remittanceEntries = [
    {
      awb_code: 'DEL-99023412',
      courier_name: 'Delhivery',
      remitted_amount: 545, // Exact match
      utr_reference: 'UTR99882211',
      remittance_date: '2026-09-11',
    },
    {
      awb_code: 'DEL-UNKNOWN-999',
      courier_name: 'Delhivery',
      remitted_amount: 350, // Unknown AWB
      utr_reference: 'UTR99882212',
      remittance_date: '2026-09-11',
    },
  ];

  const report = rtoService.reconcileCodRemittances(remittanceEntries);
  console.log('Reconciliation report:', {
    total_entries: report.total_entries,
    matched_count: report.matched_count,
    matched_amount_inr: report.matched_amount_inr,
    discrepancy_count: report.discrepancy_count,
  });

  assert(report.total_entries === 2, 'Report processed 2 remittance entries');
  assert(report.matched_count === 1, '1 entry matched exactly with COD order');
  assert(report.matched_amount_inr === 545, 'Matched amount is ₹545');
  assert(report.discrepancy_count === 1, '1 unrecognised AWB flagged in discrepancy list');
  assert(report.discrepancies[0].awb_code === 'DEL-UNKNOWN-999', 'Discrepancy correctly identifies unknown AWB');

  // Test 4: Logistics P&L Calculation (Item 38)
  console.log('\n--- TEST 4: Logistics P&L Tracker ---');
  const allOrders = pipelineService.searchOrders('');
  const pnl = rtoService.calculateLogisticsPnL(allOrders);

  console.log('Logistics P&L breakdown:', pnl);
  assert(pnl.reconciled_parcels_count > 0, 'Reconciled parcels count > 0');
  assert(pnl.total_freight_billed_inr > 0, 'Freight billed > 0');
  assert(pnl.packaging_costs_inr > 0, 'Packaging costs > 0');
  assert(typeof pnl.net_difference_inr === 'number', 'Net logistics difference is calculated');

  console.log('\n========================================================================');
  console.log('🎉 ALL TESTS FOR MODULE 19 TASK 6 PASSED SUCCESSFULLY!');
  console.log('========================================================================\n');
}

runTask6Tests().catch((err) => {
  console.error(err);
  process.exit(1);
});
