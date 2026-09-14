import { ExecutiveAnalyticsService } from '../src/lib/services/executiveAnalyticsService';
import { MerchantInventoryService } from '../src/lib/services/merchantInventoryService';
import { OrderPipelineService } from '../src/lib/services/orderPipelineService';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function runTask7Tests() {
  console.log('========================================================================');
  console.log('🧪 MODULE 19 - TASK 7: EXECUTIVE ANALYTICS & GSTR-1 AUDIT TEST SUITE');
  console.log('========================================================================\n');

  const invService = new MerchantInventoryService();
  const pipelineService = new OrderPipelineService();
  const analyticsService = new ExecutiveAnalyticsService(invService, pipelineService);

  // Test 1: 4 Live Executive KPI Cards & Field-Level Profit Security (Items 31, 34)
  console.log('--- TEST 1: Executive KPI Cards & Field-Level Profit Security ---');
  const superAdminKpis = analyticsService.getExecutiveKpis('super_admin');
  console.log('Super Admin KPIs:', superAdminKpis);

  assert(superAdminKpis.today_orders_count >= 0, 'Today orders count calculated');
  assert(superAdminKpis.pending_dispatch_count >= 0, 'Pending dispatch count calculated');
  assert(superAdminKpis.low_stock_count >= 0, 'Low stock items count calculated');
  assert(superAdminKpis.monthly_sales_inr > 0, 'Monthly sales revenue > 0');
  assert(typeof superAdminKpis.monthly_net_profit_inr === 'number', 'Net profit visible to super_admin');

  // Staff view security check
  const staffKpis = analyticsService.getExecutiveKpis('dispatch_staff');
  assert(staffKpis.monthly_net_profit_inr === undefined, 'Net profit strictly hidden from dispatch_staff');

  // Test 2: 30-Day Sales Trend & RBAC (Item 32)
  console.log('\n--- TEST 2: 30-Day Sales & Revenue Trend Chart Data ---');
  const trend = analyticsService.getSalesTrend(30, 'super_admin');
  assert(trend.length === 30, 'Generated exactly 30 daily trend data points');
  assert(typeof trend[0].sales_inr === 'number', 'Sales INR is a valid number');
  assert(typeof trend[0].profit_inr === 'number', 'Profit INR calculated for super_admin');

  const staffTrend = analyticsService.getSalesTrend(7, 'dispatch_staff');
  assert(staffTrend[0].profit_inr === undefined, 'Profit INR hidden from staff trend points');

  // Test 3: Top-Selling Books Leaderboard (Item 33)
  console.log('\n--- TEST 3: Top-Selling Books Leaderboard ---');
  const topBooks = analyticsService.getTopSellingBooks(5);
  console.log('Top books leaderboard:', topBooks);
  assert(topBooks.length > 0, 'Top-selling books leaderboard populated');
  assert(topBooks[0].rank === 1, 'Top book is ranked 1');
  assert(topBooks[0].units_sold > 0, 'Top book has units sold > 0');

  // Test 4: Dead Stock Audit (> 90 Days) & Capital Tied (Item 35)
  console.log('\n--- TEST 4: Dead Stock Audit & Dormant Capital Analysis ---');
  const superAdminDeadStock = analyticsService.getDeadStockAudit(90, 'super_admin');
  console.log('Super Admin dead stock count:', superAdminDeadStock.length);
  assert(superAdminDeadStock.length > 0, 'Identified dormant dead stock books');
  assert(typeof superAdminDeadStock[0].tied_capital_inr === 'number', 'Tied capital computed for super_admin');

  const staffDeadStock = analyticsService.getDeadStockAudit(90, 'inventory_manager');
  assert(staffDeadStock[0].tied_capital_inr === undefined, 'Tied capital scrubbed for non-super_admin');
  assert(staffDeadStock[0].wholesale_cost_price === undefined, 'Wholesale dealer cost scrubbed for inventory_manager');

  // Test 5: District Demographics (Item 36)
  console.log('\n--- TEST 5: Regional District Demographics ---');
  const demographics = analyticsService.getDistrictDemographics();
  console.log('District demographics breakdown:', demographics);
  assert(demographics.length > 0, 'Demographics aggregated by district');
  assert(demographics.some((d) => d.district === 'Malda' || d.district === 'Murshidabad'), 'Identified Malda or Murshidabad district orders');
  const sumPercentage = demographics.reduce((s, d) => s + d.percentage_of_total, 0);
  assert(Math.round(sumPercentage) >= 99 && Math.round(sumPercentage) <= 101, 'Percentage sums to ~100%');

  // Test 6: GSTR-1 Tax Audit Report & CSV Export (Item 37)
  console.log('\n--- TEST 6: GSTR-1 Tax Audit Report & Nil-Rated HSN 4901 Export ---');
  const gstr1 = analyticsService.generateGstr1Report();
  console.log('GSTR-1 summary:', {
    hsn: gstr1.hsn_code,
    gst_rate: gstr1.gst_rate_percent,
    invoices_count: gstr1.total_invoices_count,
    gross_turnover: gstr1.gross_turnover_inr,
    taxable_turnover: gstr1.taxable_turnover_inr,
    cgst: gstr1.cgst_amount_inr,
    sgst: gstr1.sgst_amount_inr,
  });

  assert(gstr1.hsn_code === '4901', 'HSN code is 4901 (Printed books)');
  assert(gstr1.gst_rate_percent === 0, 'GST rate is 0% (Exempted)');
  assert(gstr1.taxable_turnover_inr === 0, 'Taxable turnover is 0 (100% exempted under notification)');
  assert(gstr1.cgst_amount_inr === 0 && gstr1.sgst_amount_inr === 0, 'Zero GST liability confirmed');

  const csv = analyticsService.exportGstr1Csv();
  assert(csv.includes('Invoice Number,Invoice Date,Customer Name'), 'GSTR-1 CSV header correctly structured');
  assert(csv.includes('4901'), 'GSTR-1 CSV contains HSN 4901');

  // Test 7: Average Order Value (Item 40)
  console.log('\n--- TEST 7: Customer Average Order Value (AOV) ---');
  const aov = analyticsService.getAverageOrderValue();
  console.log(`Average Order Value: ₹${aov}`);
  assert(aov > 0, 'Average order value is greater than 0');

  console.log('\n========================================================================');
  console.log('🎉 ALL TESTS FOR MODULE 19 TASK 7 PASSED SUCCESSFULLY!');
  console.log('========================================================================\n');
}

runTask7Tests().catch((err) => {
  console.error(err);
  process.exit(1);
});
