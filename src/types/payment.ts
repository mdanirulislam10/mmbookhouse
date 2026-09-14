/**
 * Module 13: Core Payment, Gateway, UPI, COD & Security Types
 * 
 * Complies with:
 * - Items 1, 7, 8, 9, 10: Razorpay, Cashfree, Multi-wallet & International cards.
 * - Items 2, 3, 4: UPI Intent, Dynamic QR, and RuPay/UPI Zero Surcharge.
 * - Items 5, 41: RBI Card Tokenization (Zero local card storage).
 * - Items 11-20: Cash on Delivery (COD) Risk, ₹2,500 Limit, RTO Blacklisting, Handling Fee.
 * - Items 21-30: HMAC-SHA256 Webhook payloads, PostgreSQL `payments` schema, and T+1 settlements.
 * - Items 31-40: Failure Recovery, 3-Min Grace, UTR tracking, and Partial/Full Refunds.
 */

export type PaymentGatewayId = 'razorpay' | 'cashfree' | 'cod';

export type PaymentMethodType = 'upi' | 'cod' | 'card' | 'netbanking' | 'wallet';

export type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED'
  | 'AUTHORIZED';

export type RefundType = 'FULL' | 'PARTIAL';

export type RefundStatus = 'PENDING' | 'PROCESSED' | 'FAILED';

export interface TokenizedCardDetail {
  token: string;
  last4: string;
  network: 'RuPay' | 'Visa' | 'Mastercard' | 'Amex' | 'Other';
  expiry_month: number;
  expiry_year: number;
  card_holder_name?: string;
  is_international?: boolean;
}

export interface PaymentTransaction {
  id: string;
  order_id: string;
  payment_gateway: PaymentGatewayId;
  transaction_id: string;
  payment_method: PaymentMethodType;
  amount: number;
  currency: 'INR' | string;
  status: PaymentStatus;
  utr?: string; // 12-digit Indian Banking UTR/RRN
  card_network?: string;
  is_zero_surcharge: boolean; // Item 4: 0% fee for UPI & RuPay
  tokenized_card?: TokenizedCardDetail; // Item 5 & 41: Zero raw card storage
  gateway_order_id?: string;
  error_message?: string;
  error_code?: string;
  raw_payload?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface UpiAppSchemeUrls {
  gpay: string;
  phonepe: string;
  paytm: string;
  bhim: string;
  generic: string;
}

export interface UpiIntentDetail {
  vpa: string;
  payee_name: string;
  amount: number;
  transaction_ref: string;
  transaction_note: string;
  upi_uri: string;
  app_schemes: UpiAppSchemeUrls;
  qr_svg_data?: string;
  is_zero_surcharge: true;
}

export interface CodPolicyConfig {
  max_limit: number; // Item 13: ₹2,500 Hard cap
  handling_fee: number; // Item 14: ₹35 handling charge
  max_rto_allowed: number; // Item 15: >= 2 ungrounded returns trigger blacklist
  prepaid_discount_amount: number; // Item 20: ₹30 flat savings on prepaid
  is_otp_mandatory: boolean; // Item 12: 4-digit OTP
}

export interface CodEligibilityResult {
  eligible: boolean;
  reason?: string;
  reason_bn?: string;
  handling_fee: number;
  prepaid_savings: number;
  requires_otp: boolean;
  is_blacklisted: boolean;
  max_allowed: number;
}

export interface WebhookEventPayload {
  event: 'payment.captured' | 'payment.failed' | 'refund.processed' | 'order.paid';
  gateway: PaymentGatewayId;
  order_id: string;
  payment_id: string;
  gateway_order_id?: string;
  amount: number; // In rupees
  currency: string;
  status: PaymentStatus;
  signature: string;
  utr?: string;
  timestamp: number;
  raw?: Record<string, unknown>;
}

export interface RefundRequest {
  order_id: string;
  payment_id: string;
  amount: number;
  reason: string;
  refund_type: RefundType;
  initiated_by: 'CUSTOMER_CANCELLATION' | 'STOCK_OUT_AUTO' | 'ADMIN_PARTIAL' | 'MERCHANT_RTO';
  destination_upi_or_account?: string;
}

export interface RefundRecord {
  id: string;
  order_id: string;
  payment_id: string;
  amount: number;
  currency: string;
  refund_type: RefundType;
  status: RefundStatus;
  arn_or_rrn?: string; // Acquirer Reference Number / UTR
  reason: string;
  expected_settlement_hours: number; // UPI: 2 hrs, Cards: 72-120 hrs (3-5 days)
  created_at: string;
  updated_at: string;
}

export interface BankNetBankingOption {
  code: string;
  name: string;
  name_bn: string;
  logo_slug: string;
  is_top_six: boolean;
  active: boolean;
}

export interface GatewayHealthStatus {
  gateway: PaymentGatewayId;
  is_healthy: boolean;
  latency_ms: number;
  success_rate_percent: number;
  last_checked_at: string;
}

export interface PaymentFailureRecoveryState {
  order_id: string;
  cart_preserved: boolean;
  last_error_code?: string;
  last_error_message?: string;
  suggested_options: ('retry_upi' | 'try_card' | 'convert_to_cod')[];
  grace_period_remaining_seconds: number; // Item 34: 3-minute grace period
  whatsapp_recovery_link?: string;
}

export interface MerchantSettlementProjection {
  settlement_date: string;
  settlement_time: string; // "10:00 AM" (T+1)
  gross_sales: number;
  gateway_fee: number;
  gst_on_fee: number; // 18% GST on gateway fee (Item 47)
  net_settlement_amount: number;
  total_transactions: number;
}
