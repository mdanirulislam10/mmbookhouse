import { z } from 'zod';

/**
 * Module 14: GST Invoice, Credit Note & Shipping Label Validations
 * 
 * Complies with:
 * - Item 1: HSN 4901 4-digit code.
 * - Item 2: 15-character Indian GSTIN with state code.
 * - Item 3: Sequential Invoice Number format (INV-MMB-YYYY-XXXX).
 * - Item 41: Official GST Credit Note format (CRN-MMB-YYYY-XXXX).
 * - Item 43: 10 Mandatory GSTR-1 Report Columns.
 */

// 15-character Indian GSTIN
export const gstinSchema = z
  .string()
  .trim()
  .regex(
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    'Invalid Indian 15-character GSTIN format'
  );

// Sequential Invoice Number (Item 3)
export const invoiceNumberSchema = z
  .string()
  .trim()
  .regex(/^INV-MMB-\d{4}-\d{4,}$/, 'Invoice number must match standard format INV-MMB-YYYY-XXXX');

// GST Credit Note Number (Item 41)
export const creditNoteNumberSchema = z
  .string()
  .trim()
  .regex(/^CRN-MMB-\d{4}-\d{4,}$/, 'Credit note number must match standard format CRN-MMB-YYYY-XXXX');

// HSN Code for books (Item 1: 4901)
export const hsnCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{4,8}$/, 'HSN code must be 4 to 8 digits (e.g. 4901 for printed books)');

// GSTR-1 10-Column Mandatory Row Schema (Item 43)
export const gstr1RowValidationSchema = z.object({
  invoice_number: invoiceNumberSchema,
  invoice_date: z.string().min(1, 'Invoice date is required'),
  customer_gstin: z.string().default('URP'), // URP = Unregistered Person for B2C
  customer_state_code: z.string().regex(/^\d{2}$/, '2-digit state code required'),
  hsn_code: hsnCodeSchema,
  taxable_value: z.number().nonnegative(),
  cgst_amount: z.number().nonnegative(),
  sgst_amount: z.number().nonnegative(),
  igst_amount: z.number().nonnegative(),
  total_amount: z.number().positive(),
});

// Tax Invoice Creation Schema
export const createTaxInvoiceInputSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  financialYear: z.string().regex(/^\d{4}-\d{2}$/, 'Financial year format must be YYYY-YY (e.g. 2026-27)'),
  customerName: z.string().min(1, 'Customer name is required'),
  customerPhone: z.string().regex(/^[6-9]\d{9}$/, 'Must be a 10-digit mobile number'),
  streetAddress: z.string().min(1, 'Street address is required'),
  landmark: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  district: z.string().min(1, 'District is required'),
  state: z.string().min(1, 'State is required'),
  stateCode: z.string().regex(/^\d{2}$/, '2-digit state code is required'),
  pincode: z.string().regex(/^\d{6}$/, '6-digit postal pincode is required'),
  customerGstin: gstinSchema.optional(),
  companyName: z.string().optional(),
  items: z.array(
    z.object({
      itemId: z.string().min(1),
      title: z.string().min(1),
      titleBn: z.string().optional(),
      author: z.string().optional(),
      isbn13: z.string().optional(),
      hsnCode: hsnCodeSchema.default('4901'),
      quantity: z.number().int().positive(),
      unitSellingPrice: z.number().positive(),
      unitMrp: z.number().positive(),
    })
  ).min(1, 'At least one invoice item is required'),
  couponDiscount: z.number().nonnegative().default(0),
  shippingFee: z.number().nonnegative().default(0),
  codHandlingFee: z.number().nonnegative().default(0),
  paymentMethod: z.enum(['upi', 'card', 'netbanking', 'cod', 'wallet']),
  paymentStatus: z.enum(['PAID', 'COD_COLLECT']),
  utrOrRrn: z.string().optional(),
});
