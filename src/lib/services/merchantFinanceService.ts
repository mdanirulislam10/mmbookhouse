/**
 * Module 13 - Task 9: Merchant Finance Dashboard, T+1 Settlement & B2B GST Invoicing Service
 * 
 * Complies with:
 * - Item 28: Comprehensive Merchant Finance Dashboard (Real-time logs & metrics).
 * - Item 29: T+1 Settlement Cycle (Next business day 10:00 AM bank transfer).
 * - Item 44: AI Fraud & Risk Scoring Algorithm (VPN / Velocity / Proxy detection).
 * - Item 47: Monthly B2B GST Tax Invoicing for payment gateway fees (18% GST).
 * - Item 50: Financial security and business confidence guarantee.
 */

import { PaymentTransaction, MerchantSettlementProjection } from '@/types/payment';
import { getAllPaymentTransactions } from './webhookService';

export interface FraudRiskEvaluation {
  riskScore: number; // 0 to 100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  flags: string[];
  isBlocked: boolean;
}

export interface MonthlyGatewayGstSummary {
  month: string; // e.g. "March 2026"
  totalGrossVolume: number;
  zeroSurchargeVolume: number; // UPI & RuPay (0% fee)
  standardFeeVolume: number; // Visa/Mastercard/NetBanking (2% fee)
  gatewayFeeAmount: number; // 2% of standardFeeVolume
  gstOnFeeAmount: number; // 18% GST on gateway fee (Item 47)
  totalGatewayChargesWithGst: number;
  netSettlementAmount: number;
  itcEligibleGst: number; // Input Tax Credit claimable
}

/**
 * Item 44: AI Fraud & Risk Scoring Algorithm
 */
export function evaluateTransactionRisk(params: {
  amount: number;
  customerPhone?: string;
  isInternationalCard?: boolean;
  isVpnOrProxy?: boolean;
  velocityAttemptsLast5Min?: number;
}): FraudRiskEvaluation {
  let score = 5; // Base clean score
  const flags: string[] = [];

  // International card on local Bengali book delivery
  if (params.isInternationalCard) {
    score += 25;
    flags.push('INTERNATIONAL_CARD_DETECTED');
  }

  // Suspicious proxy/VPN
  if (params.isVpnOrProxy) {
    score += 35;
    flags.push('ANONYMOUS_PROXY_OR_VPN');
  }

  // High velocity (multiple rapid payment attempts)
  if ((params.velocityAttemptsLast5Min || 0) > 3) {
    score += 35;
    flags.push('HIGH_PAYMENT_VELOCITY');
  }

  // Abnormally high single order
  if (params.amount > 10000) {
    score += 20;
    flags.push('HIGH_VALUE_TRANSACTION');
  }

  const riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' =
    score >= 60 ? 'HIGH' : score >= 30 ? 'MEDIUM' : 'LOW';

  return {
    riskScore: Math.min(100, score),
    riskLevel,
    flags,
    isBlocked: score >= 80, // Hard block on extreme fraud risk
  };
}

/**
 * Item 29: Computes T+1 bank settlement projection (Next business day 10:00 AM)
 */
export function calculateTPlusOneSettlement(
  transactions: PaymentTransaction[],
  baseDate: Date = new Date()
): MerchantSettlementProjection {
  const paidTxs = transactions.filter((t) => t.status === 'PAID');
  const grossSales = paidTxs.reduce((sum, t) => sum + t.amount, 0);

  // Compute Gateway Fees: 0% for RuPay/UPI (Item 4), 2% for others
  let gatewayFee = 0;
  for (const t of paidTxs) {
    if (!t.is_zero_surcharge && t.payment_method !== 'upi') {
      gatewayFee += t.amount * 0.02; // Standard 2% fee
    }
  }

  // Item 47: 18% GST on Gateway Service Fee
  const gstOnFee = gatewayFee * 0.18;
  const netSettlementAmount = Math.max(0, grossSales - (gatewayFee + gstOnFee));

  // Determine T+1 Settlement Date (skip Sunday)
  const settlementDate = new Date(baseDate);
  settlementDate.setDate(settlementDate.getDate() + 1);

  // If Sunday (day 0), advance to Monday
  if (settlementDate.getDay() === 0) {
    settlementDate.setDate(settlementDate.getDate() + 1);
  }

  const formattedDate = settlementDate.toISOString().split('T')[0];

  return {
    settlement_date: formattedDate,
    settlement_time: '10:00 AM', // Item 29: Scheduled 10:00 AM next day
    gross_sales: Number(grossSales.toFixed(2)),
    gateway_fee: Number(gatewayFee.toFixed(2)),
    gst_on_fee: Number(gstOnFee.toFixed(2)),
    net_settlement_amount: Number(netSettlementAmount.toFixed(2)),
    total_transactions: paidTxs.length,
  };
}

