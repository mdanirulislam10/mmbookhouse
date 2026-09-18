'use client';

import React, { useState, useEffect } from 'react';
import {
  AdminRole,
  AdminOrderSummary,
  OrderPipelineStatus,
  BookInventoryItem,
  ExecutiveKpiSummary,
  RtoVerificationResult,
  CodRemittanceReport,
  StoreProfileSettings,
} from '../../types/sellerCentral';
import { defaultOrderPipelineService } from '../../lib/services/orderPipelineService';
import { defaultMerchantInventoryService } from '../../lib/services/merchantInventoryService';
import { defaultExecutiveAnalyticsService } from '../../lib/services/executiveAnalyticsService';
import { defaultBulkCatalogService } from '../../lib/services/bulkCatalogService';
import { defaultReturnsReconciliationService } from '../../lib/services/returnsReconciliationService';
import { defaultStoreMarketingService } from '../../lib/services/storeMarketingService';
import { defaultStoreSettingsService } from '../../lib/services/storeSettingsService';
import { AdminPaymentAuditTable } from './AdminPaymentAuditTable';
import { getAllPaymentTransactions } from '../../lib/services/webhookService';
import { calculateTPlusOneSettlement } from '../../lib/services/merchantFinanceService';
import { PaymentTransaction } from '../../types/payment';
import { AmazonTaxInvoiceView } from '../invoice/AmazonTaxInvoiceView';
import { ThermalShippingLabel } from '../invoice/ThermalShippingLabel';
import { CounterPosReceipt } from '../invoice/CounterPosReceipt';
import { PackingSlipView } from '../invoice/PackingSlipView';
import { AdminGstrReportTable } from './AdminGstrReportTable';
import { getOrCreateInvoiceForOrder } from '../../lib/services/invoiceStorageService';
import { generateGstr1Rows } from '../../lib/services/gstrExportService';
import { BackupManagementPanel } from './BackupManagementPanel';

