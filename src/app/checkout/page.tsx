import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { CheckoutHeader } from '@/components/checkout/CheckoutHeader';
import { CheckoutFooter } from '@/components/checkout/CheckoutFooter';
import { AmazonAccordionCheckout } from '@/components/checkout/AmazonAccordionCheckout';

export const metadata: Metadata = {
  title: 'Secure Checkout | M.M Book House Malda',
  description:
    'Complete your order safely with 256-bit SSL encryption, UPI, Cash on Delivery, and fast courier delivery across Malda and West Bengal.',
  robots: {
    index: false,
    follow: false,
  },
};

function CheckoutLoadingSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse space-y-6">
      <div className="h-8 bg-gray-200 rounded-lg w-48" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <div className="h-28 bg-gray-100 rounded-2xl border border-gray-200" />
          <div className="h-28 bg-gray-100 rounded-2xl border border-gray-200" />
          <div className="h-28 bg-gray-100 rounded-2xl border border-gray-200" />
        </div>
        <div className="lg:col-span-4">
          <div className="h-80 bg-gray-100 rounded-2xl border border-gray-200" />
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f4f6f8]">
      {/* Amazon 3-Step Accordion with Synchronized Header & Sticky Summary (Item 1-8) */}
      <main className="flex-1 pb-16 lg:pb-8">
        <Suspense fallback={<CheckoutLoadingSkeleton />}>
          <AmazonAccordionCheckout />
        </Suspense>
      </main>

      {/* 3. Amazon Minimal Compliance Footer (Item 10) */}
      <CheckoutFooter />
    </div>
  );
}
