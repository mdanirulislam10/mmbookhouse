/**
 * Module 19: Merchant Seller Central Admin Portal Types
 * M.M Book House Malda - E-Commerce Platform
 * 
 * Complies with 50 Architectural Items:
 * - Items 1-10: RBAC, 2FA, Field-level hiding, Audit Log, Auto-Lockout
 * - Items 11-20: Inventory, ISBN, Low-stock, Barcode, Counter Sale POS
 * - Items 21-30: Order Dispatch Pipeline, Manifest, Counter OTP, RTO, COD Reconciliation
 * - Items 31-40: Executive KPIs, Net Profit, Dead Stock, District Sales, GSTR-1
 * - Items 41-50: Coupons, Flash Deals, Maintenance Switch, Notice Bar, Store Settings
 */

export type AdminRole = 'super_admin' | 'inventory_manager' | 'dispatch_staff';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: AdminRole;
  is_active: boolean;
  two_factor_enabled: boolean;
  failed_login_attempts: number;
  locked_until?: string;
  last_login_at?: string;
  created_at: string;
}

export interface AdminSession {
  token: string;
  user: AdminUser;
  expires_at: string;
  ip_address?: string;
}

export interface AuditLogEntry {
  id: string;
  actor_id: string;
  actor_name: string;
  role: AdminRole;
  action: string; // e.g. 'UPDATE_BOOK_PRICE', 'DISPATCH_ORDER', 'APPLY_DISCOUNT'
  target_entity: 'book' | 'order' | 'inventory' | 'coupon' | 'store_settings';
  target_id?: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  ip_address?: string;
  created_at: string;
}

export interface BookInventoryItem {
  id: string;
  sku: string;
  isbn: string;
  title: string;
  title_bn: string;
  author: string;
  publisher: string;
  edition_year?: number;
  categories: string[];
  class_grade?: string;
  mrp: number;
  selling_price: number;
  wholesale_cost_price?: number; // Field-level security: only super_admin can view
  discount_percent: number;
  stock_quantity: number;
  low_stock_threshold: number; // default: 5
  weight_grams: number;
  rack_location?: string; // e.g. "Rack B-4, Shelf 2" for packing slip
  cover_image_url?: string;
  preview_images?: string[];
  is_active: boolean;
  status: 'active' | 'out_of_stock' | 'archived' | 'out_of_print';
  created_at: string;
  updated_at: string;
}

export type OrderPipelineStatus =
  | 'pending'
  | 'processing'
  | 'ready_for_pickup'
  | 'handed_over'
  | 'delivered'
  | 'rto_returned'
  | 'cancelled';

export interface OrderItemDetail {
  book_id: string;
  title: string;
  sku: string;
  rack_location?: string;
  quantity: number;
  unit_price: number;
  wholesale_cost?: number; // Hidden from staff
}

export interface AdminOrderSummary {
  order_id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  shipping_address_text: string;
  district: string;
  pincode: string;
  items: OrderItemDetail[];
  total_amount: number;
  payment_mode: string;
  payment_status: 'PAID' | 'PENDING' | 'REFUNDED';
  pipeline_status: OrderPipelineStatus;
  is_counter_pickup: boolean;
  counter_pickup_otp?: string;
  courier_name?: string;
  awb_code?: string;
  courier_pickup_requested: boolean;
  courier_freight_cost?: number;
  packaging_cost?: number;
  customer_delivery_fee?: number;
  cod_remitted?: boolean;
  cod_remitted_date?: string;
  rto_reason?: string;
  rto_restocked?: boolean;
  created_at: string;
  updated_at: string;
}

export interface DispatchManifest {
  manifest_id: string;
  manifest_date: string;
  courier_name: string;
  total_parcels: number;
  orders: Array<{
    order_id: string;
    order_number: string;
    awb: string;
    recipient_name: string;
    phone: string;
    cod_amount: number;
  }>;
  driver_name?: string;
  driver_phone?: string;
  driver_signature?: string;
  handed_over_at?: string;
}

