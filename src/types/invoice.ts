/**
 * Module 14: Core GST Invoice, Thermal Shipping Label & Accounting Types
 * 
 * Complies with:
 * - Item 1: HSN 4901 & 0% GST (Nil-rated / Exempted printed books).
 * - Item 2: Seller Legal Metadata (Netaji Subhash Road Malda, GSTIN 19...).
 * - Item 3: Sequential Invoice Numbering Scheme (e.g. INV-MMB-2026-0001).
 * - Item 4: Intrastate (CGST+SGST) vs Interstate (IGST) tax breakdown.
 * - Item 5: B2B Institutional Billing with Buyer GSTIN.
 * - Item 6: Amount in Words (Indian Currency Standard).
 * - Item 7: Itemized Table Breakdown (MRP, Selling Price, Coupon, Shipping).
 * - Item 9: Bank reference UTR/RRN printing on invoice.
 * - Item 21-30: 4x6" Thermal Shipping Label, Code 128 Barcode & A5 Packing Slip.
 * - Item 41: GST Credit Note (CRN-MMB-2026-XXXX).
 * - Item 43: 10 Mandatory GSTR-1 Report Columns.
 * - Item 46: Relational `invoices` PostgreSQL database schema.
 */

export interface SellerMetadata {
  legal_name: string;
  trade_name: string;
  address_line1: string;
  city: string;
  district: string;
  state: string;
  state_code: string; // West Bengal: "19"
  pincode: string;
  gstin: string; // 15-character GSTIN
  pan: string;
  phone: string;
  email: string;
  website: string;
}

export interface CustomerBillingDetails {
  customer_name: string;
  customer_phone: string;
  street_address: string;
  landmark?: string;
  city: string;
  district: string;
  state: string;
  state_code: string;
  pincode: string;
  gstin?: string; // B2B buyer GSTIN (Item 5)
  company_name?: string;
  customer_email?: string;
}

export interface InvoiceItem {
  item_id: string;
  book_title: string;
  book_title_bn?: string;
  author_name?: string;
  isbn13?: string;
  hsn_code: string; // Default: "4901" (Item 1)
  quantity: number;
  unit_mrp: number;
  unit_selling_price: number;
  taxable_value: number;
  cgst_rate: number; // 0%
  cgst_amount: number;
  sgst_rate: number; // 0%
  sgst_amount: number;
  igst_rate: number; // 0%
  igst_amount: number;
  total_item_amount: number;
}

export interface TaxInvoice {
  id: string;
  invoice_number: string; // e.g. "INV-MMB-2026-0001"
  financial_year: string; // e.g. "2026-27"
  order_id: string;
  invoice_date: string;
  seller: SellerMetadata;
  customer: CustomerBillingDetails;
  items: InvoiceItem[];
  subtotal_mrp: number;
  subtotal_selling_price: number;
  coupon_discount: number;
  shipping_fee: number;
  cod_handling_fee?: number;
  total_taxable_amount: number;
  total_cgst: number;
  total_sgst: number;
  total_igst: number;
  total_payable_amount: number;
  amount_in_words: string; // e.g. "Indian Rupees Three Hundred Eighty Only"
  payment_method: 'upi' | 'card' | 'netbanking' | 'cod' | 'wallet';
  payment_status: 'PAID' | 'COD_COLLECT';
  utr_or_rrn?: string; // 12-digit Indian Banking UTR/RRN (Item 9)
  verification_qr_url: string; // Item 17
  pdf_url?: string;
  is_b2b: boolean;
  is_interstate: boolean;
  created_at: string;
}

export interface ThermalShippingLabelData {
  awb_tracking_number: string;
  courier_name: string;
  order_id: string;
  invoice_number: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  recipient_landmark: string; // Item 23
  recipient_pincode: string;
  recipient_city: string;
  recipient_district: string;
  recipient_state: string;
  seller_return_address: string; // Item 24
  payment_mode: 'COD' | 'PREPAID'; // Item 25
  collectable_amount?: number;
  weight_kg: number; // Item 28
  barcode_code128_svg?: string; // Item 22
  tracking_qr_svg?: string;
  otp_badge: string; // Item 29
}

export interface PackingSlipItem {
  title: string;
  title_bn?: string;
  author?: string;
  isbn13?: string;
  quantity: number;
  verified: boolean;
}

export interface PackingSlipData {
  order_id: string;
  invoice_number: string;
  customer_name: string;
  delivery_speed: string;
  items: PackingSlipItem[];
  packer_note?: string;
  verified_at?: string;
}

export interface CreditNote {
  credit_note_number: string; // e.g. "CRN-MMB-2026-0001" (Item 41)
  original_invoice_number: string;
  order_id: string;
  credit_date: string;
  refund_amount: number;
  reason: string;
  seller: SellerMetadata;
  customer: CustomerBillingDetails;
  created_at: string;
}

export interface Gstr1ReportRow {
  invoice_number: string;
  invoice_date: string;
  customer_gstin: string;
  customer_state_code: string;
  hsn_code: string;
  taxable_value: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_amount: number;
}
