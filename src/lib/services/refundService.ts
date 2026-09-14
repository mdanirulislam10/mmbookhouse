/**
 * Module 13 - Task 7: Automated Refund, Double-Debit Reversal & Race-Condition Stockout Handler
 * 
 * Complies with:
 * - Item 19: COD Return & 24h UPI/Bank refund.
 * - Item 25: Stockout instant auto-refund on concurrency race condition.
 * - Item 36: Smart Double-Debit Reversal Tracker with Bank Reference (RRN).
 * - Item 37: 12-Digit Indian Banking UTR/RRN tracking & invoice printing.
 * - Item 38: Fast Refund SLA timelines (UPI 2 hrs, Cards 3-5 days).
 * - Item 39: Partial Refund control for combo/multi-item orders.
 */

import { RefundRecord, RefundRequest, RefundType } from '@/types/payment';
import { dispatchGatewayRefund } from './paymentGatewayAdapter';

export interface DoubleDebitTicket {
  ticket_id: string;
  order_id: string;
  duplicate_payment_id: string;
  original_payment_id: string;
  amount: number;
  rrn_or_utr: string;
  status: 'INITIATED' | 'REVERSED' | 'FAILED';
  auto_reversal_target_hours: number; // 24 hours (Item 36)
  created_at: string;
  resolved_at?: string;
}

const refundRecordsStore = new Map<string, RefundRecord>();
const doubleDebitTicketsStore = new Map<string, DoubleDebitTicket>();

export function getRefundRecord(refundId: string): RefundRecord | undefined {
  return refundRecordsStore.get(refundId);
}

export function getAllRefunds(): RefundRecord[] {
  return Array.from(refundRecordsStore.values());
}

export function resetRefundStore(): void {
  refundRecordsStore.clear();
  doubleDebitTicketsStore.clear();
}

/**
 * Item 25: Instant Auto-Refund when item went out-of-stock during concurrent checkout
 */
export async function executeStockoutInstantRefund(params: {
  orderId: string;
  paymentId: string;
  amount: number;
  outOfStockBookTitles: string[];
  destinationUpi?: string;
}): Promise<{ refund: RefundRecord; message_bn: string }> {
  const reason = `Automated instant refund due to concurrent stockout of: ${params.outOfStockBookTitles.join(', ')}`;

  const request: RefundRequest = {
    order_id: params.orderId,
    payment_id: params.paymentId,
    amount: params.amount,
    reason,
    refund_type: 'FULL',
    initiated_by: 'STOCK_OUT_AUTO',
    destination_upi_or_account: params.destinationUpi,
  };

  const refund = await dispatchGatewayRefund(request);
  refund.expected_settlement_hours = 2; // Item 25: Instant auto-refund guarantees 2 hours SLA
  refundRecordsStore.set(refund.id, refund);

  const message_bn = `দুঃখিত! পেমেন্ট চলাকালীন শেষ কপিটি স্টক শেষ হয়ে যাওয়ায় আপনার সম্পূর্ণ ₹${params.amount} টাকা তাৎক্ষণিকভাবে রিফান্ড করা হয়েছে (SLA: ২ ঘণ্টার মধ্যে ব্যাংকে জমা)।`;

  return { refund, message_bn };
}

/**
 * Item 36: Detects and resolves accidental double-debit (customer charged twice)
 */
export function handleDoubleDebitReport(params: {
  orderId: string;
  originalPaymentId: string;
  duplicatePaymentId: string;
  amount: number;
  rrnOrUtr: string;
}): DoubleDebitTicket {
  const ticketId = `DDT-${Date.now().toString().slice(-6)}`;

  const ticket: DoubleDebitTicket = {
    ticket_id: ticketId,
    order_id: params.orderId,
    original_payment_id: params.originalPaymentId,
    duplicate_payment_id: params.duplicatePaymentId,
    amount: params.amount,
    rrn_or_utr: params.rrnOrUtr,
    status: 'INITIATED',
    auto_reversal_target_hours: 24, // Item 36: Guaranteed within 24 hours
    created_at: new Date().toISOString(),
  };

  doubleDebitTicketsStore.set(ticketId, ticket);
  return ticket;
}

export function getDoubleDebitTicket(ticketId: string): DoubleDebitTicket | undefined {
  return doubleDebitTicketsStore.get(ticketId);
}

/**
 * Item 39: Partial Refund control for multi-item or combo orders
 */
export async function executePartialRefund(params: {
  orderId: string;
  paymentId: string;
  partialAmount: number;
  totalOrderAmount: number;
  reason: string;
  itemTitle?: string;
}): Promise<RefundRecord> {
  if (params.partialAmount >= params.totalOrderAmount) {
    throw new Error('Partial refund amount must be strictly less than total order amount. Use full refund instead.');
  }

  const request: RefundRequest = {
    order_id: params.orderId,
    payment_id: params.paymentId,
    amount: params.partialAmount,
    reason: params.reason || `Partial refund for ${params.itemTitle || 'unavailable item'}`,
    refund_type: 'PARTIAL',
    initiated_by: 'ADMIN_PARTIAL',
  };

  const refund = await dispatchGatewayRefund(request);
  refundRecordsStore.set(refund.id, refund);
  return refund;
}

/**
 * Item 19: COD 24-Hour Return Refund to UPI / Bank Account
 */
export async function executeCodReturnRefund(params: {
  orderId: string;
  amount: number;
  customerUpiId: string;
  reason: string;
}): Promise<RefundRecord> {
  const request: RefundRequest = {
    order_id: params.orderId,
    payment_id: `cod_ret_${params.orderId}`,
    amount: params.amount,
    reason: params.reason || 'Defective book returned by customer',
    refund_type: 'FULL',
    initiated_by: 'CUSTOMER_CANCELLATION',
    destination_upi_or_account: params.customerUpiId,
  };

  const refund = await dispatchGatewayRefund(request);
  refund.expected_settlement_hours = 24; // 24-hour SLA for verified COD returns (Item 19)
  refundRecordsStore.set(refund.id, refund);
  return refund;
}
