import React from 'react';
import { Metadata } from 'next';
import { SellerCentralDashboard } from '@/components/admin/SellerCentralDashboard';

export const metadata: Metadata = {
  title: 'মার্চেন্ট সেলার সেন্ট্রাল | M.M Book House Malda',
  description: 'Amazon-Style Merchant Seller Central Admin Portal for M.M Book House Malda. Inventory, order dispatch pipeline, barcode scanner, and executive analytics.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-slate-900">
      <SellerCentralDashboard />
    </main>
  );
}
