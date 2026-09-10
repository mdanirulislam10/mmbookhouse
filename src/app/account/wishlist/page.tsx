import React from 'react';
import type { Metadata } from 'next';
import { WishlistView } from '@/components/account/WishlistView';

export const metadata: Metadata = {
  title: 'Your Wishlist | পছন্দের তালিকা | M.M Book House Malda',
  description:
    'Save and organize your favorite academic, school, college, and competitive exam books into custom syllabi lists at M.M Book House Malda.',
  keywords: [
    'Wishlist',
    'পছন্দের তালিকা',
    'Saved Books',
    'M.M Book House Wishlist',
    'Malda Book House',
    'WBCS Book List',
  ],
  alternates: {
    canonical: '/account/wishlist',
  },
  openGraph: {
    title: 'Your Wishlist | পছন্দের তালিকা | M.M Book House',
    description:
      'Save and organize your favorite academic, school, college, and competitive exam books into custom syllabi lists at M.M Book House Malda.',
    url: 'https://mmbookhouse.in/account/wishlist',
    siteName: 'M.M Book House',
    locale: 'bn_IN',
    type: 'website',
  },
};

export default function WishlistPage() {
  return <WishlistView />;
}