export interface ExecutiveKpiSummary {
  today_sales_inr: number;
  today_orders_count: number;
  pending_dispatch_count: number;
  low_stock_count: number;
  monthly_sales_inr: number;
  monthly_net_profit_inr?: number; // super_admin only
  monthly_orders_count: number;
  rto_rate_percent: number;
}

export interface SalesTrendPoint {
  date: string;
  sales_inr: number;
  orders_count: number;
  profit_inr?: number; // super_admin only
}

export interface TopSellingBook {
  rank: number;
  book_id: string;
  title: string;
  units_sold: number;
  revenue_inr: number;
}

export interface LogisticsPnL {
  total_freight_billed_inr: number;
  total_delivery_fees_collected_inr: number;
  packaging_costs_inr: number;
  net_difference_inr: number;
  reconciled_parcels_count: number;
  average_subsidy_per_parcel_inr: number;
}

export interface RtoVerificationResult {
  order_id: string;
  order_number: string;
  awb_code: string;
  condition: 'intact_resellable' | 'damaged';
  restocked: boolean;
  restocked_items: Array<{ sku: string; quantity: number }>;
  refund_status: 'refunded' | 'store_credit_issued' | 'not_applicable';
  refund_reference?: string;
  refund_amount_inr?: number;
  damage_notes?: string;
  processed_at: string;
}

export interface CodRemittanceEntry {
  awb_code: string;
  courier_name: string;
  remitted_amount: number;
  utr_reference: string;
  remittance_date: string;
}

export interface CodRemittanceReport {
  total_entries: number;
  total_remitted_inr: number;
  matched_count: number;
  matched_amount_inr: number;
  discrepancy_count: number;
  discrepancies: Array<{
    awb_code: string;
    order_number?: string;
    expected_amount: number;
    remitted_amount: number;
    difference: number;
    reason: string;
  }>;
  pending_remittances_count: number;
  pending_amount_inr: number;
}

export interface DistrictDemographicPoint {
  district: string;
  orders_count: number;
  revenue_inr: number;
  percentage_of_total: number;
}

export interface DeadStockItem {
  book_id: string;
  sku: string;
  title: string;
  publisher: string;
  stock_quantity: number;
  wholesale_cost_price?: number; // super_admin only
  tied_capital_inr?: number; // super_admin only
  days_inactive: number;
  rack_location: string;
}

export interface Gstr1AuditReport {
  period: string;
  hsn_code: string; // 4901 (Printed books)
  gst_rate_percent: number; // 0%
  total_invoices_count: number;
  gross_turnover_inr: number;
  exempted_turnover_inr: number;
  taxable_turnover_inr: number;
  cgst_amount_inr: number;
  sgst_amount_inr: number;
  igst_amount_inr: number;
  invoices: Array<{
    invoice_number: string;
    order_date: string;
    customer_name: string;
    state_district: string;
    invoice_value_inr: number;
    hsn: string;
    tax_rate: number;
  }>;
}



export interface CouponConfig {
  code: string;
  discount_type: 'flat' | 'percentage';
  discount_value: number;
  min_order_value: number;
  max_discount_amount?: number;
  expires_at: string;
  max_usages_per_user: number;
  is_active: boolean;
}

export interface FlashDealConfig {
  deal_id: string;
  title: string;
  title_bn: string;
  book_ids: string[];
  discount_percentage: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface BookComboBundle {
  combo_id: string;
  title: string;
  title_bn: string;
  book_skus: string[];
  combo_price: number;
  original_total_price: number;
  savings_inr: number;
  is_active: boolean;
}

export interface AbandonedCartRecovery {
  cart_id: string;
  customer_name: string;
  customer_phone: string;
  book_titles: string[];
  cart_total: number;
  hours_dormant: number;
  recovery_sent: boolean;
  sent_at?: string;
}


export interface StoreProfileSettings {
  store_name: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  upi_id: string;
  upi_qr_url?: string;
  announcement_notice?: string;
  announcement_bg_color?: string;
  announcement_link?: string;
  is_announcement_active: boolean;
  is_maintenance_mode: boolean;
  maintenance_message?: string;
}

