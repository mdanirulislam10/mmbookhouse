import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getStoredInvoiceAsync, getInvoiceByOrderIdAsync } from '@/lib/services/invoiceStorageService';
import { AmazonTaxInvoiceView } from '@/components/invoice/AmazonTaxInvoiceView';

interface PageProps {
  params: Promise<{
    invoice_number: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { invoice_number } = await params;
  return {
    title: `ট্যাক্স ইনভয়েস ${invoice_number} | M.M Book House Malda`,
    description: `Official GST Rule 46 Tax Invoice for M.M Book House Malda.`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function InvoiceDetailPage({ params }: PageProps) {
  const { invoice_number } = await params;

  if (!invoice_number) {
    notFound();
  }

  // 1. Try finding by invoice number (checks memory registry & Supabase invoices table)
  let record = await getStoredInvoiceAsync(invoice_number);
  let invoice = record ? record.invoice : null;

  // 2. If not found by invoice number, try resolving by order ID / order number
  if (!invoice) {
    invoice = await getInvoiceByOrderIdAsync(invoice_number);
  }

  // 3. If neither matches, return standard 404
  if (!invoice) {
    notFound();
  }

  return <AmazonTaxInvoiceView invoice={invoice} />;
}