/**
 * Item 47: Generates Monthly B2B GST Tax Invoice Breakdown for Gateway Charges
 */
export function calculateMonthlyGatewayGstInvoice(
  monthLabel: string,
  transactions: PaymentTransaction[]
): MonthlyGatewayGstSummary {
  const paidTxs = transactions.filter((t) => t.status === 'PAID');

  let zeroSurchargeVolume = 0;
  let standardFeeVolume = 0;

  for (const t of paidTxs) {
    if (t.is_zero_surcharge || t.payment_method === 'upi') {
      zeroSurchargeVolume += t.amount;
    } else {
      standardFeeVolume += t.amount;
    }
  }

  const totalGrossVolume = zeroSurchargeVolume + standardFeeVolume;
  const gatewayFeeAmount = standardFeeVolume * 0.02; // 2% processing fee
  const gstOnFeeAmount = gatewayFeeAmount * 0.18; // 18% GST on financial service
  const totalGatewayChargesWithGst = gatewayFeeAmount + gstOnFeeAmount;
  const netSettlementAmount = totalGrossVolume - totalGatewayChargesWithGst;

  return {
    month: monthLabel,
    totalGrossVolume: Number(totalGrossVolume.toFixed(2)),
    zeroSurchargeVolume: Number(zeroSurchargeVolume.toFixed(2)),
    standardFeeVolume: Number(standardFeeVolume.toFixed(2)),
    gatewayFeeAmount: Number(gatewayFeeAmount.toFixed(2)),
    gstOnFeeAmount: Number(gstOnFeeAmount.toFixed(2)),
    totalGatewayChargesWithGst: Number(totalGatewayChargesWithGst.toFixed(2)),
    netSettlementAmount: Number(netSettlementAmount.toFixed(2)),
    itcEligibleGst: Number(gstOnFeeAmount.toFixed(2)), // 100% claimable via GSTR-2B
  };
}

/**
 * Item 28: Aggregates real-time financial stats for merchant admin panel
 */
export function getMerchantFinanceMetrics() {
  const allTxs = getAllPaymentTransactions();

  const totalTransactions = allTxs.length;
  const paidTxs = allTxs.filter((t) => t.status === 'PAID');
  const failedTxs = allTxs.filter((t) => t.status === 'FAILED');
  const refundedTxs = allTxs.filter((t) => t.status === 'REFUNDED' || t.status === 'PARTIALLY_REFUNDED');

  const grossPaidSales = paidTxs.reduce((sum, t) => sum + t.amount, 0);
  const totalRefundedAmount = refundedTxs.reduce((sum, t) => sum + t.amount, 0);

  const settlement = calculateTPlusOneSettlement(allTxs);

  return {
    totalTransactions,
    paidCount: paidTxs.length,
    failedCount: failedTxs.length,
    refundCount: refundedTxs.length,
    grossPaidSales: Number(grossPaidSales.toFixed(2)),
    totalRefundedAmount: Number(totalRefundedAmount.toFixed(2)),
    netSettlementProjected: settlement.net_settlement_amount,
    settlementDate: settlement.settlement_date,
    settlementTime: settlement.settlement_time,
  };
}
