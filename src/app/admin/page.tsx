import React from 'react';
import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SellerCentralDashboard } from '@/components/admin/SellerCentralDashboard';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/admin/adminSession';

export const metadata: Metadata = {
  title: 'মার্চেন্ট সেলার সেন্ট্রাল | M.M Book House Malda',
  description: 'Amazon-Style Merchant Seller Central Admin Portal for M.M Book House Malda. Inventory, order dispatch pipeline, barcode scanner, and executive analytics.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPage() {
  const cookieStore = await cookies();
  let authenticated = false;
  try {
    authenticated = verifyAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  } catch {
    authenticated = false;
  }
  if (!authenticated) redirect('/admin/login');

  return (
    <main className="min-h-screen bg-slate-900">
      <SellerCentralDashboard />
    </main>
  );
}
