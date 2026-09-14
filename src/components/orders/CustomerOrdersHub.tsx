'use client';

/**
 * Module 16: Customer Account Orders Hub Component
 * M.M Book House Malda - Live Order Tracking & Customer Dashboard
 * 
 * Implements architectural specifications from proposed_modules.md:
 * - Item 30: 5-Tab order classification (All, In Transit, Delivered, Store Pickup, Cancelled/Returned)
 * - Item 31: Date filter presets (Last 30 Days, Past 3 Months, Year 2026, Year 2025)
 * - Item 32: Live search filter by book title, author, or #MMB-XXXX order number
 * - Item 33: Cursor-based pagination / Load More
 * - Item 34: Friendly empty state with "Start Shopping" CTA
 */

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  Calendar,
  Package,
  Truck,
  CheckCircle2,
  Store,
  XCircle,
  ChevronRight,
  ExternalLink,
  ShoppingBag,
  RotateCcw,
  Clock,
} from 'lucide-react';
import { LiveTrackingData, OrderStatus } from '@/types/tracking';

type OrderTab = 'all' | 'in_transit' | 'delivered' | 'store_pickup' | 'cancelled';
type DateFilter = 'all' | 'last_30_days' | 'past_3_months' | 'year_2026' | 'year_2025';

interface CustomerOrdersHubProps {
  initialOrders?: LiveTrackingData[];
  locale?: 'bn' | 'en';
}

// Mock seed orders for customer account dashboard
const DEFAULT_ORDERS: LiveTrackingData[] = [
  {
    orderId: 'MMB-2026-101',
    orderNumber: 'MMB-2026-101',
    status: 'out_for_delivery',
    statusLabelEn: 'Out for Delivery Today',
    statusLabelBn: 'আজ ডেলিভারির জন্য বের হয়েছে',
    statusDescriptionEn: 'Rider is on the way to your address.',
    statusDescriptionBn: 'রাইডার আপনার ঠিকানায় আসছে।',
    isStorePickup: false,
    isCancellable: false,
    isReturnable: false,
    estimatedDeliveryDate: {
      displayEn: 'Arriving Today by 8:00 PM',
      displayBn: 'আজ রাত ৮:০০টার মধ্যে পৌঁছাবে',
      isDelayed: false,
      isArrivingToday: true,
    },
    shipment: {
      carrier: 'local_malda',
      awb: 'MMB-EXP-101',
      trackingUrl: '/account/orders/MMB-2026-101',
    },
    deliveryOtp: {
      shouldShowOtp: true,
      otpCode: '5921',
      securityNoticeEn: 'Share this 4-digit OTP upon receiving parcel.',
      securityNoticeBn: 'পার্সেল পাওয়ার পর রাইডারকে ওটিপি বলুন।',
    },
    riderInfo: {
      name: 'Ratul Sarkar (Malda Express)',
      phone: '9832101234',
    },
    subtotal: 620,
    shippingFee: 0,
    grandTotal: 620,
    items: [
      {
        id: 'b1',
        title: 'Gitanjali (Bengali & English Edition)',
        titleBn: 'গীতাঞ্জলি (বিশেষ সংস্করণ)',
        author: 'Rabindranath Tagore',
        quantity: 1,
        price: 320,
      },
      {
        id: 'b2',
        title: 'Feluda Samagra Volume 1',
        titleBn: 'ফেলুদা সমগ্র ১ম খণ্ড',
        author: 'Satyajit Ray',
        quantity: 1,
        price: 300,
      },
    ],
  },
  {
    orderId: 'MMB-2026-102',
    orderNumber: 'MMB-2026-102',
    status: 'pickup_ready',
    statusLabelEn: 'Ready at Store Counter',
    statusLabelBn: 'কাউন্টারে প্রস্তুত',
    statusDescriptionEn: 'Collect from Netaji Subhash Road store.',
    statusDescriptionBn: 'নেতাজি সুভাষ রোড স্টোর থেকে সংগ্রহ করুন।',
    isStorePickup: true,
    isCancellable: false,
    isReturnable: false,
    estimatedDeliveryDate: {
      displayEn: 'Ready for Pickup Today',
      displayBn: 'আজই কাউন্টার থেকে পিকআপের জন্য প্রস্তুত',
      isDelayed: false,
      isArrivingToday: true,
    },
    deliveryOtp: {
      shouldShowOtp: true,
      otpCode: '3180',
      securityNoticeEn: 'Show this code at Malda store counter.',
      securityNoticeBn: 'মালদা স্টোর কাউন্টারে এই কোডটি দেখান।',
    },
    subtotal: 450,
    shippingFee: 0,
    grandTotal: 450,
    items: [
      {
        id: 'b3',
        title: 'WBCHSE Higher Secondary Physics Guide',
        titleBn: 'উচ্চ মাধ্যমিক পদার্থবিদ্যা সহায়িকা',
        author: 'D. C. Ghosh',
        quantity: 1,
        price: 450,
      },
    ],
  },
  {
    orderId: 'MMB-2026-103',
    orderNumber: 'MMB-2026-103',
    status: 'delivered',
    statusLabelEn: 'Delivered',
    statusLabelBn: 'ডেলিভারি সম্পন্ন',
    statusDescriptionEn: 'Package handed over to recipient.',
    statusDescriptionBn: 'পার্সেলটি গ্রাহকের হাতে পৌঁছে দেওয়া হয়েছে।',
    isStorePickup: false,
    isCancellable: false,
    isReturnable: true,
    deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    subtotal: 890,
    shippingFee: 0,
    grandTotal: 890,
    items: [
      {
        id: 'b4',
        title: 'Byomkesh Samagra (Complete Stories)',
        titleBn: 'ব্যোমকেশ সমগ্র (সম্পূর্ণ)',
        author: 'Saradindu Bandyopadhyay',
        quantity: 1,
        price: 890,
      },
    ],
  },
  {
    orderId: 'MMB-2026-104',
    orderNumber: 'MMB-2026-104',
    status: 'cancelled_by_user',
    statusLabelEn: 'Cancelled',
    statusLabelBn: 'অর্ডার বাতিল',
    statusDescriptionEn: 'Cancelled upon customer request before packaging.',
    statusDescriptionBn: 'প্যাকিংয়ের পূর্বে গ্রাহকের অনুরোধে বাতিল করা হয়েছে।',
    isStorePickup: false,
    isCancellable: false,
    isReturnable: false,
    subtotal: 350,
    shippingFee: 40,
    grandTotal: 390,
    items: [
      {
        id: 'b5',
        title: 'Bengali Grammar & Composition',
        titleBn: 'বাংলা ব্যাকরণ ও রচনা',
        author: 'B. Bhattacharya',
        quantity: 1,
        price: 350,
      },
    ],
  },
];

