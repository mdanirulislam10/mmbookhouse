import crypto from 'crypto';
import { TaxInvoice } from '../../types/invoice';

/**
 * Module 14: Sequential Numbering, Immutable Storage & Verification Service
 * (Items 3, 10, 14, 15, 17, 44, 46)
 */

export interface StoredInvoiceRecord {
  invoice: TaxInvoice;
  content_sha256: string;
  is_immutable: boolean;
  issued_at: string;
}

// In-memory atomic sequence and storage (mirrors Supabase/PostgreSQL schema)
const sequentialCounters = new Map<string, number>();
const invoiceRegistry = new Map<string, StoredInvoiceRecord>();

/**
 * SQL Schema for PostgreSQL `invoices` table (Item 46)
 */
export const INVOICE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  financial_year VARCHAR(10) NOT NULL,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  seller_gstin VARCHAR(15) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_gstin VARCHAR(15),
  state_code VARCHAR(5) NOT NULL,
  is_interstate BOOLEAN NOT NULL DEFAULT FALSE,
  is_b2b BOOLEAN NOT NULL DEFAULT FALSE,
  total_taxable_amount NUMERIC(12, 2) NOT NULL,
  total_cgst NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total_sgst NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total_igst NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total_payable_amount NUMERIC(12, 2) NOT NULL,
  payment_method VARCHAR(20) NOT NULL,
  payment_status VARCHAR(20) NOT NULL,
  utr_or_rrn VARCHAR(50),
  pdf_storage_url TEXT,
  content_sha256 VARCHAR(64) NOT NULL,
  is_locked BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_fy_num ON invoices(financial_year, invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id);
`;

/**
 * Generates next gapless, sequential invoice number for given financial year (Item 3, 44)
 * Format: INV-MMB-YYYY-XXXX (e.g. INV-MMB-2026-0001)
 */
export function generateNextInvoiceNumber(financialYear: string = '2026-27'): string {
  const currentCount = sequentialCounters.get(financialYear) || 0;
  const nextSeq = currentCount + 1;
  sequentialCounters.set(financialYear, nextSeq);

  const baseYear = financialYear.split('-')[0] || '2026';
  const paddedSeq = String(nextSeq).padStart(4, '0');
  return `INV-MMB-${baseYear}-${paddedSeq}`;
}

/**
 * Resets sequence counter (primarily for clean test isolation)
 */
export function resetSequenceCounter(financialYear: string = '2026-27', startingAt: number = 0): void {
  sequentialCounters.set(financialYear, startingAt);
}

/**
 * Computes SHA-256 hash of invoice payload for tamper-proof audit trail (Item 15)
 */
export function computeInvoiceHash(invoice: TaxInvoice): string {
  const canonicalData = {
    num: invoice.invoice_number,
    date: invoice.invoice_date,
    order: invoice.order_id,
    seller: invoice.seller.gstin,
    cust: invoice.customer.customer_name,
    payable: invoice.total_payable_amount,
    items: invoice.items.map((i) => ({
      id: i.item_id,
      hsn: i.hsn_code,
      q: i.quantity,
      amt: i.total_item_amount,
    })),
  };
  return crypto.createHash('sha256').update(JSON.stringify(canonicalData)).digest('hex');
}

/**
 * Stores an invoice immutably (Item 10, 14).
 * Throws error if an invoice with the same number already exists and someone attempts to mutate it.
 */
export function storeTaxInvoice(invoice: TaxInvoice): StoredInvoiceRecord {
  if (invoiceRegistry.has(invoice.invoice_number)) {
    throw new Error(
      `GST Statutory Violation: Invoice ${invoice.invoice_number} has already been issued and cannot be altered or deleted. Issue a Credit Note (Item 41) for corrections.`
    );
  }

  const hash = computeInvoiceHash(invoice);
  const record: StoredInvoiceRecord = {
    invoice,
    content_sha256: hash,
    is_immutable: true,
    issued_at: new Date().toISOString(),
  };

  invoiceRegistry.set(invoice.invoice_number, record);
  return record;
}

/**
 * Retrieves stored invoice by invoice number
 */
export function getStoredInvoice(invoiceNumber: string): StoredInvoiceRecord | null {
  return invoiceRegistry.get(invoiceNumber) || null;
}

/**
 * Public statutory verification of an invoice (Item 17)
 */
export function verifyInvoice(invoiceNumber: string): {
  verified: boolean;
  invoice_number: string;
  invoice_date?: string;
  seller_trade_name?: string;
  seller_gstin?: string;
  order_id?: string;
  total_payable_amount?: number;
  payment_status?: string;
  hsn_classification?: string;
  sha256_hash?: string;
  error?: string;
} {
  const record = invoiceRegistry.get(invoiceNumber);
  if (!record) {
    return {
      verified: false,
      invoice_number: invoiceNumber,
      error: 'Invoice not found or invalid invoice reference.',
    };
  }

  // Recompute hash to ensure integrity
  const expectedHash = computeInvoiceHash(record.invoice);
  if (expectedHash !== record.content_sha256) {
    return {
      verified: false,
      invoice_number: invoiceNumber,
      error: 'CRITICAL: Tamper detected! Invoice content does not match cryptographic signature.',
    };
  }

  return {
    verified: true,
    invoice_number: record.invoice.invoice_number,
    invoice_date: record.invoice.invoice_date,
    seller_trade_name: record.invoice.seller.trade_name,
    seller_gstin: record.invoice.seller.gstin,
    order_id: record.invoice.order_id,
    total_payable_amount: record.invoice.total_payable_amount,
    payment_status: record.invoice.payment_status,
    hsn_classification: 'HSN 4901 (Printed Books - 0% Nil-Rated GST)',
    sha256_hash: record.content_sha256,
  };
}