export const SellerCentralDashboard: React.FC = () => {
  // 1. RBAC & Navigation State
  const [activeRole, setActiveRole] = useState<AdminRole>('super_admin');
  const [activeTab, setActiveTab] = useState<
    'orders' | 'inventory' | 'rto_cod' | 'analytics' | 'marketing' | 'settings' | 'finance' | 'gst_reports'
  >('orders');
  const [pipelineFilter, setPipelineFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [soundAlerts, setSoundAlerts] = useState(true);

  const handleAdminLogout = async () => {
    await fetch('/api/admin/session', { method: 'DELETE' }).catch(() => undefined);
    window.location.assign('/admin/login');
  };

  const [invoiceModalOrder, setInvoiceModalOrder] = useState<AdminOrderSummary | null>(null);
  const [thermalLabelOrder, setThermalLabelOrder] = useState<AdminOrderSummary | null>(null);
  const [posReceiptOrder, setPosReceiptOrder] = useState<AdminOrderSummary | null>(null);

  // 2. Services Data State
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [kpis, setKpis] = useState<ExecutiveKpiSummary | null>(null);
  const [lowStockBooks, setLowStockBooks] = useState<BookInventoryItem[]>([]);
  const [settings, setSettings] = useState<StoreProfileSettings>(
    defaultStoreSettingsService.getSettings()
  );

  // 3. Modals & Actions State
  const [packingSlipOrder, setPackingSlipOrder] = useState<AdminOrderSummary | null>(null);
  const [otpModalOrder, setOtpModalOrder] = useState<AdminOrderSummary | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [otpFeedback, setOtpFeedback] = useState<{ success?: boolean; msg?: string } | null>(null);

  const [isbnScanInput, setIsbnScanInput] = useState('');
  const [scannedBook, setScannedBook] = useState<BookInventoryItem | null>(null);
  const [counterSaleQty, setCounterSaleQty] = useState(1);
  const [counterSaleFeedback, setCounterSaleFeedback] = useState<string | null>(null);

  const [bulkDiscountPublisher, setBulkDiscountPublisher] = useState('ছায়া প্রকাশনী');
  const [bulkDiscountVal, setBulkDiscountVal] = useState(5);
  const [bulkDiscountFeedback, setBulkDiscountFeedback] = useState<string | null>(null);

  const [rtoInputAwb, setRtoInputAwb] = useState('');
  const [rtoCondition, setRtoCondition] = useState<'intact_resellable' | 'damaged'>('intact_resellable');
  const [rtoFeedback, setRtoFeedback] = useState<RtoVerificationResult | null>(null);

  const [couponCodeInput, setCouponCodeInput] = useState('MADHYAMIK50');
  const [couponCartVal, setCouponCartVal] = useState(520);
  const [couponRes, setCouponRes] = useState<{ valid: boolean; discount: number; final: number; msg?: string } | null>(null);

  const [exportOtpReq, setExportOtpReq] = useState<string | null>(null);
  const [exportOtpInput, setExportOtpInput] = useState('');
  const [exportedCsv, setExportedCsv] = useState<string | null>(null);
  const [paymentTransactions, setPaymentTransactions] = useState<PaymentTransaction[]>([]);

  // Refresh data based on current state & role
  const refreshData = () => {
    const fetchedOrders = defaultOrderPipelineService.searchOrders(searchQuery);
    setOrders(fetchedOrders);
    setKpis(defaultExecutiveAnalyticsService.getExecutiveKpis(activeRole));
    setLowStockBooks(defaultMerchantInventoryService.getLowStockBooks());
    setSettings(defaultStoreSettingsService.getSettings());
    try {
      setPaymentTransactions(getAllPaymentTransactions());
    } catch {
      // ignore
    }
  };

  const settlementProjection = calculateTPlusOneSettlement(paymentTransactions);

  useEffect(() => {
    refreshData();
  }, [activeRole, searchQuery]);

  // Order Transition Handler
  const handleTransition = (orderId: string, newStatus: OrderPipelineStatus) => {
    defaultOrderPipelineService.updatePipelineStatus(orderId, newStatus, {
      awb_code: `DEL-${Date.now().toString().slice(-8)}`,
      courier_name: 'Delhivery',
    });
    refreshData();
  };

  // 1-Click Courier Pickup Handler
  const handleCourierPickup = (orderId: string) => {
    defaultOrderPipelineService.requestCourierPickup([orderId], 'Delhivery');
    refreshData();
  };

  // OTP Verification Handler
  const handleVerifyOtp = () => {
    if (!otpModalOrder) return;
    const res = defaultOrderPipelineService.verifyCounterPickupOtp(
      otpModalOrder.order_id,
      otpInput
    );
    if (res.success) {
      setOtpFeedback({ success: true, msg: '✅ সফল! গ্রাহকের ওটিপি যাচাই সম্পন্ন হয়েছে এবং অর্ডার হ্যান্ডওভার করা হলো।' });
      refreshData();
      setTimeout(() => {
        setOtpModalOrder(null);
        setOtpInput('');
        setOtpFeedback(null);
      }, 1500);
    } else {
      setOtpFeedback({ success: false, msg: res.error });
    }
  };

  // Barcode / ISBN Scan
  const handleIsbnScan = () => {
    const book = defaultMerchantInventoryService.getBookByIsbnOrBarcode(isbnScanInput);
    setScannedBook(book);
    setCounterSaleFeedback(null);
  };

  // POS Counter Sale Reconciliation
  const handlePosSale = () => {
    if (!scannedBook) return;
    const res = defaultMerchantInventoryService.recordCounterSale(scannedBook.id, counterSaleQty);
    if (res.success) {
      setCounterSaleFeedback(`✅ সফল! ${counterSaleQty}টি বই বিক্রি রেকর্ড হয়েছে। নতুন স্টক: ${res.remainingStock}টি`);
      setScannedBook(res.book || null);
      refreshData();
    } else {
      setCounterSaleFeedback(`❌ ব্যর্থ: ${res.error}`);
    }
  };

  // Bulk Discount Modifier
  const handleBulkDiscount = () => {
    const res = defaultBulkCatalogService.applyBulkDiscountModifier({
      publisher: bulkDiscountPublisher,
      discount_percentage_delta: bulkDiscountVal,
    });
    setBulkDiscountFeedback(
      `✅ সফল! ${res.modifiedCount}টি বইয়ে ${bulkDiscountVal > 0 ? '+' : ''}${bulkDiscountVal}% ডিসকাউন্ট আপডেট করা হয়েছে।`
    );
    refreshData();
  };

  // Process RTO Desk
  const handleProcessRto = () => {
    const res = defaultReturnsReconciliationService.processRtoReturn(rtoInputAwb, {
      condition: rtoCondition,
      restock_to_shelf: rtoCondition === 'intact_resellable',
      refund_mode: 'instant_upi_refund',
    });
    if (res.success && res.result) {
      setRtoFeedback(res.result);
      refreshData();
    }
  };

  // Test Coupon
  const handleTestCoupon = () => {
    const res = defaultStoreMarketingService.validateAndApplyCoupon(couponCodeInput, couponCartVal);
    if (res.valid) {
      setCouponRes({
        valid: true,
        discount: res.discount_amount,
        final: res.final_total,
      });
    } else {
      setCouponRes({
        valid: false,
        discount: 0,
        final: couponCartVal,
        msg: res.error,
      });
    }
  };

  // Maintenance Switch
  const toggleMaintenance = () => {
    const newStatus = !settings.is_maintenance_mode;
    const res = defaultStoreSettingsService.updateSettings(
      { is_maintenance_mode: newStatus },
      activeRole
    );
    if (res.success) {
      setSettings(res.settings!);
    } else {
      alert(res.error);
    }
  };

  // Request Customer Export OTP
  const handleRequestExportOtp = () => {
    const res = defaultStoreSettingsService.requestExportOtp(activeRole);
    if (res.success && res.otpForTest) {
      setExportOtpReq(res.otpForTest);
      alert(res.message + ` [ডেমো ওটিপি: ${res.otpForTest}]`);
    } else {
      alert(res.message);
    }
  };

  // Verify Export OTP & Generate CSV
  const handleVerifyExportOtp = () => {
    const res = defaultStoreSettingsService.verifyOtpAndExportCustomers(
      exportOtpInput,
      activeRole
    );
    if (res.success && res.csv) {
      setExportedCsv(res.csv);
      setExportOtpReq(null);
    } else {
      alert(res.error);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (pipelineFilter === 'all') return true;
    return o.pipeline_status === pipelineFilter;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      {/* Top Banner Notice */}
      {settings.is_announcement_active && (
        <div
          className="py-2 px-4 text-center text-sm font-medium tracking-wide flex items-center justify-center gap-3 shadow-md"
          style={{ backgroundColor: settings.announcement_bg_color || '#1e3a8a' }}
        >
          <span>{settings.announcement_notice}</span>
          <span className="bg-amber-400 text-slate-900 text-xs px-2 py-0.5 rounded-full font-bold">
            লাইভ
          </span>
        </div>
      )}

      {/* Maintenance Mode Warning Bar */}
      {settings.is_maintenance_mode && (
        <div className="bg-red-600 text-white px-4 py-2 text-center text-sm font-semibold flex items-center justify-center gap-2">
          <span>⚠️ স্টোর বর্তমানে মেইন্টেন্যান্স মোডে আছে! সাধারণ ভিজিটররা কেনাকাটা করতে পারবেন না।</span>
        </div>
      )}

      {/* Header Bar */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg">
            MM
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              এম.এম বুক হাউস <span className="text-xs bg-slate-700 text-amber-400 px-2 py-0.5 rounded border border-slate-600 font-medium">মার্চেন্ট সেলার সেন্ট্রাল</span>
            </h1>
            <p className="text-xs text-slate-400">রবীন্দ্র এভিনিউ, মালদা • Amazon-Style Seller Portal v19.0</p>
          </div>
        </div>

        {/* Global Controls: Sound & Role Switcher */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSoundAlerts(!soundAlerts)}
            className={`p-2 rounded-lg border text-sm flex items-center gap-1.5 transition ${
              soundAlerts
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-400'
                : 'bg-slate-700 border-slate-600 text-slate-400'
            }`}
            title="নতুন অর্ডারে লাইভ অডিও নোটিফিকেশন অ্যালার্ট"
          >
            <span>{soundAlerts ? '🔔 সাউন্ড অন' : '🔕 সাউন্ড অফ'}</span>
          </button>

          {/* Role Selector */}
          <div className="flex items-center bg-slate-950/80 rounded-lg p-1 border border-slate-700">
            <span className="text-xs text-slate-400 px-2">রোল:</span>
            {(['super_admin', 'inventory_manager', 'dispatch_staff'] as AdminRole[]).map((r) => (
              <button
                key={r}
                onClick={() => setActiveRole(r)}
                className={`px-3 py-1 text-xs rounded-md font-medium transition ${
                  activeRole === r
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r === 'super_admin' ? 'সুপার অ্যাডমিন' : r === 'inventory_manager' ? 'ইনভেন্টরি' : 'ডিসপ্যাচ স্টাফ'}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleAdminLogout}
            className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-bold text-slate-300 transition hover:border-rose-500 hover:text-rose-300"
          >
            লগআউট
          </button>
        </div>
      </header>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* 4 Executive KPI Cards (Item 31 & 34) */}
        {kpis && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Today Sales */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 text-sm">
                <span>আজকের বিক্রয় (Today)</span>
                <span className="text-emerald-400 text-xs font-semibold">লাইভ</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">₹{kpis.today_sales_inr.toLocaleString('en-IN')}</span>
                <span className="text-xs text-slate-400">({kpis.today_orders_count}টি অর্ডার)</span>
              </div>
            </div>

            {/* Card 2: Pending Dispatch */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 text-sm">
                <span>ডিসপ্যাচ পাইপলাইন</span>
                <span className="text-amber-400 text-xs font-semibold">প্রসেসিং</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-amber-400">{kpis.pending_dispatch_count}</span>
                <span className="text-xs text-slate-400">টি পার্সেল পেন্ডিং</span>
              </div>
            </div>

            {/* Card 3: Low Stock Warning */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 text-sm">
                <span>কম স্টক অ্যালার্ট (&lt; ৫)</span>
                <span className="text-rose-400 text-xs font-semibold">সন্ধ্যায় রিস্টক</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-rose-400">{kpis.low_stock_count}</span>
                <span className="text-xs text-slate-400">টি বইয়ের স্টক সংকট</span>
              </div>
            </div>

            {/* Card 4: Monthly Net Profit (Strictly Super Admin Only) */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 text-sm">
                <span>মাসিক নেট প্রফিট</span>
                {activeRole === 'super_admin' ? (
                  <span className="text-purple-400 text-xs font-semibold">🔒 সুপার অ্যাডমিন</span>
                ) : (
                  <span className="text-slate-500 text-xs">লক করা</span>
                )}
              </div>
              <div className="mt-2">
                {activeRole === 'super_admin' ? (
                  <span className="text-2xl font-black text-purple-300">
                    ₹{kpis.monthly_net_profit_inr?.toLocaleString('en-IN') || 0}
                  </span>
                ) : (
                  <div className="flex items-center gap-1 text-slate-500 text-sm italic">
                    <span>•••••••••• (গোপনীয়)</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-700 pb-3 overflow-x-auto">
          {[
            { id: 'orders', label: '📦 অর্ডার পাইপলাইন' },
            { id: 'inventory', label: '📚 ইনভেন্টরি ও বারকোড' },
            { id: 'rto_cod', label: '🔄 RTO ও COD রিকনসিলিয়েশন' },
            { id: 'analytics', label: '📊 সেলস অ্যানালিটিক্স' },
            { id: 'gst_reports', label: '📑 GSTR-1 সেলস লেজার' },
            { id: 'marketing', label: '🎯 মার্কেটিং ও কুপন' },
            { id: 'settings', label: '⚙️ স্টোর সেটিংস' },
            { id: 'finance', label: '💳 অর্থ ও পেমেন্ট অডিট' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: ORDER PIPELINE */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {/* Filter and Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-800/80 p-4 rounded-xl border border-slate-700">
              <div className="flex items-center gap-2">
                {[
                  { id: 'all', label: 'সব' },
                  { id: 'pending', label: 'পেন্ডিং' },
                  { id: 'processing', label: 'প্যাকিং হচ্ছে' },
                  { id: 'ready_for_pickup', label: 'পিকআপের জন্য প্রস্তুত' },
                  { id: 'handed_over', label: 'কুরিয়ারে হ্যান্ডওভার' },
                  { id: 'delivered', label: 'ডেলিভার্ড' },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setPipelineFilter(st.id)}
                    className={`px-3 py-1 text-xs rounded-md transition ${
                      pipelineFilter === st.id
                        ? 'bg-slate-700 text-amber-400 font-bold border border-slate-600'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              <div className="w-full md:w-72">
                <input
                  type="text"
                  placeholder="গ্রাহকের নাম, মোবাইল, অর্ডার নং বা AWB খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-slate-800/90 rounded-xl border border-slate-700 overflow-hidden shadow">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-700 uppercase tracking-wider">
                    <tr>
                      <th className="p-3">অর্ডার #</th>
                      <th className="p-3">গ্রাহক ও জেলা</th>
                      <th className="p-3">বই ও র‍্যাক লোকেশন</th>
                      <th className="p-3">মোট টাকা ও পেমেন্ট</th>
                      <th className="p-3">স্ট্যাটাস</th>
                      <th className="p-3 text-right">কার্যক্রম</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700 text-slate-200">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400 italic">
                          কোনো অর্ডার পাওয়া যায়নি
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => (
                        <tr key={order.order_id} className="hover:bg-slate-700/40 transition">
                          <td className="p-3 font-mono font-bold text-amber-400">
                            {order.order_number}
                            {order.is_counter_pickup && (
                              <span className="block text-[10px] text-teal-400 font-normal">
                                🏬 কাউন্টার পিকআপ
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="font-semibold">{order.customer_name}</div>
                            <div className="text-slate-400">{order.customer_phone}</div>
                            <div className="text-[10px] text-slate-500">{order.district || 'Malda'}</div>
                          </td>
                          <td className="p-3">
                            {order.items.map((item, idx) => (
                              <div key={idx}>
                                <span>{item.title}</span>
                                <span className="text-[10px] text-amber-300 ml-1">
                                  [{item.rack_location || 'Rack General'}]
                                </span>
                              </div>
                            ))}
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-white">₹{order.total_amount}</div>
                            <div className="text-[10px] text-slate-400">
                              {order.payment_mode} •{' '}
                              <span
                                className={
                                  order.payment_status === 'PAID'
                                    ? 'text-emerald-400 font-semibold'
                                    : 'text-amber-400'
                                }
                              >
                                {order.payment_status}
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                order.pipeline_status === 'pending'
                                  ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                  : order.pipeline_status === 'processing'
                                  ? 'bg-blue-950 text-blue-400 border border-blue-800'
                                  : order.pipeline_status === 'ready_for_pickup'
                                  ? 'bg-purple-950 text-purple-400 border border-purple-800'
                                  : order.pipeline_status === 'handed_over'
                                  ? 'bg-indigo-950 text-indigo-400 border border-indigo-800'
                                  : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              }`}
                            >
                              {order.pipeline_status}
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-1 whitespace-nowrap">
                            {/* Tax Invoice View & Print */}
                            <button
                              onClick={() => setInvoiceModalOrder(order)}
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-[11px] text-white font-medium shadow-xs"
                              title="অফিশিয়াল GST ট্যাক্স ইনভয়েস দেখুন ও প্রিন্ট করুন"
                            >
                              🧾 ইনভয়েস
                            </button>

                            {/* 4x6 Thermal Label Print */}
                            <button
                              onClick={() => setThermalLabelOrder(order)}
                              className="px-2 py-1 bg-amber-600 hover:bg-amber-500 rounded text-[11px] text-white font-medium shadow-xs"
                              title="৪x৬ ইঞ্চি থার্মাল শিপিং লেবেল প্রিন্ট"
                            >
                              🏷️ ৪x৬ লেবেল
                            </button>

                            {/* POS Receipt */}
                            <button
                              onClick={() => setPosReceiptOrder(order)}
                              className="px-2 py-1 bg-emerald-700 hover:bg-emerald-600 rounded text-[11px] text-white font-medium shadow-xs"
                              title="২/৩ ইঞ্চি পিওএস ক্যাশ কাউন্টার রসিদ"
                            >
                              🖨️ POS
                            </button>

                            {/* A5 Packing Slip Button */}
                            <button
                              onClick={() => setPackingSlipOrder(order)}
                              className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-[11px] text-slate-200 shadow-xs"
                              title="A5 স্মার্ট প্যাকিং স্লিপ দেখুন"
                            >
                              📄 স্লিপ
                            </button>

                            {/* Counter OTP Verification button */}
                            {order.is_counter_pickup && order.pipeline_status !== 'delivered' && (
                              <button
                                onClick={() => setOtpModalOrder(order)}
                                className="px-2 py-1 bg-teal-600 hover:bg-teal-500 rounded text-[11px] text-white font-bold"
                              >
                                🔑 OTP যাচাই
                              </button>
                            )}

                            {/* State transitions */}
                            {order.pipeline_status === 'pending' && (
                              <button
                                onClick={() => handleTransition(order.order_id, 'processing')}
                                className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-[11px] text-white"
                              >
                                প্যাক করুন
                              </button>
                            )}

                            {order.pipeline_status === 'processing' && !order.is_counter_pickup && (
                              <button
                                onClick={() => handleCourierPickup(order.order_id)}
                                className="px-2 py-1 bg-amber-600 hover:bg-amber-500 rounded text-[11px] text-white"
                              >
                                পিকআপ রিকোয়েস্ট
                              </button>
                            )}

                            {order.pipeline_status === 'ready_for_pickup' && !order.is_counter_pickup && (
                              <button
                                onClick={() => handleTransition(order.order_id, 'handed_over')}
                                className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-[11px] text-white"
                              >
                                হ্যান্ডওভার
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INVENTORY & BARCODE SCANNER */}
        {activeTab === 'inventory' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Barcode Scanner & POS Counter Sale */}
            <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 space-y-4">
              <h2 className="text-base font-bold text-amber-400 flex items-center gap-2">
                <span>📷 বারকোড ও ক্যামেরা স্ক্যানার / POS কাউন্টার সেল</span>
              </h2>
              <p className="text-xs text-slate-400">
                দোকানের কাউন্টারে বারকোড রিডার বা কিবোর্ডে ISBN টাইপ করে তাৎক্ষণিক লাইভ স্টক আপডেট করুন।
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ISBN বা বারকোড লিখুন (যেমন: 9789350021980)..."
                  value={isbnScanInput}
                  onChange={(e) => setIsbnScanInput(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />
                <button
                  onClick={handleIsbnScan}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs"
                >
                  স্ক্যান করুন
                </button>
              </div>

              {scannedBook && (
                <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-700 space-y-2">
                  <div className="font-bold text-white text-sm">{scannedBook.title_bn || scannedBook.title}</div>
                  <div className="text-xs text-slate-400">
                    প্রকাশক: {scannedBook.publisher} • SKU: {scannedBook.sku}
                  </div>
                  <div className="text-xs text-amber-300 font-medium">
                    র‍্যাক লোকেশন: {scannedBook.rack_location || 'Rack General'}
                  </div>
                  <div className="flex items-center gap-4 text-xs pt-1">
                    <span>
                      বর্তমান স্টক:{' '}
                      <strong className={scannedBook.stock_quantity <= 5 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                        {scannedBook.stock_quantity}টি
                      </strong>
                    </span>
                    <span>MRP: ₹{scannedBook.mrp}</span>
                    <span>বিক্রয় মূল্য: ₹{scannedBook.selling_price}</span>
                  </div>

                  {/* POS Counter Sale Action */}
                  <div className="pt-3 border-t border-slate-800 flex items-center gap-3">
                    <span className="text-xs text-slate-300">কাউন্টার সেল:</span>
                    <input
                      type="number"
                      min="1"
                      max={scannedBook.stock_quantity}
                      value={counterSaleQty}
                      onChange={(e) => setCounterSaleQty(Number(e.target.value))}
                      className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-center text-white"
                    />
                    <button
                      onClick={handlePosSale}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs"
                    >
                      কাউন্টার সেল রেকর্ড করুন
                    </button>
                  </div>
                </div>
              )}

              {counterSaleFeedback && (
                <div className="p-3 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200">
                  {counterSaleFeedback}
                </div>
              )}
            </div>

            {/* Bulk Catalog Operations & Discount Modifier */}
            <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 space-y-4">
              <h2 className="text-base font-bold text-amber-400">
                ⚡ বাল্ক ক্যাটালগ অপারেশন ও প্রকাশক ডিসকাউন্ট
              </h2>
              <p className="text-xs text-slate-400">
                নির্দিষ্ট প্রকাশনীর সব বইয়ে এক ক্লিকে ফ্ল্যাট ডিসকাউন্ট শতাংশ বাড়ান বা কমান।
              </p>

              <div className="space-y-3 bg-slate-900/80 p-4 rounded-lg border border-slate-700">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">প্রকাশনী নির্বাচন করুন:</label>
                  <select
                    value={bulkDiscountPublisher}
                    onChange={(e) => setBulkDiscountPublisher(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-white"
                  >
                    <option value="ছায়া প্রকাশনী">ছায়া প্রকাশনী</option>
                    <option value="রায় ও মার্টিন">রায় ও মার্টিন</option>
                    <option value="আনন্দ পাবলিশার্স">আনন্দ পাবলিশার্স</option>
                    <option value="পশ্চিমবঙ্গ রাজ্য পুস্তক পর্ষদ">পশ্চিমবঙ্গ রাজ্য পুস্তক পর্ষদ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">ডিসকাউন্ট পরিবর্তন (%):</label>
                  <input
                    type="number"
                    value={bulkDiscountVal}
                    onChange={(e) => setBulkDiscountVal(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-white"
                  />
                  <span className="text-[10px] text-slate-500">
                    উদাহরণ: +৫ দিলে ৫% ডিসকাউন্ট বাড়বে, -৫ দিলে ৫% কমবে।
                  </span>
                </div>

                <button
                  onClick={handleBulkDiscount}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white rounded-lg"
                >
                  এক ক্লিকে ডিসকাউন্ট প্রয়োগ করুন
                </button>
              </div>

              {bulkDiscountFeedback && (
                <div className="p-3 bg-slate-900 border border-slate-700 rounded-lg text-xs text-emerald-400">
                  {bulkDiscountFeedback}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: RTO & COD RECONCILIATION */}
        {activeTab === 'rto_cod' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* RTO Verification Desk */}
            <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 space-y-4">
              <h2 className="text-base font-bold text-rose-400">
                📦 RTO রিটার্ন ভেরিফিকেশন ডেস্ক (Item 28)
              </h2>
              <p className="text-xs text-slate-400">
                ফেরত আসা পার্সেল স্ক্যান করুন, অক্ষত থাকলে সেলফ স্টকে ফেরত দিন এবং তাৎক্ষণিক রিফান্ড ইস্যু করুন।
              </p>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="AWB বা অর্ডার নম্বর লিখুন..."
                  value={rtoInputAwb}
                  onChange={(e) => setRtoInputAwb(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-white"
                />

                <div className="flex gap-4 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="rto_cond"
                      checked={rtoCondition === 'intact_resellable'}
                      onChange={() => setRtoCondition('intact_resellable')}
                    />
                    <span className="text-emerald-400 font-semibold">অক্ষত (Auto Restock)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="rto_cond"
                      checked={rtoCondition === 'damaged'}
                      onChange={() => setRtoCondition('damaged')}
                    />
                    <span className="text-rose-400 font-semibold">ক্ষতিগ্রস্ত (Write-off)</span>
                  </label>
                </div>

                <button
                  onClick={handleProcessRto}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-500 font-bold text-xs text-white rounded-lg"
                >
                  RTO পার্সেল প্রসেস করুন
                </button>
              </div>

              {rtoFeedback && (
                <div className="p-3 bg-slate-900 border border-slate-700 rounded-lg text-xs space-y-1">
                  <div className="text-emerald-400 font-bold">✅ RTO প্রসেস সম্পন্ন!</div>
                  <div>অর্ডার নং: {rtoFeedback.order_number}</div>
                  <div>কন্ডিশন: {rtoFeedback.condition}</div>
                  <div>স্টকে রিস্টক: {rtoFeedback.restocked ? 'হ্যাঁ' : 'না'}</div>
                  {rtoFeedback.refund_reference && (
                    <div className="text-amber-400">রিফান্ড রেফারেন্স: {rtoFeedback.refund_reference}</div>
                  )}
                </div>
              )}
            </div>

            {/* Daily COD Remittance Reconciliation */}
            <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 space-y-4">
              <h2 className="text-base font-bold text-emerald-400">
                💰 দৈনিক COD রেমিটেন্স রিকনসিলিয়েশন (Item 29)
              </h2>
              <p className="text-xs text-slate-400">
                কুরিয়ারের জমা দেওয়া টাকা ও ব্যাঙ্ক অ্যাকাউন্টের ক্রেডিট মিলিয়ে গড়মিল শনাক্ত করুন।
              </p>

              <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-700 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">পেন্ডিং COD কালেকশন:</span>
                  <span className="font-bold text-white">₹545</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">কুরিয়ার পে-আউট স্ট্যাটাস:</span>
                  <span className="text-emerald-400 font-semibold">Delhivery Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">লজিস্টিকস নেট সাবসিডি:</span>
                  <span className="text-amber-300 font-semibold">₹52.5 / পার্সেল</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ANALYTICS & GSTR-1 */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Selling Books Leaderboard */}
              <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 space-y-3">
                <h3 className="font-bold text-amber-400 text-sm">🏆 সর্বাধিক বিক্রীত বইসমূহ (Leaderboard)</h3>
                <div className="space-y-2">
                  {defaultExecutiveAnalyticsService.getTopSellingBooks(4).map((b) => (
                    <div
                      key={b.book_id}
                      className="flex items-center justify-between p-2.5 bg-slate-900/80 rounded-lg text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-[10px]">
                          {b.rank}
                        </span>
                        <span className="font-medium text-slate-200">{b.title}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-white">{b.units_sold} কপি</span>
                        <span className="text-slate-400 ml-2">₹{b.revenue_inr}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Regional Demographics */}
              <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 space-y-3">
                <h3 className="font-bold text-emerald-400 text-sm">📍 আঞ্চলিক জেলা জনসংখ্যাতাত্ত্বিক বিক্রয়</h3>
                <div className="space-y-2">
                  {defaultExecutiveAnalyticsService.getDistrictDemographics().map((d) => (
                    <div
                      key={d.district}
                      className="flex items-center justify-between p-2.5 bg-slate-900/80 rounded-lg text-xs"
                    >
                      <span className="font-medium text-slate-200">{d.district}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400">{d.orders_count}টি অর্ডার</span>
                        <span className="font-bold text-white">₹{d.revenue_inr}</span>
                        <span className="text-amber-400 font-semibold">{d.percentage_of_total}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* GSTR-1 Nil-Rated Tax Compliance */}
            <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-white text-sm">📑 GSTR-1 ট্যাক্স অডিট রিপোর্ট (HSN 4901 - 0% GST)</h3>
                <p className="text-xs text-slate-400">
                  মুদ্রিত বই ভারতীয় জিএসটি আইনানুসারে সম্পূর্ণ করমুক্ত (Nil-Rated)। চার্টার্ড অ্যাকাউন্ট্যান্টের জন্য ১-ক্লিকে CSV ডাউনলোড করুন।
                </p>
              </div>
              <button
                onClick={() => {
                  const csv = defaultExecutiveAnalyticsService.exportGstr1Csv();
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `GSTR1_MMBOOK_${new Date().toISOString().slice(0, 7)}.csv`;
                  a.click();
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow"
              >
                📥 GSTR-1 CSV ডাউনলোড
              </button>
            </div>
          </div>
        )}

        {/* TAB 4.5: GSTR-1 MONTHLY STATUTORY SALES LEDGER (Items 42, 43, 50) */}
        {activeTab === 'gst_reports' && (
          <div className="space-y-4">
            <AdminGstrReportTable
              rows={generateGstr1Rows(
                orders.map((o) =>
                  getOrCreateInvoiceForOrder(o.order_id, {
                    customerName: o.customer_name,
                    customerPhone: o.customer_phone,
                    streetAddress: o.shipping_address_text,
                    city: o.district || 'Malda',
                    totalAmount: o.total_amount,
                    items: o.items.map((it, i) => ({
                      id: `item_${i}`,
                      title: it.title,
                      price: Math.round(o.total_amount / (o.items.length || 1)),
                      quantity: 1,
                    })),
                    paymentMethod: (o.payment_mode?.toLowerCase() as any) || 'upi',
                  })
                )
              )}
              selectedMonth="2026-09"
            />
          </div>
        )}

        {/* TAB 5: MARKETING & COUPONS */}
        {activeTab === 'marketing' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Coupon Engine */}
            <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 space-y-4">
              <h3 className="font-bold text-amber-400 text-sm">🎟️ কুপন ও ডিসকাউন্ট ইঞ্জিন</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="কুপন কোড (যেমন: MADHYAMIK50)"
                  value={couponCodeInput}
                  onChange={(e) => setCouponCodeInput(e.target.value)}
                  className="w-1/2 bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-white"
                />
                <input
                  type="number"
                  placeholder="কার্ট মূল্য"
                  value={couponCartVal}
                  onChange={(e) => setCouponCartVal(Number(e.target.value))}
                  className="w-1/4 bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-white"
                />
                <button
                  onClick={handleTestCoupon}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs"
                >
                  যাচাই
                </button>
              </div>

              {couponRes && (
                <div className={`p-3 rounded-lg border text-xs ${couponRes.valid ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300' : 'bg-rose-950/40 border-rose-500 text-rose-300'}`}>
                  {couponRes.valid ? (
                    <div>
                      <div>✅ কুপন সফলভাবে প্রয়োগ হয়েছে!</div>
                      <div>ছাড়: ₹{couponRes.discount} • পরিশোধযোগ্য: ₹{couponRes.final}</div>
                    </div>
                  ) : (
                    <div>❌ {couponRes.msg}</div>
                  )}
                </div>
              )}
            </div>

            {/* Abandoned Cart WhatsApp Follow-up */}
            <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 space-y-4">
              <h3 className="font-bold text-teal-400 text-sm">🛒 অসমাপ্ত কার্ট হোয়াটসঅ্যাপ রিকভারি (Item 44)</h3>
              <p className="text-xs text-slate-400">
                যেসব শিক্ষার্থী কার্টে বই রেখে চলে গেছে, তাদের ১-ক্লিকে কুপন সহ রিমাইন্ডার পাঠান।
              </p>
              <button
                onClick={() => {
                  const carts = defaultStoreMarketingService.getDormantCarts(2);
                  if (carts.length > 0) {
                    defaultStoreMarketingService.sendWhatsAppCartRecovery(carts[0].cart_id);
                    alert(`✅ তানভীর হোসেনকে হোয়াটসঅ্যাপ রিমাইন্ডার পাঠানো হয়েছে!`);
                  } else {
                    alert('বর্তমানে কোনো পেন্ডিং কার্ট নেই।');
                  }
                }}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-lg"
              >
                ⚡ ১-ক্লিক হোয়াটসঅ্যাপ রিকভারি পাঠান
              </button>
            </div>
          </div>
        )}

        {/* TAB 6: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BackupManagementPanel />
            {/* Maintenance Mode & Shophouse Profile */}
            <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 space-y-4">
              <h3 className="font-bold text-white text-sm">🏪 দোকান প্রোফাইল ও মেইন্টেন্যান্স</h3>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400">দোকানের নাম:</span>
                  <div className="font-semibold text-white">{settings.store_name}</div>
                </div>
                <div>
                  <span className="text-slate-400">ঠিকানা:</span>
                  <div className="text-slate-300">{settings.address}</div>
                </div>
                <div>
                  <span className="text-slate-400">অফিসিয়াল UPI VPA:</span>
                  <div className="font-mono text-amber-300">{settings.upi_id}</div>
                </div>
              </div>

              {/* Maintenance Toggle */}
              <div className="pt-3 border-t border-slate-700 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">স্টোর মেইন্টেন্যান্স মোড</div>
                  <div className="text-[10px] text-slate-400">চালু থাকলে সাধারণ ক্রেতারা কিনতে পারবেন না</div>
                </div>
                <button
                  onClick={toggleMaintenance}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    settings.is_maintenance_mode
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {settings.is_maintenance_mode ? 'বন্ধ করুন' : 'চালু করুন'}
                </button>
              </div>
            </div>

            {/* Customer Data Export with OTP */}
            <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 space-y-4">
              <h3 className="font-bold text-amber-400 text-sm">🔒 গ্রাহক তালিকা এক্সপোর্ট (OTP সুরক্ষাবিশিষ্ট)</h3>
              <p className="text-xs text-slate-400">
                তথ্য চুরিরোধে গ্রাহক তালিকা ডাউনলোড করতে সুপার অ্যাডমিনের ৬-সংখ্যার ওটিপি বাধ্যতামূলক।
              </p>

              {!exportOtpReq && !exportedCsv && (
                <button
                  onClick={handleRequestExportOtp}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg"
                >
                  🔑 ওটিপি জেনারেট করুন
                </button>
              )}

              {exportOtpReq && (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="৬-সংখ্যার ওটিপি লিখুন..."
                    value={exportOtpInput}
                    onChange={(e) => setExportOtpInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-white"
                  />
                  <button
                    onClick={handleVerifyExportOtp}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg"
                  >
                    যাচাই ও CSV ডাউনলোড
                  </button>
                </div>
              )}

              {exportedCsv && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500 rounded text-xs text-emerald-300 space-y-2">
                  <div>✅ গ্রাহক তালিকা সফলভাবে এক্সপোর্ট হয়েছে!</div>
                  <button
                    onClick={() => {
                      const blob = new Blob([exportedCsv], { type: 'text/csv' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `MMBOOK_CUSTOMERS_${Date.now()}.csv`;
                      a.click();
                    }}
                    className="px-3 py-1 bg-emerald-600 text-white rounded font-bold text-xs"
                  >
                    CSV সংরক্ষণ করুন
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 7: FINANCE & PAYMENT AUDIT (Module 13) */}
        {activeTab === 'finance' && (
          <div className="space-y-4">
            <AdminPaymentAuditTable
              transactions={paymentTransactions}
              grossSales={settlementProjection.gross_sales}
              projectedSettlementDate={settlementProjection.settlement_date}
              projectedSettlementAmount={settlementProjection.net_settlement_amount}
              onInitiateRefund={(paymentId) => {
                alert(`রিফান্ড প্রক্রিয়া শুরু হয়েছে: ${paymentId}`);
              }}
            />
          </div>
        )}
      </div>

      {/* MODAL 1: A5 SMART PACKING SLIP (Item 26) */}
      {packingSlipOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-slate-100 text-slate-900 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative p-4">
            <div className="flex justify-between items-center mb-2 print:hidden">
              <span className="text-xs font-bold text-slate-700">A5 স্মার্ট ওয়্যারহাউস প্যাকিং স্লিপ</span>
              <button
                onClick={() => setPackingSlipOrder(null)}
                className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>
            <PackingSlipView
              slipData={{
                order_id: packingSlipOrder.order_number,
                invoice_number: `INV-${packingSlipOrder.order_number.replace('#', '')}`,
                customer_name: `${packingSlipOrder.customer_name} (${packingSlipOrder.customer_phone})`,
                delivery_speed: 'Express Logistics Delivery',
                items: packingSlipOrder.items.map((it) => ({
                  title: it.title,
                  quantity: it.quantity,
                  verified: true,
                })),
                packer_note: `Rack Locations: ${packingSlipOrder.items.map((i) => i.rack_location).join(', ')}`,
              }}
              onBack={() => setPackingSlipOrder(null)}
            />
          </div>
        </div>
      )}

      {/* MODAL 2: CLICK & COLLECT 4-DIGIT OTP MODAL (Item 27) */}
      {otpModalOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-base font-bold text-teal-400">কাউন্টার পিকআপ OTP যাচাই</h3>
              <button
                onClick={() => {
                  setOtpModalOrder(null);
                  setOtpFeedback(null);
                }}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              গ্রাহক <strong>{otpModalOrder.customer_name}</strong>-এর মোবাইলে পাঠানো ৪-সংখ্যার গোপন ওটিপি লিখুন:
            </p>

            <input
              type="text"
              maxLength={4}
              placeholder="৪-সংখ্যার OTP লিখুন (যেমন: 7821)"
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-center text-xl font-mono tracking-widest text-white focus:outline-none focus:border-teal-400"
            />

            {otpFeedback && (
              <div
                className={`p-3 rounded-lg text-xs ${
                  otpFeedback.success
                    ? 'bg-teal-950 text-teal-300 border border-teal-600'
                    : 'bg-rose-950 text-rose-300 border border-rose-600'
                }`}
              >
                {otpFeedback.msg}
              </div>
            )}

            <button
              onClick={handleVerifyOtp}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg text-xs shadow-lg transition"
            >
              যাচাই করে হ্যান্ডওভার করুন
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: AMAZON TAX INVOICE MODAL (Items 2, 6, 8, 35) */}
      {invoiceModalOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-2 flex justify-between items-center z-10 print:hidden">
              <span className="text-xs font-bold text-slate-700">অফিশিয়াল ট্যাক্স ইনভয়েস প্রিভিউ</span>
              <button
                onClick={() => setInvoiceModalOrder(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>
            <AmazonTaxInvoiceView
              invoice={getOrCreateInvoiceForOrder(invoiceModalOrder.order_id, {
                customerName: invoiceModalOrder.customer_name,
                customerPhone: invoiceModalOrder.customer_phone,
                streetAddress: invoiceModalOrder.shipping_address_text,
                city: invoiceModalOrder.district || 'Malda',
                totalAmount: invoiceModalOrder.total_amount,
                items: invoiceModalOrder.items.map((it, i) => ({
                  id: it.book_id || `item_${i}`,
                  title: it.title,
                  price: it.unit_price,
                  quantity: it.quantity,
                })),
                paymentMethod: (invoiceModalOrder.payment_mode?.toLowerCase() as any) || 'upi',
              })}
              onBack={() => setInvoiceModalOrder(null)}
            />
          </div>
        </div>
      )}

      {/* MODAL 4: 4x6" THERMAL SHIPPING LABEL MODAL (Items 21, 22, 23, 25, 35) */}
      {thermalLabelOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-slate-100 text-slate-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl relative p-4">
            <div className="flex justify-between items-center mb-2 print:hidden">
              <span className="text-xs font-bold text-slate-700">৪x৬ ইঞ্চি থার্মাল শিপিং লেবেল</span>
              <button
                onClick={() => setThermalLabelOrder(null)}
                className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>
            <ThermalShippingLabel
              labelData={{
                awb_tracking_number: thermalLabelOrder.awb_code || `DEL${thermalLabelOrder.order_id.replace(/\D/g, '') || '987654321'}`,
                courier_name: thermalLabelOrder.courier_name || 'DELHIVERY EXPRESS',
                order_id: thermalLabelOrder.order_number,
                invoice_number: `INV-${thermalLabelOrder.order_number.replace('#', '')}`,
                recipient_name: thermalLabelOrder.customer_name,
                recipient_phone: thermalLabelOrder.customer_phone,
                recipient_address: thermalLabelOrder.shipping_address_text || 'Netaji Subhash Road, Malda',
                recipient_landmark: 'Near Rathbari More Gate',
                recipient_pincode: thermalLabelOrder.pincode || '732101',
                recipient_city: thermalLabelOrder.district || 'Malda',
                recipient_district: thermalLabelOrder.district || 'Malda',
                recipient_state: 'West Bengal',
                seller_return_address: 'M.M Book House, Netaji Subhash Road, English Bazar, Malda - 732101, WB',
                payment_mode: thermalLabelOrder.payment_mode === 'COD' ? 'COD' : 'PREPAID',
                collectable_amount: thermalLabelOrder.payment_mode === 'COD' ? thermalLabelOrder.total_amount : 0,
                weight_kg: 0.65,
                otp_badge: '✔ Handover only after 4-digit OTP',
              }}
              onBack={() => setThermalLabelOrder(null)}
            />
          </div>
        </div>
      )}

      {/* MODAL 5: 58/80mm POS COUNTER THERMAL RECEIPT MODAL (Item 38) */}
      {posReceiptOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-slate-100 text-slate-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl relative p-4">
            <div className="flex justify-between items-center mb-2 print:hidden">
              <span className="text-xs font-bold text-slate-700">POS কাউন্টার থার্মাল রসিদ (58mm/80mm)</span>
              <button
                onClick={() => setPosReceiptOrder(null)}
                className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>
            <CounterPosReceipt
              invoice={getOrCreateInvoiceForOrder(posReceiptOrder.order_id, {
                customerName: posReceiptOrder.customer_name,
                customerPhone: posReceiptOrder.customer_phone,
                streetAddress: posReceiptOrder.shipping_address_text,
                city: posReceiptOrder.district || 'Malda',
                totalAmount: posReceiptOrder.total_amount,
                items: posReceiptOrder.items.map((it, i) => ({
                  id: it.book_id || `item_${i}`,
                  title: it.title,
                  price: it.unit_price,
                  quantity: it.quantity,
                })),
                paymentMethod: (posReceiptOrder.payment_mode?.toLowerCase() as any) || 'upi',
              })}
              onBack={() => setPosReceiptOrder(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