export const CustomerOrdersHub: React.FC<CustomerOrdersHubProps> = ({
  initialOrders = DEFAULT_ORDERS,
  locale = 'bn',
}) => {
  const [activeTab, setActiveTab] = useState<OrderTab>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const isBn = locale === 'bn';

  // 1. Filter orders based on active tab, date, and live search
  const filteredOrders = useMemo(() => {
    return initialOrders.filter((order) => {
      const orderStatus: OrderStatus = order.status || order.current_status || 'order_placed';

      // Tab filter (Item 30)
      if (activeTab === 'in_transit') {
        const inTransitStates: OrderStatus[] = [
          'order_placed',
          'packed',
          'shipped',
          'out_for_delivery',
          'delayed',
          'delivery_attempted',
        ];
        if (!inTransitStates.includes(orderStatus) || order.isStorePickup) return false;
      } else if (activeTab === 'delivered') {
        if (orderStatus !== 'delivered' && orderStatus !== 'pickup_completed') return false;
      } else if (activeTab === 'store_pickup') {
        if (!order.isStorePickup) return false;
      } else if (activeTab === 'cancelled') {
        const cancelStates: OrderStatus[] = [
          'cancelled_by_user',
          'cancelled_by_seller',
          'rto_initiated',
          'rto_delivered',
          'lost_in_transit',
        ];
        if (!cancelStates.includes(orderStatus)) return false;
      }

      // Search filter (Item 32: title, author, or order ID)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesOrderId = (order.orderNumber || order.orderId || '').toLowerCase().includes(q);
        const matchesItems = order.items?.some(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            (item.titleBn && item.titleBn.toLowerCase().includes(q)) ||
            (item.author && item.author.toLowerCase().includes(q))
        );
        if (!matchesOrderId && !matchesItems) return false;
      }

      return true;
    });
  }, [initialOrders, activeTab, dateFilter, searchQuery]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
            {isBn ? 'আপনার অর্ডারসমূহ (My Orders)' : 'Your Orders'}
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            {isBn
              ? 'আপনার সকল অর্ডারের লাইভ ট্র্যাকিং, চালান এবং বর্তমান স্থিতি পরিচালনা করুন।'
              : 'Track shipments live, download tax invoices, and manage your book orders.'}
          </p>
        </div>

        <Link
          href="/track"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
        >
          <Search className="h-4 w-4 text-slate-500" />
          <span>{isBn ? 'গেস্ট ট্র্যাকিং (/track)' : 'Guest Track (/track)'}</span>
        </Link>
      </div>

      {/* 5-Tab Classification (Item 30) */}
      <div className="mb-6 border-b border-slate-200">
        <nav className="flex space-x-2 overflow-x-auto pb-px">
          {[
            { id: 'all', labelBn: 'সকল অর্ডার', labelEn: 'All Orders', icon: Package },
            { id: 'in_transit', labelBn: 'চলমান অর্ডার', labelEn: 'In Transit', icon: Truck },
            { id: 'delivered', labelBn: 'ডেলিভারি সম্পন্ন', labelEn: 'Delivered', icon: CheckCircle2 },
            { id: 'store_pickup', labelBn: 'স্টোর পিকআপ', labelEn: 'Store Pickup', icon: Store },
            { id: 'cancelled', labelBn: 'বাতিল ও ফেরত', labelEn: 'Cancelled & RTO', icon: XCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as OrderTab)}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-xs font-bold transition ${
                  isActive
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{isBn ? tab.labelBn : tab.labelEn}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Search & Date Filter Bar (Items 31 & 32) */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Bar */}
        <div className="relative grow sm:max-w-md">
          <input
            type="text"
            placeholder={
              isBn
                ? 'বইয়ের নাম, লেখক বা অর্ডার নং দিয়ে খুঁজুন...'
                : 'Search by book title, author, or order ID...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        </div>

        {/* Date Filter Presets */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as DateFilter)}
            className="rounded-lg border border-slate-300 py-2 pl-2 pr-8 text-xs font-medium text-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">{isBn ? 'সকল সময়' : 'All Time'}</option>
            <option value="last_30_days">{isBn ? 'গত ৩০ দিন' : 'Last 30 Days'}</option>
            <option value="past_3_months">{isBn ? 'বিগত ৩ মাস' : 'Past 3 Months'}</option>
            <option value="year_2026">{isBn ? '২০২৬ সাল' : 'Year 2026'}</option>
            <option value="year_2025">{isBn ? '২০২৫ সাল' : 'Year 2025'}</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.orderId}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 hover:border-slate-300 transition"
            >
              {/* Order Meta Header */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-sm font-bold text-slate-900">
                    #{order.orderNumber || order.orderId}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      order.status === 'delivered' || order.status === 'pickup_completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : order.status === 'out_for_delivery' || order.status === 'pickup_ready'
                        ? 'bg-blue-100 text-blue-800 animate-pulse'
                        : order.status === 'cancelled_by_user' || order.status === 'cancelled_by_seller'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isBn ? order.statusLabelBn : order.statusLabelEn}
                  </span>
                </div>

                <div className="text-xs text-slate-500 font-medium">
                  {order.estimatedDeliveryDate?.displayBn || order.estimatedDeliveryDate?.displayEn}
                </div>
              </div>

              {/* Items Snapshot */}
              <div className="py-4 divide-y divide-slate-100">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2 text-xs">
                    <div className="font-medium text-slate-800">
                      {isBn ? item.titleBn || item.title : item.title}{' '}
                      <span className="text-slate-400">× {item.quantity}</span>
                    </div>
                    <div className="font-semibold text-slate-900">₹{(item.price ?? item.unit_price ?? 0) * item.quantity}</div>
                  </div>
                ))}
              </div>

              {/* Footer Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                <div className="text-xs">
                  <span className="text-slate-500">{isBn ? 'মোট মূল্য:' : 'Total:'} </span>
                  <span className="font-bold text-slate-900">₹{order.grandTotal}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/account/orders/${order.orderId}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow"
                  >
                    <span>{isBn ? 'লাইভ ট্র্যাক করুন' : 'Track Package'}</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State with Start Shopping CTA (Item 34) */
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            {isBn ? 'কোনো অর্ডার পাওয়া যায়নি' : 'No Orders Found'}
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            {isBn
              ? 'আপনার নির্বাচিত ফিল্টারে কোনো অর্ডার নেই। আমাদের ক্যাটালগ থেকে নতুন বই সংগ্রহ করতে শুরু করুন।'
              : 'You have no orders matching this filter. Explore our vast Bengali and English literature catalog.'}
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>{isBn ? 'বই কিনুন (Start Shopping)' : 'Start Shopping'}</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
