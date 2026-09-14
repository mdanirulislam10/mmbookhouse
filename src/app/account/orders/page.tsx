import React from 'react';
import { Metadata } from 'next';
import { CustomerOrdersHub } from '@/components/orders/CustomerOrdersHub';

export const metadata: Metadata = {
  title: 'আপনার অর্ডারসমূহ | M.M Book House Malda',
  description: 'আপনার সকল বইয়ের অর্ডার, লাইভ পার্সেল ট্র্যাকিং ও চালান এক নজরে দেখুন।',
};

export default function AccountOrdersPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-8">
      <CustomerOrdersHub locale="bn" />
    </main>
  );
}
