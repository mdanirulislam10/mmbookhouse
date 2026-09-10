import React from 'react';
import type { Metadata } from 'next';
import { CartView } from '@/components/cart/CartView';

export const metadata: Metadata = {
  title: 'Shopping Cart | M.M Book House',
  description:
    'Review items in your shopping cart, manage quantities, select books for checkout, and proceed to secure payment at M.M Book House Malda.',
  keywords: [
    'Shopping Cart',
    'শপিং কার্ট',
    'M.M Book House Cart',
    'Malda Book Store Cart',
    'Checkout Books',
  ],
  alternates: {
    canonical: '/cart',
  },
  openGraph: {
    title: 'Shopping Cart | M.M Book House',
    description:
      'Review items in your shopping cart, manage quantities, select books for checkout, and proceed to secure payment at M.M Book House Malda.',
    url: 'https://mmbookhouse.in/cart',
    siteName: 'M.M Book House',
    locale: 'bn_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shopping Cart | M.M Book House',
    description:
      'Review items in your shopping cart, manage quantities, select books for checkout, and proceed to secure payment at M.M Book House Malda.',
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function CartPage() {
  return <CartView />;
}
