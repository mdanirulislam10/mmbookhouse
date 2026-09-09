import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Package, Clock, CheckCircle2, Truck, ChevronRight, Home, PhoneCall, ArrowRight, BookOpen } from 'lucide-react';

export const metadata: Metadata = {
  title: 'আপনার সমস্ত অর্ডার ও ট্র্যাকিং | M.M Book House Malda',
  description: 'M.M Book House Malda-তে আপনার বইয়ের অর্ডার ট্র্যাকিং। ডেলিভারি স্ট্যাটাস, ইনভয়েস এবং পিক-আপের তথ্য।',
  keywords: ['অর্ডার ট্র্যাকিং', 'Order Tracking Malda', 'বই ডেলিভারি স্ট্যাটাস', 'M.M Book House Orders'],
};

const SAMPLE_ORDERS = [
  {
    orderId: 'MMB-2026-8841',
    date: '০৭ সেপ্টেম্বর, ২০২৬',
    status: 'ডেলিভারির পথে (Out for Delivery)',
    statusCode: 'out_for_delivery',
    totalAmount: 910,
    items: [
      {
        title: 'WBCS প্রিলিমিনারি ও মেইনস কমপ্লিট ম্যানুয়াল (২০২৬ সংস্করণ)',
        qty: 1,
        price: 595,
      },
      {
        title: 'গৌড়বঙ্গ বিশ্ববিদ্যালয় (UGB) ইতিহাস অনার্স ৪র্থ সেমিস্টার সহায়িকা',
        qty: 1,
        price: 315,
      },
    ],
    deliveryEstimate: 'আজ বিকাল ৫:০০ টার মধ্যে (ইংলিশ বাজার)',
    address: 'নেতাজি সুভাষ রোড, ইংলিশ বাজার, মালদা - ৭৩২১০১',
  },
];

export default function OrdersPage() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8 min-h-[75vh] font-bengali">
      {/* Breadcrumb */}
      <nav aria-label="ব্রেডক্রাম্ব" className="flex items-center gap-1.5 text-xs text-gray-500 mb-4 select-none">
        <Link href="/" className="hover:text-amber-600 flex items-center gap-1">
          <Home className="w-3.5 h-3.5" />
          <span>হোম</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <Link href="/account" className="hover:text-amber-600">
          <span>অ্যাকাউন্ট</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="font-bold text-gray-900">অর্ডার ট্র্যাকিং</span>
      </nav>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#131921] via-[#1e2a38] to-[#232f3e] text-white rounded-2xl p-6 sm:p-8 mb-8 border border-amber-500/20 shadow-xl">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
            <Package className="w-4 h-4 text-amber-400" />
            <span>লাইভ অর্ডার ট্র্যাকিং ও হিস্ট্রি</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white mb-2">
            আপনার বইয়ের <span className="text-amber-400">অর্ডারসমূহ</span>
          </h1>
          <p className="text-sm text-gray-300">
            আপনার বর্তমান ও পূর্বের সমস্ত বুক অর্ডারের লাইভ স্ট্যাটাস ও ট্র্যাকিং তথ্য এখানে দেখুন।
          </p>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-6">
        {SAMPLE_ORDERS.map((order) => (
          <div
            key={order.orderId}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Order Header Bar */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <span className="text-gray-500">অর্ডার নম্বর: </span>
                  <span className="font-bold text-gray-900">{order.orderId}</span>
                </div>
                <div>
                  <span className="text-gray-500">তারিখ: </span>
                  <span className="font-medium text-gray-700">{order.date}</span>
                </div>
                <div>
                  <span className="text-gray-500">মোট মূল্য: </span>
                  <span className="font-black text-gray-900">₹{order.totalAmount}</span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                <Truck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{order.status}</span>
              </span>
            </div>

            {/* Tracking Milestones */}
            <div className="px-6 py-6 border-b border-gray-100">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
                ডেলিভারি অগ্রগতি (Delivery Progress):
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs mb-1 shadow-xs">
                    ✓
                  </div>
                  <span className="text-xs font-bold text-gray-900">অর্ডার নিশ্চিত</span>
                  <span className="text-[10px] text-gray-500">গৃহীত হয়েছে</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs mb-1 shadow-xs">
                    ✓
                  </div>
                  <span className="text-xs font-bold text-gray-900">প্যাকিং সমাপ্ত</span>
                  <span className="text-[10px] text-gray-500">মালদা কাউন্টারে</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-gray-950 flex items-center justify-center font-bold text-xs mb-1 animate-pulse shadow-xs">
                    <Truck className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-amber-700">ডেলিভারির পথে</span>
                  <span className="text-[10px] text-gray-500">আজ বিকালের মধ্যে</span>
                </div>
                <div className="flex flex-col items-center opacity-40">
                  <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-xs mb-1">
                    ৪
                  </div>
                  <span className="text-xs font-bold text-gray-700">ডেলিভারি সম্পন্ন</span>
                  <span className="text-[10px] text-gray-500">হাতে পৌঁছাবে</span>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="px-6 py-4">
              <div className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-amber-600" />
                <span>বইয়ের তালিকা ({order.items.length}টি বই):</span>
              </div>
              <ul className="space-y-2">
                {order.items.map((item, idx) => (
                  <li key={idx} className="flex items-center justify-between text-xs py-1 border-b border-gray-50 last:border-0">
                    <span className="font-medium text-gray-800">{item.title}</span>
                    <span className="font-bold text-gray-900">₹{item.price} (১ কপি)</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions Footer */}
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-gray-500">
                ডেলিভারি সংক্রান্ত জরুরি প্রয়োজনে কল করুন: <strong className="text-amber-600">+91 98001 23456</strong>
              </span>
              <div className="flex items-center gap-2">
                <Link
                  href="/support"
                  className="px-3.5 py-1.5 bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 font-bold rounded shadow-2xs transition-colors"
                >
                  সহায়তা দরকার?
                </Link>
                <Link
                  href="/"
                  className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-500 text-gray-950 font-bold rounded shadow-2xs transition-colors"
                >
                  আরও বই কিনুন
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
